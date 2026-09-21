"""DB 연결만 간단히 테스트합니다. 터널 연 후: .venv\\Scripts\\python test_connection.py"""
import sys

from sqlalchemy import text

from config.settings import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER
from db.connection import get_readonly_engine


def main() -> int:
    print("DB 연결 테스트 중...")
    print(f"  host={DB_HOST!r}")
    print(f"  port={DB_PORT!r}")
    print(f"  name={DB_NAME!r}")
    print(f"  user={DB_USER!r}")
    print(f"  password_len={len(DB_PASSWORD)}")
    print(f"  password_has_newline={chr(10) in DB_PASSWORD or chr(13) in DB_PASSWORD}")
    try:
        engine = get_readonly_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 AS ok"))
            row = result.fetchone()
        print(f"성공: {dict(row._mapping)}")
        return 0
    except Exception as e:
        msg = str(e)
        print(f"실패: {msg}")
        print()
        low = msg.lower()
        if "access denied" in low:
            print("원인: MySQL이 계정/비밀번호를 거부했습니다. USER 또는 PASSWORD Secret이 서버와 다릅니다.")
        elif "unknown database" in low:
            print("원인: DB 이름(MOGAKJAK_DB_NAME)이 서버에 없습니다.")
        elif "cryptography" in low:
            print("원인: MySQL 8 인증에 cryptography 패키지가 필요합니다.")
        elif "ssl" in low:
            print("원인: SSL/인증 핸드셰이크 문제입니다.")
        elif "can't connect" in low or "connection refused" in low:
            print("원인: SSH 터널 또는 DB 포트 문제입니다.")
        else:
            print("원인: DB 연결 실패. 위 실패 메시지를 확인하세요.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
