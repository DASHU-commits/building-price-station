@echo off
cd /d "%~dp0"
echo Starting price tool at http://localhost:8000/
echo Phone on the same Wi-Fi: open http://<this-pc-lan-ip>:8000/ or scan the QR.
"C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8000 --bind 0.0.0.0 --directory "%~dp0"
pause
