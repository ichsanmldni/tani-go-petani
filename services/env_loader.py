import os


def _parse_env_file(env_path: str) -> None:
    """Parse file .env memakai Python standar agar tetap berfungsi walau python-dotenv belum terinstal."""
    if not env_path or not os.path.isfile(env_path):
        return

    try:
        with open(env_path, "r", encoding="utf-8-sig") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                if line.startswith("export "):
                    line = line[len("export "):].strip()

                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip()

                if val and val[0] not in ('"', "'") and " #" in val:
                    val = val.split(" #", 1)[0].strip()

                if len(val) >= 2 and (
                    (val[0] == '"' and val[-1] == '"')
                    or (val[0] == "'" and val[-1] == "'")
                ):
                    val = val[1:-1]

                if key and not os.environ.get(key, "").strip():
                    os.environ[key] = val
    except Exception as e:
        print(f"[EnvLoader] Warning gagal membaca {env_path}: {e}")


def load_local_env() -> None:
    """
    Memuat variabel lingkungan dari file .env di root proyek dan direktori kerja saat ini.
    Berjalan dengan python-dotenv (jika ada) maupun parser bawaan Python.
    """
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidate_paths = [
        os.path.join(root_dir, ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]

    seen = set()
    unique_paths = []
    for p in candidate_paths:
        norm = os.path.normpath(os.path.abspath(p))
        if norm not in seen:
            seen.add(norm)
            unique_paths.append(norm)

    try:
        from dotenv import load_dotenv

        for env_path in unique_paths:
            if os.path.isfile(env_path):
                load_dotenv(env_path, override=False)
    except ImportError:
        pass

    for env_path in unique_paths:
        _parse_env_file(env_path)

