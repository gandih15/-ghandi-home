@echo off
chcp 65001 >nul
title Ghandi POS - Build
REM =========================================================
REM  Ghandi POS  -  build the portable Windows program
REM  Run this ONCE on any Windows 10/11 PC that has internet.
REM  Output: dist\Ghandi\Ghandi.exe  (copy the whole folder to a
REM  USB stick / any partition — works on Windows 7 SP1 and newer)
REM  Eng. Mohamed Ali - 01098811581
REM =========================================================
setlocal
REM NW.js 0.72 = Chromium 108 (Chromium 109 was the last to support Windows 7)
set NWVER=v0.72.0
set ARCH=ia32
if /I "%1"=="x64" set ARCH=x64
set ROOT=%~dp0..
set OUT=%ROOT%\dist\Ghandi
set CACHE=%~dp0cache
set PKG=nwjs-%NWVER%-win-%ARCH%

if not exist "%CACHE%" mkdir "%CACHE%"
echo [1/5] Downloading NW.js runtime %NWVER% %ARCH% ...
if not exist "%CACHE%\%PKG%.zip" curl -L --fail -o "%CACHE%\%PKG%.zip" https://dl.nwjs.io/%NWVER%/%PKG%.zip || goto :err
echo [2/5] Extracting ...
if not exist "%CACHE%\%PKG%" tar -xf "%CACHE%\%PKG%.zip" -C "%CACHE%" || goto :err

echo [3/5] Assembling dist\Ghandi ...
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
xcopy /e /i /q /y "%CACHE%\%PKG%\*" "%OUT%\" >nul
ren "%OUT%\nw.exe" Ghandi.exe
xcopy /e /i /q /y "%ROOT%\app" "%OUT%\package.nw\" >nul
if exist "%OUT%\credits.html" del /q "%OUT%\credits.html"

echo [4/5] Setting icon and file details ...
if not exist "%CACHE%\rcedit-x86.exe" curl -L --fail -o "%CACHE%\rcedit-x86.exe" https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x86.exe
if exist "%CACHE%\rcedit-x86.exe" "%CACHE%\rcedit-x86.exe" "%OUT%\Ghandi.exe" --set-icon "%~dp0ghandi.ico" --set-version-string "ProductName" "Ghandi POS" --set-version-string "FileDescription" "Ghandi POS" --set-version-string "CompanyName" "Eng. Mohamed Ali 01098811581" --set-version-string "LegalCopyright" "Eng. Mohamed Ali - 01098811581" --set-file-version "1.0.0" --set-product-version "1.0.0"

echo [5/5] Done!
echo.
echo   %OUT%\Ghandi.exe
echo.
echo   Copy the whole "Ghandi" folder to the shop PC / USB and double-click Ghandi.exe
explorer "%OUT%"
goto :eof
:err
echo.
echo  *** Build failed. Check the internet connection and try again. ***
pause
