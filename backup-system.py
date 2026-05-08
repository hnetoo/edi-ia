#!/usr/bin/env python3
"""
EDI IA - Sistema de Backup Automático
Cria backups automáticos das configurações e dados do sistema
"""

import os
import sys
import json
import shutil
import sqlite3
import zipfile
import schedule
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# Configurações
INSTALL_DIR = r"C:\Program Files\EDI IA"
BACKUP_DIR = os.path.join(INSTALL_DIR, "backup")
LOG_DIR = os.path.join(INSTALL_DIR, "logs")
LOG_FILE = os.path.join(LOG_DIR, "backup.log")
CONFIG_FILE = os.path.join(INSTALL_DIR, "backup-config.json")

# Configurações padrão
DEFAULT_CONFIG = {
    "backup_enabled": True,
    "backup_interval": "daily",  # hourly, daily, weekly, monthly
    "backup_retention_days": 30,
    "backup_compression": True,
    "backup_database": True,
    "backup_config": True,
    "backup_logs": True,
    "backup_mobile": True,
    "email_notifications": False,
    "email_smtp_server": "smtp.gmail.com",
    "email_smtp_port": 587,
    "email_user": "",
    "email_password": "",
    "email_to": "",
    "max_backup_size_mb": 500,
    "exclude_patterns": [
        "node_modules",
        ".git",
        "*.tmp",
        "*.log",
        "dist",
        "build"
    ]
}

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

class BackupSystem:
    """Sistema de backup automático do EDI IA"""
    
    def __init__(self):
        self.config = self.load_config()
        self.setup_directories()
        
    def load_config(self):
        """Carrega configurações do backup"""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                logger.info("Configurações de backup carregadas")
                return config
            else:
                # Criar configuração padrão
                self.save_config(DEFAULT_CONFIG)
                logger.info("Configurações padrão criadas")
                return DEFAULT_CONFIG.copy()
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
            return DEFAULT_CONFIG.copy()
    
    def save_config(self, config):
        """Salva configurações do backup"""
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            logger.info("Configurações de backup salvas")
        except Exception as e:
            logger.error(f"Erro ao salvar configurações: {e}")
    
    def setup_directories(self):
        """Cria diretórios necessários"""
        try:
            os.makedirs(BACKUP_DIR, exist_ok=True)
            os.makedirs(LOG_DIR, exist_ok=True)
            logger.info("Diretórios de backup criados")
        except Exception as e:
            logger.error(f"Erro ao criar diretórios: {e}")
    
    def create_backup(self):
        """Cria um backup completo do sistema"""
        if not self.config.get("backup_enabled", True):
            logger.info("Backup desabilitado nas configurações")
            return False
        
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"edi-ia-backup-{timestamp}"
            backup_path = os.path.join(BACKUP_DIR, backup_name)
            
            logger.info(f"Iniciando backup: {backup_name}")
            
            # Criar diretório de backup
            os.makedirs(backup_path, exist_ok=True)
            
            # Backup do banco de dados
            if self.config.get("backup_database", True):
                self.backup_database(backup_path)
            
            # Backup das configurações
            if self.config.get("backup_config", True):
                self.backup_config_files(backup_path)
            
            # Backup dos logs
            if self.config.get("backup_logs", True):
                self.backup_logs(backup_path)
            
            # Backup do app mobile
            if self.config.get("backup_mobile", True):
                self.backup_mobile_app(backup_path)
            
            # Criar arquivo compactado
            if self.config.get("backup_compression", True):
                self.create_compressed_backup(backup_path, backup_name)
                # Remover diretório temporário
                shutil.rmtree(backup_path)
            
            # Limpar backups antigos
            self.cleanup_old_backups()
            
            # Enviar notificação por email
            if self.config.get("email_notifications", False):
                self.send_backup_notification(backup_name, True)
            
            logger.info(f"Backup concluído com sucesso: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao criar backup: {e}")
            
            # Enviar notificação de erro
            if self.config.get("email_notifications", False):
                self.send_backup_notification("", False, str(e))
            
            return False
    
    def backup_database(self, backup_path):
        """Faz backup do banco de dados SQLite"""
        try:
            db_path = os.path.join(INSTALL_DIR, "condo_management.db")
            
            if os.path.exists(db_path):
                backup_db_path = os.path.join(backup_path, "condo_management.db")
                shutil.copy2(db_path, backup_db_path)
                
                # Criar dump SQL também
                dump_path = os.path.join(backup_path, "database_dump.sql")
                conn = sqlite3.connect(db_path)
                
                with open(dump_path, 'w', encoding='utf-8') as f:
                    for line in conn.iterdump():
                        f.write('%s\n' % line)
                
                conn.close()
                logger.info("Backup do banco de dados concluído")
            else:
                logger.warning("Banco de dados não encontrado")
                
        except Exception as e:
            logger.error(f"Erro ao fazer backup do banco de dados: {e}")
            raise
    
    def backup_config_files(self, backup_path):
        """Faz backup dos arquivos de configuração"""
        try:
            config_files = [
                "package.json",
                "package-lock.json",
                "server.ts",
                "server-mobile-api.ts",
                "start-services.bat",
                "start-services.ps1",
                "backup-config.json"
            ]
            
            config_backup_dir = os.path.join(backup_path, "config")
            os.makedirs(config_backup_dir, exist_ok=True)
            
            for file_name in config_files:
                source_path = os.path.join(INSTALL_DIR, file_name)
                if os.path.exists(source_path):
                    dest_path = os.path.join(config_backup_dir, file_name)
                    shutil.copy2(source_path, dest_path)
            
            logger.info("Backup das configurações concluído")
            
        except Exception as e:
            logger.error(f"Erro ao fazer backup das configurações: {e}")
            raise
    
    def backup_logs(self, backup_path):
        """Faz backup dos logs do sistema"""
        try:
            if os.path.exists(LOG_DIR):
                logs_backup_dir = os.path.join(backup_path, "logs")
                shutil.copytree(LOG_DIR, logs_backup_dir)
                logger.info("Backup dos logs concluído")
            else:
                logger.warning("Diretório de logs não encontrado")
                
        except Exception as e:
            logger.error(f"Erro ao fazer backup dos logs: {e}")
            raise
    
    def backup_mobile_app(self, backup_path):
        """Faz backup do aplicativo mobile"""
        try:
            mobile_dir = os.path.join(INSTALL_DIR, "edi-ia-mobile")
            
            if os.path.exists(mobile_dir):
                mobile_backup_dir = os.path.join(backup_path, "edi-ia-mobile")
                
                # Copiar apenas arquivos importantes, excluindo node_modules
                shutil.copytree(mobile_dir, mobile_backup_dir, 
                              ignore=shutil.ignore_patterns(*self.config.get("exclude_patterns", [])))
                
                logger.info("Backup do app mobile concluído")
            else:
                logger.warning("Diretório do app mobile não encontrado")
                
        except Exception as e:
            logger.error(f"Erro ao fazer backup do app mobile: {e}")
            raise
    
    def create_compressed_backup(self, backup_path, backup_name):
        """Cria arquivo compactado do backup"""
        try:
            zip_path = os.path.join(BACKUP_DIR, f"{backup_name}.zip")
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(backup_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, backup_path)
                        zipf.write(file_path, arcname)
            
            # Verificar tamanho do backup
            backup_size = os.path.getsize(zip_path) / (1024 * 1024)  # MB
            
            if backup_size > self.config.get("max_backup_size_mb", 500):
                logger.warning(f"Backup excede tamanho máximo: {backup_size:.2f}MB")
                os.remove(zip_path)
                raise Exception(f"Backup muito grande: {backup_size:.2f}MB")
            
            logger.info(f"Backup compactado criado: {zip_path} ({backup_size:.2f}MB)")
            
        except Exception as e:
            logger.error(f"Erro ao criar backup compactado: {e}")
            raise
    
    def cleanup_old_backups(self):
        """Remove backups antigos"""
        try:
            retention_days = self.config.get("backup_retention_days", 30)
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            
            for file_name in os.listdir(BACKUP_DIR):
                if file_name.endswith('.zip'):
                    file_path = os.path.join(BACKUP_DIR, file_name)
                    file_date = datetime.fromtimestamp(os.path.getctime(file_path))
                    
                    if file_date < cutoff_date:
                        os.remove(file_path)
                        logger.info(f"Backup antigo removido: {file_name}")
            
        except Exception as e:
            logger.error(f"Erro ao limpar backups antigos: {e}")
    
    def send_backup_notification(self, backup_name, success, error_msg=None):
        """Envia notificação por email sobre o backup"""
        try:
            email_config = self.config
            
            if not email_config.get("email_notifications", False):
                return
            
            smtp_server = email_config.get("email_smtp_server", "smtp.gmail.com")
            smtp_port = email_config.get("email_smtp_port", 587)
            email_user = email_config.get("email_user", "")
            email_password = email_config.get("email_password", "")
            email_to = email_config.get("email_to", "")
            
            if not all([email_user, email_password, email_to]):
                logger.warning("Configurações de email incompletas")
                return
            
            # Criar mensagem
            msg = MIMEMultipart()
            msg['From'] = email_user
            msg['To'] = email_to
            msg['Subject'] = f"EDI IA - Backup {'Concluído' if success else 'Falhou'}"
            
            # Corpo do email
            if success:
                body = f"""
Backup do EDI IA concluído com sucesso!

Detalhes:
- Nome: {backup_name}
- Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
- Status: Sucesso

O backup está disponível no diretório: {BACKUP_DIR}
"""
            else:
                body = f"""
Backup do EDI IA falhou!

Detalhes:
- Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
- Status: Falha
- Erro: {error_msg}

Verifique os logs em: {LOG_FILE}
"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Enviar email
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(email_user, email_password)
            server.send_message(msg)
            server.quit()
            
            logger.info("Notificação por email enviada")
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação por email: {e}")
    
    def list_backups(self):
        """Lista todos os backups disponíveis"""
        try:
            backups = []
            
            for file_name in os.listdir(BACKUP_DIR):
                if file_name.endswith('.zip'):
                    file_path = os.path.join(BACKUP_DIR, file_name)
                    stat = os.stat(file_path)
                    
                    backups.append({
                        'name': file_name,
                        'path': file_path,
                        'size': stat.st_size,
                        'date': datetime.fromtimestamp(stat.st_ctime)
                    })
            
            # Ordenar por data (mais recente primeiro)
            backups.sort(key=lambda x: x['date'], reverse=True)
            
            return backups
            
        except Exception as e:
            logger.error(f"Erro ao listar backups: {e}")
            return []
    
    def restore_backup(self, backup_name):
        """Restaura um backup específico"""
        try:
            backup_path = os.path.join(BACKUP_DIR, backup_name)
            
            if not os.path.exists(backup_path):
                raise Exception(f"Backup não encontrado: {backup_name}")
            
            # Criar diretório temporário para extração
            temp_dir = os.path.join(BACKUP_DIR, "temp_restore")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Extrair backup
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                zipf.extractall(temp_dir)
            
            # Restaurar banco de dados
            db_backup = os.path.join(temp_dir, "condo_management.db")
            if os.path.exists(db_backup):
                shutil.copy2(db_backup, os.path.join(INSTALL_DIR, "condo_management.db"))
                logger.info("Banco de dados restaurado")
            
            # Restaurar configurações
            config_backup = os.path.join(temp_dir, "config")
            if os.path.exists(config_backup):
                for file_name in os.listdir(config_backup):
                    src = os.path.join(config_backup, file_name)
                    dst = os.path.join(INSTALL_DIR, file_name)
                    shutil.copy2(src, dst)
                logger.info("Configurações restauradas")
            
            # Limpar diretório temporário
            shutil.rmtree(temp_dir)
            
            logger.info(f"Backup {backup_name} restaurado com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao restaurar backup: {e}")
            return False
    
    def start_scheduler(self):
        """Inicia o agendador de backups automáticos"""
        try:
            interval = self.config.get("backup_interval", "daily")
            
            if interval == "hourly":
                schedule.every().hour.do(self.create_backup)
            elif interval == "daily":
                schedule.every().day.at("02:00").do(self.create_backup)
            elif interval == "weekly":
                schedule.every().sunday.at("02:00").do(self.create_backup)
            elif interval == "monthly":
                schedule.every().month.do(self.create_backup)
            
            logger.info(f"Agendador de backups iniciado ({interval})")
            
            # Manter o agendador rodando
            while True:
                schedule.run_pending()
                time.sleep(60)
                
        except Exception as e:
            logger.error(f"Erro no agendador de backups: {e}")

def main():
    """Função principal"""
    if len(sys.argv) < 2:
        print("Uso: python backup-system.py [comando]")
        print("Comandos:")
        print("  create    - Criar backup agora")
        print("  list      - Listar backups")
        print("  restore   - Restaurar backup")
        print("  schedule  - Iniciar agendador")
        print("  config    - Configurar backup")
        return
    
    # Verificar se está rodando como administrador (para escrita em Program Files)
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
    os.makedirs(BACKUP_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    
    command = sys.argv[1].lower()
    backup_system = BackupSystem()
    
    try:
        if command == "create":
            print("🔄 Criando backup...")
            if backup_system.create_backup():
                print("✅ Backup criado com sucesso!")
            else:
                print("❌ Falha ao criar backup")
                
        elif command == "list":
            print("📋 Lista de backups:")
            backups = backup_system.list_backups()
            
            if not backups:
                print("   Nenhum backup encontrado")
            else:
                for i, backup in enumerate(backups, 1):
                    size_mb = backup['size'] / (1024 * 1024)
                    print(f"   {i}. {backup['name']}")
                    print(f"      Data: {backup['date'].strftime('%d/%m/%Y %H:%M:%S')}")
                    print(f"      Tamanho: {size_mb:.2f} MB")
                    print()
                    
        elif command == "restore":
            backups = backup_system.list_backups()
            
            if not backups:
                print("❌ Nenhum backup encontrado para restaurar")
                return
            
            print("📋 Backups disponíveis:")
            for i, backup in enumerate(backups, 1):
                print(f"   {i}. {backup['name']} ({backup['date'].strftime('%d/%m/%Y %H:%M')})")
            
            try:
                choice = int(input("\nDigite o número do backup para restaurar: ")) - 1
                if 0 <= choice < len(backups):
                    backup_name = backups[choice]['name']
                    print(f"🔄 Restaurando backup: {backup_name}")
                    
                    if backup_system.restore_backup(backup_name):
                        print("✅ Backup restaurado com sucesso!")
                        print("🔄 Reinicie os serviços para aplicar as alterações")
                    else:
                        print("❌ Falha ao restaurar backup")
                else:
                    print("❌ Escolha inválida")
            except ValueError:
                print("❌ Escolha inválida")
                
        elif command == "schedule":
            print("⏰ Iniciando agendador de backups automáticos...")
            print("   Pressione Ctrl+C para parar")
            backup_system.start_scheduler()
            
        elif command == "config":
            print("⚙️ Configurações do backup:")
            config = backup_system.config
            
            for key, value in config.items():
                if "password" in key:
                    value = "***" if value else ""
                print(f"   {key}: {value}")
            
            print("\nPara editar as configurações, modifique o arquivo:")
            print(f"   {CONFIG_FILE}")
            
        else:
            print(f"❌ Comando desconhecido: {command}")
            
    except KeyboardInterrupt:
        print("\n👋 Operação cancelada pelo usuário")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    input("\nPressione Enter para sair")

if __name__ == "__main__":
    main()
