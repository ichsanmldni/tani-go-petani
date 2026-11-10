# TaniGo — Smart Robotic Greenhouse Monitoring Dashboard

Sistem analitik prediktif dan dashboard pemantauan cerdas perkebunan melon berbasis **React (Frontend)** dan **Python Flask + Scikit-Learn (Backend Machine Learning)** terintegrasi dengan manipulator robot industrial **ROKAE XMS5-R800-W4G3B4C**.

Sistem dirancang untuk pemindaian non-destruktif secara **in-situ** di dalam greenhouse: memindai **buah melon yang masih menggantung di pohon / lanjaran** dan **daun yang masih melekat pada tanaman** menggunakan kamera multi-angle presisi tinggi.

---

## Integrasi Robot Industrial: ROKAE XMS5-R800-W4G3B4C

* **Model Robot**: **ROKAE XMS5-R800-W4G3B4C** (6-Axis Industrial Collaborative Arm, Reach: 800 mm, Payload: 5 kg).
* **Konfigurasi End-Effector**: **Kamera Vision Terpasang Menggantikan Gripper Fisik (Eye-in-Hand)**. Lengan robot bermanuver memposisikan kamera mengitari buah dan daun di pohon.
* **Protokol Komunikasi**: **Modbus TCP**
  * **IP Robot Controller**: `192.168.2.160`
  * **Port**: `502` (Device ID: `1`)
  * **Register Tujuan**: `datacam` (Tipe Data: `INT16`, Start Address: `67`)

### Trajektori Kinematika 3-Angle Pemindaian di Pohon:
1. **Waypoint 1: Tangkai Buah (Crown / Pitch +45°)**: Kamera membidik retakan cincin absisi (*abscission layer*) pada tangkai buah yang menempel di lanjaran.
2. **Waypoint 2: Sisi Jaring Buah (Netting Mesh / Normal 0°)**: Kamera sejajar memindai kerapatan jaring gabus & rona warna saat buah masih menggantung di tanaman.
3. **Waypoint 3: Dasar Buah (Blossom-end / Pitch -60°)**: Kamera membidik ujung bunga dari bawah ke atas pada buah yang menggantung bebas.

### Nilai Register Modbus `datacam` (Address 67):
* **Kematangan Buah**:
  * `0 = Mentah (Unripe)` → Biarkan tetap menggantung di pohon
  * `1 = Mengkal (Half Ripe)` → Siap panen untuk kargo distribusi luar kota (3-5 hari)
  * `2 = Matang (Fully Ripe)` → Siap panen hari ini untuk Grade A Marketplace / Supermarket
* **Kesehatan Daun**:
  * `0 = Normal (Sehat)`
  * `1 = Aphid (Kutu Daun)`
  * `2 = Fungus (Jamur Daun)`
  * `3 = Leaf Miner (Pengorok Daun)`
  * `4 = Unknown (Gejala Lainnya / Atipikal)`

---

## Fitur Utama Sistem

### 1. Prediktif Kematangan Buah Melon & Kelayakan Marketplace
* **Jadwal Scanning**: Pada usia tanaman hari ke **90 - 100**, lengan robot menyusuri rak tanaman memindai buah per **ID Buah** (contoh: `MLN-GH-1-R01-P01-F1`).
* **Visualisasi Lengkap**:
  * *Sebaran Buah Matang per Kebun (Grouped Bar Chart)*: Komparasi Matang, Mengkal, Mentah per Greenhouse.
  * *Rekomendasi Saluran Pasar (Doughnut Chart)*: Proporsi Grade A Supermarket, Ekspedisi Luar Kota, dan Tunggu Matang.
  * *Distribusi Spektrum Kadar Gula (°Brix Bar Chart)*: Refraktometer AI (< 10°, 10-12°, 12-14°, ≥ 14° Bx).
  * *Pipeline Panen 4 Tahap*: Alur otomatis dari pemindaian 3-angle hingga alokasi pasar.
* **Summary Report Kematangan**:
  * Menampilkan jumlah buah per tingkat kematangan dengan tombol interaktif **"Lihat Detail Posisi Pohon (Index)"** untuk melihat koordinat rak (#1 - #8).
* **Tabel Log Kematangan**:
  * Dilengkapi mini-bar visual kadar gula (°Brix), foto thumbnail 3-angle, status marketplace, dan tombol modal 3-angle.

### 2. Monitoring Penyakit Daun di Pohon (Scanning Harian)
* **Jadwal Scanning**: Dilakukan **setiap hari (daily 24 jam)** per **ID Pohon** (contoh: `PHN-GH-1-R01-P01`).
* **5 Kelas Model Dataset Roboflow**:
  1. *Normal* (Daun hijau segar tanpa gejala).
  2. *Aphid* (Kutu daun di permukaan bawah helai daun).
  3. *Fungus* (Jamur daun / Powdery Mildew).
  4. *Leaf Miner* (Pengorok liang daun berkelok).
  5. *Unknown* (Gejala di luar 3 patogen utama / anomali hara).
* **Tabel Monitoring Penyakit Daun**:
  * Kolom: *ID Pohon, Greenhouse, Jalur & Index Pohon, Waktu Scanning Harian, Kondisi (Prediksi: Sehat / Sakit)*, dan kolom aksi *Detail Penyakit*.
  * Nama penyakit, confidence %, foto 3 angle, gejala, dan SOP tindakan petani **hanya muncul di dalam modal detail**.
* **Summary Report Sakit & Sehat (Grouping by Greenhouse & Jalur)**:
  * Menampilkan daftar pohon sakit vs sehat per jalur rak lengkap dengan **QR ID Pohon** (`QR-TREE-...`) dan **QR ID Buah** (`QR-FRUIT-...`).

### 3. Denah Spasial Kebun 2D (Greenhouse Digital Matrix)
* Matriks digital 4 Jalur × 8 Pohon (32 pohon per greenhouse × 3 greenhouse = 96 pohon total).
* *Dual Heatmap Toggle*:
  * Mode Kematangan: Hijau (Matang), Kuning (Mengkal), Abu-abu (Mentah).
  * Mode Kesehatan: Hijau (Sehat), Merah (Sakit).
* Telemetri mikroklimat: Suhu kanopi (°C), Kelembaban (% RH), Radiasi surya (Lux), dan status robot.

### 4. Lab Uji Model 3-Angle (Simulator)
* Simulasi inferensi real-time citra 3-angle buah dan daun dari dataset asli.
* Visualisasi grafik probabilitas prediksi multi-kelas (*Probability Bar Chart*).
* Dilengkapi **Panel Pengendali ROKAE XMS5-R800** dan tombol uji kirim sinyal Modbus ke Register 67.

### 5. Dukungan PWA & Desain Bebas Emoji Slop
* **Bebas Emoji Slop**: 100% menggunakan ikon vektor resmi **Phosphor Icons** (`@phosphor-icons/react`).
* **PWA Mobile-Ready**: Dilengkapi `manifest.json`, `sw.js`, dan navigasi bawah mobile (*bottom navigation bar*) untuk penggunaan di HP.

---

## Struktur Proyek

```
kematangan-dan-penyakit/
├── app.py                     # Backend REST API Flask + CORS + Serve React dist
├── run.py                     # Script peluncur utama Python
├── run.bat                    # Launcher klik-ganda Windows
├── run.ps1                    # Script eksekusi PowerShell
├── test_api.py                # Test suite otomatis (10 pengujian 100% pass)
├── requirements.txt           # Dependensi Python
├── color_camera_modbus_rokae_4warna_int16.py # Referensi Modbus ROKAE asli
├── models/
│   ├── melon_predictor.py     # Model Kematangan (fully_ripe, half_ripe, unripe)
│   ├── disease_predictor.py   # Model Penyakit (normal, aphid, fungus, leaf miner, unknown)
│   └── feature_extractor.py   # Ekstraktor fitur warna HSV & tekstur 3-angle
├── services/
│   ├── farm_service.py        # Layanan data greenhouse, pohon, dan buah
│   ├── rokae_service.py       # Driver integrasi Modbus ROKAE XMS5-R800 (Addr 67)
│   └── mock_data.py           # Inisialisasi data spasial 96 pohon & foto dataset
├── static/
│   ├── dist/                  # Hasil kompilasi produksi React (HTML, JS, CSS, PWA)
│   └── img/real_samples/      # Sampel foto asli buah dan daun dari file ZIP dataset
└── frontend/                  # Source code React (Vite)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx            # Layout utama, sidebar, & navigasi mobile
        ├── index.css          # Styling & breakpoints PWA
        ├── components/        # FruitModal, DiseaseModal, PositionsModal
        └── pages/             # Overview, Kematangan, Penyakit, GreenhouseMap, Simulator
```

---

## Panduan Instalasi & Menjalankan

> 📘 **Panduan Lengkap Step-by-Step**: Lihat dokumen **[PANDUAN_MENJALANKAN.md](PANDUAN_MENJALANKAN.md)** untuk petunjuk instalasi detail di Windows, Linux, dan macOS, pengujian sistem, serta pemecahan masalah.

### Langkah Cepat (Siap Pakai):
1. **Clone repositori**:
   ```bash
   git clone <URL_REPOSITORY>
   cd kematangan-dan-penyakit
   ```
2. **Setup Virtual Environment & Install Dependensi**:
   ```bash
   python -m venv venv
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   ```
3. **Jalankan Aplikasi**:
   * Windows: Dobel klik `run.bat` atau ketik `python run.py`
   * Linux / macOS: `python3 run.py`
4. **Buka Browser**:
   Kunjungi [http://localhost:5000](http://localhost:5000)

### Menjalankan Uji Otomatis (API Testing):
```bash
python test_api.py
```

### Mengembangkan Frontend (Mode Dev Vite - Opsional):
Jika ingin memodifikasi tampilan antarmuka React:
```bash
cd frontend
npm install
npm run dev
# Buka di: http://localhost:5173
# Untuk build ulang ke Flask: npm run build
```
