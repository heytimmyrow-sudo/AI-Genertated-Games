@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python or run this from a terminal with Python available.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8123/echo-archer/index.html"
python -m http.server 8123 --bind 127.0.0.1
