# GitHub Actions — 일일 데이터 수집 설정

`Daily Data Collection` 워크플로가 매일 KST 00:00에 DB 스냅샷을 수집하고 `main`에 push합니다.  
push되면 `Deploy Dashboard (GitHub Pages)`가 자동 실행되어 [대시보드](https://mogakjak.github.io/mogakjak-data/dashboard/) 숫자가 갱신됩니다.

## 현재 상태 점검

1. [Actions → Daily Data Collection](https://github.com/mogakjak/mogakjak-data/actions/workflows/schedule.yml)
2. 최근 실행이 **초록(성공)** 인지 확인
3. **42회 연속 실패(2026-09-19 기준)** — 대부분 `Validate secrets` 단계에서 중단 → **Secrets 미등록**
4. 실패 시 로그에서 단계 확인:
   - `Validate secrets` → Secrets 미등록 (로그에 `Missing GitHub Secrets: ...` 표시)
   - `Start SSH tunnel` → SSH 키/호스트 오류
   - `Test DB connection` → DB 포트·계정 오류 (원격 MySQL 포트 **3308**)

## Secrets 등록 (최초 1회)

저장소: **mogakjak/mogakjak-data** → Settings → Secrets and variables → Actions

| Secret | 값 |
|--------|-----|
| `MOGAKJAK_SSH_HOST` | `146.56.130.53` |
| `MOGAKJAK_SSH_USER` | `ubuntu` |
| `MOGAKJAK_SSH_PRIVATE_KEY` | `mogakjak-private.key` 파일 **전체** (BEGIN/END 포함) |
| `MOGAKJAK_DB_NAME` | 로컬 `.env`와 동일 |
| `MOGAKJAK_DB_USER` | 로컬 `.env`와 동일 |
| `MOGAKJAK_DB_PASSWORD` | 로컬 `.env`와 동일 |
| `DISCORD_WEBHOOK_URL` | (선택) Discord 채널 웹훅 URL — 일일 수집 결과 알림 |
| `GA4_PROPERTY_ID` | (선택) GA4 Property ID — 없으면 GA 수집 건너뜀 |
| `GA4_SERVICE_ACCOUNT_JSON` | (선택) GA 서비스 계정 JSON **전체** — `GOOGLE_APPLICATION_CREDENTIALS` 대용 |

SSH private key 붙여넣기 시 줄바꿈이 유지되어야 합니다.

> **중요:** Secrets는 **mogakjak/mogakjak-data** 저장소에 등록해야 합니다.  
> 개인 fork(`shon-ah-hyun/...`)에만 넣으면 스케줄이 돌아가도 수집되지 않습니다.

## Discord 알림 (선택)

수집 **성공/실패** 시 Discord 채널로 KPI 요약이 옵니다.

### 웹훅 만들기

1. Discord 서버 → 알림 받을 **채널** → 톱니바퀴 → **연동** → **웹후크**
2. **새 웹후크** → 이름 예: `모각작 데이터` → **웹후크 URL 복사**
3. GitHub Secrets에 `DISCORD_WEBHOOK_URL` = 복사한 URL

### 알림 예시 (성공)

```
모각작 일일 수집 완료 (2026-09-11)
· 그룹 멤버십 111건
· 개인 집중 0분
· GA 활성 사용자 6명
→ 대시보드 링크
```

Secret을 넣지 않으면 알림 step은 **조용히 건너뜁니다** (수집은 그대로).  
Discord 알림이 전혀 안 온다면 `DISCORD_WEBHOOK_URL`도 아직 등록되지 않은 상태입니다.

### 로컬 테스트

backfill 후 `.env`에 `DISCORD_WEBHOOK_URL=...` 추가하고:

```powershell
.venv\Scripts\python.exe dashboard\build_manifest.py
.venv\Scripts\python.exe scripts\notify_discord.py --status success
```

## 수동 실행 (테스트)

Actions → **Daily Data Collection** → **Run workflow** → Run

성공하면 `data/YYYY-MM-DD/` 커밋이 생기고 Pages가 재배포됩니다.

## 로컬 수동 backfill (누락 구간)

```powershell
# 1) 터널 (3308 — plan B)
connect_tunnel_3308.bat

# 2) DB backfill
.venv\Scripts\python.exe scripts\backfill_db.py --from 2026-08-09

# 3) GA backfill (선택, .env GA 자격증명 필요)
.venv\Scripts\python.exe scripts\backfill_ga.py --from 2026-08-09

# 4) manifest + push
.venv\Scripts\python.exe dashboard\build_manifest.py
git add data/ dashboard/manifest.json
git commit -m "data: backfill through yesterday"
git push mogakjak main
```

## DB 포트 참고

| 환경 | 로컬 포트 | 원격 포트 |
|------|-----------|-----------|
| 로컬 `connect_tunnel.bat` | 13307 | 3306 (현재 미사용) |
| 로컬 `connect_tunnel_3308.bat` | 13308 | **3308 (운영)** |
| GitHub Actions | 13308 | **3308** |

`.env`의 `MOGAKJAK_DB_PORT`는 사용하는 터널과 맞춰야 합니다.
