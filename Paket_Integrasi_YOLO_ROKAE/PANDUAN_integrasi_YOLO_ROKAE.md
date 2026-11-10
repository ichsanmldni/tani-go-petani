# Integrasi Kamera + YOLO + Deteksi Warna + ROKAE (Modbus TCP)

## Tujuan

File `camera_yolo_modbus_rokae.py` adalah adaptasi mandiri dari `color_camera_modbus_rokae_4warna_int16.py` yang dilampirkan. Script lama mendeteksi warna dengan HSV, membuat kontur, lalu mengirim nilai INT16 ke register `datacam`. Script baru **menambahkan YOLO sebagai pendeteksi lokasi/jenis objek** dan tetap memakai HSV untuk membaca warnanya. Script baru juga menerima hasil model YOLO custom dengan nama kelas langsung berupa `yellow`, `green`, `magenta`, `orange`.

**Alur:** Kamera → YOLO (bounding box) → kelas warna YOLO / HSV pada bounding box → area tengah → 8 frame stabil → tulis Modbus satu kali → tunggu area kosong 6 frame sebelum re-arm.

## 1. Instalasi

Disarankan Python 3.10 atau 3.11 dan environment virtual.

```bash
python -m pip install -U ultralytics opencv-python numpy "pymodbus>=3.8,<4"
```

Untuk komputer riset lama yang memakai virtualenv `/home/ridwan/Belajar/bin/python3`, ganti `python` di perintah dengan path tersebut (jika lingkungan itu masih tersedia).

## 2. Tes awal **tanpa robot**

Untuk webcam indeks 0:

```bash
python camera_yolo_modbus_rokae.py --source 0
```

Untuk gambar (tanpa jendela):

```bash
python camera_yolo_modbus_rokae.py --source contoh.jpg --no-display --output hasil.jpg
```

Untuk video:

```bash
python camera_yolo_modbus_rokae.py --source contoh.mp4 --output hasil_terakhir.jpg
```

Default model adalah `yolo26n.pt` (weights akan diunduh oleh Ultralytics saat pertama kali digunakan jika belum tersedia). Model bawaan dilatih pada dataset umum seperti COCO, **tidak otomatis mengenali tabung khusus penelitian**. Filter bawaan menerima objek kelas `sports ball`, `bottle`, `tabung`, `bola`, atau empat nama warna. Gunakan `--classes all` untuk membolehkan semua kelas model (jangan lakukan pada robot langsung tanpa validasi).

## 3. Gunakan model YOLO custom jika diperlukan

Siapkan foto/video tabung atau bola yang benar-benar digunakan pada riset, beri anotasi bounding box dan bagi data menjadi train/validation/test. Misal satu kelas objek (`tabung`) dan empat warna tetap dibedakan dengan HSV.

Contoh isi file `dataset.yaml`:

```yaml
path: /lokasi/dataset_tabung
train: images/train
val: images/val
names:
  0: tabung
```

Folder `images/train` dan `images/val` harus memiliki anotasi YOLO yang sesuai di `labels/train` dan `labels/val`.

Contoh pelatihan:

```bash
yolo detect train model=yolo26n.pt data=dataset.yaml epochs=100 imgsz=640
```

Lalu jalankan model hasil pelatihan (sesuaikan path `best.pt`):

```bash
python camera_yolo_modbus_rokae.py --model runs/detect/train/weights/best.pt --classes tabung --color-mode hsv
```

Jika model dilatih menjadi **empat kelas YOLO berdasarkan warna** (`yellow`, `green`, `magenta`, `orange`), gunakan:

```bash
python camera_yolo_modbus_rokae.py --model best.pt --classes all --color-mode yolo
```

Alternatif bawaan `--color-mode auto`: jika nama kelas YOLO sudah sebuah warna, pakai label tersebut; jika bukan, hitung HSV dari bounding box. Atur `HSV_RANGES`, `--confidence`, dan `--min-color-fraction` setelah uji kondisi pencahayaan nyata.

## 4. Koneksi ke ROKAE

| Parameter | Sesuai sumber lama |
| --- | --- |
| IP | 192.168.2.160 |
| Port | 502 |
| Device ID | 1 |
| Variabel ROKAE | `datacam` |
| Holding register protokol | 67 (verifikasi offset 66/67 di controller) |
| Format | INT16 satu register |
| YELLOW, GREEN, MAGENTA, ORANGE | 0, 1, 2, 3 |

Untuk **mengaktifkan** pengiriman Modbus (setelah semua uji aman):

```bash
python camera_yolo_modbus_rokae.py --model best.pt --classes tabung --enable-modbus
```

Default script baru adalah mode simulasi agar tidak mengirim ke robot secara tidak sengaja. `--no-modbus` juga tersedia untuk kompatibilitas.

## 5. Catatan keselamatan dan keterbatasan

- **Jangan menguji aksi robot langsung** sebelum memastikan emergency stop, interlock, zona aman, pemetaan register, dan komunikasi TCP diuji bersama operator/teknisi robot. Gunakan robot dalam mode aman/terisolasi dahulu.
- **Register `0` adalah YELLOW, bukan kode kosong**. Saat tidak ada objek, script tidak mengirim pembaruan, sehingga controller dapat masih menyimpan nilai sebelumnya. Program robot harus memiliki handshake/validitas data, timeout, dan mekanisme untuk menghindari aksi berdasarkan nilai lama.
- Readback Modbus hanya mengonfirmasi isi register, **bukan** bahwa robot telah menyelesaikan gerakan atau bahwa gerakan aman.
- Stabilitas 8 frame dihitung berdasarkan warna yang sama, bukan pelacakan ID objek. Untuk konveyor cepat atau banyak objek berdampingan, pertimbangkan YOLO tracking + identitas objek dan validasi waktu.
- YOLO pretrained bisa gagal mengenali objek khusus; gunakan `best.pt` hasil training dan uji precision/recall pada data berbeda dari training.
- Hasil klasifikasi HSV masih sensitif terhadap pencahayaan, pantulan, background, serta luas bounding box; uji di kondisi laboratorium.
- Versi adaptasi telah lolos kompilasi Python dan pengujian fungsi menggunakan output YOLO simulasi. **Belum diuji pada kamera nyata, model YOLO terpasang, atau robot ROKAE fisik.**
