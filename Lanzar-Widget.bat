@echo off
:: ANTIGRAVITY AI MONITOR — Lanzador Rápido
:: Ejecuta el widget sin instalación (modo desarrollo)

title Antigravity AI Monitor
set NODE_PATH=C:\Program Files\nodejs;C:\Users\peter\nodejs
set PATH=%NODE_PATH%;%PATH%

cd /d "%~dp0"

echo.
echo  ╔════════════════════════════════════════╗
echo  ║   ANTIGRAVITY AI MONITOR v1.0.0        ║
echo  ║   Iniciando widget de escritorio...     ║
echo  ╚════════════════════════════════════════╝
echo.

:: Verificar si ya hay un servidor corriendo en 4600
netstat -ano | findstr ":4600" >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Servidor de datos ya activo en puerto 4600
) else (
    echo  [..] Iniciando servidor de datos...
    start /b node server.cjs
    timeout /t 2 /nobreak >nul
)

echo  [..] Lanzando interfaz del widget...
npx electron . --no-sandbox

echo.
echo  Widget cerrado. Hasta la próxima.
pause
