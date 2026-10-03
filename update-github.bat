@echo off
setlocal
title Weniger Fressen - GitHub Deployer
color 0A

echo ============================================================
echo      WENIGER FRESSEN - GITHUB HOCHLADEN UND UPDATE
echo ============================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%ProgramFiles%\Git\cmd;%PATH%"

git config --global --add safe.directory * >nul 2>&1

set "TARGET_REPO=https://github.com/Remmi-GSO/Weniger-Fressen.git"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin %TARGET_REPO% >nul 2>&1
) else (
    git remote set-url origin %TARGET_REPO% >nul 2>&1
)
git branch -M main >nul 2>&1

echo [OK] Ziel-Repository: %TARGET_REPO%
echo.

echo [1/3] Pruefe und baue die Web-App...
call npm run build
if errorlevel 1 (
    color 0C
    echo.
    echo [FEHLER] Das Bauen der App ist fehlgeschlagen.
    pause
    exit /b 1
)

echo.
echo [2/3] Bereite Dateien fuer den Upload vor...
git add .
git commit -m "Update App" >nul 2>&1

echo.
echo [3/3] Lade die neue Version zu GitHub hoch...
git push -u origin main

if errorlevel 1 (
    color 0C
    echo.
    echo ============================================================
    echo   [ACHTUNG] Der Upload zu GitHub hat nicht geklappt.
    echo   Moegliche Ursachen:
    echo   1. Du musst dich im aufpoppenden GitHub-Fenster kurz anmelden.
    echo   2. Ueberpruefe deine Internetverbindung.
    echo ============================================================
) else (
    color 0A
    echo.
    echo ============================================================
    echo   ERFOLG! Die neue Version wurde zu GitHub hochgeladen!
    echo   GitHub Actions baut und aktualisiert deine App jetzt
    echo   in ca. 1-2 Minuten vollautomatisch auf GitHub Pages.
    echo ============================================================
)

echo.
echo Druecke eine beliebige Taste zum Schliessen...
pause >nul