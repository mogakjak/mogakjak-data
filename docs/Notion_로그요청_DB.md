# Notion DB — 로그/지표 요청 보드

PM이 여기에 올리면 → FE/BE가 보고 구현 → 상태가 바뀌면  
시트(엑셀 카탈로그) · 대시보드 반영 기준으로 씁니다.

---

## 1. Notion에서 만들기

1. Notion → **Table - Full page** (또는 Database)  
2. 이름: `모각작 로그·지표 요청`  
3. 아래 **속성(Properties)** 추가  
4. 뷰 3개 추천:
   - **보드**: Group by `상태`
   - **테이블**: 전체 목록
   - **필터: P0만**: `우선순위 = P0`

---

## 2. 속성 정의 (복붙용)

| 속성 이름 | 타입 | 옵션 / 설명 |
|-----------|------|-------------|
| 이름 | Title | 예: `[BE] 콕 찌르기 발송 로그` |
| 상태 | Status 또는 Select | `요청됨` / `스펙검토` / `개발중` / `로그심김` / `파이프라인수집중` / `대시보드노출` / `보류` |
| 우선순위 | Select | `P0` / `P1` / `P2` / `P3` |
| 담당영역 | Multi-select | `FE` / `BE` / `데이터파이프라인` / `GA` |
| 담당자 | Person | |
| 데이터코드 | Text | 예: `POKE_SEND`, `GA_NEW_USERS` (엑셀 코드와 동일하게) |
| 지표유형 | Select | `원자지표` / `파생지표` / `GA기본지표` / `수집작업` |
| 수집소스 | Multi-select | `DB` / `GA4` / `activity_logs` / `Redis` / `Clarity` |
| 화면명 | Text | 예: 그룹방, 온보딩 |
| 발생조건 | Text | 언제 심는지 한 줄 |
| 속성(JSON예시) | Text | `{"target_user_id":"..."}` |
| 완료기준 | Text | 개발 Done 정의 |
| 대시보드위치 | Select | `홈` / `DB탭` / `GA탭` / `추후조합` / `해당없음` |
| 엑셀반영 | Checkbox | 시트 카탈로그에 행 추가/상태변경 했는지 |
| 요청일 | Date | |
| 희망일 | Date | |
| 관련PR | URL | |
| 비고 | Text | |

---

## 3. 상태 의미

| 상태 | 누가 | 의미 |
|------|------|------|
| 요청됨 | PM | 새로 올림 |
| 스펙검토 | FE/BE | 필드·타이밍 확인 중 |
| 개발중 | FE/BE | 구현 중 |
| 로그심김 | FE/BE | prod/ staging에 기록 확인됨 |
| 파이프라인수집중 | 데이터/PM | JSON·시트에 수치 들어옴 |
| 대시보드노출 | PM | 홈/탭에 보임 |
| 보류 | PM | 나중에 |

---

## 4. 샘플 카드 (처음 넣어둘 것)

### 카드 1 — GA4 기본 지표 연동
- 이름: `[데이터] GA4 Data API → data/ga 일별 JSON`
- 상태: 요청됨
- 우선순위: P0
- 담당영역: BE, 데이터파이프라인, GA
- 데이터코드: `GA_DAILY_METRICS`
- 대시보드위치: 홈, GA탭
- 완료기준: `data/ga/날짜.json` status=ok, 신규/활성/세션/리텐션 수치 표시

### 카드 2 — activity_logs 테이블
- 이름: `[BE] activity_logs 테이블 + API`
- 상태: 요청됨
- 우선순위: P0
- 담당영역: BE
- 데이터코드: `ACTIVITY_LOGS`
- 완료기준: DDL 배포, FE에서 1건 write 성공  
- 참고: `docs/activity_logging_spec.md`

### 카드 3 — 콕 발송
- 이름: `[BE] POKE_SEND DB/activity_logs 기록`
- 우선순위: P0
- 담당영역: BE
- 데이터코드: `POKE_SEND`
- 발생조건: `POST /api/groups/poke` 성공 시
- 속성: from_user_id, to_user_id, group_id
- 대시보드위치: 추후조합

### 카드 4 — 그룹 입장 이력
- 이름: `[BE] GROUP_ENTER 매번 이력`
- 우선순위: P0
- 담당영역: BE
- 데이터코드: `UG_ENTER_HISTORY`
- 발생조건: 그룹방 입장 시마다 1행 (entered_at 덮어쓰기와 별개)
- 대시보드위치: DB탭

### 카드 5 — 온보딩 단계
- 이름: `[FE] ONBOARDING_STEP_VIEW`
- 우선순위: P0
- 담당영역: FE
- 데이터코드: `ONB_STEP_*`
- 대시보드위치: 홈(퍼널은 추후)

---

## 5. PM 운영 규칙 (짧게)

1. **새 로그/지표 필요 → Notion에만 추가** (슬랙에 스펙 장문 금지, 링크만)
2. 데이터코드는 엑셀 `모각작_데이터수집_관리.csv` 와 **같은 코드** 쓰기
3. 개발이 `로그심김` 하면 PM이 파이프라인/시트 상태 업데이트
4. GA 기본 지표는 카드 1번이 끝나야 대시보드 GA 탭이 “—” → 숫자로 바뀜

---

## 6. (선택) 시트 연동

Notion → Google Sheets 동기화(Make/Zapier 또는 CSV보내기)로  
`수집여부` 컬럼을 맞추면 엑셀 카탈로그와 요청보드가 어긋나지 않습니다.  
1차는 **수동으로 주 1회 맞춰도** 충분합니다.
