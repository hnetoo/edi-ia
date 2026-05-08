# EDI IA - Script de Inicialização de Serviços
# PowerShell para Windows com melhor formatação e robustez

Write-Host "Iniciando EDI IA Services" -ForegroundColor Green

# Função para verificar se porta está em uso
function Test-Port {
    param($Port)
    try {
        $tcpConnection = New-Object System.Net.Sockets.TcpClient
        $tcpConnection.Connect("localhost", $Port)
        $tcpConnection.Close()
        $tcpConnection.Dispose()
        return $true
    }
    catch {
        return $false
    }
}

# Função para iniciar processo em nova janela
function Start-Process {
    param(
        [string]$ProcessName,
        [string]$Arguments = "",
        [string]$WorkingDirectory = "",
        [string]$WindowTitle = ""
    )
    
    try {
        $process = Start-Process -FilePath $WorkingDirectory -ArgumentList $Arguments.Split(" ") -PassThru -NoNewWindow
        $processId = $process.Id
        
        if ($WindowTitle -ne "") {
            $process.MainWindowTitle = $WindowTitle
        }
        
        Write-Host "✅ [$ProcessName] iniciado (PID: $processId)" -ForegroundColor Green
        Write-Host "   Porta: $($Arguments.Split(' ')[1])" -ForegroundColor Yellow
        Write-Host "   Diretório: $WorkingDirectory" -ForegroundColor Yellow
        
        return $processId
    }
    catch {
        Write-Host "❌ Erro ao iniciar [$ProcessName]: $($_)" -ForegroundColor Red
        return $null
    }
}

# Verificar portas antes de iniciar
Write-Host "`n" * 80 -ForegroundColor Cyan
Write-Host "Verificando portas..." -ForegroundColor White

# Testar porta 3001 (App Principal)
if (Test-Port 3001) {
    Write-Host "✅ Porta 3001 está disponível" -ForegroundColor Green
} else {
    Write-Host "❌ Porta 3001 já está em uso" -ForegroundColor Red
    Write-Host "   Fechando outros processos que possam estar usando esta porta..." -ForegroundColor Yellow
}

# Testar porta 3002 (API Server Mobile)
if (Test-Port 3002) {
    Write-Host "✅ Porta 3002 está disponível" -ForegroundColor Green
} else {
    Write-Host "❌ Porta 3002 já está em uso" -ForegroundColor Red
    Write-Host "   Fechando outros processos que possam estar usando esta porta..." -ForegroundColor Yellow
}

Write-Host "`n" * 80 -ForegroundColor Cyan

# Iniciar App Principal
Write-Host "`n" * 80 -ForegroundColor Cyan
Write-Host "Iniciando App Principal (Porta 3001)..." -ForegroundColor White

$appPrincipalId = Start-Process -ProcessName "EDI IA - App Principal" -Arguments "npm run dev" -WorkingDirectory "c:/Users/hneto/edi-ia---gestão-de-edifícios (1)" -WindowTitle "EDI IA - App Principal (Porta 3001)"

# Aguardar um momento para garantir que o App Principal inicializou
Start-Sleep -Seconds 3

# Iniciar API Server Mobile
Write-Host "`n" * 80 -ForegroundColor Cyan
Write-Host "Iniciando API Server Mobile (Porta 3002)..." -ForegroundColor White

$apiMobileId = Start-Process -ProcessName "EDI IA - API Mobile" -Arguments "npx ts-node server-mobile-api.ts" -WorkingDirectory "c:/Users/hneto/edi-ia---gestão-de-edifícios (1)" -WindowTitle "EDI IA - API Mobile (Porta 3002)"

# Aguardar um momento para garantir que a API Mobile inicializou
Start-Sleep -Seconds 3

# Exibir informações de acesso
Write-Host "`n" * 80 -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "    EDI IA - SERVIÇOS INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n" -ForegroundColor White
Write-Host "📱 App Principal:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White
Write-Host "🌐 API Server Mobile:" -ForegroundColor Cyan
Write-Host "   http://localhost:3002" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White
Write-Host "📱 App Mobile:" -ForegroundColor Cyan
Write-Host "   https://edi-3hmcxdr29-helder-netos-projects.vercel.app" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White
Write-Host "📋 GitHub:" -ForegroundColor Cyan
Write-Host "   https://github.com/hnetoo/edi-ia" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White
Write-Host "`n" * 80 -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Pressione qualquer tecla para parar todos os serviços..." -ForegroundColor Yellow

# Manter script rodando até usuário pressionar uma tecla
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Loop para manter os processos rodando
while ($null -eq $null) {
    Start-Sleep -Seconds 1
    
    # Verificar se os processos ainda estão rodando
    $appPrincipalRunning = Get-Process -Id $appPrincipalId -ErrorAction SilentlyContinue
    $apiMobileRunning = Get-Process -Id $apiMobileId -ErrorAction SilentlyContinue
    
    if ($null -ne $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")) {
        Write-Host "`n" * 80 -ForegroundColor Red
        Write-Host "Detectando tecla pressionada..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

# Limpar ao sair
Write-Host "`n" * 80 -ForegroundColor Green
Write-Host "Encerrando todos os serviços..." -ForegroundColor Yellow

# Parar processos de forma segura
if ($appPrincipalRunning) {
    try {
        Stop-Process -Id $appPrincipalId -Force
        Write-Host "✅ App Principal encerrado" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao encerrar App Principal" -ForegroundColor Red
    }
}

if ($apiMobileRunning) {
    try {
        Stop-Process -Id $apiMobileId -Force
        Write-Host "✅ API Server Mobile encerrado" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao encerrar API Server Mobile" -ForegroundColor Red
    }
}

Write-Host "`n" * 80 -ForegroundColor Green
Write-Host "Todos os serviços foram encerrados." -ForegroundColor White
Write-Host "`n" * 80 -ForegroundColor Green
