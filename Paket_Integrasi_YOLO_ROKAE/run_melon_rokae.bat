@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

:: Deteksi Python
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
    goto MENU
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_EXE=python"
    goto MENU
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_EXE=py"
    goto MENU
)

echo [error] python tidak ditemukan di sistem.
pause
exit /b 1

:MENU
cls
echo ======================================================================
echo   AgroMelon ROKAE - Modbus TCP Camera Vision Integration
echo   Lengan robot: ROKAE XMS5-R800 (eye-in-hand flange camera)
echo   Register target: datacam (INT16, start address 67)
echo   Model: YOLO11n-CBAM (final.ipynb) ^& normalisasi CLAHE
echo ======================================================================
echo.
echo Pilih mode eksekusi:
echo [1] Pemindaian kematangan melon di pohon (mode simulasi)
echo [2] Pemindaian kematangan melon di pohon (kirim modbus ke ROKAE)
echo [3] Pemindaian penyakit daun di pohon (mode simulasi)
echo [4] Pemindaian penyakit daun di pohon (kirim modbus ke ROKAE)
echo [5] Uji gambar sampel melon (tanpa kamera fisik)
echo [6] Keluar
echo.
set /p "PILIH=Masukkan pilihan (1-6): "

if "%PILIH%"=="1" (
    "%PYTHON_EXE%" "%~dp0camera_melon_modbus_rokae.py" --task melon --source 0
    goto SELESAI
)
if "%PILIH%"=="2" (
    echo [info] memulai pengiriman sinyal modbus ke ROKAE 192.168.2.160:502...
    "%PYTHON_EXE%" "%~dp0camera_melon_modbus_rokae.py" --task melon --source 0 --enable-modbus
    goto SELESAI
)
if "%PILIH%"=="3" (
    "%PYTHON_EXE%" "%~dp0camera_melon_modbus_rokae.py" --task disease --source 0
    goto SELESAI
)
if "%PILIH%"=="4" (
    echo [info] memulai pengiriman sinyal modbus ke ROKAE 192.168.2.160:502...
    "%PYTHON_EXE%" "%~dp0camera_melon_modbus_rokae.py" --task disease --source 0 --enable-modbus
    goto SELESAI
)
if "%PILIH%"=="5" (
    "%PYTHON_EXE%" "%~dp0camera_melon_modbus_rokae.py" --task melon --source "%~dp0..\static\img\real_samples\fruits\fully_ripe_1.jpg"
    goto SELESAI
)
if "%PILIH%"=="6" (
    exit /b 0
)

:SELESAI
echo.
echo ======================================================================
echo Eksekusi selesai.
pause
