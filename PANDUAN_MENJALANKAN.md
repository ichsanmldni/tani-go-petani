# Panduan Instalasi & Menjalankan Codingtani

Dokumen ini memandu langkah demi langkah bagi pengembang, agronom, atau penguji yang baru saja melakukan `git clone` atau `git pull` repositori **Codingtani** (Greenhouse Smart Vision & Ripeness Monitoring Dashboard).

---

## Daftar Isi
1. [Prasyarat Sistem](#1-prasyarat-sistem)
2. [Langkah Cepat (Siap Pakai - 2 Menit)](#2-langkah-cepat-siap-pakai---2-menit)
3. [Panduan Menjalankan di Berbagai Sistem Operasi](#3-panduan-menjalankan-di-berbagai-sistem-operasi)
   - [Windows (PowerShell / CMD / Double Click)](#windows)
   - [Linux / Ubuntu / Debian](#linux--ubuntu)
   - [macOS](#macos)
4. [Uji Otomatis Sistem (API Testing)](#4-uji-otomatis-sistem-api-testing)
5. [Panduan Pengembang Frontend (Opsional - Edit Kode React)](#5-panduan-pengembang-frontend-opsional---edit-kode-react)
6. [Fitur Utama & Cara Penggunaan Dashboard](#6-fitur-utama--cara-penggunaan-dashboard)
7. [Integrasi Lengan Robot ROKAE XMS5-R800 & Modbus](#7-integrasi-lengan-robot-rokae-xms5-r800--modbus)
8. [Pemecahan Masalah (Troubleshooting)](#8-pemecahan-masalah-troubleshooting)

---

## 1. Prasyarat Sistem

| Komponen | Kebutuhan Minimum | Catatan |
|---|---|---|
| **Python** | Versi 3.9 - 3.12 (Disarankan 3.10 atau 3.11) | Diperlukan untuk Backend Flask & inferensi AI |
| **Git** | Versi 2.x+ | Untuk pull / clone repositori |
| **Node.js & npm** | *Opsional* (v18+) | **HANYA** jika ingin mengubah kode React di folder `frontend/`. Untuk menjalankan aplikasi, bundle `static/dist/` sudah tersedia langsung! |
| **Kamera / Webcam** | *Opsional* | Jika tidak ada webcam fisik, sistem menyediakan simulator, tombol demo foto kebun, dan tombol unggah foto |

---

## 2. Langkah Cepat (Siap Pakai - 2 Menit)

Karena hasil kompilasi frontend (`static/dist/`) dan bobot model AI (`models/*.pt`) sudah tersedia di dalam repositori, Anda **hanya membutuhkan Python** untuk langsung menjalankannya:

### Langkah 1: Clone Repositori
```bash
git clone <URL_REPOSITORY_ANDA>
cd kematangan-dan-penyakit
```

### Langkah 2: Buat & Aktifkan Virtual Environment (Disarankan)
* **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
* **Windows (Command Prompt / CMD)**:
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```
* **Linux / macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Langkah 3: Install Dependensi Python
```bash
pip install -r requirements.txt
```
*(Catatan: Paket yang diinstal mencakup Flask, Flask-CORS, PyTorch, Ultralytics YOLO, OpenCV, PyModbus, dan Pillow).*

### Langkah 4: Jalankan Server
* **Cara 1 (Semua OS)**:
  ```bash
  python run.py
  ```
* **Cara 2 (Khusus Windows)**:
  Cukup klik ganda file **`run.bat`** di File Explorer.

### Langkah 5: Buka Browser
Buka peramban (Chrome / Edge / Firefox) dan akses:
👉 **[http://localhost:5000](http://localhost:5000)** atau **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 3. Panduan Menjalankan di Berbagai Sistem Operasi

### Windows
1. Buka folder proyek di File Explorer.
2. Jika menggunakan file `.bat`:
   - Klik ganda **`run.bat`**. Skrip otomatis mendeteksi Python di komputer Anda dan langsung menyalakan server.
3. Jika menggunakan PowerShell:
   ```powershell
   # Jika ada pembatasan script execution policy di PowerShell:
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

   # Jalankan virtual environment & aplikasi:
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python run.py
   ```

### Linux / Ubuntu
1. Install paket prasyarat sistem (jika belum ada):
   ```bash
   sudo apt update
   sudo apt install -y python3 python3-pip python3-venv libgl1-mesa-glx libglib2.0-0
   ```
2. Setup environment dan jalankan:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   python3 run.py
   ```

### macOS
1. Pastikan Python 3 sudah terinstal (via Homebrew atau python.org):
   ```bash
   brew install python@3.11
   ```
2. Setup environment dan jalankan:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python3 run.py
   ```

---

## 4. Uji Otomatis Sistem (API Testing)

Setelah dependensi Python terpasang, Anda dapat memverifikasi kesehatan seluruh fungsi backend dan model AI menggunakan skrip automated test:

```bash
python test_api.py
```

Skrip ini akan memvalidasi 10 titik uji secara berurutan:
1. `GET /api/health` — Status server dan konektivitas.
2. `GET /api/greenhouses` — Data spasial greenhouse.
3. `GET /api/fruits/stats` — Kalkulasi metrik buah (Matang, Mengkal, Mentah, Brix).
4. `GET /api/diseases/summary` — Statistik kesehatan daun pohon.
5. `POST /api/predict/melon` — Inferensi pipeline kematangan melon multi-angle.
6. `POST /api/predict/disease` — Inferensi pipeline klasifikasi penyakit daun.
7. `GET /api/robot/status` — Status komunikasi Modbus robot ROKAE.
8. `POST /api/robot/send` — Pengiriman sinyal register simulasi Modbus.
9. Format QR Code (`QR-TREE-...` dan `QR-FRUIT-...`).
10. Validasi ketersediaan file model YOLO (`models/*.pt`).

Hasil yang diharapkan: **`10 passed, 0 failed`**.

---

## 5. Panduan Pengembang Frontend (Opsional - Edit Kode React)

> **PENTING**: Jika Anda hanya ingin menggunakan dashboard atau mengembangkan backend Python, **lewati bagian ini**. Bagian ini hanya relevan jika Anda ingin memodifikasi tampilan UI React, warna, atau komponen Vite.

### Struktur Frontend:
* Framework: React 18 + Vite
* Styling: Tailwind CSS
* Ikon: Lucide React & Phosphor Icons
* Folder kode sumber: `frontend/src/`
* Output kompilasi: `static/dist/` (dibaca otomatis oleh Flask)

### Langkah Menjalankan Mode Development:
```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Install dependensi Node.js
npm install

# 3. Jalankan Vite Development Server (Hot Module Replacement)
npm run dev
```
Buka **`http://localhost:5173`** di browser. Pada mode ini, perubahan kode React akan langsung terlihat seketika (*hot-reload*).

### Melakukan Build Ulang ke Flask:
Setelah selesai mengubah kode di `frontend/`, lakukan kompilasi agar perubahan tersimpan ke backend Flask:
```bash
npm run build
```
File akan otomatis dicompile ke folder `../static/dist/`. Setelah itu, restart `python run.py` jika perlu.

---

## 6. Fitur Utama & Cara Penggunaan Dashboard

Setelah dashboard terbuka di `http://localhost:5000`:

### 🍈 Tab 1: Tingkat Kematangan
* **Ringkasan Kematangan**: Memantau buah dengan klasifikasi resmi:
  * **Matang**: Buah siap panen hari ini untuk Grade A Supermarket (Kadar gula ≥ 12° Brix).
  * **Mengkal**: Siap panen untuk logistik / ekspedisi luar kota (3-5 hari perjalanan).
  * **Mentah**: Masih perlu pematangan di pohon (estimasi panen 5-8 hari ke depan).
* **Posisi Pohon**: Klik **"Lihat Detail Posisi Pohon"** untuk melihat koordinat baris dan nomor pohon melon.
* **Cetak Label QR**: Klik tombol printer pada baris tabel untuk mencetak label stiker thermal 3-Angle lengkap dengan QR Code batch panen.

### 🍃 Tab 2: Kesehatan Daun
* **Pemantauan Harian**: Menampilkan status kesehatan per pohon di greenhouse.
* **5 Kategori Penyakit**:
  1. *Normal / Sehat*
  2. *Aphid* (Kutu daun)
  3. *Fungus* (Jamur daun / Powdery Mildew)
  4. *Leaf Miner* (Pengorok liang daun)
  5. *Unknown* (Gejala anomali lain)
* **SOP Penanganan**: Klik tombol aksi pada tabel untuk membuka diagnosis, foto multi-sudut, serta SOP tindakan agronomi.

### 🧪 Tab 3: Simulator & Kamera Langsung
* **Kamera Langsung**:
  * Klik tombol **"Buka kamera"** untuk streaming webcam real-time.
  * Bounding box YOLOv8 + CBAM akan mendeteksi buah melon atau daun secara dinamis dan melacak posisinya per frame.
* **Tanpa Webcam Fisik?**:
  * **Contoh Foto Kebun**: Uji 1-klik menggunakan citra sampel melon/daun asli dari kebun.
  * **Unggah Foto dari Komputer**: Unggah file gambar (`.jpg`, `.png`) dari perangkat Anda untuk diuji secara langsung.

---

## 7. Integrasi Lengan Robot ROKAE XMS5-R800 & Modbus

Sistem Codingtani terintegrasi dengan manipulator robot industrial **ROKAE XMS5-R800-W4G3B4C** (6-Axis Collaborative Arm):

* **Protokol**: Modbus TCP
* **IP Default Controller**: `192.168.2.160` (Port `502`, Device ID `1`)
* **Holding Register**: Register `datacam` (Address `67`, Tipe `INT16`)
* **Pemetaan Nilai Register**:
  * Buah Melon: `0` = Mentah, `1` = Mengkal, `2` = Matang.
  * Daun Tanaman: `0` = Sehat, `1` = Aphid, `2` = Fungus, `3` = Leaf Miner, `4` = Unknown.

> **Catatan Safe Fallback**:
> Jika robot fisik sedang tidak terhubung atau dimatikan, sistem **tidak akan crash**. Backend otomatis beralih ke *Simulation Safe Fallback* dalam waktu 0.2 detik, sehingga seluruh fungsi dashboard dan visi komputer tetap beroperasi normal 100%.

---

## 8. Pemecahan Masalah (Troubleshooting)

### Q1: `ModuleNotFoundError: No module named 'flask_cors'` atau modul lainnya
* **Penyebab**: Dependensi belum lengkap di environment Anda.
* **Solusi**: Pastikan virtual environment aktif, lalu jalankan:
  ```bash
  pip install -r requirements.txt
  ```

### Q2: Port 5000 sudah digunakan (`Address already in use`)
* **Penyebab**: Ada proses Flask lama atau aplikasi lain (seperti AirPlay / Docker) yang menggunakan port 5000.
* **Solusi**: Jalankan aplikasi pada port lain dengan mengatur environment variable:
  * Windows (PowerShell):
    ```powershell
    $env:PORT=5001; python run.py
    ```
  * Windows (CMD):
    ```cmd
    set PORT=5001 && python run.py
    ```
  * Linux / macOS:
    ```bash
    PORT=5001 python3 run.py
    ```

### Q3: `NotFoundError: Requested device not found` saat membuka kamera
* **Penyebab**: Browser tidak mendeteksi perangkat webcam fisik, penutup privasi laptop tertutup, atau izin kamera di Windows Settings belum diizinkan.
* **Solusi**:
  1. Pastikan akses kamera aktif di *Windows Settings > Privacy & Security > Camera*.
  2. Atau gunakan opsi alternatif tanpa webcam: klik tombol **"Contoh Foto Kebun"** atau tombol **"Unggah Foto dari Komputer"** di tab Simulator.

### Q4: Layar browser putih (*blank*) saat membuka `http://localhost:5000`
* **Penyebab**: File build `static/dist/` tidak terbaca atau rusak.
* **Solusi**: Pastikan folder `static/dist/` ada dan berisi `index.html` serta folder `assets/`. Jika Anda memiliki Node.js, Anda bisa build ulang via:
  ```bash
  cd frontend
  npm run build
  cd ..
  python run.py
  ```

---

### Bantuan & Kontribusi
Jika menemui kendala atau ingin memperbarui model arsitektur CBAM, silakan buka *Issue* atau hubungi tim pengembang **Codingtani**.
