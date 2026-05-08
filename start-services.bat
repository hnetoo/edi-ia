@echo off
echo ========================================
echo    EDI IA - INICIAR SERVICOS
echo ========================================
echo.

echo [1/4] Iniciando App Principal (Porta 3001)...
cd /d "c:/Users/hneto/edi-ia---gestão-de-edifícios (1)"
start "EDI IA - App Principal" cmd /k npm run dev

echo.
echo [2/4] Aguardando 5 segundos para App Principal inicializar...
timeout /t 5

echo [3/4] Iniciando API Server Mobile (Porta 3002)...
cd /d "c:/Users/hneto/edi-ia---gestão-de-edifícios (1)"
start "EDI IA - API Mobile" cmd /k npx ts-node server-mobile-api.ts

echo.
echo [4/4] Servicos iniciados com sucesso!
echo.
echo App Principal: http://localhost:3001
echo API Mobile: http://localhost:3002
echo App Mobile: https://edi-3hmcxdr29-helder-netos-projects.vercel.app
echo.
echo ========================================
echo    Pressione qualquer tecla para parar todos os servicos
pause >nul
