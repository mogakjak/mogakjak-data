from config.settings import DB_TYPE


def quote_table(name: str) -> str:
    if DB_TYPE == "mysql":
        return f"`{name}`"
    return f'"{name}"'
