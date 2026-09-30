@echo off
REM Lance la génération automatique des photogrammes cinéma pour toutes les fiches
cd /d "%~dp0"
node outils/generer-tout.mjs
pause
