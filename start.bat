@echo off
setlocal EnableDelayedExpansion
title Mobile Compatibility Finder — Setup ^& Launch

:: ─────────────────────────────────────────────────────────────────────────────
::  Mobile Compatibility Finder — start.bat
::  Performs a full setup from scratch and launches the Electron desktop app.
::
::  Steps:
::    1. Check Node.js is installed
::    2. Install / update npm dependencies (skips if node_modules up to date)
::    3. Compile the Electron main process (TypeScript → .electron/)
::    4. Rebuild native modules (better-sqlite3) for the installed Electron version
::    5. Launch the Electron dev app  (Next.js dev server + Electron window)
:: ─────────────────────────────────────────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     Mobile Compatibility Finder              ║
echo  ║     Setup ^& Launch                          ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── Step 0: Change to the script's own directory ────────────────────────────
cd /d "%~dp0"

:: ── Step 1: Check Node.js ────────────────────────────────────────────────────
echo [1/4] Checking Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  Node.js %NODE_VER% found.
echo.

:: ── Read current version from package.json ───────────────────────────────────
for /f "tokens=2 delims=:, " %%v in ('findstr /i "\"version\"" package.json') do (
    set PKG_VERSION=%%~v
    goto :got_version
)
:got_version
echo  App version: %PKG_VERSION%
echo.

:: ── Read last installed version from sentinel file ────────────────────────────
set INSTALLED_VERSION=none
if exist ".installed-version" (
    set /p INSTALLED_VERSION=<".installed-version"
)

:: ── Step 2: Install dependencies (only if version changed) ───────────────────
echo [2/4] Checking dependencies...
if "%PKG_VERSION%"=="%INSTALLED_VERSION%" (
    echo  Version %PKG_VERSION% already installed — skipping npm install ^& rebuild.
    echo  ^(Edit package.json version to force a fresh install^)
    goto :skip_install
)

echo  Version changed: %INSTALLED_VERSION% ^→ %PKG_VERSION%
echo  Installing dependencies...
echo.
where pnpm >nul 2>&1
if not errorlevel 1 (
    echo  Using pnpm...
    call pnpm install
) else (
    echo  Using npm...
    call npm install
)
if errorlevel 1 (
    echo.
    echo  ERROR: Dependency installation failed. Check the output above.
    echo.
    pause
    exit /b 1
)
echo  Dependencies installed successfully.
echo.

:: ── Step 3: Compile Electron TypeScript ──────────────────────────────────────
echo [3/4] Compiling Electron main process...
call npm run electron:compile
if errorlevel 1 (
    echo.
    echo  ERROR: Electron compilation failed. Check TypeScript errors above.
    echo.
    pause
    exit /b 1
)
echo  Electron main process compiled.
echo.

:: ── Step 4: Rebuild native modules ───────────────────────────────────────────
echo [4/4] Rebuilding native modules (better-sqlite3)...
call npm run electron:rebuild
if errorlevel 1 (
    echo.
    echo  WARNING: Native module rebuild failed.
    echo  If you see a sqlite error at runtime, run:  npm run electron:rebuild
    echo.
) else (
    echo  Native modules ready.
)
echo.

:: ── Save installed version ────────────────────────────────────────────────────
echo %PKG_VERSION%>".installed-version"
echo  Saved installed version: %PKG_VERSION%
echo.
goto :launch

:skip_install
:: Compile check when skipping install (recompile if source is newer)
echo [3/4] Checking Electron main process...
set NEED_COMPILE=0
if not exist ".electron\main.js" set NEED_COMPILE=1
if "!NEED_COMPILE!"=="0" (
    for %%A in ("electron\main.ts") do set SRC_DATE=%%~tA
    for %%A in (".electron\main.js") do set OUT_DATE=%%~tA
    if "!SRC_DATE!" gtr "!OUT_DATE!" set NEED_COMPILE=1
)
if "!NEED_COMPILE!"=="1" (
    echo  Recompiling Electron main process ^(source changed^)...
    call npm run electron:compile
    if errorlevel 1 (
        echo  ERROR: Compilation failed.
        pause
        exit /b 1
    )
    echo  Compiled.
) else (
    echo  .electron\main.js is up to date — skipping compile.
)
echo.
echo [4/4] Native modules — skipping ^(version unchanged^).
echo.

:launch

:: ── Launch ────────────────────────────────────────────────────────────────────
echo ═══════════════════════════════════════════════════
echo  Launching Mobile Compatibility Finder...
echo  Next.js dev server will start at http://localhost:3000
echo  Electron window will open automatically.
echo.
echo  To stop: close the Electron window or press Ctrl+C here.
echo ═══════════════════════════════════════════════════
echo.

call npm run electron:dev

echo.
echo  App closed. Goodbye!
pause
