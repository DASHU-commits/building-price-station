@echo off
rem Daily price update wrapper for Windows Task Scheduler
"C:\Program Files\nodejs\node.exe" "%~dp0daily-update.js" >> "%~dp0daily-update.log" 2>&1
