@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   Album builder - local folder to album
echo ==========================================
echo.
echo  This tool will first CHECK for photos that
echo  were removed from an album but still exist
echo  in the folder, and ask you to delete them.
echo.
echo  Follow the prompts below.
echo.
"D:\Node.js\node.exe" "%~dp0batch_album.js"
echo.
pause
