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
        print(f"실패: {e}")
        print()
        msg = str(e).lower()
        if "access denied" in msg:
            print("원인: DB 사용자/비밀번호가 서버와 다릅니다.")
            print("GitHub Secret MOGAKJAK_DB_USER / MOGAKJAK_DB_PASSWORD를 .env와 동일하게 Update 하세요.")
            print("Secret에는 등호(=) 오른쪽 값만 넣습니다. 예: mogakjak_user")
        elif "unknown database" in msg:
            print("원인: DB 이름이 서버와 다릅니다.")
            print("GitHub Secret MOGAKJAK_DB_NAME을 .env와 동일하게 Update 하세요. 예: mogakjak")
        elif "can't connect" in msg or "connection refused" in msg:
            print("원인: SSH 터널 또는 DB 포트 문제입니다.")
        else:
            print("체크리스트:")
            print("1) 로컬이면 connect_tunnel_3308.bat 창이 열려 있는지")
            print("2) GitHub이면 Secret 3개(NAME/USER/PASSWORD)가 .env와 같은지")
        return 1


if __name__ == "__main__":
    sys.exit(main())
