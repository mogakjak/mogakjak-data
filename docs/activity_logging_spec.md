# 모각작 통합 활동 로깅 설계서

> 작성 기준: mogakjak-be / mogakjak-fe 코드 분석 (2026-07-12)  
> 대상 독자: PM, 백엔드/프론트엔드 개발자

---

## 1. 배경 및 목적

### 현재 문제

| 축 | 상태 |
|----|------|
| DB | `focus_session`, `invitation` 등 **도메인 테이블**에만 행동이 분산 저장 |
| 실시간 소셜 | poke/cheer → Redis Pub/Sub만, **DB 이력 없음** |
| 프론트 | GA4·Clarity는 타이머·일부 UI에 편중, **퍼널·그룹·온보딩 미수집** |
| 감사 로그 | `official_lounge_access_log`가 유일, **입장 거절만** 기록 |

### 목표

프론트엔드에서 발생하는 **모든 의미 있는 사용자 활동**을 `activity_logs` 테이블에 통합 수집하고, 기존 도메인 테이블과 병행하여 제품 분석·퍼널·이탈 분석을 가능하게 한다.

---

## 2. `activity_logs` DDL (MySQL)

```sql
CREATE TABLE activity_logs (
    id              BINARY(16)      NOT NULL PRIMARY KEY,
    user_id         BINARY(16)      NULL COMMENT '비로그인 이벤트 허용',
    session_id      VARCHAR(64)     NULL COMMENT 'FE 생성 세션 ID (퍼널 연결용)',
    event_type      VARCHAR(64)     NOT NULL COMMENT '예: PAGE_VIEW, TIMER_START',
    event_category  VARCHAR(32)     NOT NULL COMMENT 'AUTH|NAV|TIMER|GROUP|TODO|SOCIAL|LOUNGE|NOTIFICATION|FEEDBACK',
    event_action    VARCHAR(64)     NOT NULL COMMENT 'view|click|submit|complete|dismiss|start|pause|stop',
    entity_type     VARCHAR(32)     NULL COMMENT 'group|todo|focus_session|invitation|user',
    entity_id       BINARY(16)      NULL COMMENT '관련 리소스 UUID',
    page_path       VARCHAR(255)    NULL,
    referrer_path   VARCHAR(255)    NULL,
    properties      JSON            NULL COMMENT '유연한 메타데이터',
    client_ts       DATETIME(3)     NOT NULL COMMENT 'FE 발생 시각 (KST)',
    server_ts       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    platform        VARCHAR(16)     NULL COMMENT 'web|mobile_web',
    user_agent      VARCHAR(512)    NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX idx_user_server_ts   (user_id, server_ts),
    INDEX idx_event_type_ts    (event_type, server_ts),
    INDEX idx_category_ts      (event_category, server_ts),
    INDEX idx_entity           (entity_type, entity_id),
    INDEX idx_session          (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 보존 정책 (권장)

| 기간 | 처리 |
|------|------|
| 0~90일 | Hot (MySQL) |
| 90일~1년 | Cold (S3/Parquet, `mogakjak_data_pipeline` 아카이브) |
| 1년+ | 집계 테이블만 유지, raw 삭제 |

---

## 3. 이벤트 카탈로그

### 3-1. AUTH (인증·온보딩)

| event_type | action | properties 예시 |
|------------|--------|----------------|
| `AUTH_LOGIN_CLICK` | click | `{provider: "kakao"}` |
| `AUTH_LOGIN_SUCCESS` | complete | `{provider, is_new_user}` |
| `AUTH_AGREEMENT_SUBMIT` | submit | `{terms, privacy, marketing}` |
| `ONBOARDING_STEP_VIEW` | view | `{step: 3, total: 11}` |
| `ONBOARDING_COMPLETE` | complete | `{duration_sec}` |
| `ACCOUNT_WITHDRAW` | submit | `{reasons: [], feedback: ""}` |

### 3-2. NAV (네비게이션)

| event_type | action | properties 예시 |
|------------|--------|----------------|
| `PAGE_VIEW` | view | `{from: "/", to: "/todo"}` |
| `NAV_BLOCKED` | dismiss | `{reason: "timer_running"}` |

### 3-3. TIMER (타이머)

| event_type | action | entity | properties 예시 |
|------------|--------|--------|----------------|
| `TIMER_MODE_SELECT` | click | — | `{mode: "POMODORO"}` |
| `TIMER_START` | start | focus_session | `{mode, target_duration, group_id?}` |
| `TIMER_PAUSE` | pause | focus_session | `{session_id}` |
| `TIMER_RESUME` | resume | focus_session | `{session_id}` |
| `TIMER_STOP` | stop | focus_session | `{actual_focus_sec, rounds}` |
| `TIMER_VISIBILITY_TOGGLE` | click | focus_session | `{is_task_public, is_timer_public}` |
| `GROUP_TIMER_START` | start | group_focus_session | `{group_id, mode}` |
| `GROUP_TIMER_STOP` | stop | group_focus_session | `{total_duration}` |

### 3-4. GROUP / SOCIAL

| event_type | action | entity | properties 예시 |
|------------|--------|--------|----------------|
| `GROUP_CREATE` | submit | group | `{name_len}` |
| `GROUP_JOIN` | complete | group | `{source: "invite_link\|search\|lounge"}` |
| `GROUP_LEAVE` | submit | group | — |
| `GROUP_SESSION_ENTER` | start | group | `{entered_at}` |
| `GROUP_SESSION_LEAVE` | stop | group | `{stay_duration_sec}` |
| `INVITE_SEND` | submit | invitation | `{channel: "in_app"}` |
| `INVITE_LINK_COPY` | click | group | — |
| `INVITE_ACCEPT` | complete | invitation | — |
| `INVITE_DECLINE` | dismiss | invitation | — |
| `POKE_SEND` | click | user | `{target_user_id, group_id}` |
| `POKE_RESPOND` | click | — | `{action: "accept\|reject"}` |
| `CHEER_SEND` | click | user | `{context: "group\|lounge"}` |

### 3-5. TODO / MYPAGE / LOUNGE / NOTIFICATION

| event_type | action | properties 예시 |
|------------|--------|----------------|
| `TODO_CREATE` | submit | `{has_target_time}` |
| `TODO_COMPLETE_TOGGLE` | click | `{is_completed}` |
| `RECORD_VIEW` | view | `{tab: "dashboard"}` |
| `PROFILE_UPDATE` | submit | `{fields: ["nickname"]}` |
| `LOUNGE_ENTER` | start | `{result: "success\|denied"}` |
| `LOUNGE_LEAVE` | stop | — |
| `NOTI_RECEIVED` | view | `{type: "focus_check"}` |
| `NOTI_CLICK` | click | `{type, action_taken}` |
| `REVIEW_SUBMIT` | submit | `{score, tag_count}` |

---

## 4. 범용 활동 로깅 API (백엔드)

### 4-1. 엔드포인트

```
POST /api/activity-logs          # 단건
POST /api/activity-logs/batch    # 배치 (최대 50건)
```

- 인증: `@PreAuthorize("isAuthenticated()")` — `user_id`는 JWT에서 추출
- 응답: `202 Accepted` (비동기 큐 적재 권장)
- Rate limit: 유저당 100req/min (배치 1건 = N 이벤트)

### 4-2. Request 스키마

**단건**
```json
{
  "sessionId": "fe-uuid-v4",
  "eventType": "GROUP_JOIN",
  "eventCategory": "GROUP",
  "eventAction": "complete",
  "entityType": "group",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "pagePath": "/invite/550e8400-e29b-41d4-a716-446655440000",
  "referrerPath": "/onboarding",
  "clientTs": "2026-07-12T19:30:00",
  "properties": {
    "source": "invite_link"
  }
}
```

**배치**
```json
{
  "events": [
    { "...": "단건과 동일" },
    { "...": "단건과 동일" }
  ]
}
```

### 4-3. Validation 규칙

| 필드 | 규칙 |
|------|------|
| `eventType` | 카탈로그 화이트리스트 (3장 참조) |
| `eventCategory` | ENUM 고정 |
| `eventAction` | ENUM 고정 |
| `clientTs` | KST, 서버 시각과 ±5분 이내 |
| `properties` | 최대 4KB JSON |
| `entityId` | UUID v4/v7 형식 |

### 4-4. 서버사이드 자동 기록 (AOP/Service 보강)

프론트 누락·조작 방지를 위해 아래 도메인 API 성공 시 **서버에서도** `activity_logs` INSERT:

| 기존 API | 자동 생성 event_type |
|----------|---------------------|
| `POST /api/timers/start/*` | `TIMER_START` |
| `POST /api/timers/finish/{id}` | `TIMER_STOP` |
| `POST /api/groups` | `GROUP_CREATE` |
| `POST /api/groups/{id}/join` | `GROUP_JOIN` |
| `POST /api/groups/poke` | `POKE_SEND` |
| `POST /api/groups/{id}/cheer` | `CHEER_SEND` |
| `POST /api/invitations/{id}/accept` | `INVITE_ACCEPT` |
| `POST /api/lounge/enter` | `LOUNGE_ENTER` |

---

## 5. 프론트엔드 심기 가이드

### 5-1. 디렉터리 구조 (신규)

```
mogakjak-fe/src/app/_lib/activity/
├── types.ts              # EventType, EventCategory 상수
├── session.ts            # sessionId 생성/유지 (sessionStorage)
├── tracker.ts            # track(), flush(), sendBeacon
└── useActivityTracker.ts # React hook
```

### 5-2. 3계층 후킹 전략

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: 글로벌 (80% 커버)                          │
│  ① layout.tsx → ActivityTrackerProvider              │
│  ② routeChangeTracker.tsx → PAGE_VIEW                │
│  ③ api/request.ts → mutation 성공 시 자동 track      │
├─────────────────────────────────────────────────────┤
│  Layer 2: 퍼널 (온보딩·인증)                         │
│  loginButton, agreements, onboarding, deleteAccount  │
├─────────────────────────────────────────────────────┤
│  Layer 3: 고가치 기능                                │
│  groupTimer, profileList(poke), notificationProvider │
└─────────────────────────────────────────────────────┘
```

### 5-3. `tracker.ts` 핵심 동작

1. 메모리 큐에 이벤트 적재
2. **5초 간격** 또는 **10건 도달** 시 `POST /api/activity-logs/batch`
3. `beforeunload` / `visibilitychange` 시 `navigator.sendBeacon`으로 flush
4. 기존 `sendGAEvent`는 **유지** (마케팅팀용), `track()`은 제품 DB용

### 5-4. `request.ts` API 매핑 예시

| endpoint pattern | event_type |
|-----------------|------------|
| `POST /api/groups` | `GROUP_CREATE` |
| `POST /api/groups/*/join` | `GROUP_JOIN` |
| `DELETE /api/groups/*/members/me` | `GROUP_LEAVE` |
| `POST /api/groups/*/invitations` | `INVITE_SEND` |
| `POST /api/invitations/*/accept` | `INVITE_ACCEPT` |
| `POST /api/groups/poke` | `POKE_SEND` |
| `POST /api/timers/start/*` | `TIMER_START` |
| `POST /api/feedback` | `REVIEW_SUBMIT` |

### 5-5. Provider 삽입 위치

`src/app/_providers/providers.tsx` 내부:

```
QueryClientProvider
└── ActivityTrackerProvider    ← 신규
    └── RouteChangeTracker       ← 신규
        └── {children}
```

---

## 6. 데이터 파이프라인 연동

`mogakjak_data_pipeline`은 현재 아래 테이블을 일별 수집한다:

| 수집 키 | 소스 테이블 |
|---------|------------|
| `group_participation.membership_snapshot` | `user_group` |
| `group_participation.session_entries` | `user_group.entered_at` |
| `group_participation.invitations_*` | `invitation` |
| `timer_usage.personal_sessions` | `focus_session` + `focus_interval` |
| `timer_usage.group_sessions` | `group_focus_session` + `group_focus_interval` |

`activity_logs` 도입 후 파이프라인에 추가할 수집기:

```python
# collectors/activity_logs.py (향후)
# WHERE DATE(server_ts) = :target_date
# GROUP BY event_type, event_category → 일별 이벤트 카운트
```

---

## 7. 구현 로드맵

| Phase | 기간 | 범위 | 담당 |
|-------|------|------|------|
| **P0** | 1주 | DDL + API + `tracker.ts` + `request.ts` 후킹 | BE + FE |
| **P1** | 2주 | poke/cheer 서버 로그, 온보딩 step, 탈퇴 사유 API | BE + FE |
| **P2** | 3주 | 도메인 API AOP 자동 기록, 라운지 입장 성공 로그 | BE |
| **P3** | 4주 | `activity_logs` 파이프라인 수집기 + PM 대시보드 | Data |

---

## 8. 참고: 기존 DB vs activity_logs 역할 분담

| 저장소 | 역할 | 예시 |
|--------|------|------|
| `focus_session` | 비즈니스 데이터 (집중 시간 원본) | total_duration, mode |
| `user_group` | 현재 멤버십 상태 | participation_status |
| `activity_logs` | 행동 이벤트 스트림 | PAGE_VIEW, POKE_SEND, NAV_BLOCKED |
| GA4 / Clarity | 마케팅·UI 히트맵 | 자동 pageview, 세션 재생 |

**원칙:** 도메인 테이블은 그대로 두고, `activity_logs`는 **분석·퍼널·사각지대 보완** 전용으로 사용한다.
