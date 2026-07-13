# 모각작 데이터 파이프라인

모각작 서비스 DB에서 **일일 데이터를 수집**해 JSON으로 저장하는 파이프라인입니다.

## 팀원이 데이터 보는 방법 (가장 쉬움)

### A. 대시보드 링크 (GitHub Pages · 권장)

배포 후 팀 공유 URL:

```
https://<ORG>.github.io/<REPO>/dashboard/
```

설정: [docs/GITHUB_PAGES_배포.md](docs/GITHUB_PAGES_배포.md)

### B. 요약 파일

GitHub 저장소에 올라간 요약 파일을 브라우저에서 엽니다.

👉 **`data/latest_summary.md`** — 어제 핵심 지표 요약  
👉 **`data/YYYY-MM-DD/daily_snapshot.json`** — 상세 원본 데이터

## 대시보드 (HTML · Phase 1·2·3)

```
dashboard.bat
```

상단 **미리보기** / 좌측 **사이드바**:
- **공통 대시보드**: 홈·성장 · 여정·UX · DB·핵심 · GA·Tech
- **내 분석 뷰**: Lens×Journey 보드 · JSON 공유
- 협업 가이드: [docs/대시보드_협업가이드.md](docs/대시보드_협업가이드.md)
- Pages 배포: [docs/GITHUB_PAGES_배포.md](docs/GITHUB_PAGES_배포.md)

| 탭 | 내용 |
|----|------|
| 홈 | 몰입·입장→집중·초대·GA성장·여정 막힘 |
| DB | 몰입엔진·그룹분포·초대퍼널·품질경고 |
| GA | 기본지표·상관카드·심은 이벤트 |
| 여정 퍼널 | Phase3 온보딩·콕 풀퍼널 미리보기 |
| 지표 조립 | 실험 보드 |

개발 요청·Notion 보드:
- [docs/개발요청서_FE_BE.md](docs/개발요청서_FE_BE.md) ← **내일 공유용 정식 요청서**
- [docs/Notion_로그요청_DB.md](docs/Notion_로그요청_DB.md)
- [docs/개발요청_초안_DB_GA연동.md](docs/개발요청_초안_DB_GA연동.md) (이전 초안)

## 로컬에서 수집하기 (PM/개발자)

### 1. 준비
- Python 3.12+
- `.env` 파일 (DB 접속 정보)
- `mogakjak-private.key` (SSH 키, Git에 올리지 않음)

### 2. 실행 순서

```
① connect_tunnel.bat   ← 창 열어 둔 채 유지
② run.bat              ← 연결 테스트 + 수집
```

### 3. 결과 위치

```
data/
  latest_summary.md          ← 요약 (팀 공유용)
  2026-07-12/
    daily_snapshot.json      ← 상세 데이터
```

## 자동 수집 (GitHub Actions)

매일 **KST 자정**에 자동 실행됩니다.

- 워크플로: `.github/workflows/schedule.yml`
- 수집 후 `data/` 폴더를 GitHub에 자동 커밋 → 팀원이 바로 확인 가능
- 수동 실행: GitHub → Actions → **Daily Data Collection** → **Run workflow**

### 최초 설정

👉 [docs/GITHUB_ACTIONS_설정.md](docs/GITHUB_ACTIONS_설정.md) 참고

## 수집 항목

| 영역 | 내용 |
|------|------|
| 그룹 참여 | 멤버십 스냅샷, 세션 입장, 초대 생성/응답 |
| 타이머 사용 | 개인/그룹 세션, 집중 구간(interval) |

## 폴더 구조

```
mogakjak_data_pipeline/
├── main.py                 # 수집 진입점
├── collectors/             # 수집 로직
├── config/                 # DB·테이블 설정
├── db/                     # DB 연결
├── data/                   # 수집 결과 (GitHub 공유)
├── connect_tunnel.bat      # SSH 터널 (로컬용)
├── run.bat                 # 로컬 실행
└── .github/workflows/      # 자동 수집
```

## 참고 문서

- [DB 접속 가이드](docs/DB접속_가이드.txt)
- [GitHub Actions 설정](docs/GITHUB_ACTIONS_설정.md)
- [데이터 수집 통합 목록](docs/sheets/모각작_데이터수집_통합목록.csv)
