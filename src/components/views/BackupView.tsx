import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  Calendar, 
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BackupView: React.FC = () => {
  const [backups, setBackups] = React.useState<any[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [lastBackup, setLastBackup] = React.useState<any>(null);

  React.useEffect(() => {
    fetchBackups();
    // Auto-backup diário
    const interval = setInterval(() => {
      checkAndCreateAutoBackup();
    }, 60000); // Verificar a cada minuto (em produção seria a cada 24h)
    
    return () => clearInterval(interval);
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup/list');
      const data = await response.json();
      if (data.success) {
        setBackups(data.backups);
        if (data.backups.length > 0) {
          setLastBackup(data.backups[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const createBackup = async (type: 'full' | 'incremental' = 'full') => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      const data = await response.json();
      if (data.success) {
        await fetchBackups();
        alert(`Backup ${type} criado com sucesso!`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Erro ao criar backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: number) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Isso irá substituir todos os dados atuais.')) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup restaurado com sucesso! A página será recarregada.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Erro ao restaurar backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const checkAndCreateAutoBackup = async () => {
    // Verificar se o último backup tem mais de 24h
    if (lastBackup) {
      const lastBackupTime = new Date(lastBackup.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastBackupTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        await createBackup('incremental');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'failed': return <XCircle className="text-red-500" size={20} />;
      case 'in_progress': return <RefreshCw className="text-yellow-500 animate-spin" size={20} />;
      default: return <AlertTriangle className="text-orange-500" size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-white">Backup na Nuvem</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => createBackup('incremental')}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-6 py-2 bg-brand/10 text-brand border border-brand/30 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand/20 transition-all"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Criando...
              </>
            ) : (
              <>
                <Upload size={16} />
                Backup Rápido
              </>
            )}
          </button>
          <button 
            onClick={() => createBackup('full')}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Criando...
              </>
            ) : (
              <>
                <Cloud size={16} />
                Backup Completo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Cloud className="text-green-500" size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold">Status da Nuvem</h4>
              <p className="text-sm text-ink-muted">Conectado e sincronizado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-500">Online</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center">
              <HardDrive className="text-brand" size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold">Armazenamento</h4>
              <p className="text-sm text-ink-muted">2.4 GB de 10 GB usados</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-brand h-2 rounded-full" style={{ width: '24%' }}></div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-500" size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold">Próximo Backup</h4>
              <p className="text-sm text-ink-muted">Automático em 23 horas</p>
            </div>
          </div>
          <div className="text-xs text-ink-muted">
            Último: {lastBackup ? formatDate(lastBackup.created_at) : 'Nunca'}
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="glass-card p-8">
        <h4 className="text-xl font-bold text-white mb-6">Histórico de Backups</h4>
        
        {backups.length === 0 ? (
          <div className="text-center py-12">
            <Cloud size={48} className="mx-auto text-brand/20 mb-4" />
            <p className="text-ink-muted">Nenhum backup encontrado</p>
            <p className="text-sm text-ink-muted/60 mt-2">Crie seu primeiro backup para proteger seus dados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <motion.div
                key={backup.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    {getStatusIcon(backup.status)}
                  </div>
                  <div>
                    <h5 className="text-white font-semibold">{backup.filename}</h5>
                    <div className="flex items-center gap-4 text-sm text-ink-muted">
                      <span className="capitalize">{backup.type}</span>
                      <span>{backup.size}</span>
                      <span>{formatDate(backup.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreBackup(backup.id)}
                    disabled={isRestoring}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/10 text-green-500 border border-green-600/30 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-600/20 transition-all disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Restaurando...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        Restaurar
                      </>
                    )}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 text-ink-muted border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Settings */}
      <div className="glass-card p-8">
        <h4 className="text-xl font-bold text-white mb-6">Configurações de Backup</h4>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-white font-semibold">Backup Automático</h5>
              <p className="text-sm text-ink-muted">Criar backup incremental diariamente</p>
            </div>
            <button className="w-12 h-6 bg-brand rounded-full relative transition-colors">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-white font-semibold">Retenção de Backups</h5>
              <p className="text-sm text-ink-muted">Manter backups por 30 dias</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white">
              <option>7 dias</option>
              <option>30 dias</option>
              <option>90 dias</option>
              <option>Ilimitado</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-white font-semibold">Notificações</h5>
              <p className="text-sm text-ink-muted">Alertar sobre backups e falhas</p>
            </div>
            <button className="w-12 h-6 bg-brand rounded-full relative transition-colors">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BackupView;
