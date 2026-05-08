#!/usr/bin/env python3
"""
EDI IA - Criador de Instalador .exe para Windows
Script para criar instalador profissional com interface gráfica
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
import tempfile
import json

# Configurações do instalador
INSTALLER_CONFIG = {
    "app_name": "EDI IA - Sistema de Gestão Condominial",
    "app_version": "1.0.0",
    "app_publisher": "EDI IA Solutions",
    "app_url": "https://edi-ia.ao",
    "app_icon": "edi-ia.ico",
    "shortcut_name": "EDI IA",
    "install_dir": "C:\\Program Files\\EDI IA",
    "start_menu": "EDI IA",
    "desktop_shortcut": True,
    "start_menu_shortcut": True,
    "run_after_install": True
}

def create_installer_script():
    """Cria o script principal do instalador"""
    
    installer_script = f'''
# EDI IA - Script de Instalação Automática
# Criado em: {datetime.datetime.now()}

# Configurações
$AppName = "{INSTALLER_CONFIG["app_name"]}"
$AppVersion = "{INSTALLER_CONFIG["app_version"]}"
$Publisher = "{INSTALLER_CONFIG["app_publisher"]}"
$InstallDir = "{INSTALLER_CONFIG["install_dir"]}"
$ShortcutName = "{INSTALLER_CONFIG["shortcut_name"]}"
$StartMenu = "{INSTALLER_CONFIG["start_menu"]}"

# Verificar se está rodando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {{
    Write-Host "❌ Este instalador precisa ser executado como Administrador" -ForegroundColor Red
    Write-Host "   Clique com o botão direito e selecione 'Executar como Administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}}

# Função para mostrar progresso
function Show-Progress {{
    param(
        [string]$Activity,
        [string]$Status,
        [int]$PercentComplete
    )
    Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete
}}

# Função para verificar dependências
function Check-Dependencies {{
    Write-Host "🔍 Verificando dependências..." -ForegroundColor Cyan
    
    # Verificar Node.js
    try {{
        $nodeVersion = node --version
        Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    }} catch {{
        Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
        Write-Host "   Por favor, instale Node.js em https://nodejs.org" -ForegroundColor Yellow
        return $false
    }}
    
    # Verificar npm
    try {{
        $npmVersion = npm --version
        Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
    }} catch {{
        Write-Host "❌ npm não encontrado" -ForegroundColor Red
        return $false
    }}
    
    return $true
}}

# Função para criar diretórios
function Create-Directories {{
    Write-Host "📁 Criando diretórios..." -ForegroundColor Cyan
    
    try {{
        # Criar diretório de instalação
        if (!(Test-Path $InstallDir)) {{
            New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
            Write-Host "✅ Diretório de instalação criado: $InstallDir" -ForegroundColor Green
        }}
        
        # Criar diretório de logs
        $logsDir = Join-Path $InstallDir "logs"
        if (!(Test-Path $logsDir)) {{
            New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
            Write-Host "✅ Diretório de logs criado: $logsDir" -ForegroundColor Green
        }}
        
        # Criar diretório de backup
        $backupDir = Join-Path $InstallDir "backup"
        if (!(Test-Path $backupDir)) {{
            New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
            Write-Host "✅ Diretório de backup criado: $backupDir" -ForegroundColor Green
        }}
        
        return $true
    }} catch {{
        Write-Host "❌ Erro ao criar diretórios: $($_)" -ForegroundColor Red
        return $false
    }}
}}

# Função para copiar arquivos
function Copy-ApplicationFiles {{
    Write-Host "📦 Copiando arquivos da aplicação..." -ForegroundColor Cyan
    
    try {{
        $sourceDir = $PSScriptRoot
        $targetDir = $InstallDir
        
        # Copiar arquivos principais
        $filesToCopy = @(
            "src",
            "edi-ia-mobile",
            "server.ts",
            "server-mobile-api.ts",
            "package.json",
            "package-lock.json",
            "README.md",
            "start-services.bat",
            "start-services.ps1",
            "README_DEPLOY_WINDOWS.md"
        )
        
        $totalFiles = $filesToCopy.Count
        $currentFile = 0
        
        foreach ($file in $filesToCopy) {{
            $currentFile++
            $percentComplete = ($currentFile / $totalFiles) * 100
            
            Show-Progress -Activity "Copiando arquivos" -Status "Copiando $file" -PercentComplete $percentComplete
            
            $sourcePath = Join-Path $sourceDir $file
            $targetPath = Join-Path $targetDir $file
            
            if (Test-Path $sourcePath) {{
                if (Test-Path $targetPath -PathType Container) {{
                    Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
                }} else {{
                    Copy-Item -Path $sourcePath -Destination $targetPath -Force
                }}
                Write-Host "✅ Copiado: $file" -ForegroundColor Green
            }} else {{
                Write-Host "⚠️ Arquivo não encontrado: $file" -ForegroundColor Yellow
            }}
        }}
        
        return $true
    }} catch {{
        Write-Host "❌ Erro ao copiar arquivos: $($_)" -ForegroundColor Red
        return $false
    }}
}}

# Função para instalar dependências
function Install-Dependencies {{
    Write-Host "📦 Instalando dependências Node.js..." -ForegroundColor Cyan
    
    try {{
        Set-Location $InstallDir
        
        # Instalar dependências principais
        Write-Host "📦 Instalando dependências principais..." -ForegroundColor Yellow
        npm install --production
        
        Write-Host "✅ Dependências instaladas com sucesso" -ForegroundColor Green
        return $true
    }} catch {{
        Write-Host "❌ Erro ao instalar dependências: $($_)" -ForegroundColor Red
        return $false
    }}
}}

# Função para criar atalhos
function Create-Shortcuts {{
    Write-Host "🔗 Criando atalhos..." -ForegroundColor Cyan
    
    try {{
        $shell = New-Object -ComObject WScript.Shell
        
        # Criar atalho na área de trabalho
        if ({INSTALLER_CONFIG["desktop_shortcut"]}) {{
            $desktopPath = [Environment]::GetFolderPath("Desktop")
            $desktopShortcut = Join-Path $desktopPath "$ShortcutName.lnk"
            $shortcut = $shell.CreateShortcut($desktopShortcut)
            $shortcut.TargetPath = Join-Path $InstallDir "start-services.bat"
            $shortcut.WorkingDirectory = $InstallDir
            $shortcut.Description = $AppName
            $shortcut.Save()
            Write-Host "✅ Atalho criado na área de trabalho" -ForegroundColor Green
        }}
        
        # Criar atalho no Menu Iniciar
        if ({INSTALLER_CONFIG["start_menu_shortcut"]}) {{
            $startMenuPath = Join-Path [Environment]::GetFolderPath("Programs") $StartMenu
            if (!(Test-Path $startMenuPath)) {{
                New-Item -Path $startMenuPath -ItemType Directory -Force | Out-Null
            }}
            
            $startMenuShortcut = Join-Path $startMenuPath "$ShortcutName.lnk"
            $shortcut = $shell.CreateShortcut($startMenuShortcut)
            $shortcut.TargetPath = Join-Path $InstallDir "start-services.bat"
            $shortcut.WorkingDirectory = $InstallDir
            $shortcut.Description = $AppName
            $shortcut.Save()
            Write-Host "✅ Atalho criado no Menu Iniciar" -ForegroundColor Green
        }}
        
        return $true
    }} catch {{
        Write-Host "❌ Erro ao criar atalhos: $($_)" -ForegroundColor Red
        return $false
    }}
}}

# Função para criar desinstalador
function Create-Uninstaller {{
    Write-Host "🗑️ Criando desinstalador..." -ForegroundColor Cyan
    
    try {{
        $uninstallerScript = @"
# EDI IA - Script de Desinstalação
# Criado automaticamente pelo instalador

$AppName = "{INSTALLER_CONFIG["app_name"]}"
$InstallDir = "{INSTALLER_CONFIG["install_dir"]}"
$ShortcutName = "{INSTALLER_CONFIG["shortcut_name"]}"
$StartMenu = "{INSTALLER_CONFIG["start_menu"]}"

Write-Host "🗑️ Desinstalando $AppName..." -ForegroundColor Yellow

# Remover atalhos
try {{
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $desktopShortcut = Join-Path $desktopPath "$ShortcutName.lnk"
    if (Test-Path $desktopShortcut) {{
        Remove-Item $desktopShortcut -Force
        Write-Host "✅ Atalho removido da área de trabalho" -ForegroundColor Green
    }}
    
    $startMenuPath = Join-Path [Environment]::GetFolderPath("Programs") $StartMenu
    $startMenuShortcut = Join-Path $startMenuPath "$ShortcutName.lnk"
    if (Test-Path $startMenuShortcut) {{
        Remove-Item $startMenuShortcut -Force
        Write-Host "✅ Atalho removido do Menu Iniciar" -ForegroundColor Green
    }}
    
    # Remover diretório do Menu Iniciar se estiver vazio
    if (Test-Path $startMenuPath) {{
        $items = Get-ChildItem $startMenuPath
        if ($items.Count -eq 0) {{
            Remove-Item $startMenuPath -Force
            Write-Host "✅ Diretório do Menu Iniciar removido" -ForegroundColor Green
        }}
    }}
}} catch {{
    Write-Host "⚠️ Erro ao remover atalhos: $($_)" -ForegroundColor Yellow
}}

# Parar serviços se estiverem rodando
try {{
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Serviços parados" -ForegroundColor Green
}} catch {{
    Write-Host "⚠️ Erro ao parar serviços: $($_)" -ForegroundColor Yellow
}}

# Remover diretório de instalação
if (Test-Path $InstallDir) {{
    try {{
        Remove-Item $InstallDir -Recurse -Force
        Write-Host "✅ Diretório de instalação removido" -ForegroundColor Green
    }} catch {{
        Write-Host "❌ Erro ao remover diretório: $($_)" -ForegroundColor Red
        Write-Host "   Por favor, remova manualmente: $InstallDir" -ForegroundColor Yellow
    }}
}}

Write-Host "✅ $AppName desinstalado com sucesso!" -ForegroundColor Green
Read-Host "Pressione Enter para sair"
"@
        
        $uninstallerPath = Join-Path $InstallDir "uninstall.ps1"
        $uninstallerScript | Out-File -FilePath $uninstallerPath -Encoding UTF8
        Write-Host "✅ Desinstalador criado: $uninstallerPath" -ForegroundColor Green
        
        return $true
    }} catch {{
        Write-Host "❌ Erro ao criar desinstalador: $($_)" -ForegroundColor Red
        return $false
    }}
}}

# Função para registrar no Painel de Controle
function Register-App {{
    Write-Host "📝 Registrando aplicação..." -ForegroundColor Cyan
    
    try {{
        $registryPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\EDI IA"
        
        # Criar entrada no registro
        New-Item -Path $registryPath -Force | Out-Null
        New-ItemProperty -Path $registryPath -Name "DisplayName" -Value $AppName -PropertyType String -Force | Out-Null
        New-ItemProperty -Path $registryPath -Name "DisplayVersion" -Value $AppVersion -PropertyType String -Force | Out-Null
        New-ItemProperty -Path $registryPath -Name "Publisher" -Value $Publisher -PropertyType String -Force | Out-Null
        New-ItemProperty -Path $registryPath -Name "InstallLocation" -Value $InstallDir -PropertyType String -Force | Out-Null
        New-ItemProperty -Path $registryPath -Name "UninstallString" -Value "powershell.exe -ExecutionPolicy Bypass -File `"$InstallDir\\uninstall.ps1`"" -PropertyType String -Force | Out-Null
        New-ItemProperty -Path $registryPath -Name "URLInfoAbout" -Value "{INSTALLER_CONFIG["app_url"]}" -PropertyType String -Force | Out-Null
        
        Write-Host "✅ Aplicação registrada no Painel de Controle" -ForegroundColor Green
        return $true
    }} catch {{
        Write-Host "❌ Erro ao registrar aplicação: $($_)" -ForegroundColor Red
        return $false
    }}
}}

# Função principal de instalação
function Main {{
    Clear-Host
    
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "    $AppName v$AppVersion" -ForegroundColor Green
    Write-Host "    Instalador Automático" -ForegroundColor Green
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar dependências
    if (!(Check-Dependencies)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    # Criar diretórios
    if (!(Create-Directories)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    # Copiar arquivos
    if (!(Copy-ApplicationFiles)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    # Instalar dependências
    if (!(Install-Dependencies)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    # Criar atalhos
    if (!(Create-Shortcuts)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    # Criar desinstalador
    if (!(Create-Uninstaller)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    # Registrar aplicação
    if (!(Register-App)) {{
        Read-Host "Pressione Enter para sair"
        exit 1
    }}
    
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Green
    Write-Host "    ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "=" * 80 -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 App Principal: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "🌐 API Mobile: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "📱 App Mobile: https://edi-3hmcxdr29-helder-netos-projects.vercel.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 Para iniciar o sistema:" -ForegroundColor Yellow
    Write-Host "   • Duplo-clique no atalho 'EDI IA' na área de trabalho" -ForegroundColor White
    Write-Host "   • Ou execute 'start-services.bat' na pasta de instalação" -ForegroundColor White
    Write-Host ""
    Write-Host "🗑️ Para desinstalar:" -ForegroundColor Yellow
    Write-Host "   • Use 'Adicionar ou Remover Programas' no Painel de Controle" -ForegroundColor White
    Write-Host "   • Ou execute 'uninstall.ps1' na pasta de instalação" -ForegroundColor White
    Write-Host ""
    
    if ({INSTALLER_CONFIG["run_after_install"]}) {{
        Write-Host "🚀 Iniciando o sistema..." -ForegroundColor Green
        Start-Process -FilePath (Join-Path $InstallDir "start-services.bat") -WorkingDirectory $InstallDir
    }}
    
    Write-Host ""
    Read-Host "Pressione Enter para sair"
}}

# Executar instalação
Main
'''
    
    return installer_script

def create_installer_exe():
    """Cria o arquivo .exe do instalador usando Inno Setup"""
    
    print("🔨 Criando instalador .exe...")
    
    # Criar script do Inno Setup
    inno_script = f'''
[Setup]
AppName={INSTALLER_CONFIG["app_name"]}
AppVersion={INSTALLER_CONFIG["app_version"]}
AppPublisher={INSTALLER_CONFIG["app_publisher"]}
AppPublisherURL={INSTALLER_CONFIG["app_url"]}
AppSupportURL={INSTALLER_CONFIG["app_url"]}
AppUpdatesURL={INSTALLER_CONFIG["app_url"]}
DefaultDirName={INSTALLER_CONFIG["install_dir"]}
DefaultGroupName={INSTALLER_CONFIG["start_menu"]}
AllowNoIcons=yes
LicenseFile=LICENSE.txt
OutputDir=dist
OutputBaseFilename=EDI-IA-Installer
SetupIconFile={INSTALLER_CONFIG["app_icon"]}
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\\Portuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{{cm:CreateDesktopIcon}}"; GroupDescription: "{{cm:AdditionalIcons}}"; Flags: unchecked

[Files]
Source: "*"; DestDir: "{{app}}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "start-services.bat"; DestDir: "{{app}}"; Flags: ignoreversion
Source: "start-services.ps1"; DestDir: "{{app}}"; Flags: ignoreversion
Source: "README_DEPLOY_WINDOWS.md"; DestDir: "{{app}}"; Flags: ignoreversion

[Icons]
Name: "{{group}}\\{INSTALLER_CONFIG["shortcut_name"]}"; Filename: "{{app}}\\start-services.bat"; WorkingDir: "{{app}}"
Name: "{{commondesktop}}\\{INSTALLER_CONFIG["shortcut_name"]}"; Filename: "{{app}}\\start-services.bat"; WorkingDir: "{{app}}"; Tasks: desktopicon

[Run]
Filename: "{{app}}\\start-services.bat"; Description: "Iniciar EDI IA"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{{app}}"
'''
    
    # Salvar script do Inno Setup
    with open("edi-ia-installer.iss", "w", encoding="utf-8") as f:
        f.write(inno_script)
    
    print("✅ Script do Inno Setup criado")
    
    # Verificar se Inno Setup está instalado
    try:
        subprocess.run(["iscc", "/?"], capture_output=True, check=True)
        print("✅ Inno Setup encontrado")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Inno Setup não encontrado")
        print("📥 Por favor, baixe e instale Inno Setup:")
        print("   https://jrsoftware.org/isdl.php")
        return False
    
    # Compilar instalador
    try:
        print("🔨 Compilando instalador...")
        result = subprocess.run(["iscc", "edi-ia-installer.iss"], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Instalador compilado com sucesso!")
            print("📦 Arquivo criado: dist/EDI-IA-Installer.exe")
            return True
        else:
            print(f"❌ Erro na compilação: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao compilar instalador: {e}")
        return False

def create_portable_installer():
    """Cria instalador portátil (ZIP com script de instalação)"""
    
    print("📦 Criando instalador portátil...")
    
    # Criar diretório temporário
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Copiar arquivos principais
        source_dir = Path(".")
        target_dir = temp_path / "EDI-IA-Portable"
        
        files_to_copy = [
            "src",
            "edi-ia-mobile", 
            "server.ts",
            "server-mobile-api.ts",
            "package.json",
            "package-lock.json",
            "README.md",
            "start-services.bat",
            "start-services.ps1",
            "README_DEPLOY_WINDOWS.md"
        ]
        
        for file_name in files_to_copy:
            source_file = source_dir / file_name
            if source_file.exists():
                target_file = target_dir / file_name
                if source_file.is_dir():
                    shutil.copytree(source_file, target_file, dirs_exist_ok=True)
                else:
                    shutil.copy2(source_file, target_file)
                print(f"✅ Copiado: {file_name}")
        
        # Criar script de instalação portátil
        install_script = create_installer_script()
        install_file = target_dir / "install.bat"
        
        with open(install_file, "w", encoding="utf-8") as f:
            f.write(install_script)
        
        print("✅ Script de instalação criado")
        
        # Criar arquivo README para instalador portátil
        readme_content = f'''
# EDI IA - Instalador Portátil

## 📦 Como Instalar

1. **Descompacte** este arquivo em uma pasta de sua escolha
2. **Clique com o botão direito** em `install.bat`
3. **Selecione "Executar como Administrador"**
4. **Siga as instruções** do instalador

## 🚀 Como Usar

Após a instalação:

- **Duplo-clique** no atalho "EDI IA" na área de trabalho
- **Ou execute** `start-services.bat` na pasta de instalação

## 📱 Acessar o Sistema

- **App Principal**: http://localhost:3001
- **API Mobile**: http://localhost:3002  
- **App Mobile**: https://edi-3hmcxdr29-helder-netos-projects.vercel.app

## 📋 Requisitos

- Windows 10 ou superior
- Node.js instalado (https://nodejs.org)
- Conexão com internet para o app mobile

## 🗑️ Como Desinstalar

- Use "Adicionar ou Remover Programas" no Painel de Controle
- Ou execute `uninstall.ps1` na pasta de instalação

## 📞 Suporte

- WhatsApp: +244 923 456 789
- Email: suporte@edi-ia.ao
- GitHub: https://github.com/hnetoo/edi-ia

---

**Versão**: {INSTALLER_CONFIG["app_version"]}  
**Data**: {datetime.datetime.now().strftime("%d/%m/%Y")}
'''
        
        readme_file = target_dir / "README-INSTALADOR.md"
        with open(readme_file, "w", encoding="utf-8") as f:
            f.write(readme_content)
        
        print("✅ README do instalador criado")
        
        # Criar arquivo ZIP
        zip_filename = "EDI-IA-Portable-Installer.zip"
        shutil.make_archive("EDI-IA-Portable-Installer", "zip", str(target_dir))
        
        print(f"✅ Instalador portátil criado: {zip_filename}")
        return True

def main():
    """Função principal"""
    
    print("=" * 80)
    print("    EDI IA - Criador de Instalador .exe")
    print("=" * 80)
    print()
    
    # Verificar se estamos no diretório correto
    if not Path("package.json").exists():
        print("❌ Erro: Execute este script no diretório raiz do projeto")
        print("   O arquivo package.json não foi encontrado")
        return
    
    # Menu de opções
    print("Escolha o tipo de instalador:")
    print("1. Instalador .exe (requer Inno Setup)")
    print("2. Instalador Portátil (ZIP)")
    print("3. Ambos")
    print()
    
    choice = input("Digite sua escolha (1-3): ").strip()
    
    if choice == "1":
        success = create_installer_exe()
    elif choice == "2":
        success = create_portable_installer()
    elif choice == "3":
        success1 = create_installer_exe()
        success2 = create_portable_installer()
        success = success1 or success2
    else:
        print("❌ Escolha inválida")
        return
    
    if success:
        print()
        print("=" * 80)
        print("    ✅ INSTALADOR CRIADO COM SUCESSO!")
        print("=" * 80)
        print()
        print("📦 Arquivos criados:")
        
        if Path("dist/EDI-IA-Installer.exe").exists():
            print("   • dist/EDI-IA-Installer.exe")
        
        if Path("EDI-IA-Portable-Installer.zip").exists():
            print("   • EDI-IA-Portable-Installer.zip")
        
        print()
        print("🚀 O EDI IA está pronto para distribuição!")
    else:
        print()
        print("❌ Erro ao criar instalador")
        print("📞 Verifique os requisitos e tente novamente")

if __name__ == "__main__":
    import datetime
    main()
