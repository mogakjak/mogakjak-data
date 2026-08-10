-- 모각작 activity_logs (행동 장부)
-- 기존 MySQL DB(mogakjak)에 테이블 추가용

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
