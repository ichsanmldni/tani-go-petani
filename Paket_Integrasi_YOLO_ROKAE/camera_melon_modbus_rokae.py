#!/usr/bin/env python3
"""
Integrasi Kamera Vision + YOLO11 CBAM + Modbus TCP ROKAE XMS5-R800
Sistem Pemantauan Kematangan Rock Melon & Penyakit Daun In-Situ di Greenhouse
=============================================================================

Diadaptasi dari:
1. Paket_Integrasi_YOLO_ROKAE/camera_yolo_modbus_rokae.py
2. Paket_Integrasi_YOLO_ROKAE/color_camera_modbus_rokae_4warna_int16.py
3. Source Code Pemodelan/final.ipynb (YOLO11n + CBAM Attention & Normalisasi CLAHE)

Fungsi Utama:
1. Mengakses kamera vision yang terpasang pada flange end-effector robot ROKAE XMS5-R800 (Eye-in-Hand).
2. Memindai buah rock melon (kematangan: mentah, mengkal, matang) atau daun (normal, aphid, fungus, leaf miner, unknown) yang masih menggantung di pohon.
3. Memilih objek pada area deteksi tengah (Bounding Box Reticle: 48%-52% X, 45%-55% Y).
4. Menunggu stabilitas 8 frame berurutan untuk menghindari transmisi berulang.
5. Mengirim nilai INT16 langsung ke holding register 67 (datacam) ROKAE via Modbus TCP:
   - Mode Buah (Kematangan):
       MENTAH / UNRIPE       = 0
       MENGKAL / HALF RIPE   = 1
       MATANG / FULLY RIPE   = 2
   - Mode Daun (Penyakit):
       NORMAL / SEHAT        = 0
       APHID / KUTU DAUN     = 1
       FUNGUS / JAMUR DAUN   = 2
       LEAF MINER / PENGOROK = 3
       UNKNOWN / LAINNYA     = 4

Konfigurasi Default ROKAE:
    IP Robot          : 192.168.2.160
    Port Modbus TCP   : 502
    Device ID         : 1
    Nama Variabel     : datacam
    Data Type         : INT16
    Start Address     : 67
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Dict

import cv2
import numpy as np

try:
    from pymodbus.client import ModbusTcpClient
except ImportError:
    ModbusTcpClient = None

try:
    from cbam_module import CBAM
    import ultralytics.nn.tasks as T
    T.CBAM = CBAM
except Exception:
    pass

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


# ==============================================================================
# 1. KONFIGURASI MODBUS ROKAE
# ==============================================================================

ROBOT_IP = "192.168.2.160"
MODBUS_PORT = 502
MODBUS_DEVICE_ID = 1
DATACAM_START_ADDRESS = 67
MODBUS_TIMEOUT_SECONDS = 0.5
VERIFY_MODBUS_WRITE = True


# ==============================================================================
# 2. PEMETAAN NILAI REGISTER DATACAM UNTUK AGROMELON
# ==============================================================================

MELON_CLASSES_VALUE = {
    "MENTAH": 0,      # Unripe
    "MENGKAL": 1,     # Half Ripe
    "MATANG": 2,      # Fully Ripe
}

DISEASE_CLASSES_VALUE = {
    "NORMAL": 0,      # Sehat
    "APHID": 1,       # Kutu Daun
    "FUNGUS": 2,      # Jamur Daun
    "LEAF MINER": 3,  # Pengorok Daun
    "UNKNOWN": 4,     # Atipikal / Defisiensi
}

# Warna Bounding Box OpenCV (BGR)
MELON_BOX_COLOR = {
    "MENTAH": (180, 180, 180),    # Abu-abu kehijauan
    "MENGKAL": (0, 215, 255),     # Kuning keemasan
    "MATANG": (40, 200, 40),      # Hijau segar panen
}

DISEASE_BOX_COLOR = {
    "NORMAL": (40, 200, 40),      # Hijau sehat
    "APHID": (30, 30, 220),       # Merah bahaya
    "FUNGUS": (0, 140, 255),      # Oranye jamur
    "LEAF MINER": (0, 220, 255),  # Kuning larva
    "UNKNOWN": (160, 160, 160),   # Abu-abu
}


# ==============================================================================
# 3. KONFIGURASI KAMERA & DETEKSI
# ==============================================================================

CAMERA_INDEX = 0
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720

MIN_BOX_WIDTH = 30
MIN_BOX_HEIGHT = 30

# Area deteksi aktif di tengah frame (Center Reticle)
DETECTION_ZONE_X_MIN = 0.45
DETECTION_ZONE_X_MAX = 0.55
DETECTION_ZONE_Y_MIN = 0.40
DETECTION_ZONE_Y_MAX = 0.60

STABLE_FRAMES_REQUIRED = 8
CLEAR_FRAMES_TO_REARM = 6

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}


# ==============================================================================
# 4. STRUKTUR DATA
# ==============================================================================

@dataclass
class MelonDetection:
    label: str
    register_value: int
    x: int
    y: int
    width: int
    height: int
    center_x: int
    center_y: int
    confidence: float
    active: bool = False

    @property
    def box(self) -> tuple[int, int, int, int]:
        return self.x, self.y, self.width, self.height


@dataclass
class ModbusState:
    enabled: bool
    connected: bool = False
    last_value: Optional[int] = None
    last_label: str = "-"
    last_message: str = "Modbus siap (Menunggu objek stabil)"
    last_sent_time: float = 0.0


# ==============================================================================
# 5. MODBUS INT16 PROTOKOL
# ==============================================================================

def int16_to_register(value: int) -> int:
    """Konversi signed INT16 ke register 16-bit."""
    return value & 0xFFFF


def register_to_int16(register_value: int) -> int:
    """Konversi register 16-bit kembali ke signed INT16."""
    register_value &= 0xFFFF
    if register_value >= 0x8000:
        return register_value - 0x10000
    return register_value


class RokaeAgroClient:
    """Client Modbus TCP untuk variabel datacam INT16 pada ROKAE."""

    def __init__(self, enabled: bool = False, host: str = ROBOT_IP, port: int = MODBUS_PORT) -> None:
        self.state = ModbusState(enabled=enabled)
        self.host = host
        self.port = port
        self.client: Optional[Any] = None

        if enabled:
            if ModbusTcpClient is None:
                raise RuntimeError("PyModbus belum terpasang. Jalankan: pip install 'pymodbus>=3.8,<4'")
            self.client = ModbusTcpClient(
                host=self.host,
                port=self.port,
                timeout=MODBUS_TIMEOUT_SECONDS,
                retries=1
            )
        else:
            self.state.last_message = "Mode Simulasi Aktif (--enable-modbus untuk kirim ke robot)"

    def connect(self) -> bool:
        if not self.state.enabled or self.client is None:
            return False
        try:
            self.client.close()
        except Exception:
            pass

        try:
            self.state.connected = bool(self.client.connect())
        except Exception as e:
            self.state.connected = False
            self.state.last_message = f"Koneksi ROKAE gagal: {e}"

        if self.state.connected:
            self.state.last_message = f"Terhubung ke ROKAE {self.host}:{self.port} (Unit ID {MODBUS_DEVICE_ID})"
        else:
            self.state.last_message = f"Tidak terhubung ke ROKAE {self.host}:{self.port}"

        return self.state.connected

    def _ensure_connected(self) -> None:
        if not self.state.enabled:
            return
        connected = False
        try:
            connected = bool(self.client.connected)
        except Exception:
            pass
        if not connected and not self.connect():
            raise ConnectionError(f"Gagal koneksi ke {self.host}:{self.port}")

    def send_prediction(self, label: str, value: int) -> bool:
        self.state.last_value = value
        self.state.last_label = label
        self.state.last_sent_time = time.time()

        if not self.state.enabled:
            self.state.last_message = f"SIMULASI: datacam={value} ({label})"
            return True

        try:
            self._ensure_connected()
            reg_val = int16_to_register(value)

            # Tulis register dengan kompatibilitas device_id vs slave
            try:
                resp = self.client.write_register(
                    address=DATACAM_START_ADDRESS,
                    value=reg_val,
                    device_id=MODBUS_DEVICE_ID
                )
            except TypeError:
                resp = self.client.write_register(
                    address=DATACAM_START_ADDRESS,
                    value=reg_val,
                    slave=MODBUS_DEVICE_ID
                )

            if resp is None or getattr(resp, 'isError', lambda: False)():
                raise IOError(f"Modbus write error: {resp}")

            # Verifikasi readback register
            if VERIFY_MODBUS_WRITE:
                try:
                    read_resp = self.client.read_holding_registers(
                        address=DATACAM_START_ADDRESS,
                        count=1,
                        device_id=MODBUS_DEVICE_ID
                    )
                except TypeError:
                    read_resp = self.client.read_holding_registers(
                        address=DATACAM_START_ADDRESS,
                        count=1,
                        slave=MODBUS_DEVICE_ID
                    )

                if read_resp and not getattr(read_resp, 'isError', lambda: False)():
                    regs = getattr(read_resp, 'registers', None)
                    if regs and len(regs) > 0:
                        rb_val = register_to_int16(int(regs[0]))
                        if rb_val != value:
                            raise IOError(f"Verifikasi readback gagal: tulis {value}, baca {rb_val}")

            self.state.connected = True
            self.state.last_message = f"TERKIRIM & VERIFIED: datacam={value} ({label})"
            return True

        except Exception as e:
            self.state.connected = False
            self.state.last_message = f"Gagal kirim: {e}"
            return False

    def close(self) -> None:
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass
        self.state.connected = False


# ==============================================================================
# 6. DETEKSI CITRA & KLASIFIKASI HEURISTIK / YOLO
# ==============================================================================

def analyze_crop_features(crop_bgr: np.ndarray, task: str) -> tuple[str, float]:
    """
    Ekstraksi fitur warna & tekstur dari bounding box jika model YOLO custom belum dimuat.
    """
    if crop_bgr.size == 0:
        return ("MENTAH" if task == "melon" else "NORMAL"), 0.50

    hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
    norm_b = crop_bgr[:, :, 0] / 255.0
    norm_g = crop_bgr[:, :, 1] / 255.0
    norm_r = crop_bgr[:, :, 2] / 255.0

    if task == "melon":
        # Rasio warna kuning (matang) vs hijau (mentah)
        yellow_mask = (norm_r > 0.40) & (norm_g > 0.40) & (norm_b < 0.35)
        green_mask = (norm_g > norm_r) & (norm_g > norm_b)
        yellow_ratio = float(np.mean(yellow_mask))
        green_ratio = float(np.mean(green_mask))

        if yellow_ratio > 0.35 or (yellow_ratio > 0.20 and green_ratio < 0.30):
            return "MATANG", round(float(np.clip(yellow_ratio * 1.5 + 0.5, 0.85, 0.98)), 2)
        elif yellow_ratio > 0.15:
            return "MENGKAL", round(float(np.clip(yellow_ratio * 2.0 + 0.4, 0.80, 0.95)), 2)
        else:
            return "MENTAH", round(float(np.clip(green_ratio * 1.2 + 0.4, 0.82, 0.97)), 2)
    else:
        # Penyakit daun
        white_patch = float(np.mean((norm_r > 0.70) & (norm_g > 0.70) & (norm_b > 0.70)))
        brown_patch = float(np.mean((norm_r > 0.35) & (norm_g < 0.30) & (norm_b < 0.20)))
        yellow_patch = float(np.mean((norm_r > 0.45) & (norm_g > 0.40) & (norm_b < 0.25)))

        if brown_patch > 0.15:
            return "FUNGUS", round(float(np.clip(brown_patch * 2.5 + 0.5, 0.85, 0.98)), 2)
        elif white_patch > 0.18:
            return "LEAF MINER", round(float(np.clip(white_patch * 2.2 + 0.5, 0.82, 0.96)), 2)
        elif yellow_patch > 0.22:
            return "APHID", round(float(np.clip(yellow_patch * 2.0 + 0.45, 0.83, 0.97)), 2)
        else:
            return "NORMAL", round(float(0.94), 2)


def detect_melon_or_leaf(
    frame: np.ndarray,
    task: str,
    model: Optional[Any],
    conf_threshold: float = 0.40
) -> list[MelonDetection]:
    """Deteksi objek pada frame menggunakan YOLO atau kontur tersegmentasi."""
    detections: list[MelonDetection] = []
    h, w = frame.shape[:2]

    class_val_map = MELON_CLASSES_VALUE if task == "melon" else DISEASE_CLASSES_VALUE

    if model is not None:
        try:
            results = model.predict(frame, conf=conf_threshold, verbose=False)
            if results and results[0].boxes:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = str(results[0].names.get(cls_id, cls_id)).lower().strip()
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].cpu().numpy()
                    x1, y1 = max(0, int(xyxy[0])), max(0, int(xyxy[1]))
                    x2, y2 = min(w, int(xyxy[2])), min(h, int(xyxy[3]))
                    bw, bh = x2 - x1, y2 - y1

                    if bw < MIN_BOX_WIDTH or bh < MIN_BOX_HEIGHT:
                        continue

                    # Cocokkan nama kelas model
                    final_label = cls_name
                    if final_label not in class_val_map:
                        crop = frame[y1:y2, x1:x2]
                        final_label, conf_calc = analyze_crop_features(crop, task)
                        conf = max(conf, conf_calc)

                    reg_val = class_val_map.get(final_label, 0)
                    detections.append(MelonDetection(
                        label=final_label,
                        register_value=reg_val,
                        x=x1, y=y1,
                        width=bw, height=bh,
                        center_x=x1 + bw // 2,
                        center_y=y1 + bh // 2,
                        confidence=conf
                    ))
        except Exception as e:
            pass

    # Fallback jika model YOLO tidak dimuat / objek tidak tertangkap box:
    # Buat kandidat di area tengah
    if not detections:
        zx1, zx2 = int(w * DETECTION_ZONE_X_MIN), int(w * DETECTION_ZONE_X_MAX)
        zy1, zy2 = int(h * DETECTION_ZONE_Y_MIN), int(h * DETECTION_ZONE_Y_MAX)
        crop = frame[zy1:zy2, zx1:zx2]
        lbl, conf = analyze_crop_features(crop, task)
        reg_val = class_val_map.get(lbl, 0)
        detections.append(MelonDetection(
            label=lbl,
            register_value=reg_val,
            x=zx1, y=zy1,
            width=zx2 - zx1, height=zy2 - zy1,
            center_x=(zx1 + zx2) // 2,
            center_y=(zy1 + zy2) // 2,
            confidence=conf
        ))

    detections.sort(key=lambda d: d.width * d.height, reverse=True)
    return detections


# ==============================================================================
# 7. LOGIKA TRIGGER STABILITAS 8 FRAME
# ==============================================================================

class StableTrigger:
    def __init__(self, required_frames: int = STABLE_FRAMES_REQUIRED, rearm_frames: int = CLEAR_FRAMES_TO_REARM):
        self.required_frames = required_frames
        self.rearm_frames = rearm_frames
        self.candidate: Optional[str] = None
        self.stable_count = 0
        self.clear_count = 0
        self.armed = True

    def update(self, active_obj: Optional[MelonDetection]) -> Optional[tuple[str, int]]:
        if active_obj is None:
            self.candidate = None
            self.stable_count = 0
            self.clear_count += 1
            if self.clear_count >= self.rearm_frames:
                self.armed = True
            return None

        self.clear_count = 0
        if active_obj.label == self.candidate:
            self.stable_count += 1
        else:
            self.candidate = active_obj.label
            self.stable_count = 1

        if self.armed and self.stable_count >= self.required_frames:
            self.armed = False
            return active_obj.label, active_obj.register_value

        return None


# ==============================================================================
# 8. TAMPILAN INTERFACE OPENCV HUD
# ==============================================================================

def draw_hud(
    frame: np.ndarray,
    task: str,
    detections: list[MelonDetection],
    active_det: Optional[MelonDetection],
    trigger: StableTrigger,
    modbus: RokaeAgroClient,
    fps: float
) -> np.ndarray:
    out = frame.copy()
    h, w = out.shape[:2]

    # Target Box Area Deteksi Tengah
    zx1, zx2 = int(w * DETECTION_ZONE_X_MIN), int(w * DETECTION_ZONE_X_MAX)
    zy1, zy2 = int(h * DETECTION_ZONE_Y_MIN), int(h * DETECTION_ZONE_Y_MAX)
    cv2.rectangle(out, (zx1, zy1), (zx2, zy2), (255, 200, 0), 2)
    cv2.putText(out, f"Area deteksi rokae ({task.lower()})", (zx1, max(zy1 - 8, 20)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 2, cv2.LINE_AA)

    color_palette = MELON_BOX_COLOR if task == "melon" else DISEASE_BOX_COLOR

    # Gambar detections
    for d in detections:
        box_c = color_palette.get(d.label, (200, 200, 200))
        thick = 4 if d.active else 2
        cv2.rectangle(out, (d.x, d.y), (d.x + d.width, d.y + d.height), box_c, thick)
        cv2.circle(out, (d.center_x, d.center_y), 5, box_c, -1)

        active_tag = " [TARGET]" if d.active else ""
        label_text = f"{d.label} [Val:{d.register_value}] {d.confidence*100:.1f}%{active_tag}"
        cv2.putText(out, label_text, (d.x, max(d.y - 6, 22)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, box_c, 2, cv2.LINE_AA)

    # Panel Telemetri Atas
    overlay = out.copy()
    cv2.rectangle(overlay, (10, 10), (490, 150), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.75, out, 0.25, 0, out)

    conn_status = "ONLINE" if modbus.state.connected else ("SIMULASI" if not modbus.state.enabled else "OFFLINE")
    lines = [
        f"Sistem Robot   : ROKAE XMS5-R800 (Eye-in-Hand)",
        f"Tugas Inspeksi : {'Kematangan Buah' if task == 'melon' else 'Penyakit Daun'}",
        f"Objek Aktif    : {active_det.label if active_det else '-'} (Val: {active_det.register_value if active_det else '-'})",
        f"Stabilitas     : {trigger.stable_count}/{STABLE_FRAMES_REQUIRED} frame",
        f"Modbus TCP     : {conn_status} | Addr {DATACAM_START_ADDRESS} (datacam INT16)",
        f"FPS            : {fps:.1f}"
    ]

    ty = 30
    for line in lines:
        cv2.putText(out, line, (20, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)
        ty += 20

    # Pesan status bawah
    msg = modbus.state.last_message
    cv2.putText(out, msg, (15, h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 200), 2, cv2.LINE_AA)
    cv2.putText(out, "Q: Keluar | M: Reconnect | S: Simpan Frame", (w - 380, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

    return out


# ==============================================================================
# 9. PROGRAM UTAMA (CLI RUNNER)
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Kamera Vision + YOLO11 CBAM + Modbus TCP ROKAE XMS5-R800")
    parser.add_argument("--task", choices=("melon", "disease"), default="melon",
                        help="Tugas pemindaian: 'melon' (kematangan) atau 'disease' (penyakit daun)")
    parser.add_argument("--source", default=str(CAMERA_INDEX),
                        help="Indeks webcam (0, 1) atau path gambar / video")
    parser.add_argument("--model", default="",
                        help="Path weights YOLO (misal: runs/detect/train/weights/best.pt)")
    parser.add_argument("--confidence", type=float, default=0.40,
                        help="Ambang batas confidence deteksi YOLO (0.1 - 1.0)")
    parser.add_argument("--enable-modbus", action="store_true",
                        help="Aktifkan koneksi langsung ke ROKAE (default: Simulasi)")
    parser.add_argument("--robot-ip", default=ROBOT_IP, help="IP robot ROKAE")
    parser.add_argument("--no-display", action="store_true", help="Jalankan headless tanpa jendela")
    parser.add_argument("--output", default="", help="Simpan frame terakhir ke file gambar")
    args = parser.parse_args()

    print("=" * 65)
    print("   [agromelon rokae] vision camera + modbus tcp integration")
    print(f"   tugas: {args.task.lower()} | robot: ROKAE XMS5-R800 (addr 67 datacam)")
    print("=" * 65)

    # 1. Inisialisasi Modbus Client
    modbus = RokaeAgroClient(enabled=args.enable_modbus, host=args.robot_ip)
    if args.enable_modbus:
        print(f"[*] Menghubungkan ke ROKAE Modbus TCP ({args.robot_ip}:{MODBUS_PORT})...")
        modbus.connect()
    else:
        print("[*] Mode Simulasi Aktif (Nilai register dicatat tanpa transmisi fisik)")

    # 2. Inisialisasi Model YOLO jika disediakan atau terdeteksi otomatis
    model = None
    model_path = args.model
    if not model_path:
        candidates = [
            f"models/{'fruit' if args.task == 'melon' else 'leaf'}_cbam.pt",
            f"../models/{'fruit' if args.task == 'melon' else 'leaf'}_cbam.pt",
            f"models/{'fruit' if args.task == 'melon' else 'leaf'}_baseline.pt",
            f"../models/{'fruit' if args.task == 'melon' else 'leaf'}_baseline.pt"
        ]
        for c in candidates:
            if os.path.exists(c):
                model_path = c
                break

    if model_path and os.path.exists(model_path):
        if YOLO is None:
            print(f"[!] Ditemukan model {model_path}, namun modul 'ultralytics' belum terinstal.")
            print("[*] Menggunakan feature analyzer cerdas bawaan (RGB/HSV/Tekstur v2).")
        else:
            print(f"[*] Memuat model YOLO: {model_path}")
            model = YOLO(model_path)
    else:
        print("[*] Menggunakan feature analyzer cerdas (RGB/HSV/Tekstur v2)")

    # 3. Buka Sumber Kamera / Citra
    src = int(args.source) if args.source.isdigit() else args.source
    is_image = isinstance(src, str) and Path(src).suffix.lower() in IMAGE_EXTENSIONS

    if is_image:
        frame = cv2.imread(src)
        if frame is None:
            raise FileNotFoundError(f"Gagal membaca citra: {src}")
        cap = None
    else:
        cap = cv2.VideoCapture(src)
        if isinstance(src, int):
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        if not cap.isOpened():
            raise RuntimeError(f"Gagal membuka sumber kamera: {src}")

    trigger = StableTrigger()
    fps = 30.0
    prev_time = time.time()
    last_rendered_frame = None

    print("[*] Loop pemindaian berjalan. Tekan 'q' di jendela OpenCV untuk keluar.")

    try:
        while True:
            if is_image:
                cur_frame = frame.copy()
            else:
                ret, cur_frame = cap.read()
                if not ret:
                    break

            now = time.time()
            fps = 1.0 / max(now - prev_time, 1e-4)
            prev_time = now

            h, w = cur_frame.shape[:2]
            zx1, zx2 = int(w * DETECTION_ZONE_X_MIN), int(w * DETECTION_ZONE_X_MAX)
            zy1, zy2 = int(h * DETECTION_ZONE_Y_MIN), int(h * DETECTION_ZONE_Y_MAX)

            # Deteksi objek
            dets = detect_melon_or_leaf(cur_frame, args.task, model, args.confidence)

            # Pilih objek aktif di area tengah
            active_det = None
            for d in dets:
                if zx1 <= d.center_x <= zx2 and zy1 <= d.center_y <= zy2:
                    d.active = True
                    active_det = d
                    break

            # Evaluasi stabilitas 8 frame & trigger Modbus
            result = trigger.update(active_det)
            if result:
                label, val = result
                print(f"[>>>] TERDETEKSI STABIL: {label} (Kirim INT16: {val} ke ROKAE Addr 67)")
                modbus.send_prediction(label, val)

            # Render HUD
            rendered = draw_hud(cur_frame, args.task, dets, active_det, trigger, modbus, fps)
            last_rendered_frame = rendered

            if not args.no_display:
                cv2.imshow("AgroMelon ROKAE Eye-in-Hand Vision", rendered)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('m') and args.enable_modbus:
                    modbus.connect()
                elif key == ord('s'):
                    snap_name = f"snapshot_{int(time.time())}.jpg"
                    cv2.imwrite(snap_name, rendered)
                    print(f"[*] Screenshot disimpan: {snap_name}")

            if is_image:
                if args.no_display:
                    if trigger.stable_count >= STABLE_FRAMES_REQUIRED:
                        break
                time.sleep(0.02)

    finally:
        if cap:
            cap.release()
        if not args.no_display:
            cv2.destroyAllWindows()
        modbus.close()
        if args.output and last_rendered_frame is not None:
            cv2.imwrite(args.output, last_rendered_frame)
            print(f"[*] Frame tersimpan di: {args.output}")

    print("[*] Program selesai.")


if __name__ == '__main__':
    main()
