@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" "%~dp0scripts\serve-5173.cjs" > "%~dp0static-server.log" 2>&1
