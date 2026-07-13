"""
집중 타이머 이용 시간 수집.

- personal_sessions: focus_session + focus_interval (개인·그룹 내 개인 타이머)
- group_sessions: group_focus_session + group_focus_interval (그룹 공유 타이머)
"""
from collections import defaultdict
from datetime import date

from sqlalchemy.engine import Engine

from config import schema as s
from db.connection import fetch_all
from db.date_filter import kst_date_equals
from db.identifiers import quote_table
from db.uuid import as_uuid

USER = quote_table(s.T_USER)
GROUP = quote_table(s.T_GROUP)

PERSONAL_SESSION_QUERY = f"""
SELECT
    {as_uuid(f"fs.{s.C_FS_PK}", "session_id")},
    {as_uuid(f"fs.{s.C_FS_USER_ID}", "user_id")},
    u.{s.C_USER_NAME} AS user_name,
    {as_uuid(f"fs.{s.C_FS_GROUP_ID}", "group_id")},
    g.{s.C_GROUP_NAME} AS group_name,
    {as_uuid(f"fs.{s.C_FS_TODO_ID}", "todo_id")},
    {as_uuid(f"fs.{s.C_FS_CATEGORY_ID}", "category_id")},
    fs.{s.C_FS_MODE} AS mode,
    fs.{s.C_FS_PARTICIPATION_TYPE} AS participation_type,
    fs.{s.C_FS_STARTED_AT} AS started_at,
    fs.{s.C_FS_ENDED_AT} AS ended_at,
    fs.{s.C_FS_TARGET_DURATION} AS target_duration,
    fs.{s.C_FS_TOTAL_DURATION} AS total_duration,
    fs.{s.C_FS_PROGRESS_RATE} AS progress_rate,
    fs.{s.C_FS_FOCUS_DURATION} AS focus_duration,
    fs.{s.C_FS_BREAK_DURATION} AS break_duration,
    fs.{s.C_FS_REPEAT_COUNT} AS repeat_count,
    fs.{s.C_FS_STATUS} AS status,
    fs.{s.C_FS_IS_TASK_PUBLIC} AS is_task_public,
    fs.{s.C_FS_IS_TIMER_PUBLIC} AS is_timer_public
FROM {s.T_FOCUS_SESSION} fs
JOIN {USER} u ON u.{s.C_USER_PK} = fs.{s.C_FS_USER_ID}
LEFT JOIN {GROUP} g ON g.{s.C_GROUP_PK} = fs.{s.C_FS_GROUP_ID}
WHERE {kst_date_equals(f"fs.{s.C_FS_STARTED_AT}")}
ORDER BY fs.{s.C_FS_STARTED_AT}
"""

PERSONAL_INTERVAL_QUERY = f"""
SELECT
    {as_uuid(f"fi.{s.C_FI_PK}", "interval_id")},
    {as_uuid(f"fi.{s.C_FI_SESSION_ID}", "session_id")},
    fi.{s.C_FI_STARTED_AT} AS started_at,
    fi.{s.C_FI_ENDED_AT} AS ended_at,
    fi.{s.C_FI_PHASE_TYPE} AS phase_type,
    fi.{s.C_FI_ROUND} AS round
FROM {s.T_FOCUS_INTERVAL} fi
JOIN {s.T_FOCUS_SESSION} fs ON fs.{s.C_FS_PK} = fi.{s.C_FI_SESSION_ID}
WHERE {kst_date_equals(f"fs.{s.C_FS_STARTED_AT}")}
ORDER BY fi.{s.C_FI_SESSION_ID}, fi.{s.C_FI_STARTED_AT}
"""

GROUP_SESSION_QUERY = f"""
SELECT
    {as_uuid(f"gfs.{s.C_GFS_PK}", "session_id")},
    {as_uuid(f"gfs.{s.C_GFS_GROUP_ID}", "group_id")},
    g.{s.C_GROUP_NAME} AS group_name,
    gfs.{s.C_GFS_MODE} AS mode,
    gfs.{s.C_GFS_PARTICIPATION_TYPE} AS participation_type,
    gfs.{s.C_GFS_STARTED_AT} AS started_at,
    gfs.{s.C_GFS_ENDED_AT} AS ended_at,
    gfs.{s.C_GFS_TARGET_DURATION} AS target_duration,
    gfs.{s.C_GFS_TOTAL_DURATION} AS total_duration,
    gfs.{s.C_GFS_PROGRESS_RATE} AS progress_rate,
    gfs.{s.C_GFS_FOCUS_DURATION} AS focus_duration,
    gfs.{s.C_GFS_BREAK_DURATION} AS break_duration,
    gfs.{s.C_GFS_REPEAT_COUNT} AS repeat_count,
    gfs.{s.C_GFS_STATUS} AS status
FROM {s.T_GROUP_FOCUS_SESSION} gfs
JOIN {GROUP} g ON g.{s.C_GROUP_PK} = gfs.{s.C_GFS_GROUP_ID}
WHERE {kst_date_equals(f"gfs.{s.C_GFS_STARTED_AT}")}
ORDER BY gfs.{s.C_GFS_STARTED_AT}
"""

GROUP_INTERVAL_QUERY = f"""
SELECT
    {as_uuid(f"gfi.{s.C_GFI_PK}", "interval_id")},
    {as_uuid(f"gfi.{s.C_GFI_SESSION_ID}", "session_id")},
    gfi.{s.C_GFI_STARTED_AT} AS started_at,
    gfi.{s.C_GFI_ENDED_AT} AS ended_at,
    gfi.{s.C_GFI_PHASE_TYPE} AS phase_type,
    gfi.{s.C_GFI_ROUND} AS round
FROM {s.T_GROUP_FOCUS_INTERVAL} gfi
JOIN {s.T_GROUP_FOCUS_SESSION} gfs ON gfs.{s.C_GFS_PK} = gfi.{s.C_GFI_SESSION_ID}
WHERE {kst_date_equals(f"gfs.{s.C_GFS_STARTED_AT}")}
ORDER BY gfi.{s.C_GFI_SESSION_ID}, gfi.{s.C_GFI_STARTED_AT}
"""


def _attach_intervals(
    sessions: list[dict],
    intervals: list[dict],
    session_id_key: str = "session_id",
) -> list[dict]:
    by_session: dict = defaultdict(list)
    for interval in intervals:
        by_session[interval[session_id_key]].append(interval)

    enriched = []
    for session in sessions:
        row = dict(session)
        row["intervals"] = by_session.get(session[session_id_key], [])
        enriched.append(row)
    return enriched


def collect_timer_usage(engine: Engine, target_date: date) -> dict:
    params = {"target_date": target_date.isoformat()}

    personal_sessions = fetch_all(engine, PERSONAL_SESSION_QUERY, params)
    personal_intervals = fetch_all(engine, PERSONAL_INTERVAL_QUERY, params)
    group_sessions = fetch_all(engine, GROUP_SESSION_QUERY, params)
    group_intervals = fetch_all(engine, GROUP_INTERVAL_QUERY, params)

    return {
        "personal_sessions": _attach_intervals(personal_sessions, personal_intervals),
        "group_sessions": _attach_intervals(group_sessions, group_intervals),
    }
