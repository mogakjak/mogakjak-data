from config.settings import DB_TYPE


def as_uuid(column: str, alias: str) -> str:
    """BINARY(16) UUID를 JSON 친화적 문자열로 변환."""
    if DB_TYPE == "mysql":
        return f"BIN_TO_UUID({column}) AS {alias}"
    return f"{column}::text AS {alias}"
