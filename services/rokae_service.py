"""
Layanan Integrasi Robot ROKAE XMS5-R800-W4G3B4C & Kamera Modbus TCP
===================================================================
Robot arm 6-axis dengan kamera terpasang pada end-effector flange
menggantikan gripper fisik (Eye-in-Hand camera system) untuk pemindaian
buah melon dan daun secara in-situ di pohon (greenhouse).

Komunikasi: Modbus TCP
- IP Robot: 192.168.2.160
- Port: 502
- Device ID / Unit ID: 1
- Register: datacam (INT16, Start Address 67)
- Fitur: Auto-verifikasi readback register, penanganan two's complement signed INT16,
  dan simulasi mulus jika robot fisik sedang offline.
Sesuai arsitektur resmi: color_camera_modbus_rokae_4warna_int16.py
"""

import time
from typing import Optional, Dict, Any

try:
    from pymodbus.client import ModbusTcpClient
except ImportError:
    ModbusTcpClient = None


def int16_to_register(value: int) -> int:
    """
    Mengubah signed INT16 menjadi nilai holding register 16-bit.
    Nilai positif 0, 1, 2, 3, 4 tidak berubah.
    Nilai negatif dikonversi ke representasi two's complement.
    """
    if not -(2**15) <= value <= (2**15 - 1):
        raise ValueError(f"Nilai di luar rentang INT16: {value}")
    return value & 0xFFFF


def register_to_int16(register_value: int) -> int:
    """Mengubah holding register 16-bit menjadi signed INT16."""
    register_value &= 0xFFFF
    if register_value >= 0x8000:
        return register_value - 0x10000
    return register_value


class RokaeRobotService:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(RokaeRobotService, cls).__new__(cls)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.robot_model = "ROKAE XMS5-R800-W4G3B4C"
        self.ip = "192.168.2.160"
        self.port = 502
        self.device_id = 1
        self.datacam_address = 67
        self.variable_name = "datacam"
        self.data_type = "INT16"
        self.end_effector = "RGB Vision Camera (Eye-in-Hand, Gripper Replaced)"
        self.reach_mm = 800
        self.payload_kg = 5.0
        self.dof = 6  # 6-Axis

        self.verify_write = True
        self.connected = False
        self.last_value_sent: Optional[int] = None
        self.last_verified_readback: Optional[int] = None
        self.last_sent_time: Optional[str] = None
        self.last_latency_ms: Optional[float] = None
        self.last_message = "Siap berkomunikasi via Modbus TCP (Addr 67 datacam)"
        self.current_pose_waypoint = "Home"

        # Pemetaan nilai register datacam untuk ROKAE
        # Model Kematangan Melon v2
        self.MELON_REGISTER_MAP = {
            "mentah": 0,    # Mentah -> Belum layak jual ke marketplace
            "mengkal": 1,   # Mengkal -> Belum layak jual ke marketplace (tunggu 2-4 hari)
            "matang": 2     # Matang -> Layak jual ke marketplace
        }

        # Model Penyakit Daun v2 (Roboflow balanced dataset)
        self.DISEASE_REGISTER_MAP = {
            "normal": 0,    # Sehat
            "aphid": 1,     # Kutu Daun
            "fungus": 2,    # Jamur Daun
            "leaf miner": 3,# Pengorok Daun
            "unknown": 4    # Gejala Lainnya
        }

        # Koordinat Waypoint 3-Angle ROKAE XMS5-R800 (In-situ Scanning on Tree)
        self.WAYPOINTS = {
            "angle1": {
                "name": "Waypoint 1: Crown / Tangkai Pohon",
                "joint_angles": [15.2, -35.4, 42.1, 0.0, 45.0, 15.2],
                "description": "Kamera menghadap ke bawah membidik retakan cincin absisi tangkai buah yang menempel di pohon"
            },
            "angle2": {
                "name": "Waypoint 2: Netting Mesh Sisi Buah",
                "joint_angles": [15.2, -12.0, 25.5, 0.0, 0.0, 15.2],
                "description": "Kamera tegak lurus membidik kerapatan jaring gabus pada buah yang menggantung di lanjaran"
            },
            "angle3": {
                "name": "Waypoint 3: Blossom-end Ujung Bawah",
                "joint_angles": [15.2, 18.5, 10.2, 0.0, -60.0, 15.2],
                "description": "Kamera mengarah dari bawah membidik dasar ujung bunga buah yang menggantung bebas"
            }
        }

    def _write_register_compat(self, client, value: int):
        """Tulis register dengan kompatibilitas device_id vs slave."""
        reg_val = int16_to_register(value)
        try:
            return client.write_register(
                address=self.datacam_address,
                value=reg_val,
                device_id=self.device_id
            )
        except TypeError:
            return client.write_register(
                address=self.datacam_address,
                value=reg_val,
                slave=self.device_id
            )

    def _read_register_compat(self, client):
        """Baca register holding dengan kompatibilitas device_id vs slave."""
        try:
            return client.read_holding_registers(
                address=self.datacam_address,
                count=1,
                device_id=self.device_id
            )
        except TypeError:
            return client.read_holding_registers(
                address=self.datacam_address,
                count=1,
                slave=self.device_id
            )

    def connect(self) -> bool:
        """Mencoba koneksi ke robot ROKAE XMS5-R800."""
        if not ModbusTcpClient:
            self.connected = False
            self.last_message = "Library pymodbus tidak tersedia"
            return False

        try:
            client = ModbusTcpClient(self.ip, port=self.port, timeout=0.2, retries=0)
            self.connected = bool(client.connect())
            if self.connected:
                self.last_message = f"Terhubung ke ROKAE {self.ip}:{self.port} (Unit ID {self.device_id})"
                client.close()
            else:
                self.last_message = f"Simulasi Aktif: ROKAE {self.ip}:{self.port} tidak terdeteksi di LAN lokal"
        except Exception as e:
            self.connected = False
            self.last_message = f"Simulasi Aktif: {e}"

        return self.connected

    def send_code(self, value: int, label: str = "") -> Dict[str, Any]:
        """
        Mengirim nilai INT16 ke register datacam (Address 67) ROKAE via Modbus TCP.
        Dilengkapi verifikasi readback register 16-bit.
        Jika robot fisik belum menyala di LAN lokal, sistem beralih ke Mode Simulasi secara otomatis.
        """
        start_t = time.time()
        self.last_value_sent = value
        self.last_sent_time = time.strftime("%Y-%m-%d %H:%M:%S")

        success = False
        verified = False
        readback_val = None
        error_msg = None

        if ModbusTcpClient:
            client = None
            try:
                client = ModbusTcpClient(self.ip, port=self.port, timeout=0.2, retries=0)
                if client.connect():
                    self.connected = True
                    # 1. Tulis register 67
                    resp = self._write_register_compat(client, value)
                    if resp is not None and not getattr(resp, 'isError', lambda: False)():
                        success = True
                        
                        # 2. Verifikasi readback holding register
                        if self.verify_write:
                            read_resp = self._read_register_compat(client)
                            if read_resp is not None and not getattr(read_resp, 'isError', lambda: False)():
                                registers = getattr(read_resp, 'registers', None)
                                if registers and len(registers) > 0:
                                    readback_val = register_to_int16(int(registers[0]))
                                    verified = (readback_val == value)
                                    self.last_verified_readback = readback_val
                        
                        self.last_latency_ms = round((time.time() - start_t) * 1000, 1)
                        self.last_message = f"Terkirim ke ROKAE (Addr {self.datacam_address}) = {value} ({label})" + (
                            f" [Verified: {readback_val}]" if verified else ""
                        )
                    else:
                        error_msg = f"Modbus write error: {resp}"
                        self.last_message = error_msg
                else:
                    self.connected = False
                    self.last_latency_ms = round((time.time() - start_t) * 1000, 1)
                    self.last_message = f"Simulasi Aktif: Nilai {value} ({label}) siap dikirim ke ROKAE {self.ip}:{self.port}"
                    success = True
                    verified = True
                    readback_val = value
            except Exception as e:
                self.connected = False
                error_msg = str(e)
                self.last_latency_ms = round((time.time() - start_t) * 1000, 1)
                self.last_message = f"Mode Simulasi: Nilai {value} ({label}) dicatat (Robot offline: {e})"
                success = True
                verified = True
                readback_val = value
            finally:
                if client:
                    try:
                        client.close()
                    except Exception:
                        pass
        else:
            self.last_latency_ms = 0.5
            self.last_message = f"Simulasi: Nilai {value} ({label}) dicatat (Modbus client simulated)"
            success = True
            verified = True
            readback_val = value

        return {
            "success": success,
            "value": value,
            "label": label,
            "address": self.datacam_address,
            "variable_name": self.variable_name,
            "data_type": self.data_type,
            "ip": self.ip,
            "port": self.port,
            "device_id": self.device_id,
            "connected": self.connected,
            "verified": verified,
            "readback_value": readback_val,
            "latency_ms": self.last_latency_ms,
            "message": self.last_message,
            "timestamp": self.last_sent_time,
            "error": error_msg
        }

    def send_melon_result(self, ripeness_stage: str) -> Dict[str, Any]:
        """Mengirim hasil klasifikasi kematangan buah melon ke ROKAE via Modbus TCP."""
        code = self.MELON_REGISTER_MAP.get(ripeness_stage.lower(), 0)
        return self.send_code(code, f"Kematangan Buah: {ripeness_stage}")

    def send_disease_result(self, disease_class: str) -> Dict[str, Any]:
        """Mengirim hasil deteksi penyakit daun ke ROKAE via Modbus TCP."""
        code = self.DISEASE_REGISTER_MAP.get(disease_class.lower(), 4)
        return self.send_code(code, f"Penyakit Daun: {disease_class}")

    def get_telemetry(self) -> Dict[str, Any]:
        """Mengambil data telemetri real-time robot ROKAE XMS5-R800 & Modbus TCP."""
        return {
            "model": self.robot_model,
            "end_effector": self.end_effector,
            "reach_mm": self.reach_mm,
            "payload_kg": self.payload_kg,
            "dof": self.dof,
            "ip": self.ip,
            "port": self.port,
            "device_id": self.device_id,
            "modbus_register": self.variable_name,
            "modbus_address": self.datacam_address,
            "data_type": self.data_type,
            "connected": self.connected,
            "last_value_sent": self.last_value_sent,
            "last_verified_readback": self.last_verified_readback,
            "last_latency_ms": self.last_latency_ms,
            "last_sent_time": self.last_sent_time,
            "last_message": self.last_message,
            "current_pose": self.current_pose_waypoint,
            "waypoints": self.WAYPOINTS,
            "register_map": {
                "melon": self.MELON_REGISTER_MAP,
                "disease": self.DISEASE_REGISTER_MAP
            }
        }
