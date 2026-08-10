"""날짜 구간 DB 스냅샷 수집 (main.py --date 반복)."""
from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KST = timezone(timedelta(hours=9))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from", dest="date_from", required=True)
    parser.add_argument("--to", dest="date_to", default=None)
    args = parser.parse_args()
    start = date.fromisoformat(args.date_from)
    end = (
        date.fromisoformat(args.date_to)
        if args.date_to
        else (datetime.now(KST).date() - timedelta(days=1))
    )
    if end > datetime.now(KST).date() - timedelta(days=1):
        end = datetime.now(KST).date() - timedelta(days=1)
    cur = start
    ok = fail = 0
    while cur <= end:
        print(f"=== DB collect {cur} ===")
        r = subprocess.run(
            [sys.executable, str(ROOT / "main.py"), "--date", cur.isoformat()],
            cwd=str(ROOT),
        )
        if r.returncode == 0:
            ok += 1
        else:
            fail += 1
        cur += timedelta(days=1)
    print(f"DB backfill 완료 ok={ok} fail={fail}")


if __name__ == "__main__":
    main()
