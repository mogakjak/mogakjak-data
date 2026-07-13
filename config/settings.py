import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DB_HOST = os.getenv("MOGAKJAK_DB_HOST", "")
DB_PORT = os.getenv("MOGAKJAK_DB_PORT", "3306")
DB_NAME = os.getenv("MOGAKJAK_DB_NAME", "")
DB_USER = os.getenv("MOGAKJAK_DB_USER", "")
DB_PASSWORD = os.getenv("MOGAKJAK_DB_PASSWORD", "")
DB_TYPE = os.getenv("MOGAKJAK_DB_TYPE", "mysql").lower()

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", BASE_DIR / "data"))
