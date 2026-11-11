import os
import time
import json
import requests
from datetime import datetime
from typing import Dict, Any
from services.env_loader import load_local_env

load_local_env()

class AIAnalyticsService:
    """
    Layanan Deskriptif Analitik TaniGo berbasis OpenAI GPT Nano (gpt-5.4-nano).
    Menghasilkan analisis naratif cerdas untuk:
    1. Status Kematangan Buah Melon (Siklus 90 HST)
    2. Kondisi Kesehatan Daun & Sebaran Penyakit Tanaman
    """

    DEFAULT_NANO_MODEL = "gpt-5.4-nano"
    FALLBACK_MODEL = "gpt-4o-mini"
    CACHE_TTL_SECONDS = 900  # 15 menit

    def __init__(self):
        load_local_env()
        self.api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self.model = os.environ.get("OPENAI_NANO_MODEL", self.DEFAULT_NANO_MODEL).strip() or self.DEFAULT_NANO_MODEL
        self._ripeness_cache = {"timestamp": 0, "data": None}
        self._disease_cache = {"timestamp": 0, "data": None}

    def _resolve_api_key(self) -> str:
        """Ambil API key dari memory/environment atau muat ulang dari .env bila kosong."""
        key = (self.api_key or os.environ.get("OPENAI_API_KEY", "")).strip()
        if not key or key == "your-openai-api-key-here":
            load_local_env()
            key = os.environ.get("OPENAI_API_KEY", "").strip()
        if key == "your-openai-api-key-here":
            key = ""
        self.api_key = key
        return key

    def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        """Kirim request ke OpenAI API dengan timeout dan fallback model."""
        api_key = self._resolve_api_key()
        if not api_key:
            raise ValueError("OPENAI_API_KEY belum diset di file .env atau environment variable.")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        models_to_try = [self.model, self.FALLBACK_MODEL]

        for m in models_to_try:
            payload = {
                "model": m,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.25,
                "max_completion_tokens": 2500
            }

            try:
                resp = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=15
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return content
                else:
                    print(f"[AIAnalyticsService] Warning: {m} returned {resp.status_code}: {resp.text[:150]}")
            except Exception as e:
                print(f"[AIAnalyticsService] Exception with {m}: {e}")

        raise RuntimeError("Semua percobaan model OpenAI gagal atau timeout.")

    def get_ripeness_analytics(self, stats: Dict[str, Any], force_refresh: bool = False) -> Dict[str, Any]:
        """
        Menghasilkan deskriptif analitik untuk menu Kematangan Buah,
        mencakup analisis per status (matang, mengkal, mentah) berbasis siklus 90 HST.
        """
        now = time.time()
        if not force_refresh and self._ripeness_cache["data"] and (now - self._ripeness_cache["timestamp"] < self.CACHE_TTL_SECONDS):
            return self._ripeness_cache["data"]

        rip = stats.get("ripeness", {})
        matang = rip.get("matang", 29)
        mengkal = rip.get("mengkal", 31)
        mentah = rip.get("mentah", 36)
        total = stats.get("total_fruits", 96)
        gh_dist = stats.get("gh_distribution", {})

        system_prompt = (
            "Anda adalah konsultan agronomi dan analis rantai pasok hortikultura presisi untuk sistem TaniGo. "
            "Anda menganalisis data kematangan buah melon berjaring in-situ di kebun. "
            "Patokan baku siklus panen tanaman adalah 90 Hari Setelah Tanam (90 HST). "
            "JANGAN gunakan kata 'Kesiapan panen AI' atau kata samar seperti 'tergolong sedang/rendah'. "
            "Tuliskan dalam SATU kalimat operasional kebun yang jelas dan konkret: sebutkan jumlah buah yang siap petik hari ini dan gelombang panen berikutnya dalam 2-4 hari. "
            "Output WAJIB berupa JSON murni yang lengkap dan valid sesuai format yang diminta, dalam Bahasa Indonesia."
        )

        user_prompt = f"""
Analisis data kematangan saat ini:
- Total Populasi Buah: {total} buah di 3 Kebun
- Matang (Umur >= 90 HST, Sisa 0 hari): {matang} buah ({rip.get('matang_pct', 30.2)}%)
- Mengkal (Umur ~86-88 HST, Sisa 2-4 hari): {mengkal} buah ({rip.get('mengkal_pct', 32.3)}%)
- Mentah (Umur ~82-85 HST, Sisa 5-8 hari): {mentah} buah ({rip.get('mentah_pct', 37.5)}%)
- Sebaran Kebun: {json.dumps(gh_dist)}

Kembalikan format JSON:
{{
  "overall_verdict": "Satu kalimat konkret: Sebanyak {matang} buah ({rip.get('matang_pct', 30.2)}%) siap dipanen hari ini (Gelombang 1), disusul {mengkal} buah ({rip.get('mengkal_pct', 32.3)}%) dalam 2-4 hari ke depan.",
  "overall_narrative": "Sebanyak {matang} buah siap dipanen hari ini, disusul {mengkal} buah mengkal dalam 2-4 hari ke depan.",
  "harvest_readiness_score": {round(((matang + 0.65 * mengkal) / (total or 1)) * 100, 1)},
  "target_benchmark": "90 Hari Setelah Tanam (HST)",
  "projected_harvest_window": "2 - 4 Hari Lagi",
  "estimated_brix": "14.5 - 16.0 °Bx",
  "status_analysis": {{
    "matang": {{
      "status_label": "Matang · Siap Panen Hari Ini",
      "count": {matang},
      "percentage": {rip.get('matang_pct', 30.2)},
      "quick_insight": "Jaring suberin rapat merata dan absisi penuh, siap petik dan kirim ke pasar segar Grade A hari ini.",
      "action_chip": "Siap Petik Hari Ini",
      "market_channel": "Grade A Supermarket & Marketplace B2B",
      "action": "Panen selektif pohon matang hari ini."
    }},
    "mengkal": {{
      "status_label": "Mengkal · Panen 2–4 Hari Lagi",
      "count": {mengkal},
      "percentage": {rip.get('mengkal_pct', 32.3)},
      "quick_insight": "Daging buah masih padat dan kokoh; sangat tahan guncangan ekspedisi antarkota dan matang saat tiba di pembeli.",
      "action_chip": "Pre-Order B2B (Panen H+2)",
      "market_channel": "Distribusi Logistik Jarak Jauh",
      "action": "Alokasikan untuk pre-order dan jadwal panen 48 jam."
    }},
    "mentah": {{
      "status_label": "Mentah · Sisa 5–8 Hari Lagi",
      "count": {mentah},
      "percentage": {rip.get('mentah_pct', 37.5)},
      "quick_insight": "Buah aktif membentuk guratan jaring (fase netting) dan menimbun rasa manis (Brix); tunda panen hingga usia 90 HST.",
      "action_chip": "Tunda Panen (Fase Netting)",
      "market_channel": "Retensi Pohon (Tunda Panen)",
      "action": "Pertahankan pasokan kalium harian dan tunda pemetikan."
    }}
  }},
  "harvest_waves": [
    {{"label": "Gelombang 1 (Hari Ini)", "count": {matang}, "status": "Siap Panen", "days": "0 Hari"}},
    {{"label": "Gelombang 2 (2-4 Hari)", "count": {mengkal}, "status": "Pre-Order B2B", "days": "2-4 Hari"}},
    {{"label": "Gelombang 3 (5-8 Hari)", "count": {mentah}, "status": "Pematangan", "days": "5-8 Hari"}}
  ],
  "strategic_recommendations": [
    "Lakukan panen selektif untuk buah matang 90 HST hari ini.",
    "Alokasikan buah mengkal untuk logistik pesanan ekspedisi antarkota.",
    "Pertahankan nutrisi kalium pada buah mentah hingga genap 90 HST."
  ]
}}
"""

        try:
            raw_json = self._call_openai(system_prompt, user_prompt)
            result = json.loads(raw_json)
            result["model_used"] = self.model
            result["generated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            result["source"] = "openai_gpt_nano"
            self._ripeness_cache = {"timestamp": now, "data": result}
            return result
        except Exception as err:
            print(f"[AIAnalyticsService] Fallback heuristic for ripeness analytics: {err}")
            fallback = self._get_fallback_ripeness_analytics(stats)
            if self._resolve_api_key():
                self._ripeness_cache = {"timestamp": now - (self.CACHE_TTL_SECONDS - 60), "data": fallback}
            return fallback

    def get_disease_analytics(self, stats: Dict[str, Any], force_refresh: bool = False) -> Dict[str, Any]:
        """
        Menghasilkan deskriptif analitik untuk menu Kesehatan Daun (Penyakit),
        mencakup kondisi saat ini, rasio sehat vs sakit, dan rekomendasi mitigasi.
        """
        now = time.time()
        if not force_refresh and self._disease_cache["data"] and (now - self._disease_cache["timestamp"] < self.CACHE_TTL_SECONDS):
            return self._disease_cache["data"]

        dis = stats.get("disease", {})
        sehat = dis.get("sehat", 74)
        sakit = dis.get("sakit", 22)
        total = stats.get("total_trees", 96)
        breakdown = dis.get("breakdown", {})
        gh_dist = stats.get("gh_distribution", {})

        system_prompt = (
            "Anda adalah ahli patologi tanaman dan agronomis kebun spesialis melon dari sistem TaniGo. "
            "Anda menganalisis status kesehatan daun berdasarkan inspeksi visi komputer harian (3 sudut pandang per pohon). "
            "Status kesehatan diklasifikasikan secara tegas menjadi Sehat atau Sakit dengan nama patogen spesifik: "
            "Aphid (Kutu Daun), Fungus (Jamur Daun), dan Leaf Miner (Penggorok Daun). "
            "JANGAN MEMBUAT PARAGRAF PANJANG. Tuliskan setiap penjelasan dalam SATU kalimat pendek, padat, dan visual-friendly. "
            "Output WAJIB berupa JSON murni yang lengkap dan valid sesuai format yang diminta, dalam Bahasa Indonesia."
        )

        user_prompt = f"""
Analisis data kesehatan daun saat ini:
- Total Pohon Diperiksa: {total} pohon di 3 Kebun
- Pohon Sehat: {sehat} pohon ({dis.get('sehat_pct', 77.1)}%)
- Pohon Sakit: {sakit} pohon ({dis.get('sakit_pct', 22.9)}%)
- Sebaran Patogen Daun:
  * Aphid (Kutu Daun): {breakdown.get('aphid', 9)} pohon
  * Fungus (Jamur Daun): {breakdown.get('fungus', 8)} pohon
  * Leaf Miner (Penggorok Daun): {breakdown.get('leaf miner', 5)} pohon
- Sebaran Kesehatan per Kebun: {json.dumps(gh_dist)}

Kembalikan format JSON:
{{
  "overall_verdict": "Satu kalimat ringkas kesimpulan diagnosis kesehatan kanopi AI untuk dashboard.",
  "overall_narrative": "Satu kalimat ringkas kesimpulan diagnosis kesehatan kanopi AI.",
  "health_score": {dis.get('sehat_pct', 77.1)},
  "threat_level": "Waspada Terkendali",
  "threat_score": {dis.get('sakit_pct', 22.9)},
  "pathogen_analysis": {{
    "aphid": {{
      "label": "Aphid (Kutu Daun)",
      "count": {breakdown.get('aphid', 9)},
      "urgency": "Tinggi",
      "severity_score": 75,
      "quick_insight": "Koloni kutu bawah daun berisiko memicu jelaga & vektor virus.",
      "action_chip": "Semprot Sabun Kalium",
      "impact": "Menghisap cairan floem bawah daun.",
      "immediate_action": "Semprot sabun kalium & pasang yellow trap."
    }},
    "fungus": {{
      "label": "Fungus (Jamur Daun)",
      "count": {breakdown.get('fungus', 8)},
      "urgency": "Tinggi",
      "severity_score": 70,
      "quick_insight": "Spora tepung di kanopi atas menghambat laju fotosintesis.",
      "action_chip": "Bio-Fungisida & Ventilasi",
      "impact": "Bercak spora menutupi helai fotosintesis.",
      "immediate_action": "Sanitasi daun & kurangi kelembapan kebun."
    }},
    "leaf_miner": {{
      "label": "Leaf Miner (Penggorok)",
      "count": {breakdown.get('leaf miner', 5)},
      "urgency": "Sedang",
      "severity_score": 45,
      "quick_insight": "Alur korok transparan larva di mesofil daun.",
      "action_chip": "Pasang Sticky Trap",
      "impact": "Liang korok mengurangi efisiensi daun.",
      "immediate_action": "Pasang sticky trap kuning & pangkas helai sakit."
    }}
  }},
  "kebun_hotspots": [
    {{"name": "Kebun Sakura (Ciwidey)", "health_pct": 84, "status": "Aman"}},
    {{"name": "Kebun Maribaya (Lembang)", "health_pct": 78, "status": "Stabil"}},
    {{"name": "Kebun Cisondari (Pasirjambu)", "health_pct": 69, "status": "Perhatian"}}
  ],
  "hotspot_areas": "Konsentrasi pohon sakit terpantau pada baris tengah (Jalur 2 dan 3).",
  "containment_steps": [
    "Isolasi 9 pohon terinfeksi kutu daun.",
    "Optimalkan ventilasi kebun untuk tekan spora jamur.",
    "Gunakan peta posisi pohon untuk panduan penyemprotan terarah."
  ]
}}
"""

        try:
            raw_json = self._call_openai(system_prompt, user_prompt)
            result = json.loads(raw_json)
            result["model_used"] = self.model
            result["generated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            result["source"] = "openai_gpt_nano"
            self._disease_cache = {"timestamp": now, "data": result}
            return result
        except Exception as err:
            print(f"[AIAnalyticsService] Fallback heuristic for disease analytics: {err}")
            fallback = self._get_fallback_disease_analytics(stats)
            if self._resolve_api_key():
                self._disease_cache = {"timestamp": now - (self.CACHE_TTL_SECONDS - 60), "data": fallback}
            return fallback

    def _get_fallback_ripeness_analytics(self, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Cadangan heuristik jika koneksi OpenAI offline."""
        rip = stats.get("ripeness", {})
        matang = rip.get("matang", 29)
        mengkal = rip.get("mengkal", 31)
        mentah = rip.get("mentah", 36)
        total = stats.get("total_fruits", 96)

        return {
            "overall_verdict": f"Sebanyak {matang} buah ({rip.get('matang_pct', 30.2)}%) telah mencapai umur 90 HST dan siap dipanen hari ini, disusul gelombang kedua sebanyak {mengkal} buah ({rip.get('mengkal_pct', 32.3)}%) dalam 2–4 hari ke depan.",
            "overall_narrative": f"Sebanyak {matang} buah matang siap petik hari ini, {mengkal} buah mengkal ideal untuk pre-order pengiriman luar kota (H+2), dan {mentah} buah dalam fase pengisian jaring & sukrosa aktif.",
            "harvest_readiness_score": round(((matang + 0.65 * mengkal) / (total or 1)) * 100, 1),
            "target_benchmark": "90 Hari Setelah Tanam (HST)",
            "projected_harvest_window": "2 - 4 Hari Lagi",
            "estimated_brix": "14.5 - 16.0 °Bx",
            "status_analysis": {
                "matang": {
                    "status_label": "Matang · 0 Hari (90 HST)",
                    "count": matang,
                    "percentage": rip.get("matang_pct", 30.2),
                    "quick_insight": "Jaring rapat merata dan absisi penuh, siap petik dan kirim ke pasar premium hari ini.",
                    "action_chip": "Siap Petik Hari Ini",
                    "characteristics": "Jaring rapat merata, tangkai full-slip.",
                    "analytical_summary": "Akumulasi gula optimal (Brix >= 14°Bx). Siap petik hari ini.",
                    "market_channel": "Grade A Supermarket & Marketplace B2B",
                    "action": "Lakukan pemetikan selektif pada pohon teridentifikasi hari ini."
                },
                "mengkal": {
                    "status_label": "Mengkal · 2–4 Hari",
                    "count": mengkal,
                    "percentage": rip.get("mengkal_pct", 32.3),
                    "quick_insight": "Jaring gabus 70-80% dan tekstur padat, sangat ideal untuk kuota pre-order logistik jarak jauh.",
                    "action_chip": "Pre-Order B2B (H+2)",
                    "characteristics": "Jaring gabus 70-80%, zona absisi separuh.",
                    "analytical_summary": "Sisa 2-4 hari menuju 90 HST. Tekstur kokoh tahan benturan transportasi.",
                    "market_channel": "Distribusi Logistik Jarak Jauh",
                    "action": "Jadwalkan panen untuk pengiriman luar kota dalam 48 jam."
                },
                "mentah": {
                    "status_label": "Mentah · 5–8 Hari",
                    "count": mentah,
                    "percentage": rip.get("mentah_pct", 37.5),
                    "quick_insight": "Fase pembentukan jaring aktif, tahan panen dan optimalkan suplai harian kalium.",
                    "action_chip": "Retensi Nutrisi Kalium",
                    "characteristics": "Warna dasar hijau dominan, jaring gabus masih tipis.",
                    "analytical_summary": "Sisa 5-8 hari menuju 90 HST. Proses akumulasi sukrosa sedang berjalan.",
                    "market_channel": "Retensi Pohon (Belum Layak Jual)",
                    "action": "Pertahankan pasokan nutrisi kalium & hindari petik dini."
                }
            },
            "harvest_waves": [
                {"label": "Wave 1 (Hari Ini)", "count": matang, "status": "Siap Panen", "days": "0 Hari"},
                {"label": "Wave 2 (2-4 Hari)", "count": mengkal, "status": "Pre-Order B2B", "days": "2-4 Hari"},
                {"label": "Wave 3 (5-8 Hari)", "count": mentah, "status": "Pematangan", "days": "5-8 Hari"}
            ],
            "greenhouse_readiness": [
                {"greenhouse_name": "Kebun Cisondari (Pasirjambu)", "status_readiness": "Tinggi", "summary": "Proporsi matang tertinggi (60%), prioritas panen hari ini."},
                {"greenhouse_name": "Kebun Sakura (Ciwidey)", "status_readiness": "Sedang", "summary": "Sebaran seimbang (40% matang, 40% mengkal), siap panen bertahap 2-3 hari."},
                {"greenhouse_name": "Kebun Maribaya (Lembang)", "status_readiness": "Awal", "summary": "Mayoritas buah masih mentah (45%) dan mengkal (35%), fokus nutrisi."}
            ],
            "strategic_recommendations": [
                "Prioritaskan panen selektif untuk 29 buah matang di Kebun Cisondari dan Kebun Sakura hari ini.",
                "Alokasikan 31 buah mengkal untuk memenuhi kuota pesanan ekspedisi antar-kota pada H+2.",
                "Pantau secara ketat 36 buah mentah agar pembentukan jaring suberin sempurna pada umur 90 HST."
            ],
            "model_used": "rules-engine-fallback",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source": "heuristic_fallback"
        }

    def _get_fallback_disease_analytics(self, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Cadangan heuristik jika koneksi OpenAI offline."""
        dis = stats.get("disease", {})
        sehat = dis.get("sehat", 74)
        sakit = dis.get("sakit", 22)
        breakdown = dis.get("breakdown", {})

        return {
            "overall_verdict": f"77.1% populasi kanopi dalam status Sehat Prima; sebaran 22 pohon sakit terkonsentrasi dan terkendali.",
            "overall_narrative": f"Kondisi kanopi kebun berada dalam status Waspada Terkendali dengan 74 pohon Sehat prima dan 22 pohon terdeteksi Sakit terfokus pada kutu daun ({breakdown.get('aphid', 9)}) dan jamur ({breakdown.get('fungus', 8)}).",
            "health_score": dis.get("sehat_pct", 77.1),
            "threat_level": "Waspada Terkendali",
            "threat_score": dis.get("sakit_pct", 22.9),
            "health_rate_summary": f"{dis.get('sehat_pct', 77.1)}% Sehat ({sehat} pohon) berbanding {dis.get('sakit_pct', 22.9)}% Sakit ({sakit} pohon)",
            "pathogen_analysis": {
                "aphid": {
                    "label": "Aphid (Kutu Daun)",
                    "count": breakdown.get("aphid", 9),
                    "urgency": "Tinggi",
                    "severity_score": 75,
                    "quick_insight": "Koloni kutu bawah daun berisiko memicu jelaga & vektor virus.",
                    "action_chip": "Semprot Sabun Kalium",
                    "impact": "Menghisap cairan floem bawah daun.",
                    "immediate_action": "Aplikasi sabun kalium & pasang yellow sticky trap."
                },
                "fungus": {
                    "label": "Fungus (Jamur Daun)",
                    "count": breakdown.get("fungus", 8),
                    "urgency": "Tinggi",
                    "severity_score": 70,
                    "quick_insight": "Spora tepung di kanopi atas menghambat laju fotosintesis.",
                    "action_chip": "Bio-Fungisida & Ventilasi",
                    "impact": "Bercak jamur tepung menutupi kanopi atas.",
                    "immediate_action": "Sanitasi daun terinfeksi & kurangi kelembapan kebun."
                },
                "leaf_miner": {
                    "label": "Leaf Miner (Penggorok)",
                    "count": breakdown.get("leaf miner", 5),
                    "urgency": "Sedang",
                    "severity_score": 45,
                    "quick_insight": "Alur korok transparan larva di mesofil daun.",
                    "action_chip": "Pasang Sticky Trap",
                    "impact": "Terowongan larva mengurangi efisiensi daun.",
                    "immediate_action": "Pangkas helai sakit & pasang sticky trap."
                }
            },
            "kebun_hotspots": [
                {"name": "Kebun Sakura (Ciwidey)", "health_pct": 84, "status": "Aman"},
                {"name": "Kebun Maribaya (Lembang)", "health_pct": 78, "status": "Stabil"},
                {"name": "Kebun Cisondari (Pasirjambu)", "health_pct": 69, "status": "Perhatian"}
            ],
            "hotspot_areas": "Konsentrasi pohon sakit terpantau pada baris tengah (Jalur 2 dan Jalur 3).",
            "containment_steps": [
                "Isolasi 9 pohon terinfeksi kutu daun untuk cegah transmisi ke buah.",
                "Optimalkan ventilasi kebun untuk menekan spora jamur.",
                "Gunakan Peta Posisi Pohon untuk memandu petugas penyemprotan terarah."
            ],
            "model_used": "rules-engine-fallback",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source": "heuristic_fallback"
        }

# Instance singleton
ai_analytics_service = AIAnalyticsService()
