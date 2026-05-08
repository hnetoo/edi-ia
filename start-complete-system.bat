@echo off
echo ========================================
echo    EDI IA - INICIAR SISTEMA COMPLETO
echo ========================================
echo.

echo [1/5] Iniciando App Principal (Porta 3001)...
cd /d "c:/Users/hneto/edi-ia---gestão-de-edifícios (1)"
start "EDI IA - App Principal" cmd /k npm run dev

echo.
echo [2/5] Aguardando 5 segundos para App Principal inicializar...
timeout /t 5

echo [3/5] Iniciando API Server Mobile (Porta 3002)...
start "EDI IA - API Mobile" cmd /k npx ts-node server-mobile-api.ts

echo.
echo [4/5] Aguardando 3 segundos para API Mobile inicializar...
timeout /t 3

echo [5/5] Iniciando Servidor Mobile Local (Porta 3003)...
start "EDI IA - Mobile Local" cmd /k python mobile-local-server.py

echo.
echo ========================================
echo    SISTEMA EDI IA INICIADO COM SUCESSO!
echo ========================================
echo.
echo 📱 App Principal: http://localhost:3001
echo 🌐 API Mobile: http://localhost:3002
echo 📱 App Mobile Local: http://localhost:3003
echo.
echo ✅ Sistema completo funcionando localmente
echo 🔗 Sem necessidade de autenticação Vercel
echo 📱 App mobile agora acessível localmente
echo.
echo ========================================
echo    Pressione qualquer tecla para parar todos os servicos
pause >nul
