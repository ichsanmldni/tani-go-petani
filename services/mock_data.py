import random
from datetime import datetime, timedelta

def generate_initial_farm_data():
    greenhouses = [
        {
            "id": "GH-1",
            "name": "Kebun Sakura (Ciwidey)",
            "nama_kebun": "Kebun Sakura (Ciwidey)",
            "nama_gh": "Kebun Sakura (Ciwidey)",
            "variety": "",
            "rows": 4,
            "trees_per_row": 8,
            "planting_date": (datetime.now() - timedelta(days=96)).strftime("%Y-%m-%d"),
            "target_harvest": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "alamat": "Jl. Raya Ciwidey - Patengan KM 7, Alamendah, Rancabali, Kab. Bandung, Jawa Barat 40973",
            "gmaps_link": "https://maps.google.com/?q=-7.135248,107.411623",
            "latitude": -7.135248,
            "longitude": 107.411623,
            "kontak_kebun": "Kang Asep Supriatna",
            "no_hp": "0812-2345-6781",
            "estimasi_berat_buah_kg": 1.9,
            "estimasi_brix": "14.5 - 16.0 °Bx"
        },
        {
            "id": "GH-2",
            "name": "Kebun Maribaya (Lembang)",
            "nama_kebun": "Kebun Maribaya (Lembang)",
            "nama_gh": "Kebun Maribaya (Lembang)",
            "variety": "",
            "rows": 4,
            "trees_per_row": 8,
            "planting_date": (datetime.now() - timedelta(days=92)).strftime("%Y-%m-%d"),
            "target_harvest": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d"),
            "alamat": "Jl. Maribaya No. 108, Kayuambon, Kec. Lembang, Kab. Bandung Barat, Jawa Barat 40391",
            "gmaps_link": "https://maps.google.com/?q=-6.816432,107.625121",
            "latitude": -6.816432,
            "longitude": 107.625121,
            "kontak_kebun": "Pak Budi Hartono",
            "no_hp": "0813-8765-4321",
            "estimasi_berat_buah_kg": 1.8,
            "estimasi_brix": "13.8 - 15.2 °Bx"
        },
        {
            "id": "GH-3",
            "name": "Kebun Cisondari (Pasirjambu)",
            "nama_kebun": "Kebun Cisondari (Pasirjambu)",
            "nama_gh": "Kebun Cisondari (Pasirjambu)",
            "variety": "",
            "rows": 4,
            "trees_per_row": 8,
            "planting_date": (datetime.now() - timedelta(days=98)).strftime("%Y-%m-%d"),
            "target_harvest": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "alamat": "Jl. Stasiun Cisondari No. 45, Pasirjambu, Kec. Pasirjambu, Kab. Bandung, Jawa Barat 40972",
            "gmaps_link": "https://maps.google.com/?q=-7.098712,107.476534",
            "latitude": -7.098712,
            "longitude": 107.476534,
            "kontak_kebun": "Ibu Rina Marlina",
            "no_hp": "0821-9876-1234",
            "estimasi_berat_buah_kg": 2.1,
            "estimasi_brix": "15.0 - 16.8 °Bx"
        }
    ]

    # Kelas penyakit daun disesuaikan 100% dengan dataset pelatihan final.ipynb:
    # Diseases Rock Melon.v2-v2-aug-image-level.yolov11 (BALANCE_LEAF=True)
    # names: ['aphid', 'fungus', 'leaf miner', 'normal', 'unknown']
    LEAF_CLASSES_INFO = {
        "normal": {
            "display_name": "Normal (Tanaman Sehat)",
            "kondisi": "Sehat",
            "is_sakit": False,
            "modbus_code": 0,
            "gejala": "Daun hijau segar seragam, tanpa koloni kutu daun, spora jamur, atau alur korok larva.",
            "penanganan": "Pertahankan sirkulasi udara greenhouse dan pemupukan presisi nutrisi harian.",
            "urgensi": "Aman",
            "badge": "success"
        },
        "aphid": {
            "display_name": "Aphid (Kutu Daun)",
            "kondisi": "Sakit",
            "is_sakit": True,
            "modbus_code": 1,
            "gejala": "Koloni kutu daun berkerumun pada permukaan bawah daun (Angle 2), daun menggulung, ekskresi embun madu berjelaga.",
            "penanganan": "Aplikasi insektisida nabati / sabun insektisida, pasang perangkap lekat kuning (yellow sticky trap).",
            "urgensi": "Tinggi",
            "badge": "danger"
        },
        "fungus": {
            "display_name": "Fungus (Jamur Daun)",
            "kondisi": "Sakit",
            "is_sakit": True,
            "modbus_code": 2,
            "gejala": "Bercak nekrotik berspora jamur di permukaan atas dan bawah daun, helai daun mengering rapuh.",
            "penanganan": "Pangkas helai daun sakit, kurangi kelembapan ruangan, semprot fungisida protektif/sistemik Mankozeb.",
            "urgensi": "Tinggi",
            "badge": "danger"
        },
        "leaf miner": {
            "display_name": "Leaf Miner (Pengorok Daun)",
            "kondisi": "Sakit",
            "is_sakit": True,
            "modbus_code": 3,
            "gejala": "Garis terowongan alur berkelok-kelok warna putih keperakan pada helai daun akibat aktivitas larva lalat Liriomyza.",
            "penanganan": "Semprot insektisida berbahan aktif Abamektin / Spinosad pada pagi hari, musnahkan daun terinfestasi berat.",
            "urgensi": "Sedang",
            "badge": "danger"
        },
        "unknown": {
            "display_name": "Lainnya (Unknown / Atipikal)",
            "kondisi": "Sakit",
            "is_sakit": True,
            "modbus_code": 4,
            "gejala": "Gejala di luar 4 kelas patogen utama (indikasi defisiensi hara Mg/Fe/Zn, kerusakan fisik mekanis, atau bercak non-spesifik).",
            "penanganan": "Cek nilai EC dan pH nutrisi irigasi tetes, evaluasi perkembangan pucuk baru dalam 24 jam.",
            "urgensi": "Perhatian",
            "badge": "warning"
        }
    }

    trees = []
    fruits = []

    today_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    for gh in greenhouses:
        gh_id = gh["id"]
        if gh_id == "GH-3":
            ripeness_weights = [0.15, 0.25, 0.60]  # dominan matang
            base_age = 90
        elif gh_id == "GH-1":
            ripeness_weights = [0.20, 0.40, 0.40]  # seimbang mengkal & matang
            base_age = 88
        else:
            ripeness_weights = [0.45, 0.35, 0.20]  # dominan mentah
            base_age = 84

        for row_idx in range(1, gh["rows"] + 1):
            row_str = f"Jalur {row_idx}"
            for p_idx in range(1, gh["trees_per_row"] + 1):
                tree_id = f"PHN-{gh_id}-R{row_idx:02d}-P{p_idx:02d}"
                fruit_id = f"MLN-{gh_id}-R{row_idx:02d}-P{p_idx:02d}-F1"
                qr_tree = f"QR-TREE-{tree_id}"
                qr_fruit = f"QR-FRUIT-{fruit_id}"

                # 1. Monitoring Penyakit Daun (Scanning Harian per Pohon)
                # 5 kelas penyakit: normal, aphid, fungus, leaf miner, unknown
                leaf_key = random.choices(
                    ["normal", "aphid", "fungus", "leaf miner", "unknown"],
                    weights=[0.76, 0.09, 0.08, 0.05, 0.02]
                )[0]

                leaf_info = LEAF_CLASSES_INFO[leaf_key]
                conf_leaf = round(random.uniform(88.0, 98.6), 1)

                # Ambil foto asli dari static/img/real_samples/leaves/
                folder_leaf = leaf_key.replace(" ", "_")
                img_num = (p_idx % 6) + 1
                img_angle1 = f"/static/img/real_samples/leaves/{folder_leaf}_{img_num}.jpg"
                img_angle2 = f"/static/img/real_samples/leaves/{folder_leaf}_{(img_num % 6) + 1}.jpg"
                img_angle3 = f"/static/img/real_samples/leaves/{folder_leaf}_{((img_num + 1) % 6) + 1}.jpg"

                tree_entry = {
                    "tree_id": tree_id,
                    "qr_code": qr_tree,
                    "fruit_id": fruit_id,
                    "qr_fruit": qr_fruit,
                    "greenhouse_id": gh_id,
                    "greenhouse_name": gh["name"],
                    "row": row_str,
                    "row_index": row_idx,
                    "tree_index": p_idx,
                    "last_scan_time": today_str,
                    "kondisi": leaf_info["kondisi"],
                    "badge_class": leaf_info["badge"],
                    "raw_class": leaf_key,
                    "nama_penyakit": leaf_info["display_name"],
                    "confidence": conf_leaf,
                    "gejala": leaf_info["gejala"],
                    "rekomendasi_penanganan": leaf_info["penanganan"],
                    "urgensi": leaf_info["urgensi"],
                    "modbus_code": leaf_info["modbus_code"],
                    "model_version": "YOLO11n-CBAM (final.ipynb) - Balanced Leaf",
                    "angles": {
                        "angle1": img_angle1,
                        "angle2": img_angle2,
                        "angle3": img_angle3,
                        "labels": ["Angle 1: Permukaan Atas (Adaxial)", "Angle 2: Permukaan Bawah (Abaxial)", "Angle 3: Kanopi & Tangkai Daun"]
                    }
                }
                trees.append(tree_entry)

                # 2. Kematangan Buah Melon (Siklus 90 Hari Setelah Tanam / 90 HST)
                # Output: mentah (82-85 hari, sisa 5-8 hari), mengkal (86-88 hari, sisa 2-4 hari), matang (90+ hari, sisa 0 hari)
                ripeness_choice = random.choices(["matang", "mengkal", "mentah"], weights=ripeness_weights)[0]

                if ripeness_choice == "matang":
                    fruit_age = random.choice([90, 91])
                    sisa_min, sisa_max = (0, 0)
                    sisa_hari_str = "0 hari (Siap Panen)"
                    rek = "Jaring melon rapat dan merata, retakan cincin absisi tangkai merekah penuh."
                    market_status = "Layak Jual ke Marketplace"
                    market_badge = "success"
                    action_advice = "Buah sudah matang sempurna (siklus 90 HST tercapai) dan layak jual ke marketplace."
                    conf_rip = round(random.uniform(89.0, 97.8), 1)
                    dataset_fruit_cls = "fully_ripe"
                elif ripeness_choice == "mengkal":
                    fruit_age = random.choice([86, 87, 88])
                    sisa_min, sisa_max = (2, 4)
                    sisa_hari_str = f"{sisa_min}-{sisa_max} hari"
                    rek = "Jaring gabus mulai terhubung rapat, proses pematangan sedang berlangsung."
                    market_status = "Belum Layak Jual ke Marketplace"
                    market_badge = "warning"
                    action_advice = f"Belum matang penuh, tunggu estimasi {sisa_hari_str} (menuju siklus 90 HST)."
                    conf_rip = round(random.uniform(87.0, 95.5), 1)
                    dataset_fruit_cls = "half_ripe"
                else:  # mentah
                    fruit_age = random.choice([82, 83, 84, 85])
                    sisa_min, sisa_max = (5, 8)
                    sisa_hari_str = f"{sisa_min}-{sisa_max} hari"
                    rek = "Jaring gabus masih tipis renggang dan warna dasar kehijauan."
                    market_status = "Belum Layak Jual ke Marketplace"
                    market_badge = "secondary"
                    action_advice = f"Buah masih mentah, tunggu estimasi {sisa_hari_str} (menuju siklus 90 HST)."
                    conf_rip = round(random.uniform(90.0, 98.2), 1)
                    dataset_fruit_cls = "unripe"

                # Ambil foto asli dari static/img/real_samples/fruits/
                fruit_img_num = (p_idx % 6) + 1
                fruit_angle1 = f"/static/img/real_samples/fruits/{dataset_fruit_cls}_{fruit_img_num}.jpg"
                fruit_angle2 = f"/static/img/real_samples/fruits/{dataset_fruit_cls}_{(fruit_img_num % 6) + 1}.jpg"
                fruit_angle3 = f"/static/img/real_samples/fruits/{dataset_fruit_cls}_{((fruit_img_num + 1) % 6) + 1}.jpg"

                modbus_val = 2 if ripeness_choice == "matang" else (1 if ripeness_choice == "mengkal" else 0)

                fruit_entry = {
                    "fruit_id": fruit_id,
                    "qr_code": qr_fruit,
                    "tree_id": tree_id,
                    "qr_tree": qr_tree,
                    "greenhouse_id": gh_id,
                    "greenhouse_name": gh["name"],
                    "variety": gh["variety"],
                    "row": row_str,
                    "row_index": row_idx,
                    "tree_index": p_idx,
                    "age_days": fruit_age,
                    "tingkat_kematangan": ripeness_choice,
                    "dataset_stage": dataset_fruit_cls,
                    "confidence": conf_rip,
                    "badge_class": market_badge,
                    "rekomendasi": rek,
                    "marketplace_status": market_status,
                    "action_advice": action_advice,
                    "sisa_hari": sisa_hari_str,
                    "sisa_hari_min": sisa_min,
                    "sisa_hari_max": sisa_max,
                    "modbus_code": modbus_val,
                    "model_version": "YOLO11n-CBAM (final.ipynb)",
                    "sepakat": True,
                    "angles": {
                        "angle1": fruit_angle1,
                        "angle2": fruit_angle2,
                        "angle3": fruit_angle3,
                        "labels": ["Angle 1: Crown (Tangkai)", "Angle 2: Netting Mesh (Sisi)", "Angle 3: Blossom-end (Bawah)"]
                    }
                }
                fruits.append(fruit_entry)

    return greenhouses, trees, fruits
