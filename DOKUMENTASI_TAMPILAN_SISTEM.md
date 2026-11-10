# 🖥️ Dokumentasi Komprehensif Seluruh Tampilan Sistem AgroMelon AI

Dokumen ini berisi spesifikasi lengkap seluruh antarmuka pengguna (**User Interface / UI**), visualisasi data, komponen interaktif, panel kontrol robot, modal dialog, dan modul cetak label fisik pada sistem **AgroMelon AI**.

---

## 📑 Daftar Isi
1. [Layout Induk & Navigasi Global (Global Header)](#1-layout-induk--navigasi-global)
2. [Tab 1: Dashboard Kematangan Buah (`Kematangan.jsx`)](#2-tab-1-dashboard-kematangan-buah)
3. [Tab 2: Monitoring Penyakit Daun di Pohon (`Penyakit.jsx`)](#3-tab-2-monitoring-penyakit-daun-di-pohon)
4. [Tab 3: Lab Uji Model & Live Camera HUD (`Simulator.jsx`)](#4-tab-3-lab-uji-model--live-camera-hud)
5. [Modal Interaktif (Pop-up Dialogs)](#5-modal-interaktif-pop-up-dialogs)
6. [Modul Cetak Label Stiker Termal Panen Fisik (`printLabel.js`)](#6-modul-cetak-label-stiker-termal-panen-fisik)
7. [Matriks Data Binding: Endpoint API ke Komponen UI](#7-matriks-data-binding-endpoint-api-ke-komponen-ui)

---

## 1. Layout Induk & Navigasi Global

Komponen ini dirender oleh `frontend/src/App.jsx` dan selalu terlihat di bagian atas layar pada semua tab.

### 1.1 Header & Brand Identity
* **Logo Ikon**: Ikon vektor tanaman (`Plant` dari Phosphor Icons) berlatar hijau (`#16a34a`).
* **Nama Sistem**: **Melon Monitoring** (teks tebal hitam).
* **Sub-judul**: *Greenhouse Vision Dashboard* (teks abu-abu kecil).
* **Status Pill Robot ROKAE**:
  * Ikon robot (`Robot`) berwarna hijau.
  * Teks: **"Sistem Otomasi Kamera Terhubung"**.
  * Berfungsi sebagai indikator status kesiapan komunikasi Modbus TCP robot.

### 1.2 Navigasi Tab Utama
Terdapat 3 tombol tab dengan efek aktif (highlight latar putih, bayangan halus, dan warna teks kontras):
1. **Kematangan Buah** (`CircleDashed` Icon): Membuka dashboard analitik panen buah melon.
2. **Monitoring Penyakit Daun** (`Plant` Icon): Membuka panel monitoring kesehatan daun harian.
3. **Uji Model & Kamera** (`Flask` Icon): Membuka simulator pengujian preset dan webcam live HUD.

### 1.3 Dukungan Responsif Mobile (PWA)
* Pada layar desktop: Navigasi horizontal di bar header.
* Pada layar mobile: Terintegrasi dengan PWA bottom navigation bar yang memudahkan pengoperasian satu tangan oleh petugas di lapangan greenhouse.

---

## 2. Tab 1: Dashboard Kematangan Buah

File: `frontend/src/pages/Kematangan.jsx`

Halaman ini berfokus pada hasil pemindaian in-situ buah melon yang masih menggantung pada lanjaran (usia hari ke 90–100).

### 2.1 Bagian 1: Sebaran Buah Matang di Masing-masing Kebun
* **Judul**: Sebaran Buah Matang di Masing-masing Kebun.
* **Deskripsi Alur**: *Pemindaian robotik in-situ usia tanaman hari ke 90-100 pada pohon lanjaran*.
* **3 Kartu Ringkasan Greenhouse**:
  * Nama Greenhouse & Kebun Nyata:
    1. **Greenhouse Sakura — Kebun Agro Melon Ciwidey** (Varietas Rock Melon Kirameki).
    2. **Greenhouse Maribaya — Kebun Lembang Highland Farm** (Varietas Rock Melon Inthanon).
    3. **Greenhouse Cisondari — Kebun Pasirjambu Eco Agri** (Varietas Golden Emerald Rock Melon).
  * Persentase & Jumlah Matang (contoh: *11 Matang (34%)*).
  * Visual Triple-Bar Progress:
    * Warna Hijau: Rasio Matang.
    * Warna Kuning: Rasio Mengkal.
    * Warna Abu-abu: Rasio Mentah.
  * Statistik Kaki Kartu: Jumlah Mengkal, Jumlah Mentah, dan Total Buah (32 Buah per greenhouse).
* **Grafik Batang Komparatif (Grouped Bar Chart - Chart.js)**:
  * Sumbu X: Nama-nama greenhouse & kebun nyata.
  * Sumbu Y: Jumlah buah (step size 5).
  * Bar Hijau: Matang.
  * Bar Kuning: Mengkal.
  * Bar Abu-abu: Mentah.
  * Legend interaktif di bagian bawah.

### 2.2 Bagian 2: Summary Report Kematangan & Posisi Pohon
Menampilkan 3 kartu status besar sesuai tingkat kematangan buah:
1. **Kartu Matang (Fully Ripe)**:
   * Background hijau lembut (`#f0fdf4`) dengan border hijau.
   * Badge: `Layak Jual ke Marketplace` (hijau).
   * Angka Besar: Jumlah buah matang (contoh: **28** buah).
   * Keterangan: *Buah matang, siap dipanen dan dijual hari ini*.
   * Tombol Aksi: **"Lihat Posisi Pohon (Index)"** (membuka modal daftar index pohon #1–#8 di kebun).
2. **Kartu Mengkal (Half Ripe)**:
   * Background kuning lembut (`#fefce8`) dengan border kuning.
   * Badge: `Belum Layak Jual` (kuning).
   * Angka Besar: Jumlah buah mengkal (contoh: **36** buah).
   * Keterangan: *Buah mengkal, estimasi sisa 2-4 hari*.
   * Tombol Aksi: **"Lihat Posisi Pohon (Index)"**.
3. **Kartu Mentah (Unripe)**:
   * Background abu-abu lembut (`#f8fafc`) dengan border netral.
   * Badge: `Belum Layak Jual` (abu-abu).
   * Angka Besar: Jumlah buah mentah (contoh: **32** buah).
   * Keterangan: *Buah mentah, estimasi sisa 5-8 hari*.
   * Tombol Aksi: **"Lihat Posisi Pohon (Index)"**.

### 2.3 Bagian 3: Kontrol Filter & Form Pencarian
* **Dropdown Filter Greenhouse**: Pilihan `Semua Kebun`, `Greenhouse Sakura (Ciwidey)`, `Greenhouse Maribaya (Lembang)`, `Greenhouse Cisondari (Pasirjambu)`.
* **Dropdown Filter Kematangan**: Pilihan `Semua Kematangan`, `Matang`, `Mengkal`, `Mentah`.
* **Input Pencarian**: Input teks dengan ikon kaca pembesar untuk mencari ID Pohon, ID Buah, atau Jalur.
* **Tombol "Cari"**: Tombol hijau pemicu filter langsung.

### 2.4 Bagian 4: Tabel Log Data Pemindaian Buah
Tabel responsif menampilkan data riwayat scanning per individu buah:
* **Kolom 1: ID Pohon & Buah**:
  * Thumbnail Kode QR mini (vektor SVG tajam).
  * ID Pohon tebal (contoh: `PHN-GH-1-R01-P01`).
  * ID Buah berwarna biru (contoh: `MLN-GH-1-R01-P01-F1`).
* **Kolom 2: Greenhouse & Jalur**:
  * Nama Greenhouse dan nomor jalur (contoh: `Jalur 1 — Pohon #1`).
* **Kolom 3: Citra 3 Angle**:
  * Tiga thumbnail mikro sejajar:
    1. Tangkai Atas (*Crown*).
    2. Jaring Samping (*Netting Mesh*).
    3. Dasar Buah (*Blossom-end*).
* **Kolom 4: Tingkat Kematangan**:
  * Badge visual: Hijau (*Matang*), Kuning (*Mengkal*), atau Abu-abu (*Mentah*).
* **Kolom 5: Kesimpulan Marketplace**:
  * Teks status: *"Layak Jual ke Marketplace"* (hijau) atau *"Belum Layak Jual ke Marketplace"* (abu-abu).
* **Kolom 6: Kolom Aksi**:
  * Tombol hijau **"Detail"** dengan ikon mata (`Eye`) untuk membuka popup modal buah lengkap.

---

## 3. Tab 2: Monitoring Penyakit Daun di Pohon

File: `frontend/src/pages/Penyakit.jsx`

Halaman ini berfokus pada hasil pemindaian harian 24 jam untuk pencegahan wabah penyakit daun sebelum menular ke seluruh greenhouse.

### 3.1 Bagian 1: Ringkasan Sederhana (2 KPI Cards)
1. **Kartu Tanaman Sehat**:
   * Border aksen hijau di sisi kiri.
   * Angka besar jumlah pohon sehat (contoh: **74** pohon).
   * Ikon perisai centang (`ShieldCheck`) hijau.
   * Deskripsi: *Daun normal tanpa gejala infeksi*.
2. **Kartu Terindikasi Sakit**:
   * Border aksen merah di sisi kiri.
   * Angka besar jumlah pohon sakit (contoh: **22** pohon).
   * Ikon perisai peringatan (`ShieldWarning`) merah.
   * Deskripsi: *Perlu tindakan penanganan / sanitasi*.

### 3.2 Bagian 2: Kontrol Filter & Form Pencarian
* **Dropdown Filter Greenhouse**: Filter per greenhouse atau semua kebun.
* **Dropdown Filter Kondisi**: Filter `Semua Kondisi`, `Sehat`, atau `Sakit`.
* **Input Pencarian**: Input teks untuk mencari ID pohon atau nama jalur rak.
* **Tombol "Cari"**: Tombol hijau emerald.

### 3.3 Bagian 3: Tabel Monitoring Penyakit Daun
Tabel dirancang dengan prinsip *clean information hierarchy* (nama patogen dan foto 3 sudut tidak membuat tabel sesak, melainkan tersimpan di modal detail):
* **Kolom 1: ID Pohon / QR**:
  * QR Code thumbnail mini.
  * Teks ID Pohon mono-spaced (contoh: `PHN-GH-1-R01-P02`).
  * Teks string QR Code (contoh: `QR-TREE-PHN-GH-1-R01-P02`).
* **Kolom 2: Greenhouse**:
  * Nama greenhouse lokasi pohon berada.
* **Kolom 3: Jalur & Index**:
  * Badge Jalur (contoh: `Jalur 1`) dan index posisi tanaman (contoh: `#2`).
* **Kolom 4: Waktu Scan**:
  * Ikon jam (`Clock`) dan timestamp pemindaian harian (contoh: *Hari ini, 08:30 WIB*).
* **Kolom 5: Kondisi (Prediksi)**:
  * Hanya menampilkan 2 badge kontras: **Sehat** (hijau) atau **Sakit** (merah).
* **Kolom 6: Kolom Aksi Detail**:
  * Tombol **"Detail Penyakit"** (merah jika sakit, hijau tua jika sehat) untuk membuka modal lengkap diagnosa, gejala, dan SOP tindakan.

### 3.4 Bagian 4: Summary Sakit & Sehat Grouping by Greenhouse dan Jalur
Tampilan hierarkis yang mengelompokkan pohon berdasarkan blok fisik di lapangan:
* **Header Kartu Greenhouse**:
  * Nama Greenhouse dan varietas melon yang ditanam.
  * Badge total: `XX Sehat` dan `YY Sakit`.
* **Daftar Jalur Rak (Jalur 1 s/d Jalur 4)**:
  * Menampilkan jumlah tanaman sehat vs sakit pada jalur tersebut.
  * Keterangan total pohon per jalur (8 pohon).
  * Tombol Merah: **"Posisi Sakit (N)"** (muncul jika ada tanaman sakit di jalur tersebut).
  * Tombol Hijau: **"Posisi Sehat (M)"**.
  * Klik tombol akan membuka modal daftar index pohon beserta QR Code pendamping buahnya.

---

## 4. Tab 3: Lab Uji Model & Live Camera HUD

File: `frontend/src/pages/Simulator.jsx`

Halaman simulator interaktif untuk menguji inferensi model AI secara langsung menggunakan data preset atau kamera live webcam/HP.

### 4.1 Header & Pemilih Tugas (Task Selector)
* **Judul**: Uji Pemindaian Kamera & Sampel.
* **Badge**: `Visi Otomatis` (hijau).
* **Dua Tombol Pilihan Pengujian**:
  1. Tombol Hijau: **Uji Kematangan Melon** (`Plant` Icon).
  2. Tombol Merah: **Uji Penyakit Daun** (`Bug` Icon).

### 4.2 Pemilih Sumber Citra (Input Source Mode)
* **Tombol 1**: `Sampel Foto (3 Sudut)` — Menggunakan citra dataset asli yang telah diekstrak.
* **Tombol 2**: `Kamera Langsung (Webcam/Live)` — Mengaktifkan sensor kamera perangkat secara real-time.

---

### 4.3 Tampilan Mode 1: Sampel Foto Preset (3 Sudut)
Jika memilih mode sampel foto:
* **Form Konfigurasi Parameter**:
  * Dropdown ID Buah / Pohon.
  * Input Usia Tanaman (HST) — default 96 hari.
  * Dropdown Pilihan Kategori Preset:
    * Buah: `Matang`, `Mengkal`, `Mentah`.
    * Daun: `Normal (Sehat)`, `Aphid (Kutu Daun)`, `Fungus (Jamur Daun)`, `Leaf Miner (Pengorok Daun)`, `Unknown (Lainnya)`.
  * Tombol Pilihan Index Sampel (Sampel #1 s/d #6).
* **Panel Visualisasi 3-Angle Citra**:
  * Menampilkan 3 kartu foto sudut pandang:
    1. **Angle 1**: Tangkai Buah (Crown) / Permukaan Atas Daun.
    2. **Angle 2**: Jaring Gabus (Netting Mesh) / Permukaan Bawah Daun.
    3. **Angle 3**: Dasar Buah (Blossom-end) / Pucuk Daun.
  * Setiap foto memiliki tombol zoom/inspeksi resolusi tinggi.
* **Tombol Utama**: **"Jalankan Inferensi Model AI"** (tombol besar dengan efek loading).

---

### 4.4 Tampilan Mode 2: Kamera Langsung Real-Time (Live Web HUD)
Jika memilih mode kamera langsung:
* **Viewport Video Kamera**:
  * Menampilkan feed kamera resolusi 720p/1080p.
* **Canvas Overlay HUD (Head-Up Display)**:
  * **Reticle Deteksi Tengah**: Kotak garis putus-putus biru muda di tengah layar (area 48%-52% X, 45%-55% Y) sebagai panduan posisi buah/daun.
  * **Crosshairs**: Garis bidik silang tepat di titik pusat koordinat.
  * **Dynamic Bounding Box**: Kotak batas deteksi yang otomatis membungkus objek:
    * Warna Hijau: Buah Matang / Daun Sehat.
    * Warna Kuning: Buah Mengkal.
    * Warna Merah: Buah Mentah / Daun Terinfeksi Sakit.
  * **Corner Cyber Accents**: Garis sudut siku tebal di keempat sudut bounding box.
  * **Floating Tag Chip**: Label nama kelas + persentase confidence (contoh: `Matang (95.4%)`) melayang rapi di atas kotak.
  * **Telemetry HUD Bar (Kiri Atas)**:
    * Indikator lampu berdenyut (hijau pulsing).
    * Teks status: *"AI Real-Time Vision Aktif"*.
    * Counter performa: *FPS kamera aktual (contoh: 30 FPS)*.
  * **Debouncing Stabilitas 8 Frame**: Indikator stabilitas objek yang menghitung maju hingga 8 frame sebelum memicu pengiriman sinyal Modbus ke robot.

---

### 4.5 Panel Hasil Inferensi & Rekomendasi
Setelah inferensi selesai (baik dari preset maupun kamera):
* **Kartu Hasil Prediksi**:
  * Kategori Terdeteksi (contoh: **Matang (Fully Ripe)** atau **Fungus (Jamur Daun)**).
  * Tingkat Keyakinan / Confidence (contoh: **96.8%**).
  * Estimasi Kadar Gula (°Brix) untuk buah (contoh: **14.8 °Bx**).
  * Estimasi Sisa Hari Panen (contoh: **0 hari - Siap Panen Hari Ini**).
  * Rekomendasi Saluran Pasar (Grade A Supermarket / Ekspedisi Luar Kota / Tunda).
  * Rincian Gejala & SOP Penanganan Agronomis untuk penyakit daun.
* **Grafik Probabilitas Multi-Kelas**:
  * Bar horizontal yang menunjukkan distribusi probabilitas setiap kelas target.
* **Feedback Modbus Robot ROKAE**:
  * Status pengiriman sinyal ke PLC robot.
  * Nilai register `datacam` yang tertulis (INT16).
  * Konfirmasi readback & latensi komunikasi (ms).

---

### 4.6 Panel Pengendali & Telemetri Robot ROKAE XMS5-R800
Terletak di bagian bawah tab simulator:
* **Informasi Perangkat Keras**:
  * Model Robot: `ROKAE XMS5-R800-W4G3B4C` (6-Axis Collaborative Arm).
  * End-Effector: `RGB Vision Camera (Flange Eye-in-Hand, Gripper Replaced)`.
  * IP & Port: `192.168.2.160:502` | Device ID: `1`.
  * Register Target: `datacam` (Address 67, Tipe INT16).
* **Status Koneksi**:
  * Badge Hijau jika terhubung ke controller robot fisik.
  * Badge Kuning (*Mode Simulasi Aman*) jika robot offline di laboratorium.
* **Tombol Pengendali Manual Modbus**:
  * Tombol manual untuk menyuntikkan nilai INT16 langsung ke Address 67:
    * `Kirim 0: Mentah / Normal`
    * `Kirim 1: Mengkal / Aphid`
    * `Kirim 2: Matang / Fungus`
    * `Kirim 3: Leaf Miner`
    * `Kirim 4: Unknown / Lainnya`

---

## 5. Modal Interaktif (Pop-up Dialogs)

Sistem menggunakan modal dialog untuk detail mendalam agar tampilan tabel utama tetap rapi dan ringkas.

### 5.1 Modal Detail Buah (`FruitModal.jsx`)
Dibuka saat pengguna mengklik tombol "Detail" pada tabel kematangan buah.
* **Header Modal**:
  * Judul: Detail Pemindaian Buah Melon.
  * ID Buah (`MLN-GH-1-R01-P01-F1`) dan ID Pohon terkait.
  * Tombol Close (X).
* **Visual 3-Angle Viewport**:
  * Menampilkan 3 kartu foto besar (Crown, Netting, Blossom-end) dengan label keterangan sudut dan fungsi anatominya.
* **Metrik & Analisis Fisik**:
  * Tingkat Kematangan (badge warna).
  * Kadar Gula Refraktometer AI (°Brix) lengkap dengan indikator progress bar tingkat kemanisan.
  * Usia Tanaman (HST) dan Estimasi Tanggal Panen Optimal.
  * Varietas Tanaman (contoh: *Rock Melon Kirameki*).
  * Berat Estimasi Buah (kg).
* **Rekomendasi Saluran Pasar B2B**:
  * Kotak kesimpulan apakah buah layak masuk supermarket Grade A atau dialokasikan untuk kargo distribusi luar pulau.
* **Status Integrasi Robot**:
  * Nilai register Modbus `datacam` yang ditransmisikan ke ROKAE (nilai `0`, `1`, atau `2`).
* **Tombol Aksi**:
  1. Tombol Hijau: **"Cetak Label Stiker Panen"** (memicu pencetakan fisik stiker termal).
  2. Tombol Abu-abu: **"Tutup"**.

---

### 5.2 Modal Detail Penyakit Daun (`DiseaseModal.jsx`)
Dibuka saat pengguna mengklik tombol "Detail Penyakit" pada tabel monitoring daun.
* **Header Modal**:
  * Judul: Detail Diagnosa & Penanganan Daun.
  * ID Pohon (`PHN-GH-1-R01-P02`) dan Lokasi Greenhouse.
  * Badge Status: **Sehat** atau **Sakit**.
  * Badge Tingkat Urgensi: `Aman`, `Perhatian`, `Sedang`, atau `Tinggi`.
* **Visual 3-Angle Viewport**:
  * Menampilkan foto 3 sudut daun (Permukaan Atas, Permukaan Bawah/Area Hama, dan Pangkal Batang/Pucuk).
* **Diagnosa Patogen & Tingkat Keyakinan**:
  * Nama Penyakit / Patogen (contoh: *Aphid (Kutu Daun)* atau *Fungus (Jamur Daun)*).
  * Skor Confidence Deteksi AI (contoh: *97.2%*).
* **Deskripsi Gejala Lapangan**:
  * Uraian ciri-ciri fisik visual yang terdeteksi pada daun (contoh: *Bercak nekrotik berspora melingkar, helai daun mengering rapuh*).
* **Standar Operasional Prosedur (SOP) Tindakan Petani**:
  * Panduan langkah-langkah praktis penanganan agronomis (contoh: *Pangkas daun sakit, semprot fungisida berbahan aktif Mankozeb / Azoksistrobin, kurangi kelembapan*).
* **Informasi Buah Pendamping**:
  * Menampilkan informasi buah melon yang tumbuh pada pohon yang sama beserta tombol pintas untuk langsung memeriksa status kematangan buahnya.

---

### 5.3 Modal Posisi Pohon / Index (`PositionsModal.jsx`)
Dibuka saat pengguna mengklik tombol "Lihat Posisi Pohon (Index)" pada kartu summary atau tombol jalur kebun.
* **Header Modal**:
  * Judul rincian posisi (contoh: *Posisi Pohon: Buah Matang (28 Titik)* atau *Posisi Pohon Sakit: Greenhouse Sakura (Ciwidey) — Jalur 1*).
  * Badge jumlah total titik tanaman.
* **Tabel Grid Posisi Pohon**:
  * **Nomor Index**: Posisi urutan fisik pohon pada lanjaran rak (#1 s/d #8).
  * **Jalur**: Nomor jalur (Jalur 1 s/d Jalur 4).
  * **Greenhouse**: Nama greenhouse lokasi.
  * **ID Pohon & QR Code**: Dilengkapi string QR untuk verifikasi scan di lapangan.
  * **ID Buah Pendamping**: Menghubungkan pohon dengan buah yang menggantung padanya.
  * **Status / Nilai**: Tingkat kematangan atau kondisi kesehatan.
  * **Aksi Pintas**: Tombol untuk langsung membuka modal detail pohon atau buah yang bersangkutan.

---

### 5.4 Modal Inspeksi Foto Resolusi Penuh (`ImageDetailModal.jsx`)
Dibuka saat pengguna mengklik salah satu foto sudut pandang pada simulator atau modal.
* Menampilkan foto definisi tinggi dalam skala penuh tanpa terpotong.
* Keterangan nama sudut (*Crown / Netting / Blossom*).
* Tombol tutup di pojok kanan atas.

---

## 6. Modul Cetak Label Stiker Termal Panen Fisik

File: `frontend/src/utils/printLabel.js`

Modul ini bukan sekadar tangkapan layar (*screenshot*), melainkan **layout dokumen cetak vektor hitam-putih presisi tinggi** yang dirancang khusus untuk mesin printer stiker termal portabel/desktop (standar kertas gulung stiker **60 mm × 85 mm**).

### Elemen yang Tercetak pada Stiker Fisik:
1. **Header Stiker**:
   * Teks tebal: **AGROMELON AI • SMART HARVEST LABEL**.
   * Garis pemisah ganda.
2. **Identitas Utama Buah**:
   * ID Buah: Huruf besar font mono-spaced tebal (contoh: `MLN-GH-1-R01-P01-F1`).
   * Varietas: Nama kultivar (contoh: *Rock Melon Kirameki*).
   * Lokasi Pohon: Greenhouse, Jalur, dan Nomor Pohon.
3. **Hasil Penilaian AI & Kualitas**:
   * Tingkat Kematangan: **MATANG (FULLY RIPE)**.
   * Kesimpulan Kelayakan: **LAYAK JUAL KE MARKETPLACE (GRADE A)**.
   * Kadar Gula: Nilai refraktometer AI (contoh: **14.8 °Bx**).
   * Estimasi Berat: (contoh: **1.9 kg**).
   * Tanggal & Jam Pindai: Timestamp akurat saat pemindaian dilakukan.
4. **Kode QR Fisik (High-Density Pure SVG)**:
   * Kode QR ukuran besar di tengah label berisi string unik `QR-FRUIT-MLN-...`.
   * Teks instruksi di bawah QR: *"Pindai untuk verifikasi keaslian buah & traceability kebun"*.
5. **Footer Verifikasi Robotik**:
   * Keterangan sistem: *"Inspected in-situ by ROKAE XMS5-R800 Robotic Vision Arm"*.

---

## 7. Matriks Data Binding: Endpoint API ke Komponen UI

Tabel berikut menunjukkan korelasi antara endpoint backend Flask (`app.py`) dan elemen antarmuka yang menampilkan datanya:

| Endpoint Backend | HTTP | Komponen Frontend UI | Data yang Ditampilkan di Layar |
| :--- | :---: | :--- | :--- |
| `/api/stats` | `GET` | `App.jsx`, `Kematangan.jsx`, `Penyakit.jsx` | Angka KPI global, total buah (96), rasio matang/mengkal/mentah, rasio sehat/sakit, status Modbus robot. |
| `/api/greenhouses` | `GET` | `Kematangan.jsx`, `Penyakit.jsx` | Dropdown filter kebun, nama greenhouse, alamat, varietas tanaman, koordinat GPS. |
| `/api/fruits` | `GET` | Tabel Log Buah di `Kematangan.jsx` | Daftar buah, ID, jalur, status kematangan, kelayakan marketplace, thumbnail foto 3 sudut. |
| `/api/fruit/<id>` | `GET` | `FruitModal.jsx` & Cetak Label | Detail satu buah, foto zoom 3 sudut, kadar gula Brix, estimasi panen, register Modbus. |
| `/api/trees` | `GET` | Tabel Monitoring di `Penyakit.jsx` | Daftar pohon, ID, greenhouse, jalur, waktu scan harian, status kondisi Sehat / Sakit. |
| `/api/tree/<id>` | `GET` | `DiseaseModal.jsx` | Detail pohon, foto 3 sudut daun, diagnosa patogen, deskripsi gejala lapangan, teks SOP petani. |
| `/api/ripeness/summary` | `GET` | Summary Cards di `Kematangan.jsx` & `PositionsModal.jsx` | Total matang/mengkal/mentah dan daftar koordinat nomor index pohon (#1–#8) per jalur rak. |
| `/api/disease/summary` | `GET` | Summary Grouping di `Penyakit.jsx` & `PositionsModal.jsx` | Pengelompokan jalur rak per greenhouse, jumlah sehat vs sakit, daftar tombol posisi sakit & sehat. |
| `/api/predict/melon` | `POST` | Panel Hasil di `Simulator.jsx` | Hasil inferensi buah: status kematangan, confidence %, brix, hari panen, probabilitas kelas, feedback Modbus. |
| `/api/predict/disease` | `POST` | Panel Hasil di `Simulator.jsx` | Hasil inferensi daun: nama patogen, confidence %, gejala, SOP penanganan, feedback Modbus. |
| `/api/predict/live_frame`| `POST` | Live Canvas HUD di `Simulator.jsx` | Koordinat bounding box dinamis, label kelas melayang, warna indikator kotak, sinyal debouncing 8 frame. |
| `/api/rokae/status` | `GET` | Header `App.jsx` & Panel Robot di `Simulator.jsx` | Status koneksi IP robot (192.168.2.160), nilai register terakhir di holding register 67, latensi ms. |
| `/api/rokae/send` | `POST` | Tombol Manual Modbus di `Simulator.jsx` | Respon eksekusi pengiriman nilai register manual (0, 1, 2, 3, 4). |

---

*Dokumen ini dirancang sebagai acuan tunggal antarmuka pengguna AgroMelon AI untuk pengembang front-end, evaluator sistem, dan agen AI.*

