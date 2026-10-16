@echo off
cd /d "%~dp0"
echo Starting local price server on port 8000...
start "price-server" /min "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8000 --bind 0.0.0.0 --directory "%~dp0"
echo.
echo Starting public tunnel. Keep this window open while others are viewing.
echo The public https://....trycloudflare.com address will appear below.
echo.
"%~dp0..\tools\cloudflared.exe" tunnel --url http://127.0.0.1:8000 --no-autoupdate
pause
