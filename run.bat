@echo off
setlocal

:: Cek lokasi Python instalasi pengguna
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
    goto RUN
)

if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Python\bin\python.exe"
    goto RUN
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_EXE=py"
    goto RUN
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_EXE=python"
    goto RUN
)

echo [ERROR] Python tidak ditemukan di sistem.
pause
exit /b 1

:RUN
echo ============================================================
echo   Monitoring Kematangan Melon ^& Penyakit Daun
echo ============================================================
echo Menjalankan dengan: "%PYTHON_EXE%"
echo Buka browser di: http://localhost:5000
echo ============================================================
"%PYTHON_EXE%" run.py
pause
