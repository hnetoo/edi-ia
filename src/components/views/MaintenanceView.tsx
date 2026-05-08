import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  Download, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { generatePDF } from '../../lib/pdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MaintenanceViewProps {
  maintenanceTickets: any[];
  maintenanceFilter: string;
  setMaintenanceFilter: (filter: string) => void;
  setIsTicketModalOpen: (open: boolean) => void;
  setSelectedTicket: (ticket: any) => void;
  generatePDF: (options: any) => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenanceTickets,
  maintenanceFilter,
  setMaintenanceFilter,
  setIsTicketModalOpen,
  setSelectedTicket,
  generatePDF
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          {['Pendente', 'Em Curso', 'Todos', 'Concluídos'].map((f) => (
            <button 
              key={f}
              onClick={() => setMaintenanceFilter(f === 'Concluídos' ? 'Concluído' : f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                maintenanceFilter === (f === 'Concluídos' ? 'Concluído' : f) ? "border border-brand text-brand" : "text-ink-muted hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              generatePDF({
                title: 'Tickets de Manutenção',
                subtitle: `Filtro: ${maintenanceFilter}`,
                columns: ['Título', 'Estado', 'Tipo', 'Prioridade', 'Data'],
                rows: maintenanceTickets
                  .filter(t => maintenanceFilter === 'Todos' || t.status === maintenanceFilter)
                  .map(t => [t.title, t.status, t.type, t.priority, t.date]),
                filename: 'tickets_manutencao',
                metadata: {
                  count: maintenanceTickets.filter(t => maintenanceFilter === 'Todos' || t.status === maintenanceFilter).length,
                  period: new Date().toLocaleDateString('pt-PT')
                }
              });
            }}
            className="flex items-center gap-2 px-6 py-2 border border-white/10 rounded-xl text-ink-muted text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all shadow-lg"
          >
            <Download size={16} /> Exportar PDF
          </button>
          <button 
            onClick={() => setIsTicketModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
          >
            <Wrench size={16} /> Abrir Ticket
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {maintenanceTickets
          .filter(t => maintenanceFilter === 'Todos' || t.status === maintenanceFilter)
          .map((task, i) => (
          <div key={i} className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-brand/20">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border",
                task.priority === 'Crítica' ? "border-red-500/30 bg-red-500/10 text-red-500" :
                task.priority === 'Alta' ? "border-orange-500/30 bg-orange-500/10 text-orange-500" : "border-brand/30 bg-brand/10 text-brand"
              )}>
                <Wrench size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">{task.title}</h4>
                <div className="flex gap-4">
                  <span className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">{task.type}</span>
                  <span className="text-[10px] text-ink-muted flex items-center gap-1"><Clock size={10} /> {task.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                 <p className="text-[10px] text-ink-muted uppercase font-bold tracking-widest mb-1">Prioridade</p>
                 <span className={cn(
                   "text-xs font-bold",
                   task.priority === 'Crítica' ? "text-red-500" : 
                   task.priority === 'Alta' ? "text-orange-500" : "text-brand"
                 )}>{task.priority}</span>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-ink-muted uppercase font-bold tracking-widest mb-1">Estado</p>
                 <span className={cn(
                   "text-xs font-bold",
                   task.status === 'Concluído' ? "text-green-400" : "text-white"
                 )}>{task.status}</span>
              </div>
              <button 
                onClick={() => setSelectedTicket(task)}
                className="p-3 bg-white/5 rounded-xl hover:bg-brand/10 hover:text-brand transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ))}
        {(maintenanceFilter !== 'Todos' ? maintenanceTickets.filter(t => t.status === maintenanceFilter) : maintenanceTickets).length === 0 && (
          <div className="py-20 text-center glass-card border-dashed">
            <Wrench size={48} className="mx-auto text-brand/20 mb-4" />
            <p className="text-ink-muted italic">Nenhum ticket encontrado para este filtro.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MaintenanceView;
