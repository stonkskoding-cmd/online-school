@echo off
REM Пингует бэкенд на Render — можно запускать вручную или через Планировщик задач Windows
curl -fsS --max-time 30 "https://online-school-backend-mqn9.onrender.com/api/health"
if %ERRORLEVEL% NEQ 0 (
  echo Ping failed
  exit /b 1
)
echo Backend keep-alive OK
