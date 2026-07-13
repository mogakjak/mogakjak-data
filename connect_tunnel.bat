@echo off
chcp 65001 >nul
set SERVER_IP=146.56.130.53
set SSH_USER=ubuntu
set KEY_FILE=%~dp0mogakjak-private.key
set LOCAL_PORT=13307
set REMOTE_PORT=3306

cd /d "%~dp0"

echo SSH tunnel starting...
echo Local %LOCAL_PORT% --^> server 127.0.0.1:%REMOTE_PORT%
echo Keep this window OPEN, then run run.bat
echo .env MOGAKJAK_DB_PORT must be %LOCAL_PORT%
echo.

icacls "%KEY_FILE%" /inheritance:r >nul 2>&1
icacls "%KEY_FILE%" /grant:r "%USERNAME%:R" >nul 2>&1

ssh -i "%KEY_FILE%" -N -L %LOCAL_PORT%:127.0.0.1:%REMOTE_PORT% %SSH_USER%@%SERVER_IP%
pause
