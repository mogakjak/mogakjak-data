"""
유저별 그룹방 참여 기록 수집.

- membership_snapshot: 수집일 기준 전체 멤버십 상태 (일별 diff 분석용)
- session_entries: 수집일에 그룹 세션에 입장한 기록 (entered_at)
- invitations_created: 수집일에 생성된 초대
- invitations_responded: 수집일에 수락/거절된 초대
"""
from datetime import date

from sqlalchemy.engine import Engine

from config import schema as s
from db.connection import fetch_all
from db.date_filter import kst_date_equals
from db.identifiers import quote_table
from db.uuid import as_uuid

USER = quote_table(s.T_USER)
GROUP = quote_table(s.T_GROUP)

MEMBERSHIP_SNAPSHOT_QUERY = f"""
SELECT
    {as_uuid(f"ug.{s.C_UG_PK}", "user_group_id")},
    {as_uuid(f"ug.{s.C_UG_USER_ID}", "user_id")},
    u.{s.C_USER_NAME} AS user_name,
    {as_uuid(f"ug.{s.C_UG_GROUP_ID}", "group_id")},
    g.{s.C_GROUP_NAME} AS group_name,
    ug.{s.C_UG_ROLE} AS role,
    ug.{s.C_UG_PARTICIPATION_STATUS} AS participation_status,
    ug.{s.C_UG_ENTERED_AT} AS entered_at,
    ug.{s.C_UG_CHEER_COUNT} AS cheer_count,
    ug.{s.C_UG_CREATED_AT} AS joined_at,
    ug.{s.C_UG_UPDATED_AT} AS updated_at
FROM {s.T_USER_GROUP} ug
JOIN {USER} u ON u.{s.C_USER_PK} = ug.{s.C_UG_USER_ID}
JOIN {GROUP} g ON g.{s.C_GROUP_PK} = ug.{s.C_UG_GROUP_ID}
ORDER BY g.{s.C_GROUP_NAME}, u.{s.C_USER_NAME}
"""

SESSION_ENTRIES_QUERY = f"""
SELECT
    {as_uuid(f"ug.{s.C_UG_PK}", "user_group_id")},
    {as_uuid(f"ug.{s.C_UG_USER_ID}", "user_id")},
    u.{s.C_USER_NAME} AS user_name,
    {as_uuid(f"ug.{s.C_UG_GROUP_ID}", "group_id")},
    g.{s.C_GROUP_NAME} AS group_name,
    ug.{s.C_UG_PARTICIPATION_STATUS} AS participation_status,
    ug.{s.C_UG_ENTERED_AT} AS entered_at
FROM {s.T_USER_GROUP} ug
JOIN {USER} u ON u.{s.C_USER_PK} = ug.{s.C_UG_USER_ID}
JOIN {GROUP} g ON g.{s.C_GROUP_PK} = ug.{s.C_UG_GROUP_ID}
WHERE {kst_date_equals(f"ug.{s.C_UG_ENTERED_AT}")}
ORDER BY ug.{s.C_UG_ENTERED_AT}
"""

INVITATIONS_CREATED_QUERY = f"""
SELECT
    {as_uuid(f"i.{s.C_INV_PK}", "invitation_id")},
    {as_uuid(f"i.{s.C_INV_GROUP_ID}", "group_id")},
    g.{s.C_GROUP_NAME} AS group_name,
    {as_uuid(f"i.{s.C_INV_INVITER_ID}", "inviter_id")},
    inviter.{s.C_USER_NAME} AS inviter_name,
    {as_uuid(f"i.{s.C_INV_INVITEE_ID}", "invitee_id")},
    invitee.{s.C_USER_NAME} AS invitee_name,
    i.{s.C_INV_STATUS} AS status,
    i.{s.C_INV_CREATED_AT} AS created_at
FROM {s.T_INVITATION} i
JOIN {GROUP} g ON g.{s.C_GROUP_PK} = i.{s.C_INV_GROUP_ID}
JOIN {USER} inviter ON inviter.{s.C_USER_PK} = i.{s.C_INV_INVITER_ID}
JOIN {USER} invitee ON invitee.{s.C_USER_PK} = i.{s.C_INV_INVITEE_ID}
WHERE {kst_date_equals(f"i.{s.C_INV_CREATED_AT}")}
ORDER BY i.{s.C_INV_CREATED_AT}
"""

INVITATIONS_RESPONDED_QUERY = f"""
SELECT
    {as_uuid(f"i.{s.C_INV_PK}", "invitation_id")},
    {as_uuid(f"i.{s.C_INV_GROUP_ID}", "group_id")},
    g.{s.C_GROUP_NAME} AS group_name,
    {as_uuid(f"i.{s.C_INV_INVITER_ID}", "inviter_id")},
    inviter.{s.C_USER_NAME} AS inviter_name,
    {as_uuid(f"i.{s.C_INV_INVITEE_ID}", "invitee_id")},
    invitee.{s.C_USER_NAME} AS invitee_name,
    i.{s.C_INV_STATUS} AS status,
    i.{s.C_INV_CREATED_AT} AS created_at,
    i.{s.C_INV_UPDATED_AT} AS responded_at
FROM {s.T_INVITATION} i
JOIN {GROUP} g ON g.{s.C_GROUP_PK} = i.{s.C_INV_GROUP_ID}
JOIN {USER} inviter ON inviter.{s.C_USER_PK} = i.{s.C_INV_INVITER_ID}
JOIN {USER} invitee ON invitee.{s.C_USER_PK} = i.{s.C_INV_INVITEE_ID}
WHERE i.{s.C_INV_STATUS} IN ('ACCEPTED', 'DECLINED')
  AND {kst_date_equals(f"i.{s.C_INV_UPDATED_AT}")}
ORDER BY i.{s.C_INV_UPDATED_AT}
"""


def collect_group_participation(engine: Engine, target_date: date) -> dict:
    params = {"target_date": target_date.isoformat()}

    return {
        "membership_snapshot": fetch_all(engine, MEMBERSHIP_SNAPSHOT_QUERY, params),
        "session_entries": fetch_all(engine, SESSION_ENTRIES_QUERY, params),
        "invitations_created": fetch_all(engine, INVITATIONS_CREATED_QUERY, params),
        "invitations_responded": fetch_all(
            engine, INVITATIONS_RESPONDED_QUERY, params
        ),
    }
