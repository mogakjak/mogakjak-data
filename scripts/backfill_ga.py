"""GA4 Data API로 날짜 구간을 일별 수집합니다."""
from __future__ import annotations

import argparse
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from collectors.ga_metrics import collect_ga_metrics, ga_enabled  # noqa: E402

KST = timezone(timedelta(hours=9))


def _parse(s: str) -> date:
    return date.fromisoformat(s)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from", dest="date_from", required=True, help="YYYY-MM-DD")
    parser.add_argument("--to", dest="date_to", default=None, help="YYYY-MM-DD (기본: 어제 KST)")
    parser.add_argument("--sleep", type=float, default=0.35, help="요청 간격(초)")
    args = parser.parse_args()

    if not ga_enabled():
        raise SystemExit("GA 자격증명 없음 (.env GOOGLE_APPLICATION_CREDENTIALS)")

    start = _parse(args.date_from)
    end = _parse(args.date_to) if args.date_to else (datetime.now(KST).date() - timedelta(days=1))
    if end > datetime.now(KST).date() - timedelta(days=1):
        end = datetime.now(KST).date() - timedelta(days=1)
    if start > end:
        raise SystemExit(f"잘못된 구간: {start} > {end}")

    cur = start
    ok = fail = 0
    while cur <= end:
        try:
            payload = collect_ga_metrics(cur)
            status = payload.get("status")
            print(f"[{cur}] {status}", flush=True)
            if status == "ok":
                ok += 1
            else:
                fail += 1
        except Exception as exc:  # noqa: BLE001
            fail += 1
            print(f"[{cur}] ERROR {exc}", flush=True)
        cur += timedelta(days=1)
        time.sleep(args.sleep)
    print(f"완료 ok={ok} fail={fail} range={start}..{end}", flush=True)


if __name__ == "__main__":
    main()
