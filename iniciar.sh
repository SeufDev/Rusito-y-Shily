#!/usr/bin/env bash
# Rusito & Shily: instala lo necesario (la primera vez) y abre la web en el navegador.
# Uso: ./iniciar.sh   (en Windows, desde Git Bash)
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js. Instalalo desde https://nodejs.org (version LTS) y volve a correr este script."
  exit 1
fi

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "Instalando dependencias (solo la primera vez, tarda un ratito)..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "Sin .env.local: arranca en modo vista previa (claves: shily y rusito)."
fi

echo "Abriendo Rusito & Shily en http://localhost:5173 ..."
npm run dev -- --open
