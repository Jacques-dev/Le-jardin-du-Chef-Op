@echo off
chcp 65001 > nul
echo ============================================================
echo   LE JARDIN DU CHEF OP - GENERATION VIDEOS (GOOGLE VEO 3.1)
echo ============================================================
echo.
node outils/generer-videos.mjs
echo.
pause
