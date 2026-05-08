import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CircleCheck, 
  Clock, 
  Download, 
  TrendingUp, 
  Settings, 
  Trash2 
} from 'lucide-react';
import { CURRENCY_FORMAT } from '../../constants';
import { generatePDF } from '../../lib/pdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MetricCard = ({ label, value, trend, icon: Icon }: { label: string, value: string, trend?: string, icon: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 flex flex-col gap-4 group hover:border-brand/30 transition-all border-white/5"
  >
    <div className="flex justify-between items-start">
      <div className="p-3 bg-brand/10 rounded-2xl group-hover:bg-brand/20 transition-colors">
        <Icon className="text-brand" size={24} />
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full",
          trend.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-white mt-1 group-hover:text-brand transition-colors">{value}</p>
    </div>
  </motion.div>
);

interface StaffViewProps {
  employees: any[];
  vacations: any[];
  payroll: any[];
  hrActiveView: 'funcionarios' | 'ferias' | 'folha';
  setHrActiveView: (view: 'funcionarios' | 'ferias' | 'folha') => void;
  setEditingEmployee: (employee: any) => void;
  setIsEmployeeModalOpen: (open: boolean) => void;
  fetchEmployees: () => void;
  setIsVacationModalOpen: (open: boolean) => void;
  setIsPayrollModalOpen: (open: boolean) => void;
  generatePDF: (options: any) => void;
}

const StaffView: React.FC<StaffViewProps> = ({
  employees,
  vacations,
  payroll,
  hrActiveView,
  setHrActiveView,
  setEditingEmployee,
  setIsEmployeeModalOpen,
  fetchEmployees,
  setIsVacationModalOpen,
  setIsPayrollModalOpen,
  generatePDF
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Custo Mensal Staff" value={CURRENCY_FORMAT.format(employees.reduce((acc, e) => acc + (e.salary || 0), 0))} icon={Users} />
        <MetricCard label="Funcionários Ativos" value={`${employees.filter(e => e.status === 'Ativo').length}/${employees.length}`} icon={CircleCheck} />
        <MetricCard label="Férias Atuais" value={`${vacations.filter(v => {
          const now = new Date();
          return new Date(v.start_date) <= now && new Date(v.end_date) >= now;
        }).length} Colaboradores`} icon={Clock} />
      </div>

      <div className="flex bg-white/5 p-1 rounded-2xl w-fit mb-8">
        {(['funcionarios', 'ferias', 'folha'] as const).map((v) => (
          <button 
            key={v}
            onClick={() => setHrActiveView(v)}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              hrActiveView === v ? "bg-brand text-black shadow-lg" : "text-ink-muted hover:text-white"
            )}
          >
            {v === 'funcionarios' ? 'Funcionários' : v === 'ferias' ? 'Gestão de Férias' : 'Folha Salarial'}
          </button>
        ))}
      </div>

      {hrActiveView === 'funcionarios' && (
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Quadro de Pessoal</h3>
            <button 
              onClick={() => {
                setEditingEmployee(null);
                setIsEmployeeModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Users size={16} /> Novo Funcionário
            </button>
          </div>
          <div className="space-y-4">
            {employees.map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-brand/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-lighter flex items-center justify-center font-bold text-brand border border-white/5">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{staff.name}</h4>
                    <p className="text-[10px] text-ink-muted uppercase tracking-widest font-bold">{staff.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-ink-muted font-bold uppercase tracking-tighter">Vencimento Base</p>
                    <p className="text-sm font-mono text-white">{CURRENCY_FORMAT.format(staff.salary)}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                    staff.status === 'Ativo' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                  )}>
                    {staff.status}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingEmployee(staff);
                        setIsEmployeeModalOpen(true);
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg text-ink-muted hover:text-white transition-colors"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm(`Tem certeza que deseja eliminar ${staff.name}?`)) {
                          await fetch(`/api/employees/${staff.id}`, { method: 'DELETE' });
                          fetchEmployees();
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-ink-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="py-20 text-center glass-card border-dashed">
                <Users size={48} className="mx-auto text-brand/20 mb-4" />
                <p className="text-ink-muted italic">Nenhum funcionário registado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hrActiveView === 'ferias' && (
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Cronograma de Férias</h3>
            <button 
              onClick={() => {
                fetchEmployees();
                setIsVacationModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Clock size={16} /> Agendar Férias
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {vacations.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-brand/20 transition-all">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-brand/5 text-brand rounded-xl">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{v.employee_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Período:</span>
                      <span className="text-xs text-white font-mono">{v.start_date} até {v.end_date}</span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest",
                  new Date(v.end_date) < new Date() ? "bg-white/5 text-ink-muted" : "bg-brand/10 text-brand"
                )}>
                  {new Date(v.end_date) < new Date() ? 'Concluído' : 'Agendado'}
                </div>
              </div>
            ))}
            {vacations.length === 0 && (
              <div className="py-20 text-center glass-card border-dashed">
                <Clock size={48} className="mx-auto text-brand/20 mb-4" />
                <p className="text-ink-muted italic">Nenhum período de férias agendado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hrActiveView === 'folha' && (
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Folha de Pagamentos</h3>
            <div className="flex gap-4">
              <button 
                onClick={async () => {
                  console.log('PDF button clicked in StaffView - Payroll');
                  console.log('payroll:', payroll);
                  setIsGeneratingPDF(true);
                  try {
                    await generatePDF({
                      title: 'Folha Salarial Consolidada',
                      columns: ['Nome', 'Cargo', 'Base', 'Bónus', 'Deduções', 'Líquido'],
                      rows: payroll.map(p => [
                        p.employee_name, 
                        p.position, 
                        CURRENCY_FORMAT.format(p.base_salary), 
                        CURRENCY_FORMAT.format(p.bonus), 
                        CURRENCY_FORMAT.format(p.deductions), 
                        CURRENCY_FORMAT.format(p.net_salary)
                      ]),
                      filename: 'folha_salarial',
                      metadata: {
                        total: CURRENCY_FORMAT.format(payroll.reduce((sum, p) => sum + p.net_salary, 0)),
                        count: payroll.length,
                        period: `${new Date().toLocaleDateString('pt-PT')}`
                      }
                    });
                  } catch (error) {
                    console.error('Error in StaffView PDF button:', error);
                    alert('Erro ao gerar PDF da folha salarial');
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
                disabled={isGeneratingPDF}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isGeneratingPDF 
                    ? 'bg-brand/20 border-brand/30 text-brand animate-pulse' 
                    : 'border border-white/10 text-ink-muted hover:text-white'
                }`}
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Exportar PDF
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  fetchEmployees();
                  setIsPayrollModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
              >
                <TrendingUp size={16} /> Gerar Pagamento
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/5">
                  <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Colaborador</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Mês/Ano</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Vencimento Líquido</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Data Pagamento</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payroll.map((p, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <p className="text-sm font-bold text-white">{p.employee_name}</p>
                      <p className="text-[10px] text-ink-muted uppercase">{p.position}</p>
                    </td>
                    <td className="py-4 text-xs text-white font-medium">{p.month} {p.year}</td>
                    <td className="py-4">
                      <span className="text-sm font-mono font-bold text-brand">{CURRENCY_FORMAT.format(p.net_salary)}</span>
                    </td>
                    <td className="py-4 text-xs text-ink-muted font-mono">{p.payment_date}</td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => {
                          console.log('Receipt button clicked for:', p);
                          try {
                            generatePDF({
                              title: `Recibo de Vencimento - ${p.employee_name}`,
                              subtitle: `Período: ${p.month} ${p.year}`,
                              columns: ['Descrição', 'Valor'],
                              rows: [
                                ['Vencimento Base', CURRENCY_FORMAT.format(p.base_salary)],
                                ['Bónus/Subsídios', CURRENCY_FORMAT.format(p.bonus)],
                                ['Deduções/Impostos', CURRENCY_FORMAT.format(p.deductions)],
                                ['Total Líquido', CURRENCY_FORMAT.format(p.net_salary)],
                                ['Data de Pagamento', p.payment_date]
                              ],
                              filename: `recibo_${p.employee_name}_${p.month}_${p.year}`,
                              metadata: {
                                total: CURRENCY_FORMAT.format(p.net_salary),
                                period: `${p.month} ${p.year}`
                              }
                            });
                          } catch (error) {
                            console.error('Error in receipt button:', error);
                            alert('Erro ao gerar recibo');
                          }
                        }}
                        className="text-brand text-[10px] font-bold uppercase tracking-widest hover:underline"
                      >
                        Ver Recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payroll.length === 0 && (
              <div className="py-20 text-center">
                <TrendingUp size={48} className="mx-auto text-brand/20 mb-4" />
                <p className="text-ink-muted italic">Nenhum registo salarial encontrado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StaffView;
