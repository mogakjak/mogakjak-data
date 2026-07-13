@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo [1/2] DB connection test...
.venv\Scripts\python.exe test_connection.py
set TEST_EXIT=%ERRORLEVEL%
if not "%TEST_EXIT%"=="0" goto :failed

echo.
echo [2/2] Running collection...
.venv\Scripts\python.exe main.py
set MAIN_EXIT=%ERRORLEVEL%
if not "%MAIN_EXIT%"=="0" goto :failed

echo.
echo All done. Check data folder.
goto :finish

:failed
echo.
echo Failed. Keep connect_tunnel.bat open and check .env settings.

:finish
echo.
echo Press any key to close this window...
pause >nul
