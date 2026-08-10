"""
activity_logs 일별 집계.

- by_event_type / by_category: 이벤트 건수
- unique_users / unique_sessions: 대략적 참여 규모
- samples: 당일 최근 이벤트 일부 (대시보드 미리보기용)
"""
from datetime import date

from sqlalchemy.engine import Engine
from sqlalchemy.exc import ProgrammingError, OperationalError

from db.connection import fetch_all
from db.date_filter import kst_date_equals
from db.uuid import as_uuid

BY_TYPE_QUERY = f"""
SELECT
    event_type,
    event_category,
    event_action,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM activity_logs
WHERE {kst_date_equals("COALESCE(client_ts, created_at)")}
GROUP BY event_type, event_category, event_action
ORDER BY event_count DESC, event_type
"""

SUMMARY_QUERY = f"""
SELECT
    COUNT(*) AS total_events,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(DISTINCT session_id) AS unique_sessions,
    COUNT(DISTINCT event_type) AS distinct_event_types
FROM activity_logs
WHERE {kst_date_equals("COALESCE(client_ts, created_at)")}
"""

SAMPLE_QUERY = f"""
SELECT
    {as_uuid("id", "id")},
    {as_uuid("user_id", "user_id")},
    session_id,
    event_type,
    event_category,
    event_action,
    page_path,
    client_ts,
    created_at,
    platform
FROM activity_logs
WHERE {kst_date_equals("COALESCE(client_ts, created_at)")}
ORDER BY COALESCE(client_ts, created_at) DESC
LIMIT 50
"""


def _empty_payload() -> dict:
    return {
        "total_events": 0,
        "unique_users": 0,
        "unique_sessions": 0,
        "distinct_event_types": 0,
        "by_event": [],
        "samples": [],
        "note": None,
    }


def collect_activity_logs(engine: Engine, target_date: date) -> dict:
    params = {"target_date": target_date.isoformat()}
    try:
        summary_rows = fetch_all(engine, SUMMARY_QUERY, params)
        by_event = fetch_all(engine, BY_TYPE_QUERY, params)
        samples = fetch_all(engine, SAMPLE_QUERY, params)
    except (ProgrammingError, OperationalError) as exc:
        payload = _empty_payload()
        payload["note"] = f"activity_logs 조회 실패: {exc}"
        return payload

    summary = summary_rows[0] if summary_rows else {}
    return {
        "total_events": int(summary.get("total_events") or 0),
        "unique_users": int(summary.get("unique_users") or 0),
        "unique_sessions": int(summary.get("unique_sessions") or 0),
        "distinct_event_types": int(summary.get("distinct_event_types") or 0),
        "by_event": [
            {
                "event_type": row["event_type"],
                "event_category": row["event_category"],
                "event_action": row["event_action"],
                "event_count": int(row["event_count"] or 0),
                "unique_users": int(row["unique_users"] or 0),
                "unique_sessions": int(row["unique_sessions"] or 0),
            }
            for row in by_event
        ],
        "samples": samples,
        "note": None,
    }
