@echo off
setlocal
cd /d "%~dp0"
title BASTION TD - Launcher

if "%1"=="open" goto open_browser_arg
if "%1"=="server" goto run_server_arg
if "%1"=="test" goto run_test_arg
if "%1"=="endless" goto run_endless_arg
if "%1"=="git" goto check_git_arg

:menu
cls
echo ============================================================
echo            BASTION TD - DEVELOPMENT LAUNCHER
echo ============================================================
echo.
echo   [1] Buka Game Langsung di Browser (Rekomendasi - Instan)
echo   [2] Jalankan Local HTTP Server (Port 8080)
echo   [3] Jalankan Automated Smoke Test (Wave 20)
echo   [4] Jalankan Endless Mode Test (Wave 40)
echo   [5] Cek Status Git dan File Bersih
echo   [0] Keluar
echo.
echo ============================================================
set /p choice="Pilih opsi [1-5, atau 0]: "

if "%choice%"=="1" goto open_browser
if "%choice%"=="2" goto run_server
if "%choice%"=="3" goto run_test
if "%choice%"=="4" goto run_endless
if "%choice%"=="5" goto check_git
if "%choice%"=="0" goto exit

echo.
echo Pilihan tidak valid. Silakan pilih 1-5 atau 0.
timeout /t 2 >nul
goto menu

:open_browser
echo.
echo [BASTION] Membuka index.html di browser default...
start "" "%~dp0index.html"
echo [BASTION] Game berhasil dibuka!
timeout /t 2 >nul
goto exit

:open_browser_arg
start "" "%~dp0index.html"
exit /b 0

:run_server
echo.
echo [BASTION] Menjalankan local HTTP server di port 8080...
echo Tekan Ctrl+C di terminal ini untuk mematikan server.
start "" "http://localhost:8080"
node -e "const http=require('http'),fs=require('fs'),path=require('path');const m={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png'};http.createServer((q,s)=>{let f=path.join(process.cwd(),q.url==='/'?'index.html':q.url.split('?')[0]);if(!fs.existsSync(f)){s.writeHead(404);return s.end('Not found');}s.writeHead(200,{'Content-Type':m[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(8080,()=>console.log('[OK] Server siap di http://localhost:8080'));"
pause
goto menu

:run_server_arg
start "" "http://localhost:8080"
node -e "const http=require('http'),fs=require('fs'),path=require('path');const m={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png'};http.createServer((q,s)=>{let f=path.join(process.cwd(),q.url==='/'?'index.html':q.url.split('?')[0]);if(!fs.existsSync(f)){s.writeHead(404);return s.end('Not found');}s.writeHead(200,{'Content-Type':m[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(8080,()=>console.log('[OK] Server siap di http://localhost:8080'));"
exit /b 0

:run_test
echo.
echo [TEST] Menjalankan automated smoke test (Wave 20)...
node tests\smoke.js
echo.
pause
goto menu

:run_test_arg
node tests\smoke.js
exit /b %errorlevel%

:run_endless
echo.
echo [TEST] Menjalankan endless mode test (Wave 40)...
node tests\smoke.js 40
echo.
pause
goto menu

:run_endless_arg
node tests\smoke.js 40
exit /b %errorlevel%

:check_git
echo.
echo [GIT] Memeriksa status repositori...
git status
echo.
pause
goto menu

:check_git_arg
git status
exit /b %errorlevel%

:exit
exit /b 0
