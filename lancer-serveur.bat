@echo off
REM Lance le site en local avec rechargement automatique (Live Reload) sur http://localhost:5500
cd /d "%~dp0"
where npx >nul 2>nul && (npx -y live-server . --port=5500 & goto :eof)
where py >nul 2>nul && (start "" http://localhost:5500 & py -m http.server 5500 & goto :eof)
where python >nul 2>nul && (start "" http://localhost:5500 & python -m http.server 5500 & goto :eof)
echo Node.js ou Python est requis : https://nodejs.org/
pause
