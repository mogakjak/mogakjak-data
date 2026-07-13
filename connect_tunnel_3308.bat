@echo off
chcp 65001 >nul
set SERVER_IP=146.56.130.53
set SSH_USER=ubuntu
set KEY_FILE=%~dp0mogakjak-private.key
set LOCAL_PORT=13308
set REMOTE_PORT=3308

cd /d "%~dp0"

echo SSH tunnel (plan B: remote port 3308)...
echo Local %LOCAL_PORT% --^> server 127.0.0.1:%REMOTE_PORT%
echo If connect_tunnel.bat fails, use this file instead.
echo Then set .env MOGAKJAK_DB_PORT=%LOCAL_PORT%
echo.

icacls "%KEY_FILE%" /inheritance:r >nul 2>&1
icacls "%KEY_FILE%" /grant:r "%USERNAME%:R" >nul 2>&1

ssh -i "%KEY_FILE%" -N -L %LOCAL_PORT%:127.0.0.1:%REMOTE_PORT% %SSH_USER%@%SERVER_IP%
pause
