#!/usr/bin/env python3
"""
EDI IA - Servidor Local para App Mobile
Cria um servidor web local para servir o app mobile sem necessidade de Vercel
"""

import os
import sys
import json
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
import logging
from pathlib import Path

# Configurações
MOBILE_PORT = 3003
MOBILE_DIR = os.path.join(os.path.dirname(__file__), "edi-ia-mobile", "EDIAMobile")
API_BASE_URL = "http://localhost:3002"

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MobileHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Handler personalizado para servir o app mobile localmente"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=MOBILE_DIR, **kwargs)
    
    def do_GET(self):
        """Processa requisições GET"""
        parsed_path = urlparse(self.path)
        
        # Se for a API, redirecionar para o servidor principal
        if parsed_path.path.startswith('/api/'):
            self.proxy_request(parsed_path)
        else:
            # Servir arquivos estáticos do app mobile
            self.serve_static_file(parsed_path)
    
    def do_POST(self):
        """Processa requisições POST"""
        parsed_path = urlparse(self.path)
        
        # Se for a API, redirecionar para o servidor principal
        if parsed_path.path.startswith('/api/'):
            self.proxy_request(parsed_path)
        else:
            self.send_error(404, "Not Found")
    
    def proxy_request(self, parsed_path):
        """Proxy para o servidor API principal"""
        try:
            import requests
            
            # Construir URL completa para o servidor principal
            target_url = f"{API_BASE_URL}{parsed_path.path}"
            
            # Adicionar query parameters se existirem
            if parsed_path.query:
                target_url += f"?{parsed_path.query}"
            
            # Fazer a requisição para o servidor principal
            if self.command == 'GET':
                response = requests.get(target_url, timeout=10)
            elif self.command == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                headers = dict(self.headers)
                response = requests.post(target_url, data=post_data, headers=headers, timeout=10)
            
            # Enviar resposta de volta para o cliente
            self.send_response(response.status_code)
            
            # Copiar headers da resposta
            for header, value in response.headers.items():
                if header.lower() not in ['content-length', 'transfer-encoding']:
                    self.send_header(header, value)
            
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            # Enviar corpo da resposta
            self.wfile.write(response.content)
            
        except Exception as e:
            logger.error(f"Erro no proxy: {e}")
            self.send_error(500, f"Proxy Error: {str(e)}")
    
    def serve_static_file(self, parsed_path):
        """Serve arquivos estáticos do app mobile"""
        try:
            # Se for a raiz, servir index.html
            if parsed_path.path == '/':
                file_path = os.path.join(MOBILE_DIR, 'index.html')
            else:
                file_path = os.path.join(MOBILE_DIR, parsed_path.path.lstrip('/'))
            
            # Verificar se o arquivo existe
            if os.path.exists(file_path) and os.path.isfile(file_path):
                # Determinar content type
                content_type = self.get_content_type(file_path)
                
                # Ler arquivo
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Enviar resposta
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(content)
            else:
                # Se não encontrar, tentar servir index.html (para SPA)
                index_path = os.path.join(MOBILE_DIR, 'index.html')
                if os.path.exists(index_path):
                    with open(index_path, 'rb') as f:
                        content = f.read()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', str(len(content)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    self.wfile.write(content)
                else:
                    self.send_error(404, "File not found")
                    
        except Exception as e:
            logger.error(f"Erro ao servir arquivo: {e}")
            self.send_error(500, f"Server Error: {str(e)}")
    
    def get_content_type(self, file_path):
        """Determina o content type baseado na extensão do arquivo"""
        ext = os.path.splitext(file_path)[1].lower()
        
        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
        }
        
        return content_types.get(ext, 'application/octet-stream')
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Personalizar log messages"""
        logger.info(f"Mobile Server: {format % args}")

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Servidor HTTP com suporte a threads"""
    daemon_threads = True

class MobileLocalServer:
    """Servidor local para o app mobile"""
    
    def __init__(self, port=MOBILE_PORT):
        self.port = port
        self.server = None
        self.server_thread = None
        self.running = False
        
    def start(self):
        """Inicia o servidor"""
        try:
            # Verificar se o diretório do app mobile existe
            if not os.path.exists(MOBILE_DIR):
                logger.error(f"Diretório do app mobile não encontrado: {MOBILE_DIR}")
                return False
            
            # Criar servidor
            self.server = ThreadedHTTPServer(('localhost', self.port), MobileHTTPRequestHandler)
            self.running = True
            
            # Iniciar servidor em thread separada
            self.server_thread = threading.Thread(target=self._run_server)
            self.server_thread.daemon = True
            self.server_thread.start()
            
            logger.info(f"Servidor mobile iniciado em http://localhost:{self.port}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar servidor mobile: {e}")
            return False
    
    def _run_server(self):
        """Executa o servidor"""
        try:
            self.server.serve_forever()
        except Exception as e:
            logger.error(f"Erro no servidor: {e}")
    
    def stop(self):
        """Para o servidor"""
        if self.server and self.running:
            self.running = False
            self.server.shutdown()
            self.server.server_close()
            
            if self.server_thread:
                self.server_thread.join(timeout=5)
            
            logger.info("Servidor mobile parado")
    
    def is_running(self):
        """Verifica se o servidor está rodando"""
        return self.running and self.server and self.server_thread.is_alive()

def check_dependencies():
    """Verifica dependências necessárias"""
    try:
        import requests
        return True
    except ImportError:
        print("❌ Biblioteca 'requests' não encontrada")
        print("📦 Instale com: pip install requests")
        return False

def main():
    """Função principal"""
    print("=" * 60)
    print("    EDI IA - Servidor Local para App Mobile")
    print("=" * 60)
    print()
    
    # Verificar dependências
    if not check_dependencies():
        input("\nPressione Enter para sair")
        return
    
    # Verificar se o diretório do app mobile existe
    if not os.path.exists(MOBILE_DIR):
        print(f"❌ Diretório do app mobile não encontrado:")
        print(f"   {MOBILE_DIR}")
        print()
        print("📁 Verifique se o app mobile está na pasta correta:")
        print("   edi-ia-mobile/EDIAMobile/")
        input("\nPressione Enter para sair")
        return
    
    # Criar servidor
    server = MobileLocalServer()
    
    try:
        # Iniciar servidor
        if server.start():
            print()
            print("✅ Servidor mobile iniciado com sucesso!")
            print()
            print("📱 Acesse o app mobile em:")
            print(f"   http://localhost:{server.port}")
            print()
            print("🔗 O app mobile se conectará automaticamente à API:")
            print(f"   {API_BASE_URL}")
            print()
            print("⚠️  Mantenha esta janela aberta para manter o servidor rodando")
            print("   Pressione Ctrl+C para parar o servidor")
            print()
            
            # Manter servidor rodando
            try:
                while server.is_running():
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n👋 Parando servidor...")
                server.stop()
                print("✅ Servidor parado com sucesso!")
        else:
            print("❌ Falha ao iniciar servidor")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    input("\nPressione Enter para sair")

if __name__ == "__main__":
    main()
