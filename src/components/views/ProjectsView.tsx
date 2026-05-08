import React from 'react';
import { motion } from 'framer-motion';
import { Construction, Plus, Pencil, Trash2, CircleCheck } from 'lucide-react';
import { CURRENCY_FORMAT } from '../../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectsViewProps {
  projects: any[];
  setProjects: (projects: any[] | ((prev: any[]) => any[])) => void;
  setSelectedProject: (project: any) => void;
  setEditingProject: (project: any) => void;
  setIsProjectModalOpen: (open: boolean) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  setProjects,
  setSelectedProject,
  setEditingProject,
  setIsProjectModalOpen,
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Obras e Projetos</h3>
        <button
          onClick={() => {
            setEditingProject(null);
            setIsProjectModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
        >
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projects.map((proj) => (
          <div key={proj.id} className={cn(
            "glass-card p-8 flex flex-col gap-6 group hover:border-brand/30 transition-all",
            proj.status === 'Concluído' && "border-green-500/20 opacity-80"
          )}>
             <div className="flex justify-between items-start">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-xl font-bold text-white">{proj.title}</h3>
                   {proj.status === 'Concluído' && (
                     <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">Concluído</span>
                   )}
                 </div>
                 <p className="text-xs text-ink-muted">Orçamento: <span className="text-brand font-mono">{CURRENCY_FORMAT.format(proj.budget)}</span></p>
               </div>
               <div className="p-3 bg-brand/10 text-brand rounded-2xl group-hover:scale-110 transition-transform">
                 <Construction size={24} />
               </div>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-ink/60">
                  <span>Progresso Geral</span>
                  <span className={cn(proj.status === 'Concluído' ? "text-green-500" : "text-brand")}>{proj.progress}%</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${proj.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn(
                      "h-full brand-glow",
                      proj.status === 'Concluído' ? "bg-green-500" : "bg-brand"
                    )} 
                  />
               </div>
             </div>
             <div className="flex flex-wrap gap-2 py-4">
               {proj.items.map((item: string, j: number) => (
                 <span key={j} className={cn(
                   "text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full group-hover:text-ink transition-colors",
                   proj.status === 'Concluído' ? "text-green-500/70 border-green-500/20" : "text-ink-muted"
                 )}>{item}</span>
               ))}
             </div>
             <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-ink-muted">Vencimento: <span className="text-white font-mono">{proj.deadline}</span></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProject(proj);
                      setIsProjectModalOpen(true);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-ink-muted hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja eliminar o projeto "${proj.title}"?`)) {
                        setProjects(prev => prev.filter(p => p.id !== proj.id));
                      }
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-ink-muted hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => setSelectedProject(proj)}
                    className="text-brand text-xs font-bold uppercase tracking-widest hover:underline ml-2"
                  >
                    Detalhes
                  </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="py-20 text-center glass-card border-dashed">
          <Construction size={48} className="mx-auto text-brand/20 mb-4" />
          <p className="text-ink-muted italic">Nenhum projeto registado.</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProjectsView;
