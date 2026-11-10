import os
import json
import time
import urllib.request
import urllib.error

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL_NAME = "gpt-4o-mini"

# In-memory cache agar hemat biaya & respon instan
_cache = {
    "ripeness": {"data": None, "timestamp": 0},
    "disease": {"data": None, "timestamp": 0}
}
CACHE_TTL = 300  # 5 menit

def _call_openai(system_prompt, user_prompt):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 450
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            return res_json["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[AnalyticsService] OpenAI API error: {e}")
        return None

def get_ripeness_analytics(stats):
    now = time.time()
    cached = _cache["ripeness"]
    if cached["data"] and (now - cached["timestamp"] < CACHE_TTL):
        return cached["data"]

    total = stats.get("total_fruits", 0)
    matang = stats.get("matang_count", 0)
    mengkal = stats.get("mengkal_count", 0)
    mentah = stats.get("mentah_count", 0)
    pct_matang = stats.get("matang_pct", 0)
    gh_dist = stats.get("gh_distribution", {})

    gh_summary = ", ".join([
        f"{v.get('name')}: {v.get('matang')} matang, {v.get('mengkal')} mengkal, {v.get('mentah')} mentah"
        for k, v in gh_dist.items()
    ])

    system_prompt = (
        "Anda adalah pakar agronomi dan analis AI panen melon hidroponik profesional. "
        "Tugas Anda memberikan deskriptif analitik yang tajam, ringkas, profesional, dan solutif "
        "mengenai status kematangan buah melon saat ini. "
        "Gunakan Bahasa Indonesia baku tanpa emoji, jelas dan mudah dipahami pengelola kebun."
    )

    user_prompt = f"""
Berikut adalah data riil kematangan buah melon hidroponik saat ini:
- Total buah terpantau: {total} buah
- Buah Matang: {matang} buah ({pct_matang}%) - siap panen hari ini
- Buah Mengkal: {mengkal} buah - estimasi panen 2-4 hari lagi
- Buah Mentah: {mentah} buah - fase pembesaran
- Distribusi per kebun: {gh_summary}

Berikan deskriptif analitik terstruktur:
1. Kondisi Saat Ini (Ringkasan singkat rasio panen keseluruhan)
2. Analisis Status Kematangan (Uraian buah matang, mengkal, dan mentah)
3. Rekomendasi Aksi (Langkah prioritas penjemputan dan reservasi booking)
Buat dalam 3 paragraf padat atau poin singkat maksimal 180 kata.
"""

    analysis = _call_openai(system_prompt, user_prompt)
    if not analysis:
        analysis = (
            f"Kondisi saat ini menunjukkan {matang} buah ({pct_matang}%) telah mencapai tingkat kematangan optimal dan siap dipanen hari ini. "
            f"Sebanyak {mengkal} buah berada pada fase mengkal dengan perkiraan masa panen 2 hingga 4 hari ke depan, sedangkan {mentah} buah masih dalam fase pembesaran. "
            f"Disarankan pengelola memprioritaskan distribusi melon matang dan membuka reservasi pemesanan untuk fase mengkal."
        )

    result = {
        "success": True,
        "analytics": analysis,
        "timestamp": now,
        "model": MODEL_NAME
    }
    _cache["ripeness"] = {"data": result, "timestamp": now}
    return result

def get_disease_analytics(stats):
    now = time.time()
    cached = _cache["disease"]
    if cached["data"] and (now - cached["timestamp"] < CACHE_TTL):
        return cached["data"]

    total = stats.get("total_trees", 0)
    sehat = stats.get("sehat_count", 0)
    sakit = stats.get("sakit_count", 0)
    pct_sehat = stats.get("sehat_pct", 0)
    d_classes = stats.get("disease_classes", {})

    system_prompt = (
        "Anda adalah pakar proteksi tanaman hortikultura dan patologi tanaman melon hidroponik. "
        "Tugas Anda memberikan deskriptif analitik mengenai kondisi kesehatan daun saat ini. "
        "Gunakan Bahasa Indonesia baku tanpa emoji, faktual, berbasis data, dan aplikatif bagi pengelola kebun."
    )

    user_prompt = f"""
Berikut adalah data kesehatan daun melon hidroponik saat ini:
- Total pohon terpantau: {total} pohon
- Daun Sehat: {sehat} pohon ({pct_sehat}%)
- Daun Sakit: {sakit} pohon
- Rincian kelas penyakit daun:
  * Normal (Sehat): {d_classes.get('normal', 0)}
  * Hama Kutu Daun (Aphid): {d_classes.get('aphid', 0)}
  * Infeksi Jamur (Fungus): {d_classes.get('fungus', 0)}
  * Lalat Pengorok Daun (Leaf Miner): {d_classes.get('leaf miner', 0)}
  * Gejala Lain / Unknown: {d_classes.get('unknown', 0)}

Berikan deskriptif analitik terstruktur:
1. Kondisi Saat Ini (Kesehatan kanopi dan persentase tanaman sehat)
2. Analisis Gejala & Sebaran Penyakit (Hama/infeksi dominan yang ditemukan)
3. Rekomendasi Mitigasi (Tindakan sanitasi/pengendalian terpadu segera)
Buat dalam 3 paragraf padat atau poin ringkas maksimal 180 kata.
"""

    analysis = _call_openai(system_prompt, user_prompt)
    if not analysis:
        analysis = (
            f"Kondisi kesehatan daun tanaman saat ini berada pada tingkat {pct_sehat}% sehat ({sehat} dari {total} pohon). "
            f"Ditemukan {sakit} pohon dengan indikasi gangguan daun, didominasi oleh infeksi jamur ({d_classes.get('fungus', 0)} pohon) dan hama lalat pengorok ({d_classes.get('leaf miner', 0)} pohon). "
            f"Rekomendasi tindakan meliputi pemangkasan daun bergejala berat serta pengaturan sirkulasi udara greenhouse untuk menekan kelembapan mikro."
        )

    result = {
        "success": True,
        "analytics": analysis,
        "timestamp": now,
        "model": MODEL_NAME
    }
    _cache["disease"] = {"data": result, "timestamp": now}
    return result

