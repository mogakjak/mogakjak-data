"""DB 연결만 간단히 테스트합니다. 터널 연 후: .venv\\Scripts\\python test_connection.py"""
import sys

from sqlalchemy import text

from db.connection import get_readonly_engine


def main() -> int:
    print("DB 연결 테스트 중...")
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
        print("체크리스트:")
        print("1) connect_tunnel.bat 창이 열려 있는지")
        print("2) .env MOGAKJAK_DB_PORT=13307 (or 13308 with connect_tunnel_3308.bat)")
        print("3) MOGAKJAK_DB_USER / PASSWORD 확인")
        return 1


if __name__ == "__main__":
    sys.exit(main())
