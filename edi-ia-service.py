#!/usr/bin/env python3
"""
EDI IA - Serviço Windows para Inicialização Automática
Cria um serviço Windows que inicia automaticamente os servidores do EDI IA
"""

import os
import sys
import time
import logging
import subprocess
import threading
from pathlib import Path
import win32service
import win32serviceutil
import win32event
import win32con
import servicemanager

# Configurações do serviço
SERVICE_NAME = "EDI IA Service"
SERVICE_DISPLAY_NAME = "EDI IA - Sistema de Gestão Condominial"
SERVICE_DESCRIPTION = "Serviço para inicialização automática dos servidores do EDI IA"
INSTALL_DIR = r"C:\Program Files\EDI IA"
LOG_DIR = os.path.join(INSTALL_DIR, "logs")
LOG_FILE = os.path.join(LOG_DIR, "service.log")

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EDIAService(win32serviceutil.ServiceFramework):
    """Classe principal do serviço Windows"""
    
    _svc_name_ = SERVICE_NAME
    _svc_display_name_ = SERVICE_DISPLAY_NAME
    _svc_description_ = SERVICE_DESCRIPTION
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.is_alive = True
        self.processes = []
        
        logger.info("Serviço EDI IA inicializado")
    
    def SvcStop(self):
        """Para o serviço"""
        logger.info("Recebido comando para parar o serviço")
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_alive = False
        
        # Parar todos os processos
        self.stop_all_processes()
        
        logger.info("Serviço EDI IA parado")
    
    def SvcDoRun(self):
        """Executa o serviço"""
        logger.info("Iniciando serviço EDI IA")
        
        try:
            # Criar diretórios necessários
            self.create_directories()
            
            # Iniciar processos
            self.start_processes()
            
            # Manter serviço rodando
            self.run_service()
            
        except Exception as e:
            logger.error(f"Erro no serviço: {e}")
            self.ReportServiceStatus(win32service.SERVICE_STOPPED)
    
    def create_directories(self):
        """Cria diretórios necessários"""
        try:
            os.makedirs(LOG_DIR, exist_ok=True)
            os.makedirs(INSTALL_DIR, exist_ok=True)
            logger.info("Diretórios criados com sucesso")
        except Exception as e:
            logger.error(f"Erro ao criar diretórios: {e}")
            raise
    
    def start_processes(self):
        """Inicia os processos do EDI IA"""
        try:
            # Iniciar App Principal (porta 3001)
            self.start_app_principal()
            
            # Aguardar um pouco
            time.sleep(3)
            
            # Iniciar API Server Mobile (porta 3002)
            self.start_api_mobile()
            
            logger.info("Todos os processos iniciados com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao iniciar processos: {e}")
            raise
    
    def start_app_principal(self):
        """Inicia o App Principal"""
        try:
            cmd = [
                "npm", "run", "dev"
            ]
            
            cwd = INSTALL_DIR
            env = os.environ.copy()
            env["PORT"] = "3001"
            
            process = subprocess.Popen(
                cmd,
                cwd=cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            
            self.processes.append({
                "name": "App Principal",
                "process": process,
                "port": 3001
            })
            
            logger.info("App Principal iniciado (PID: %d, Porta: 3001)" % process.pid)
            
        except Exception as e:
            logger.error(f"Erro ao iniciar App Principal: {e}")
            raise
    
    def start_api_mobile(self):
        """Inicia o API Server Mobile"""
        try:
            cmd = [
                "npx", "ts-node", "server-mobile-api.ts"
            ]
            
            cwd = INSTALL_DIR
            env = os.environ.copy()
            env["PORT"] = "3002"
            
            process = subprocess.Popen(
                cmd,
                cwd=cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            
            self.processes.append({
                "name": "API Mobile",
                "process": process,
                "port": 3002
            })
            
            logger.info("API Mobile iniciado (PID: %d, Porta: 3002)" % process.pid)
            
        except Exception as e:
            logger.error(f"Erro ao iniciar API Mobile: {e}")
            raise
    
    def run_service(self):
        """Mantém o serviço rodando e monitora os processos"""
        logger.info("Serviço rodando, monitorando processos...")
        
        # Iniciar thread de monitoramento
        monitor_thread = threading.Thread(target=self.monitor_processes)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        # Aguardar comando de parada
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)
    
    def monitor_processes(self):
        """Monitora os processos e reinicia se necessário"""
        while self.is_alive:
            try:
                for proc_info in self.processes:
                    process = proc_info["process"]
                    
                    # Verificar se processo ainda está rodando
                    if process.poll() is not None:
                        logger.warning(f"Processo {proc_info['name']} parou inesperamente")
                        
                        # Tentar reiniciar
                        try:
                            if proc_info["name"] == "App Principal":
                                self.start_app_principal()
                            elif proc_info["name"] == "API Mobile":
                                self.start_api_mobile()
                            
                            logger.info(f"Processo {proc_info['name']} reiniciado com sucesso")
                            
                        except Exception as e:
                            logger.error(f"Erro ao reiniciar {proc_info['name']}: {e}")
                
                # Aguardar antes da próxima verificação
                time.sleep(10)
                
            except Exception as e:
                logger.error(f"Erro no monitoramento: {e}")
                time.sleep(5)
    
    def stop_all_processes(self):
        """Para todos os processos"""
        logger.info("Parando todos os processos...")
        
        for proc_info in self.processes:
            try:
                process = proc_info["process"]
                
                if process.poll() is None:
                    # Tentar parar gracefulmente
                    process.terminate()
                    
                    # Aguardar um pouco
                    time.sleep(2)
                    
                    # Se ainda estiver rodando, forçar parada
                    if process.poll() is None:
                        process.kill()
                    
                    logger.info(f"Processo {proc_info['name']} parado")
                
            except Exception as e:
                logger.error(f"Erro ao parar processo {proc_info['name']}: {e}")

def install_service():
    """Instala o serviço Windows"""
    try:
        win32serviceutil.InstallService(
            EDIAService._svc_name_,
            EDIAService._svc_display_name_,
            EDIAService._svc_description_,
            startType=win32service.SERVICE_AUTO_START
        )
        
        logger.info("Serviço EDI IA instalado com sucesso")
        print("✅ Serviço EDI IA instalado com sucesso")
        
        # Iniciar o serviço
        win32serviceutil.StartService(EDIAService._svc_name_)
        logger.info("Serviço EDI IA iniciado")
        print("✅ Serviço EDI IA iniciado")
        
    except Exception as e:
        logger.error(f"Erro ao instalar serviço: {e}")
        print(f"❌ Erro ao instalar serviço: {e}")

def uninstall_service():
    """Desinstala o serviço Windows"""
    try:
        # Parar o serviço
        if win32serviceutil.QueryServiceStatus(EDIAService._svc_name_)[1] != win32service.SERVICE_STOPPED:
            win32serviceutil.StopService(EDIAService._svc_name_)
        
        # Remover o serviço
        win32serviceutil.RemoveService(EDIAService._svc_name_)
        
        logger.info("Serviço EDI IA desinstalado com sucesso")
        print("✅ Serviço EDI IA desinstalado com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao desinstalar serviço: {e}")
        print(f"❌ Erro ao desinstalar serviço: {e}")

def main():
    """Função principal"""
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(EDIAService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(EDIAService)

if __name__ == "__main__":
    # Verificar se está rodando como administrador
    try:
        import ctypes
        if not ctypes.windll.shell32.IsUserAnAdmin():
            print("❌ Este script precisa ser executado como Administrador")
            print("   Clique com o botão direito e selecione 'Executar como Administrador'")
            sys.exit(1)
    except:
        print("❌ Erro ao verificar permissões de administrador")
        sys.exit(1)
    
    # Criar diretórios necessários
    os.makedirs(LOG_DIR, exist_ok=True)
    
    # Menu de opções
    print("=" * 60)
    print("    EDI IA - Gerenciador de Serviço Windows")
    print("=" * 60)
    print()
    print("1. Instalar serviço")
    print("2. Desinstalar serviço")
    print("3. Iniciar serviço")
    print("4. Parar serviço")
    print("5. Verificar status")
    print("6. Ver logs")
    print()
    
    choice = input("Digite sua escolha (1-6): ").strip()
    
    try:
        if choice == "1":
            install_service()
        elif choice == "2":
            uninstall_service()
        elif choice == "3":
            win32serviceutil.StartService(EDIAService._svc_name_)
            print("✅ Serviço iniciado")
        elif choice == "4":
            win32serviceutil.StopService(EDIAService._svc_name_)
            print("✅ Serviço parado")
        elif choice == "5":
            status = win32serviceutil.QueryServiceStatus(EDIAService._svc_name_)
            status_map = {
                1: "STOPPED",
                2: "START_PENDING",
                3: "STOP_PENDING",
                4: "RUNNING",
                5: "CONTINUE_PENDING",
                6: "PAUSE_PENDING",
                7: "PAUSED"
            }
            print(f"Status do serviço: {status_map.get(status[1], 'UNKNOWN')}")
        elif choice == "6":
            if os.path.exists(LOG_FILE):
                print("=== Logs do Serviço ===")
                with open(LOG_FILE, "r", encoding="utf-8") as f:
                    print(f.read())
            else:
                print("❌ Arquivo de log não encontrado")
        else:
            print("❌ Escolha inválida")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    input("\nPressione Enter para sair")
