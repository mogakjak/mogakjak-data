"""
mogakjak-be JPA 엔티티 기준 테이블/컬럼명.

출처: mogakjak-be/src/main/java/com/mogakjak/mogakjak/domain/**/entity/
DB: MySQL, UUID PK는 BINARY(16), 컬럼명은 snake_case.
"""

# user (User.java)
T_USER = "user"
C_USER_PK = "id"
C_USER_NAME = "name"
C_USER_EMAIL = "email"
C_USER_LAST_ACTIVITY = "last_activity_at"
C_USER_IS_ACTIVE = "is_active"
C_USER_CREATED_AT = "created_at"
C_USER_UPDATED_AT = "updated_at"

# mogak_groups (Group.java — @Table(name = "mogak_groups"))
T_GROUP = "mogak_groups"
C_GROUP_PK = "id"
C_GROUP_NAME = "name"

# user_group (UserGroup.java)
T_USER_GROUP = "user_group"
C_UG_PK = "id"
C_UG_USER_ID = "user_id"
C_UG_GROUP_ID = "group_id"
C_UG_ROLE = "role"
C_UG_PARTICIPATION_STATUS = "participation_status"
C_UG_ENTERED_AT = "entered_at"
C_UG_CHEER_COUNT = "cheer_count"
C_UG_CREATED_AT = "created_at"
C_UG_UPDATED_AT = "updated_at"

# invitation (Invitation.java)
T_INVITATION = "invitation"
C_INV_PK = "id"
C_INV_GROUP_ID = "group_id"
C_INV_INVITER_ID = "inviter_id"
C_INV_INVITEE_ID = "invitee_id"
C_INV_STATUS = "status"
C_INV_CREATED_AT = "created_at"
C_INV_UPDATED_AT = "updated_at"

# focus_session (FocusSession.java)
T_FOCUS_SESSION = "focus_session"
C_FS_PK = "id"
C_FS_USER_ID = "user_id"
C_FS_TODO_ID = "todo_id"
C_FS_CATEGORY_ID = "category_id"
C_FS_GROUP_ID = "group_id"
C_FS_MODE = "mode"
C_FS_PARTICIPATION_TYPE = "participation_type"
C_FS_STARTED_AT = "started_at"
C_FS_ENDED_AT = "ended_at"
C_FS_TARGET_DURATION = "target_duration"
C_FS_TOTAL_DURATION = "total_duration"
C_FS_PROGRESS_RATE = "progress_rate"
C_FS_FOCUS_DURATION = "focus_duration"
C_FS_BREAK_DURATION = "break_duration"
C_FS_REPEAT_COUNT = "repeat_count"
C_FS_STATUS = "status"
C_FS_IS_TASK_PUBLIC = "is_task_public"
C_FS_IS_TIMER_PUBLIC = "is_timer_public"

# focus_interval (FocusInterval.java)
T_FOCUS_INTERVAL = "focus_interval"
C_FI_PK = "id"
C_FI_SESSION_ID = "session_id"
C_FI_STARTED_AT = "started_at"
C_FI_ENDED_AT = "ended_at"
C_FI_PHASE_TYPE = "phase_type"
C_FI_ROUND = "round"

# group_focus_session (GroupFocusSession.java)
T_GROUP_FOCUS_SESSION = "group_focus_session"
C_GFS_PK = "id"
C_GFS_GROUP_ID = "group_id"
C_GFS_MODE = "mode"
C_GFS_PARTICIPATION_TYPE = "participation_type"
C_GFS_STARTED_AT = "started_at"
C_GFS_ENDED_AT = "ended_at"
C_GFS_TARGET_DURATION = "target_duration"
C_GFS_TOTAL_DURATION = "total_duration"
C_GFS_PROGRESS_RATE = "progress_rate"
C_GFS_FOCUS_DURATION = "focus_duration"
C_GFS_BREAK_DURATION = "break_duration"
C_GFS_REPEAT_COUNT = "repeat_count"
C_GFS_STATUS = "status"

# group_focus_interval (GroupFocusInterval.java)
T_GROUP_FOCUS_INTERVAL = "group_focus_interval"
C_GFI_PK = "id"
C_GFI_SESSION_ID = "session_id"
C_GFI_STARTED_AT = "started_at"
C_GFI_ENDED_AT = "ended_at"
C_GFI_PHASE_TYPE = "phase_type"
C_GFI_ROUND = "round"

# feedback (Feedback.java) — 일일 수집 보조
T_FEEDBACK = "feedback"
C_FB_PK = "id"
C_FB_USER_ID = "user_id"
C_FB_SCORE = "score"
C_FB_CONTENT = "content"
C_FB_CREATED_AT = "created_at"

# official_lounge_access_log (OfficialLoungeAccessLog.java)
T_LOUNGE_ACCESS_LOG = "official_lounge_access_log"
C_OAL_PK = "id"
C_OAL_USER_ID = "user_id"
C_OAL_ATTEMPTED_AT = "attempted_at"
C_OAL_RESULT = "result"
C_OAL_REASON = "reason"
