@echo off
chcp 65001 >nul
title Weniger Fressen - GitHub Deployer
color 0A

echo ============================================================
echo      🥗 WENIGER FRESSEN - GITHUB HOCHLADEN & UPDATE 🚀
echo ============================================================
echo.

:: Add Node.js to PATH if needed
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

:: Check if git remote origin is configured
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo [HINWEIS] Es ist noch keine GitHub-Adresse hinterlegt.
    echo.
    echo Bitte erstelle ein neues leeres Repository auf GitHub:
    echo 1. Gehe auf https://github.com/new
    echo 2. Repository name: weniger-fressen (oder beliebig)
    echo 3. "Public" auswählen und KEINE README oder Lizenz anhaken!
    echo 4. Klicke auf "Create repository".
    echo.
    echo Kopiere dann die HTTPS-URL (z.B. https://github.com/DeinName/weniger-fressen.git)
    echo.
    set /p REPO_URL="GitHub URL hier einfuegen: "
    
    if "%REPO_URL%"=="" (
        color 0C
        echo [FEHLER] Keine URL eingegeben. Abbruch.
        pause
        exit /b 1
    )
    
    git remote add origin %REPO_URL%
    git branch -M main
    color 0A
    echo.
    echo [OK] GitHub-Adresse erfolgreich hinterlegt!
    echo.
)

echo [1/3] Pruefe und baue die Web-App...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [FEHLER] Das Bauen der App ist fehlgeschlagen. Bitte Fehler oben pruefen.
    pause
    exit /b 1
)

echo.
echo [2/3] Bereite Dateien fuer den Upload vor...
git add .

set "TIMESTAMP=%DATE% %TIME:~0,5%"
set /p COMMIT_MSG="Beschreibe kurz die Aenderung (Enter fuer 'Update %TIMESTAMP%'): "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update %TIMESTAMP%"

git commit -m "%COMMIT_MSG%" >nul 2>&1

echo.
echo [3/3] Lade die neue Version zu GitHub hoch...
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ============================================================
    echo   🎉 ERFOLG! Die neue Version wurde zu GitHub hochgeladen!
    echo   GitHub Actions baut und aktualisiert deine App jetzt
    echo   in ca. 1-2 Minuten vollautomatisch auf GitHub Pages.
    echo ============================================================
) else (
    color 0C
    echo.
    echo ============================================================
    echo   [ACHTUNG] Der Upload zu GitHub hat nicht geklappt.
    echo   Moegliche Ursachen:
    echo   1. Du bist auf diesem PC noch nicht bei GitHub eingeloggt.
    echo   2. Die eingegebene Repository-URL war nicht korrekt.
    echo ============================================================
)

echo.
echo Druecke eine beliebige Taste zum Schliessen...
pause >nul
