from config.settings import DB_TYPE


def kst_date_equals(column: str) -> str:
    """
    KST 기준 특정 날짜(:target_date)와 일치하는지 비교.

    mogakjak-be는 LocalDateTime을 KST로 저장하므로 MySQL에서는 DATE()만 사용.
    """
    if DB_TYPE == "mysql":
        return f"DATE({column}) = :target_date"
    return f"({column} AT TIME ZONE 'Asia/Seoul')::date = CAST(:target_date AS date)"
