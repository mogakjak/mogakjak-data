from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from config.settings import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_TYPE, DB_USER


def get_readonly_engine() -> Engine:
    if not all([DB_HOST, DB_NAME, DB_USER, DB_PASSWORD]):
        raise ValueError(
            "DB 접속 정보가 없습니다. .env 또는 GitHub Secrets를 확인하세요."
        )

    user = quote_plus(DB_USER)
    password = quote_plus(DB_PASSWORD)

    if DB_TYPE == "mysql":
        url = (
            f"mysql+pymysql://{user}:{password}"
            f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
    else:
        url = (
            f"postgresql+psycopg2://{user}:{password}"
            f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )

    return create_engine(url, pool_pre_ping=True)


def fetch_all(engine: Engine, query: str, params: dict | None = None) -> list[dict]:
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        return [dict(row._mapping) for row in result]
