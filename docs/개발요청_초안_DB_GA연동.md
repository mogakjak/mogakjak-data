# 개발 요청 초안 — DB 로그 + GA4 대시보드 연동

> 대상: 프론트엔드 / 백엔드  
> 요청자: PM (데이터 파이프라인)  
> 목적: 대시보드가 **DB + GA4** 지표를 함께 보도록 연동 준비

---

## 배경

- 데이터 파이프라인은 이미 **MySQL(DB)** 에서 일별 스냅샷을 수집합니다.
- 대시보드 UI는 **홈 / DB / GA4** 탭으로 구성해 두었습니다.
- **GA4 기본 지표**(신규 사용자, 활성 사용자, 세션, 리텐션 등)는 아직 API 연동 전이라 placeholder 상태입니다.
- 빠진 행동 로그(콕 발송, 입장 이력, 온보딩 단계 등)는 **공통 activity_logs** 로 심어 달라고 요청합니다.

상세 설계: `docs/activity_logging_spec.md`  
요청 트래킹: Notion DB (아래 `Notion_로그요청_DB.md` 참고)

---

## 요청 A — GA4 Data API → 파이프라인 (우선)

### 목표
매일(또는 대시보드 새로고침 시) 아래 지표를  
`data/ga/YYYY-MM-DD.json` 형식으로 저장할 수 있게 해 주세요.

```json
{
  "source": "ga4",
  "status": "ok",
  "target_date": "2026-07-12",
  "property_id": "properties/XXXXXXXX",
  "collected_at": "2026-07-13T01:00:00+09:00",
  "metrics": {
    "active_users": 0,
    "new_users": 0,
    "sessions": 0,
    "engaged_sessions": 0,
    "average_engagement_time_sec": 0,
    "bounce_rate": 0.0,
    "retention_d1": 0.0,
    "retention_d7": 0.0,
    "retention_d30": 0.0
  }
}
```

- `bounce_rate`, `retention_*` 는 **0~1 비율** (예: 35% → `0.35`)
- 리텐션 리포트 API가 별도면, 가능한 범위부터라도 OK

### FE/BE에서 필요한 것
| 담당 | 내용 |
|------|------|
| 공통 | GA4 **Property ID** / 측정 ID 공유 |
| BE 또는 데이터 | GA4 Data API용 **서비스 계정** JSON + Viewer 권한 |
| FE | (확인) `NEXT_PUBLIC_GA_ID` / gtag 설정이 production에 켜져 있는지 |

### 완료 기준
- [ ] 서비스 계정으로 GA4 지표 1일분 pull 성공
- [ ] `data/ga/날짜.json` 생성 (`status: ok`)
- [ ] 대시보드 **홈·GA4 탭**에 숫자 표시 (파이프라인 쪽은 PM이 연결)

---

## 요청 B — 공통 `activity_logs` (행동 로그 표준화)

### 목표
이벤트마다 테이블을 늘리지 않고, **한 테이블(또는 동일 API)** 에 심어 주세요.  
파이프라인이 통째로 긁어 대시보드/엑셀에 반영하기 위함입니다.

DDL·이벤트 목록: `docs/activity_logging_spec.md`

### 특히 급한 이벤트 (P0)
| event_type | 담당 | 비고 |
|------------|------|------|
| `POKE_SEND` | BE | 현재 Redis만 → DB 이력 필요 |
| `GROUP_ENTER` / `GROUP_LEAVE` | BE | 입장마다 이력 (entered_at 덮어쓰기 보완) |
| `GROUP_JOIN` / `GROUP_LEAVE_MEMBER` | BE | 탈퇴 hard delete로 이력 소실 |
| `ONBOARDING_STEP_VIEW` | FE(+BE) | 단계별 퍼널 |
| `INVITE_LINK_COPY` | FE | 클립보드 복사 |
| `PAGE_VIEW` | FE | 커스텀 경로 (GA pageview 보조) |
| `RECORD_VIEW` | FE/BE | 집중 리포트 조회 |

### 완료 기준
- [ ] `activity_logs` 테이블(또는 합의된 이벤트 API) 배포
- [ ] P0 이벤트 최소 1개 이상 production 기록 확인
- [ ] Notion 요청 카드 상태를 `로그 심김` 으로 변경

---

## 요청 C — Notion으로 이후 요청 받기 (프로세스)

앞으로 로그 추가는 **Notion DB에 카드 추가**로만 요청합니다.  
개발자는 Notion만 보면 됩니다.  
스키마: `docs/Notion_로그요청_DB.md`

상태 흐름:
`요청됨 → 개발중 → 로그 심김 → 파이프라인 수집중 → 대시보드 노출`

---

## 일정 제안

| 순서 | 항목 | 예상 |
|------|------|------|
| 1 | GA Property/권한 공유 | 0.5일 |
| 2 | GA Data API pull PoC | 1~2일 |
| 3 | activity_logs DDL + P0 이벤트 | 2~4일 |
| 4 | 파이프라인·대시보드 연결 (PM) | 연동 후 |

---

## 참고 경로

```
mogakjak_data_pipeline/
  dashboard/          ← 홈·DB·GA UI (GA는 placeholder)
  data/ga/*.json      ← GA 일별 지표 (연동 후 ok)
  data/YYYY-MM-DD/    ← DB 스냅샷 (이미 수집중)
  docs/activity_logging_spec.md
  docs/Notion_로그요청_DB.md
```
