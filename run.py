import os
import sys

# Batasi thread backend agar hemat memori & CPU
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
os.environ.setdefault('MKL_NUM_THREADS', '1')
os.environ.setdefault('OMP_NUM_THREADS', '1')

from services.env_loader import load_local_env
load_local_env()

# Script Runner untuk Smart Agro Melon AI System
from app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("   Monitoring Kematangan Melon & Penyakit Daun")
    print("   Dashboard Visi Komputer Multi-Angle (Flask + React)")
    print("=" * 60)
    print(f" * Dashboard backend & frontend aktif di:")
    print(f"   --> http://127.0.0.1:{port}")
    print(f"   --> http://localhost:{port}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)

