@echo off
setlocal EnableDelayedExpansion
title Mobile Compatibility Finder — Build Installer

:: ─────────────────────────────────────────────────────────────────────────────
::  Mobile Compatibility Finder — build.bat
::  Builds a distributable Windows installer (.exe) using Electron Forge.
::
::  Output:
::    out\make\squirrel.windows\x64\Mobile Compatibility Finder Setup.exe  (installer)
::    out\make\zip\win32\x64\*.zip                                          (portable)
::
::  Steps:
::    1. Check Node.js
::    2. Install dependencies (if node_modules missing)
::    3. Generate icon.ico from icon.png (if needed)
::    4. Build Next.js static export  → out/
::    5. Compile Electron TypeScript  → .electron/
::    6. Rebuild native modules       (better-sqlite3)
::    7. Run electron-forge make      → packaged installer
:: ─────────────────────────────────────────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   Mobile Compatibility Finder — Build Installer  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ── Step 1: Check Node.js ────────────────────────────────────────────────────
echo [1/6] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Download from https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  Node.js %NODE_VER% OK.
echo.

:: ── Step 2: Install dependencies ─────────────────────────────────────────────
echo [2/6] Installing dependencies...
if not exist "node_modules\" (
    where pnpm >nul 2>&1
    if not errorlevel 1 ( call pnpm install ) else ( call npm install )
    if errorlevel 1 ( echo  ERROR: Install failed. & pause & exit /b 1 )
    echo  Done.
) else (
    echo  node_modules found — skipping.
)
echo.

:: ── Step 3: Generate icon ─────────────────────────────────────────────────────
echo [3/6] Checking icon...
if not exist "public\icon.ico" (
    if exist "public\icon.png" (
        echo  Converting icon.png → icon.ico...
        node scripts\make-icon.js
        if errorlevel 1 (
            echo  WARNING: Icon conversion failed — will use default Electron icon.
        )
    ) else (
        echo  WARNING: public\icon.png not found — using default Electron icon.
        echo  Add public\icon.png ^(512x512^) and re-run to use a custom icon.
    )
) else (
    echo  icon.ico found — skipping conversion.
)
echo.

:: ── Step 4: Build Next.js static export ──────────────────────────────────────
echo [4/6] Building Next.js static export...
echo  (This exports the app to out/ — may take 1-2 minutes)
call npm run build
if errorlevel 1 (
    echo.
    echo  ERROR: Next.js build failed. Fix any errors above, then retry.
    pause & exit /b 1
)
echo  Next.js build complete. Static files in out\
echo.

:: ── Step 5: Compile Electron TypeScript ──────────────────────────────────────
echo [5/6] Compiling Electron main process...
call npm run electron:compile
if errorlevel 1 (
    echo  ERROR: Electron compilation failed.
    pause & exit /b 1
)
echo  Electron compiled to .electron\
echo.

:: ── Step 6: Rebuild native modules ───────────────────────────────────────────
echo [6/6] Rebuilding native modules for production Electron...
call npm run electron:rebuild
if errorlevel 1 (
    echo  WARNING: Native module rebuild failed — better-sqlite3 may not work in the packaged app.
)
echo  Native modules ready.
echo.

:: ── Package with Electron Forge ──────────────────────────────────────────────
echo ═══════════════════════════════════════════════════════
echo  Running Electron Forge — packaging installer...
echo  This may take several minutes on first run.
echo ═══════════════════════════════════════════════════════
echo.

call npx electron-forge make --out release
if errorlevel 1 (
    echo.
    echo  ╔═══════════════════════════════════════════════════╗
    echo  ║  BUILD FAILED — check errors above               ║
    echo  ╚═══════════════════════════════════════════════════╝
    pause & exit /b 1
)

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║  BUILD SUCCESSFUL!                                           ║
echo  ║                                                              ║
echo  ║  Installer:                                                  ║
echo  ║    release\make\squirrel.windows\x64\                        ║
echo  ║    └─ Mobile Compatibility Finder Setup.exe                  ║
echo  ║                                                              ║
echo  ║  Portable ZIP:                                               ║
echo  ║    release\make\zip\win32\x64\*.zip                          ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Open the output folder in Explorer
start "" "release\make"

pause
