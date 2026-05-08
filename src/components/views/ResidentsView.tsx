import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircle, 
  Download, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronRight 
} from 'lucide-react';
import { CURRENCY_FORMAT } from '../../constants';
import { generatePDF } from '../../lib/pdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResidentsViewProps {
  residents: any[];
  fetchResidents: () => void;
  setEditingResident: (resident: any) => void;
  setIsResidentModalOpen: (open: boolean) => void;
  setSelectedResidentForHistory: (resident: any) => void;
  fetchResidentTransactions: (id: string) => void;
  setSelectedResidentForPayment: (resident: any) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  generatePDF: (options: any) => void;
  selectedResidentForHistory: any;
}

const ResidentsView: React.FC<ResidentsViewProps> = ({
  residents,
  fetchResidents,
  setEditingResident,
  setIsResidentModalOpen,
  setSelectedResidentForHistory,
  fetchResidentTransactions,
  setSelectedResidentForPayment,
  setIsPaymentModalOpen,
  generatePDF,
  selectedResidentForHistory
}) => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Comunidade de Moradores</h3>
          <p className="text-sm text-ink-muted">Gestão centralizada de residentes e estados de conta</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              generatePDF({
                title: 'Lista de Moradores',
                columns: ['Nome', 'Unidade', 'Tipo', 'Telefone', 'Saldo (AOA)'],
                rows: residents.map(r => [r.name, r.unit, r.type, r.phone || '', CURRENCY_FORMAT.format(r.balance)]),
                filename: 'lista_moradores',
                metadata: {
                  count: residents.length,
                  total: CURRENCY_FORMAT.format(residents.reduce((sum, r) => sum + r.balance, 0)),
                  period: new Date().toLocaleDateString('pt-PT')
                }
              });
            }}
            className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-xl text-ink-muted text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all shadow-lg"
          >
            <Download size={16} /> Exportar Lista
          </button>
          <button 
            onClick={() => {
              setEditingResident(null);
              setIsResidentModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
          >
            <Plus size={16} /> Novo Morador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {residents.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card">
            <UserCircle size={64} className="mx-auto text-brand/20 mb-4" />
            <h4 className="text-xl font-bold text-white">Nenhum Morador Encontrado</h4>
            <p className="text-ink-muted">Comece por registar os primeiros residentes do condomínio.</p>
          </div>
        )}
        {residents.map((res) => (
          <div key={res.id} className="glass-card p-8 group hover:border-brand/30 transition-all flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl border border-brand/20">
                {(res.name || '?').charAt(0)}
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingResident(res);
                    setIsResidentModalOpen(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl text-ink-muted hover:text-brand transition-colors"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!res.id) return;
                    if (window.confirm(`Remover morador ${res.name}?`)) {
                      try {
                        const r = await fetch(`/api/residents/${res.id}`, { method: 'DELETE' });
                        if (r.ok) {
                          fetchResidents();
                        } else {
                          alert("Erro ao eliminar no servidor");
                        }
                      } catch (err) {
                        alert("Erro de conexão");
                      }
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl text-ink-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xl font-bold text-white mb-1 group-hover:text-brand transition-colors">{res.name}</h4>
              <p className="text-xs text-ink-muted font-bold uppercase tracking-widest">{res.unit} • {res.type || 'Residente'}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                 <span className="text-ink-muted uppercase font-bold tracking-tighter">Contacto</span>
                 <span className="text-white font-mono">{res.contact || res.phone || '---'}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                 <span className="text-xs text-ink-muted uppercase font-bold tracking-tighter">Estado de Conta</span>
                 <span className={cn(
                    "text-sm font-mono font-bold px-3 py-1 rounded-lg",
                    (res.balance || 0) > 0 ? "bg-red-400/10 text-red-400" : "bg-green-500/10 text-green-500"
                  )}>
                    {CURRENCY_FORMAT.format(res.balance || 0)}
                  </span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResidentForHistory(res);
                  fetchResidentTransactions(res.id);
                }}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                 Histórico
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResidentForPayment(res);
                  setIsPaymentModalOpen(true);
                }}
                className="flex-1 py-3 bg-brand/10 border border-brand/20 text-brand rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand hover:text-black transition-all"
              >
                 Pagar
              </button>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!res.id) return;
                  try {
                    const resNotify = await fetch('/api/notifications/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ residentId: res.id, type: 'balance_reminder' })
                    });
                    if (resNotify.ok) {
                      window.alert(`Notificação de saldo enviada para ${res.name}`);
                    } else {
                      window.alert("Falha ao enviar notificação no servidor");
                    }
                  } catch (err) {
                    window.alert("Erro ao enviar notificação");
                  }
                }}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                 Notificar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResidentsView;
