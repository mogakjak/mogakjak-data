# GitHub Pages로 대시보드 링크 공유

정적 파일(`dashboard/` + `data/`)만 올려 **무료 HTTPS 링크**로 팀을 초대합니다.

## 결과 URL (예시)

저장소가 `https://github.com/<ORG>/<REPO>` 이면:

```
https://<ORG>.github.io/<REPO>/
https://<ORG>.github.io/<REPO>/dashboard/
```

루트(`/`)는 자동으로 `/dashboard/`로 이동합니다.

---

## 최초 1회 설정

### 1) GitHub 원격 저장소

로컬에 git이 없다면:

```powershell
cd C:\00_mogakjak\mogakjak_data_pipeline
git init
git add .
git commit -m "chore: init pipeline + GitHub Pages dashboard"
```

GitHub에서 **New repository** 생성 후:

```powershell
git branch -M main
git remote add origin https://github.com/<ORG>/<REPO>.git
git push -u origin main
```

> `.env`, `*.key`, `.venv`, `mogakjak-be/`, `mogakjak-fe/` 는 `.gitignore`로 제외됩니다.

### 2) Pages 소스 = GitHub Actions

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. Actions → **Deploy Dashboard (GitHub Pages)** → **Run workflow** (최초 1회)

배포가 끝나면 Settings → Pages에 공개 URL이 표시됩니다.

### 3) (선택) 일일 수집과 연동

이미 `Daily Data Collection`이 `data/`를 커밋하면,  
같은 push로 Pages 워크플로가 다시 돌아 **링크의 숫자도 갱신**됩니다.

---

## 팀원에게 공유할 때

1. 위 Pages URL을 슬랙/노션에 고정
2. 개인 실험 보드는 여전히 **JSON 내보내기/불러오기**
3. 공통 KPI는 Pages의 **홈 · 여정 · DB · GA**만 기준

---

## 로컬 확인

```
dashboard.bat
→ http://127.0.0.1:8765/dashboard/
```

Pages와 동일한 파일을 씁니다. 배포 전에 `python dashboard/build_manifest.py`로 manifest를 맞춰 두면 좋습니다.

---

## 주의

| 항목 | 설명 |
|------|------|
| 공개 범위 | **Public** 저장소면 URL도 공개(무료). **Private** 저장소의 Pages는 GitHub Pro/Team 등 유료 플랜이 필요할 수 있음 |
| 비밀 | DB 비밀번호·SSH 키는 Actions Secrets / 로컬만. Pages에는 올리지 않음 |
| 개인 보드 | 브라우저 localStorage라 PC마다 다름 → JSON으로 공유 |
| PII | `daily_snapshot.json`에 유저명이 있을 수 있음 → Private 권장 시 Pro 또는 요약만 공개 검토 |
