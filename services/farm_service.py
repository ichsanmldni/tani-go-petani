import json
import os
from datetime import datetime
from services.mock_data import generate_initial_farm_data

class FarmService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(FarmService, cls).__new__(cls)
            cls._instance._init_data()
        return cls._instance

    def _init_data(self):
        greenhouses, trees, fruits = generate_initial_farm_data()
        self.greenhouses = greenhouses
        self.trees = trees
        self.fruits = fruits

    def get_all_greenhouses(self):
        return self.greenhouses

    def get_greenhouse_by_id(self, gh_id):
        for gh in self.greenhouses:
            if gh["id"] == gh_id:
                return gh
        return None

    def get_fruits(self, gh_id=None, ripeness=None, search=None):
        res = self.fruits
        if gh_id and gh_id != "all":
            res = [f for f in res if f["greenhouse_id"] == gh_id]
        if ripeness and ripeness != "all":
            res = [f for f in res if f["tingkat_kematangan"] == ripeness]
        if search:
            s = search.lower()
            res = [f for f in res if s in f["fruit_id"].lower() or s in f["tree_id"].lower() or s in f["row"].lower()]
        return res

    def get_fruit_by_id(self, fruit_id):
        for f in self.fruits:
            if f["fruit_id"] == fruit_id:
                return f
        return None

    def get_trees(self, gh_id=None, kondisi=None, search=None):
        res = self.trees
        if gh_id and gh_id != "all":
            res = [t for t in res if t["greenhouse_id"] == gh_id]
        if kondisi and kondisi != "all":
            res = [t for t in res if t["kondisi"].lower() == kondisi.lower()]
        if search:
            s = search.lower()
            res = [t for t in res if s in t["tree_id"].lower() or s in t["nama_penyakit"].lower() or s in t["row"].lower()]
        return res

    def get_tree_by_id(self, tree_id):
        for t in self.trees:
            if t["tree_id"] == tree_id:
                return t
        return None

    def get_global_stats(self):
        total_fruits = len(self.fruits)
        total_trees = len(self.trees)

        # 1. Hitung kematangan buah
        matang_count = sum(1 for f in self.fruits if f["tingkat_kematangan"] == "matang")
        mengkal_count = sum(1 for f in self.fruits if f["tingkat_kematangan"] == "mengkal")
        mentah_count = sum(1 for f in self.fruits if f["tingkat_kematangan"] == "mentah")

        # 2. Hitung kesehatan daun
        sehat_count = sum(1 for t in self.trees if t["kondisi"] == "Sehat")
        sakit_count = sum(1 for t in self.trees if t["kondisi"] == "Sakit")

        # 3. 5 kelas penyakit daun dari dataset
        disease_classes = {
            "normal": sum(1 for t in self.trees if t.get("raw_class") == "normal"),
            "aphid": sum(1 for t in self.trees if t.get("raw_class") == "aphid"),
            "fungus": sum(1 for t in self.trees if t.get("raw_class") == "fungus"),
            "leaf miner": sum(1 for t in self.trees if t.get("raw_class") == "leaf miner"),
            "unknown": sum(1 for t in self.trees if t.get("raw_class") == "unknown")
        }

        # 4. Status Kelayakan Marketplace
        mp_layak = sum(1 for f in self.fruits if "layak jual ke marketplace" in f.get("marketplace_status", "").lower() and "belum" not in f.get("marketplace_status", "").lower())
        mp_belum = sum(1 for f in self.fruits if "belum" in f.get("marketplace_status", "").lower())

        # 5. Sebaran buah matang di masing-masing kebun
        gh_distribution = {}
        for gh in self.greenhouses:
            gid = gh["id"]
            g_fruits = [f for f in self.fruits if f["greenhouse_id"] == gid]
            g_trees = [t for t in self.trees if t["greenhouse_id"] == gid]
            g_matang = sum(1 for f in g_fruits if f["tingkat_kematangan"] == "matang")
            g_mengkal = sum(1 for f in g_fruits if f["tingkat_kematangan"] == "mengkal")
            g_mentah = sum(1 for f in g_fruits if f["tingkat_kematangan"] == "mentah")

            gh_distribution[gid] = {
                "name": gh["name"],
                "variety": gh["variety"],
                "total_fruits": len(g_fruits),
                "matang": g_matang,
                "mengkal": g_mengkal,
                "mentah": g_mentah,
                "matang_pct": round((g_matang / (len(g_fruits) or 1)) * 100, 1),
                "sehat": sum(1 for t in g_trees if t["kondisi"] == "Sehat"),
                "sakit": sum(1 for t in g_trees if t["kondisi"] == "Sakit"),
                "sehat_pct": round((sum(1 for t in g_trees if t["kondisi"] == "Sehat") / (len(g_trees) or 1)) * 100, 1),
            }

        return {
            "total_fruits": total_fruits,
            "total_trees": total_trees,
            "ripeness": {
                "matang": matang_count,
                "mengkal": mengkal_count,
                "mentah": mentah_count,
                "matang_pct": round((matang_count / (total_fruits or 1)) * 100, 1),
                "mengkal_pct": round((mengkal_count / (total_fruits or 1)) * 100, 1),
                "mentah_pct": round((mentah_count / (total_fruits or 1)) * 100, 1)
            },
            "disease": {
                "sehat": sehat_count,
                "sakit": sakit_count,
                "sehat_pct": round((sehat_count / (total_trees or 1)) * 100, 1),
                "sakit_pct": round((sakit_count / (total_trees or 1)) * 100, 1),
                "breakdown": disease_classes
            },
            "marketplace": {
                "layak": mp_layak,
                "belum": mp_belum,
                "layak_pct": round((mp_layak / (total_fruits or 1)) * 100, 1),
                "belum_pct": round((mp_belum / (total_fruits or 1)) * 100, 1)
            },
            "gh_distribution": gh_distribution
        }

    def get_ripeness_summary_with_tree_positions(self):
        """
        Summary report yang menunjukkan jumlah buah per tingkat kematangan
        yang bisa di-klik detail per tingkat kematangan untuk melihat posisi pohon (index).
        """
        categories = ["matang", "mengkal", "mentah"]
        report = {}

        for cat in categories:
            matching_fruits = [f for f in self.fruits if f["tingkat_kematangan"] == cat]
            positions = []
            for f in matching_fruits:
                positions.append({
                    "fruit_id": f["fruit_id"],
                    "tree_id": f["tree_id"],
                    "qr_code": f.get("qr_code", f"QR-FRUIT-{f['fruit_id']}"),
                    "greenhouse_id": f["greenhouse_id"],
                    "greenhouse_name": f["greenhouse_name"],
                    "row": f["row"],
                    "row_index": f["row_index"],
                    "tree_index": f["tree_index"],
                    "age_days": f["age_days"],
                    "confidence": f["confidence"],
                    "tingkat_kematangan": f.get("tingkat_kematangan", cat),
                    "sisa_hari": f.get("sisa_hari", "0 hari" if cat == "matang" else ("2-4 hari" if cat == "mengkal" else "5-8 hari")),
                    "marketplace_status": f["marketplace_status"]
                })

            report[cat] = {
                "label": cat,
                "total": len(matching_fruits),
                "positions": positions
            }

        return report

    def get_disease_summary_grouped_by_gh_and_row(self):
        """
        Summary sakit dan sehat dengan tombol detail posisi pohon,
        grouping by greenhouse dan jalur (menggunakan QR ID pohon dan ID buah).
        """
        grouped = {}
        for gh in self.greenhouses:
            gid = gh["id"]
            g_trees = [t for t in self.trees if t["greenhouse_id"] == gid]

            rows_data = {}
            for row_idx in range(1, gh["rows"] + 1):
                row_str = f"Jalur {row_idx}"
                r_trees = [t for t in g_trees if t["row_index"] == row_idx]

                sakit_trees = [t for t in r_trees if t["kondisi"] == "Sakit"]
                sehat_trees = [t for t in r_trees if t["kondisi"] == "Sehat"]

                sakit_trees_data = [
                    {
                        "tree_id": t["tree_id"],
                        "qr_code": t.get("qr_code", f"QR-TREE-{t['tree_id']}"),
                        "fruit_id": t.get("fruit_id", f"MLN-{t['tree_id']}-F1"),
                        "qr_fruit": t.get("qr_fruit", f"QR-FRUIT-MLN-{t['tree_id']}-F1"),
                        "tree_index": t["tree_index"],
                        "row": t["row"],
                        "kondisi": t["kondisi"],
                        "nama_penyakit": t["nama_penyakit"],
                        "confidence": t["confidence"],
                        "last_scan_time": t["last_scan_time"]
                    } for t in sakit_trees
                ]
                sehat_trees_data = [
                    {
                        "tree_id": t["tree_id"],
                        "qr_code": t.get("qr_code", f"QR-TREE-{t['tree_id']}"),
                        "fruit_id": t.get("fruit_id", f"MLN-{t['tree_id']}-F1"),
                        "qr_fruit": t.get("qr_fruit", f"QR-FRUIT-MLN-{t['tree_id']}-F1"),
                        "tree_index": t["tree_index"],
                        "row": t["row"],
                        "kondisi": t["kondisi"],
                        "nama_penyakit": t["nama_penyakit"],
                        "confidence": t["confidence"],
                        "last_scan_time": t["last_scan_time"]
                    } for t in sehat_trees
                ]

                rows_data[row_str] = {
                    "row_name": row_str,
                    "row_index": row_idx,
                    "total_trees": len(r_trees),
                    "sakit_count": len(sakit_trees),
                    "sehat_count": len(sehat_trees),
                    "sakit_trees": sakit_trees_data,
                    "sehat_trees": sehat_trees_data,
                    "sakit": sakit_trees_data,
                    "sehat": sehat_trees_data
                }

            grouped[gid] = {
                "greenhouse_id": gid,
                "greenhouse_name": gh["name"],
                "variety": gh["variety"],
                "total_trees": len(g_trees),
                "total_sakit": sum(1 for t in g_trees if t["kondisi"] == "Sakit"),
                "total_sehat": sum(1 for t in g_trees if t["kondisi"] == "Sehat"),
                "rows": rows_data
            }

        return grouped

    def get_greenhouse_spatial_grid(self, gh_id):
        gh = self.get_greenhouse_by_id(gh_id)
        if not gh:
            return None

        g_trees = [t for t in self.trees if t["greenhouse_id"] == gh_id]
        g_fruits = [f for f in self.fruits if f["greenhouse_id"] == gh_id]

        grid = []
        for r_idx in range(1, gh["rows"] + 1):
            row_items = []
            for p_idx in range(1, gh["trees_per_row"] + 1):
                tree = next((t for t in g_trees if t["row_index"] == r_idx and t["tree_index"] == p_idx), None)
                fruit = next((f for f in g_fruits if f["row_index"] == r_idx and f["tree_index"] == p_idx), None)

                row_items.append({
                    "row_index": r_idx,
                    "tree_index": p_idx,
                    "tree": tree,
                    "fruit": fruit
                })
            grid.append(row_items)

        return {
            "greenhouse": gh,
            "grid": grid
        }

    def record_melon_scan(self, fruit_id, prediction, angles=None):
        for f in self.fruits:
            if f["fruit_id"] == fruit_id:
                f["tingkat_kematangan"] = prediction.get("tingkat_kematangan", f["tingkat_kematangan"])
                f["confidence"] = prediction.get("confidence", f["confidence"])
                f["rekomendasi"] = prediction.get("rekomendasi", f["rekomendasi"])
                f["marketplace_status"] = prediction.get("marketplace_status", f["marketplace_status"])
                f["badge_class"] = prediction.get("badge_class", f["badge_class"])
                if angles:
                    if isinstance(angles, dict):
                        f["angles"]["angle1"] = angles.get("angle1", f["angles"].get("angle1"))
                        f["angles"]["angle2"] = angles.get("angle2", f["angles"].get("angle2"))
                        f["angles"]["angle3"] = angles.get("angle3", f["angles"].get("angle3"))
                    elif isinstance(angles, list):
                        if len(angles) > 0 and isinstance(angles[0], dict) and 'img' in angles[0]:
                            f["angles"]["angle1"] = angles[0]['img']
                        if len(angles) > 1 and isinstance(angles[1], dict) and 'img' in angles[1]:
                            f["angles"]["angle2"] = angles[1]['img']
                        if len(angles) > 2 and isinstance(angles[2], dict) and 'img' in angles[2]:
                            f["angles"]["angle3"] = angles[2]['img']
                return f
        return None

    def record_disease_scan(self, tree_id, prediction, angles=None):
        for t in self.trees:
            if t["tree_id"] == tree_id:
                t["kondisi"] = prediction.get("kondisi", t["kondisi"])
                t["nama_penyakit"] = prediction.get("nama_penyakit", t["nama_penyakit"])
                t["confidence"] = prediction.get("confidence", t["confidence"])
                t["gejala"] = prediction.get("gejala", t["gejala"])
                t["rekomendasi_penanganan"] = prediction.get("penanganan", t["rekomendasi_penanganan"])
                t["badge_class"] = prediction.get("badge_class", t["badge_class"])
                if angles:
                    if isinstance(angles, dict):
                        t["angles"]["angle1"] = angles.get("angle1", t["angles"].get("angle1"))
                        t["angles"]["angle2"] = angles.get("angle2", t["angles"].get("angle2"))
                        t["angles"]["angle3"] = angles.get("angle3", t["angles"].get("angle3"))
                    elif isinstance(angles, list):
                        if len(angles) > 0 and isinstance(angles[0], dict) and 'img' in angles[0]:
                            t["angles"]["angle1"] = angles[0]['img']
                        if len(angles) > 1 and isinstance(angles[1], dict) and 'img' in angles[1]:
                            t["angles"]["angle2"] = angles[1]['img']
                        if len(angles) > 2 and isinstance(angles[2], dict) and 'img' in angles[2]:
                            t["angles"]["angle3"] = angles[2]['img']
                return t
        return None

    def get_b2b_commodities(self):
        """
        Rekapitulasi komoditas hilir B2B untuk marketplace:
        1. Komoditas Siap Jual (Matang)
        2. Komoditas Pre-Order (Mengkal dengan perkiraan masa panen)
        """
        siap_jual = []
        mengkal_list = []

        total_matang_all = 0
        total_mengkal_all = 0
        total_kg_matang_all = 0.0
        total_kg_mengkal_all = 0.0

        for gh in self.greenhouses:
            gid = gh["id"]
            gh_fruits = [f for f in self.fruits if f["greenhouse_id"] == gid]
            unit_weight = gh.get("estimasi_berat_buah_kg", 1.9)

            # Matang
            matang_fruits = [f for f in gh_fruits if f["tingkat_kematangan"] == "matang"]
            count_matang = len(matang_fruits)
            kg_matang = round(count_matang * unit_weight, 1)

            if count_matang > 0:
                total_matang_all += count_matang
                total_kg_matang_all += kg_matang
                siap_jual.append({
                    "id": f"B2B-RDY-{gid}",
                    "greenhouse_id": gid,
                    "nama_kebun": gh["name"],
                    "varietas": gh["variety"],
                    "alamat": gh.get("alamat", "-"),
                    "link_gmaps": gh.get("gmaps_link", f"https://maps.google.com/?q={gh.get('latitude', 0)},{gh.get('longitude', 0)}"),
                    "latitude": gh.get("latitude"),
                    "longitude": gh.get("longitude"),
                    "jumlah_matang": count_matang,
                    "estimasi_kg": kg_matang,
                    "estimasi_brix": gh.get("estimasi_brix", "14.5 - 16.0 °Bx"),
                    "target_panen": gh.get("target_harvest", "Siap Panen"),
                    "status_ketersediaan": "Tersedia Siap Kirim",
                    "status_badge": "success",
                    "harga_per_kg": 38000,
                    "minimal_order_kg": 50,
                    "kontak_kebun": gh.get("kontak_kebun", "Pengelola Kebun"),
                    "no_hp": gh.get("no_hp", "0812-0000-0000"),
                    "grade": "Grade A Super (Jaring Rapat Merata)",
                    "sample_fruits": [
                        {
                            "fruit_id": f["fruit_id"],
                            "confidence": f["confidence"],
                            "image": f["angles"]["angle1"],
                            "row": f["row"],
                            "tree_index": f["tree_index"]
                        } for f in matang_fruits[:4]
                    ]
                })

            # Mengkal
            mengkal_fruits = [f for f in gh_fruits if f["tingkat_kematangan"] == "mengkal"]
            count_mengkal = len(mengkal_fruits)
            kg_mengkal = round(count_mengkal * unit_weight, 1)

            if count_mengkal > 0:
                total_mengkal_all += count_mengkal
                total_kg_mengkal_all += kg_mengkal
                mengkal_list.append({
                    "id": f"B2B-PRE-{gid}",
                    "greenhouse_id": gid,
                    "nama_kebun": gh["name"],
                    "varietas": gh["variety"],
                    "alamat": gh.get("alamat", "-"),
                    "link_gmaps": gh.get("gmaps_link", f"https://maps.google.com/?q={gh.get('latitude', 0)},{gh.get('longitude', 0)}"),
                    "latitude": gh.get("latitude"),
                    "longitude": gh.get("longitude"),
                    "jumlah_mengkal": count_mengkal,
                    "estimasi_kg": kg_mengkal,
                    "perkiraan_masa_panen": f"2 - 4 Hari Lagi ({gh.get('target_harvest', '')})",
                    "sisa_hari": "2 - 4 hari",
                    "target_panen": gh.get("target_harvest", ""),
                    "status_ketersediaan": "Bisa Pre-Order Kuota",
                    "status_badge": "warning",
                    "harga_per_kg": 35000,
                    "minimal_order_kg": 50,
                    "kontak_kebun": gh.get("kontak_kebun", "Pengelola Kebun"),
                    "no_hp": gh.get("no_hp", "0812-0000-0000"),
                    "grade": "Grade A Pre-Order (Pematangan Optimal)",
                    "sample_fruits": [
                        {
                            "fruit_id": f["fruit_id"],
                            "confidence": f["confidence"],
                            "image": f["angles"]["angle1"],
                            "row": f["row"],
                            "tree_index": f["tree_index"]
                        } for f in mengkal_fruits[:4]
                    ]
                })

        return {
            "success": True,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "total_matang": total_matang_all,
                "total_mengkal": total_mengkal_all,
                "total_kg_matang": round(total_kg_matang_all, 1),
                "total_kg_mengkal": round(total_kg_mengkal_all, 1),
                "total_kebun_aktif": len(self.greenhouses),
                "kebun_siap_jual_count": len(siap_jual),
                "kebun_mengkal_count": len(mengkal_list),
                "rata_rata_brix": "15.2 °Bx",
                "qc_status": "Terverifikasi AI YOLO11n-CBAM & Modbus ROKAE"
            },
            "komoditas_siap_jual": siap_jual,
            "komoditas_mengkal": mengkal_list
        }
