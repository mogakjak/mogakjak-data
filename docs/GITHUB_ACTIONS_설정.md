# GitHub Actions 자동 수집 설정 가이드

PM(우은진)이 따라 할 수 있는 단계별 가이드입니다.

---

## 1. GitHub 저장소 만들기

1. GitHub에서 **New repository** 클릭
2. 이름 예: `mogakjak-data-pipeline`
3. **Private** 권장 (사용자 이름 등 데이터 포함)
4. Create repository

---

## 2. 코드 올리기 (최초 1회)

프로젝트 폴더에서 PowerShell 또는 Git Bash 실행:

```bash
cd C:\00_mogakjak\mogakjak_data_pipeline
git init
git add .
git commit -m "feat: add daily data collection pipeline"
git branch -M main
git remote add origin https://github.com/조직명/mogakjak-data-pipeline.git
git push -u origin main
```

> `.env`, `mogakjak-private.key`는 `.gitignore`에 있어서 올라가지 않습니다.

---

## 2-1. 대시보드 링크 (GitHub Pages)

코드 push 후:

1. Settings → **Pages** → Source: **GitHub Actions**
2. Actions → **Deploy Dashboard (GitHub Pages)** → Run workflow
3. URL: `https://<ORG>.github.io/<REPO>/dashboard/`

상세: [GITHUB_PAGES_배포.md](GITHUB_PAGES_배포.md)

---

## 3. GitHub Secrets 등록

저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

아래 6개를 등록하세요.

| Secret 이름 | 값 | 설명 |
|-------------|-----|------|
| `MOGAKJAK_SSH_HOST` | `146.56.130.53` | Oracle 서버 IP |
| `MOGAKJAK_SSH_USER` | `ubuntu` | SSH 사용자 |
| `MOGAKJAK_SSH_PRIVATE_KEY` | (키 파일 전체 내용) | `mogakjak-private.key`를 메모장으로 열어 **처음부터 끝까지** 복사 |
| `MOGAKJAK_DB_NAME` | `mogakjak` | DB 이름 |
| `MOGAKJAK_DB_USER` | `mogakjak_user` | DB 사용자 |
| `MOGAKJAK_DB_PASSWORD` | (비밀번호) | DB 비밀번호 |

### SSH 키 복사 방법

1. `mogakjak-private.key` 파일을 메모장으로 열기
2. `-----BEGIN ... KEY-----` 부터 `-----END ... KEY-----` 까지 전부 선택 → 복사
3. Secret `MOGAKJAK_SSH_PRIVATE_KEY`에 붙여넣기

---

## 4. Actions 권한 확인

저장소 → **Settings** → **Actions** → **General**

- **Workflow permissions**: `Read and write permissions` 선택
- (데이터를 `data/` 폴더에 자동 커밋하려면 쓰기 권한 필요)

---

## 5. 수동 테스트 실행

1. 저장소 → **Actions** 탭
2. 왼쪽에서 **Daily Data Collection** 선택
3. **Run workflow** → **Run workflow** 클릭
4. 약 1~2분 후 초록색 체크(✓) 확인

성공하면:
- `data/YYYY-MM-DD/daily_snapshot.json` 파일이 저장소에 생김
- `data/latest_summary.md` 요약 파일 업데이트

---

## 6. 팀원에게 공유

아래 링크만 공유하면 됩니다.

```
https://github.com/조직명/mogakjak-data-pipeline/blob/main/data/latest_summary.md
```

- 매일 자정(KST) 이후 자동 갱신
- JSON 상세 데이터는 `data/날짜/` 폴더에서 확인

---

## 스케줄

| 항목 | 값 |
|------|-----|
| 실행 시각 | 매일 KST 00:00 (자정) |
| 수집 대상 | KST 기준 **어제** 하루 |
| UTC cron | `0 15 * * *` |

---

## 문제 해결

| 증상 | 확인 사항 |
|------|-----------|
| SSH tunnel failed | `MOGAKJAK_SSH_PRIVATE_KEY` 전체 복사 여부, 서버 IP |
| Access denied (DB) | `MOGAKJAK_DB_USER` / `PASSWORD` |
| Commit push 실패 | Workflow permissions → Read and write |
| Lost connection | 서버에서 MySQL(3306) 실행 중인지 개발자에게 확인 |

로컬에서 `connect_tunnel.bat` + `run.bat`이 성공하면, 같은 DB 정보로 Actions도 동작해야 합니다.
