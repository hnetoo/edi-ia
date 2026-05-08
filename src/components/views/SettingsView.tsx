import React from 'react';
import { motion } from 'framer-motion';

interface SettingsViewProps {
  settings: any;
  fetchSettings: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, fetchSettings }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="max-w-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">Definições do Sistema</h3>
        
        <div className="glass-card p-8 space-y-8">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const updates = {
              building_name: formData.get('building_name'),
              admin_email: formData.get('admin_email'),
              currency: formData.get('currency'),
            };

            try {
              const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
              });
              if (res.ok) {
                alert("Definições atualizadas com sucesso!");
                fetchSettings();
              }
            } catch (err) {
              alert("Erro ao atualizar definições");
            }
          }} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Nome do Edifício / Condomínio</label>
              <input 
                name="building_name" 
                defaultValue={settings.building_name}
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">E-mail Administrativo</label>
              <input 
                name="admin_email" 
                type="email"
                defaultValue={settings.admin_email}
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Moeda Local</label>
              <select 
                name="currency" 
                defaultValue={settings.currency}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none appearance-none"
              >
                <option value="AOA" className="bg-surface-dark">Kwanza (AOA)</option>
                <option value="EUR" className="bg-surface-dark">Euro (EUR)</option>
                <option value="USD" className="bg-surface-dark">Dólar (USD)</option>
              </select>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Base de Dados</h4>
              <div className="flex items-center justify-between p-4 bg-red-400/5 border border-red-400/20 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-red-400">Limpar Dados do Sistema</p>
                  <p className="text-[10px] text-ink-muted">Esta ação irá remover todos os registos de moradores e transações.</p>
                </div>
                <button 
                  type="button"
                  onClick={async () => {
                    if (confirm("TEM A CERTEZA? Esta ação é irreversível e apagará todos os dados de moradores e financeiro.")) {
                      if (confirm("ÚLTIMA AVISO: Todos os moradores, transações, funcionários e manutenção serão apagados permanentemente!")) {
                        try {
                          const response = await fetch('/api/reset-all', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          
                          if (response.ok) {
                            alert("✅ Sistema resetado com sucesso! Todos os dados foram limpos.");
                            // Recarregar a página para atualizar dados
                            window.location.reload();
                          } else {
                            const error = await response.json();
                            alert(`❌ Erro ao resetar: ${error.message || 'Erro desconhecido'}`);
                          }
                        } catch (error) {
                          alert("❌ Erro de conexão ao tentar resetar o sistema.");
                        }
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-400 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 transition-colors"
                >
                  Reset Total
                </button>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit"
                className="w-full py-4 bg-brand text-black font-bold rounded-xl text-sm uppercase tracking-widest hover:scale-[1.02] transition-all brand-glow-sm"
              >
                Guardar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsView;
