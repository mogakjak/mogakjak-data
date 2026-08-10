import json
import os
from datetime import datetime
from pathlib import Path

import pymysql
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

c = pymysql.connect(
    host=os.getenv("MOGAKJAK_DB_HOST", "127.0.0.1"),
    port=int(os.getenv("MOGAKJAK_DB_PORT", "3306")),
    user=os.getenv("MOGAKJAK_DB_USER", ""),
    password=os.getenv("MOGAKJAK_DB_PASSWORD", ""),
    database=os.getenv("MOGAKJAK_DB_NAME", ""),
)
cur = c.cursor()
cur.execute(
    """
CREATE TABLE IF NOT EXISTS activity_logs (
    id BINARY(16) NOT NULL PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id BINARY(16) NULL,
    session_id VARCHAR(64) NULL,
    event_type VARCHAR(64) NOT NULL,
    event_category VARCHAR(32) NOT NULL,
    event_action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NULL,
    entity_id BINARY(16) NULL,
    page_path VARCHAR(255) NULL,
    referrer_path VARCHAR(255) NULL,
    properties JSON NULL,
    client_ts DATETIME(6) NOT NULL,
    platform VARCHAR(16) NULL,
    user_agent VARCHAR(512) NULL,
    INDEX idx_al_user_created (user_id, created_at),
    INDEX idx_al_event_type_created (event_type, created_at),
    INDEX idx_al_category_created (event_category, created_at),
    INDEX idx_al_entity (entity_type, entity_id),
    INDEX idx_al_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""
)
now = datetime.now()
props = json.dumps({"source": "manual_seed"}, ensure_ascii=False)
cur.execute(
    """
INSERT INTO activity_logs (
  id, created_at, updated_at, user_id, session_id,
  event_type, event_category, event_action,
  page_path, properties, client_ts, platform
) VALUES (
  UUID_TO_BIN(UUID()), %s, %s, NULL, %s,
  %s, %s, %s,
  %s, CAST(%s AS JSON), %s, %s
)
""",
    (
        now,
        now,
        "demo-session",
        "PAGE_VIEW",
        "NAV",
        "view",
        "/",
        props,
        now,
        "web",
    ),
)
c.commit()
cur.execute("SELECT COUNT(*) FROM activity_logs")
print("activity_logs rows:", cur.fetchone()[0])
cur.execute(
    """
SELECT event_type, event_category, page_path, platform
FROM activity_logs
ORDER BY created_at DESC
LIMIT 5
"""
)
for row in cur.fetchall():
    print(row)
c.close()
print("DONE")
