@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo Building dashboard manifest...
if exist ".venv\Scripts\python.exe" (
  .venv\Scripts\python.exe dashboard\build_manifest.py
) else (
  python dashboard\build_manifest.py
)
if errorlevel 1 (
  echo Failed to build manifest.
  pause
  exit /b 1
)

echo.
echo Starting local server at http://127.0.0.1:8765/dashboard/
echo Keep this window open. Press Ctrl+C to stop.
echo.

start "" "http://127.0.0.1:8765/dashboard/"

if exist ".venv\Scripts\python.exe" (
  .venv\Scripts\python.exe -m http.server 8765
) else (
  python -m http.server 8765
)

pause
