"""기존 daily_snapshot.json에 activity_logs만 채워 넣기 (전체 DB 재수집 없이)."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from collectors.activity_logs import collect_activity_logs  # noqa: E402
from config.settings import OUTPUT_DIR  # noqa: E402
from db.connection import get_readonly_engine  # noqa: E402

KST = timezone(timedelta(hours=9))


def patch_day(engine, day: date) -> dict:
    path = OUTPUT_DIR / day.isoformat() / "daily_snapshot.json"
    if not path.exists():
        return {"date": day.isoformat(), "status": "skip_no_snapshot"}

    activity = collect_activity_logs(engine, day)
    payload = json.loads(path.read_text(encoding="utf-8"))
    payload["activity_logs"] = activity
    summary = payload.setdefault("summary", {})
    summary["activity_log_count"] = activity["total_events"]
    summary["activity_unique_users"] = activity["unique_users"]
    payload["activity_logs_patched_at"] = datetime.now(KST).isoformat()
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    return {
        "date": day.isoformat(),
        "status": "ok",
        "events": activity["total_events"],
    }


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
    engine = get_readonly_engine()
    cur = start
    ok = fail = skip = nonempty = 0
    while cur <= end:
        try:
            result = patch_day(engine, cur)
            print(result)
            if result["status"] == "ok":
                ok += 1
                if result.get("events"):
                    nonempty += 1
            else:
                skip += 1
        except Exception as exc:  # noqa: BLE001
            fail += 1
            print({"date": cur.isoformat(), "status": "fail", "error": str(exc)})
        cur += timedelta(days=1)
    print(f"activity_logs patch 완료 ok={ok} skip={skip} fail={fail} nonempty={nonempty}")


if __name__ == "__main__":
    main()
