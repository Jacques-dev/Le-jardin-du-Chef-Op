@echo off
REM Lance le site en local sur http://localhost:8000 (fermer cette fenetre pour arreter)
cd /d "%~dp0"
start "" http://localhost:8000
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
where node >nul 2>nul && (npx -y http-server -p 8000 -c-1 & goto :eof)
echo Python ou Node est necessaire : https://www.python.org/downloads/
pause
