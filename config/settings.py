import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _env(name: str, default: str = "") -> str:
    """Read env var, stripping paste artifacts from GitHub Secrets."""
    value = (os.getenv(name, default) or default).strip().strip('"').strip("'")
    prefix = f"{name}="
    if value.startswith(prefix):
        value = value[len(prefix) :].strip().strip('"').strip("'")
    return value


DB_HOST = _env("MOGAKJAK_DB_HOST")
DB_PORT = _env("MOGAKJAK_DB_PORT", "3306")
DB_NAME = _env("MOGAKJAK_DB_NAME")
DB_USER = _env("MOGAKJAK_DB_USER")
DB_PASSWORD = _env("MOGAKJAK_DB_PASSWORD")
DB_TYPE = _env("MOGAKJAK_DB_TYPE", "mysql").lower()

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", str(BASE_DIR / "data")))
