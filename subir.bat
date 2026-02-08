@echo off
cd /d "%~dp0"
echo Iniciando Servidor Vialidades...
start "Vialidades Server" cmd /k "cd server && npm start"

echo Iniciando Cliente Vialidades...
start "Vialidades Client" cmd /k "cd client && npm run dev"

echo Proyecto Iniciado.
