@echo off
REM Rusito & Shily: instala lo necesario (la primera vez) y abre la web en el navegador.
REM Uso: doble clic en este archivo.
cd /d "%~dp0"
title Rusito y Shily

where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Se abre la pagina para instalarlo: elegi la version LTS.
  echo Cuando termine, cerra esta ventana y volve a hacer doble clic en iniciar.bat
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias, solo la primera vez. Tarda un ratito...
  call npm install
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias. Revisa tu conexion y proba de nuevo.
    pause
    exit /b 1
  )
)

if not exist .env.local (
  echo Sin .env.local: arranca en modo vista previa. Claves: shily y rusito
)

echo Abriendo Rusito y Shily en http://localhost:5173
echo Para apagarla, cerra esta ventana.
call npm run dev -- --open
pause
