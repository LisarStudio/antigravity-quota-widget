@echo off
:: ANTIGRAVITY AI MONITOR — Lanzador de Desarrollo
:: Siempre carga el código fuente fresco (no el build viejo)

title Antigravity AI Monitor (Dev)
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   ANTIGRAVITY AI MONITOR — MODO DEV          ║
echo  ║   Iniciando servidor + Vite + Electron...     ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── 1. Matar procesos viejos ─────────────────────────────────────────────────
echo  [1/4] Limpiando procesos anteriores...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4600 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
taskkill /IM "Antigravity AI Monitor.exe" /F >nul 2>&1
timeout /t 1 /nobreak >nul

:: ── 2. Arrancar servidor de datos (puerto 4600) ──────────────────────────────
echo  [2/4] Arrancando servidor de datos (puerto 4600)...
start "AGY-Server" /min cmd /c "node "%~dp0server.cjs""
timeout /t 2 /nobreak >nul

:: ── 3. Arrancar Vite dev server (puerto 5173) ────────────────────────────────
echo  [3/4] Arrancando Vite (codigo fuente fresco, puerto 5173)...
start "AGY-Vite" /min cmd /c "cd /d "%~dp0" && npx vite --port 5173 --host 127.0.0.1"
echo  [..] Esperando que Vite levante (5 segundos)...
timeout /t 5 /nobreak >nul

:: ── 4. Abrir Electron (cargará http://127.0.0.1:5173) ───────────────────────
echo  [4/4] Lanzando Electron...
echo.
npx --prefix "%~dp0" electron "%~dp0main.js" --no-sandbox

:: Cleanup al cerrar
echo.
echo  [..] Cerrando servidores...
taskkill /FI "WINDOWTITLE eq AGY-Server" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AGY-Vite"   /F >nul 2>&1
echo  Widget cerrado. Hasta la proxima.
pause
