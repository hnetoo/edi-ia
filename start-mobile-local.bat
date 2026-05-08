@echo off
echo ========================================
echo    EDI IA - INICIAR APP MOBILE LOCAL
echo ========================================
echo.

echo [1/3] Verificando dependências...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python não encontrado
    echo 📦 Por favor, instale Python em https://python.org
    pause
    exit /b 1
)

echo ✅ Python encontrado

echo.
echo [2/3] Verificando biblioteca requests...
python -c "import requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Biblioteca requests não encontrada
    echo 📦 Instalando biblioteca requests...
    pip install requests
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar requests
        pause
        exit /b 1
    )
    echo ✅ Biblioteca requests instalada
) else (
    echo ✅ Biblioteca requests encontrada
)

echo.
echo [3/3] Iniciando servidor mobile local...
cd /d "c:/Users/hneto/edi-ia---gestão-de-edifícios (1)"
python mobile-local-server.py

echo.
echo ========================================
echo    Servidor mobile local finalizado
echo ========================================
pause
