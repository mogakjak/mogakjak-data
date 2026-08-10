"""data/ DB 스냅샷 + data/ga GA 일별 JSON → dashboard/manifest.json"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
GA_DIR = DATA_DIR / "ga"
OUT = Path(__file__).resolve().parent / "manifest.json"

GA_PLACEHOLDER_METRICS = {
    "active_users": None,
    "new_users": None,
    "sessions": None,
    "engaged_sessions": None,
    "average_engagement_time_sec": None,
    "bounce_rate": None,
    "retention_d1": None,
    "retention_d7": None,
    "retention_d30": None,
}


def _safe_summary(snapshot: dict) -> dict:
    summary = snapshot.get("summary") or {}
    return {
        "membership_count": int(summary.get("membership_count") or 0),
        "session_entry_count": int(summary.get("session_entry_count") or 0),
        "invitations_created_count": int(summary.get("invitations_created_count") or 0),
        "invitations_responded_count": int(summary.get("invitations_responded_count") or 0),
        "personal_session_count": int(summary.get("personal_session_count") or 0),
        "group_session_count": int(summary.get("group_session_count") or 0),
        "personal_focus_seconds": int(summary.get("personal_focus_seconds") or 0),
        "group_focus_seconds": int(summary.get("group_focus_seconds") or 0),
    }


def _scan_db_days() -> list[dict]:
    days: list[dict] = []
    if not DATA_DIR.exists():
        return days
    for day_dir in sorted(DATA_DIR.iterdir()):
        if not day_dir.is_dir() or day_dir.name == "ga":
            continue
        snapshot_path = day_dir / "daily_snapshot.json"
        if not snapshot_path.exists():
            continue
        try:
            payload = json.loads(snapshot_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        days.append(
            {
                "date": day_dir.name,
                "path": f"../data/{day_dir.name}/daily_snapshot.json",
                "collected_at": payload.get("collected_at"),
                "summary": _safe_summary(payload),
            }
        )
    days.sort(key=lambda d: d["date"], reverse=True)
    return days


def _ensure_ga_placeholder(date: str) -> Path:
    GA_DIR.mkdir(parents=True, exist_ok=True)
    path = GA_DIR / f"{date}.json"
    if path.exists():
        return path
    payload = {
        "source": "ga4",
        "status": "pending_integration",
        "target_date": date,
        "property_id": None,
        "collected_at": None,
        "metrics": dict(GA_PLACEHOLDER_METRICS),
        "checklist": [
            {"item": "GA4 Property ID / 측정 ID 확인", "done": False},
            {"item": "서비스 계정 + Data API 권한", "done": False},
            {"item": "파이프라인 ga collector 구현", "done": False},
            {"item": "Secrets에 GA 인증정보 등록", "done": False},
        ],
        "note": "연동 전 placeholder. 실제 연동 후 metrics가 채워집니다.",
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _scan_ga_days(dates: list[str]) -> list[dict]:
    days: list[dict] = []
    for date in dates:
        path = _ensure_ga_placeholder(date)
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        metrics = payload.get("metrics") or {}
        connected = payload.get("status") == "ok" and any(
            metrics.get(k) is not None for k in GA_PLACEHOLDER_METRICS
        )
        days.append(
            {
                "date": date,
                "path": f"../data/ga/{date}.json",
                "status": payload.get("status", "pending_integration"),
                "connected": connected,
                "collected_at": payload.get("collected_at"),
                "metrics": metrics,
                "checklist": payload.get("checklist") or [],
                "note": payload.get("note"),
            }
        )
    days.sort(key=lambda d: d["date"], reverse=True)
    return days


def build_manifest() -> dict:
    db_days = _scan_db_days()
    dates = [d["date"] for d in db_days]
    if not dates:
        # DB 없어도 GA 골격 날짜 하나라도 유지
        from datetime import date, timedelta

        dates = [(date.today() - timedelta(days=1)).isoformat()]
        for d in dates:
            _ensure_ga_placeholder(d)

    ga_days = _scan_ga_days(dates)
    ga_connected = any(d.get("connected") for d in ga_days)

    return {
        "sources": {
            "db": {"connected": bool(db_days), "day_count": len(db_days)},
            "ga4": {
                "connected": ga_connected,
                "day_count": len(ga_days),
                "status": "ok" if ga_connected else "pending_integration",
            },
        },
        "latest_date": db_days[0]["date"] if db_days else (ga_days[0]["date"] if ga_days else None),
        "db_days": db_days,
        "ga_days": ga_days,
        # 하위 호환
        "days": db_days,
        "day_count": len(db_days),
    }


def main() -> None:
    manifest = build_manifest()
    # GA FE 심어둔 이벤트 + 엑셀 조립 카탈로그
    try:
        try:
            from build_catalog import main as build_catalog_main
        except ImportError:
            from dashboard.build_catalog import main as build_catalog_main

        build_catalog_main()
        manifest["catalog_path"] = "./metrics_catalog.json"
        dates = [d["date"] for d in manifest.get("db_days") or []]
        if not dates and manifest.get("latest_date"):
            dates = [manifest["latest_date"]]
        manifest["ga_events_days"] = [
            {
                "date": d,
                "path": f"../data/ga/{d}_events.json",
            }
            for d in dates
        ]
    except Exception as exc:  # noqa: BLE001
        print(f"catalog 빌드 경고: {exc}")

    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"manifest 저장: {OUT} "
        f"(DB {manifest['sources']['db']['day_count']}일, "
        f"GA {manifest['sources']['ga4']['status']})"
    )


if __name__ == "__main__":
    main()
