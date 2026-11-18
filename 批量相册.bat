@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   Album builder - local folder to album
echo ==========================================
echo.
echo  Follow the prompts below.
echo.
"D:\Node.js\node.exe" "%~dp0batch_album.js"
echo.
pause
