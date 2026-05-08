import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart as LucidePieChart, 
  Download, 
  Plus, 
  Wallet, 
  AlertTriangle, 
  Clock, 
  Pencil 
} from 'lucide-react';
import { 
  BarChart, 
  XAxis, 
  Tooltip, 
  Bar, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { CURRENCY_FORMAT } from '../../constants';
import { generateFinancialPDF } from '../../lib/pdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FinanceViewProps {
  allTransactions: any[];
  fixedExpenses: any[];
  extraFees: any[];
  setTransactionType: (type: string) => void;
  setIsTransactionModalOpen: (open: boolean) => void;
  setEditingFixedExpense: (expense: any) => void;
  setIsFixedExpenseModalOpen: (open: boolean) => void;
  setIsExtraFeeModalOpen: (open: boolean) => void;
  generatePDF: (options: any) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({
  allTransactions,
  fixedExpenses,
  extraFees,
  setTransactionType,
  setIsTransactionModalOpen,
  setEditingFixedExpense,
  setIsFixedExpenseModalOpen,
  setIsExtraFeeModalOpen,
  generatePDF
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      {/* Finance Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-white font-bold tracking-tight">Fluxo de Caixa (Entradas vs Saídas)</h4>
              <p className="text-[10px] text-ink-muted uppercase">Análise de movimentos mensais</p>
            </div>
            <TrendingUp size={20} className="text-brand" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Jan', in: 1200000, out: 850000 },
                { name: 'Fev', in: 1300000, out: 900000 },
                { name: 'Mar', in: 1100000, out: 1200000 },
                { name: 'Abr', in: 1450000, out: 950000 },
                { name: 'Mai', in: 1600000, out: 1100000 },
              ]}>
                <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Bar dataKey="in" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="out" fill="#F87171" radius={[4, 4, 0, 0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-white font-bold tracking-tight">Distribuição de Despesas</h4>
              <p className="text-[10px] text-ink-muted uppercase">Por categoria principal</p>
            </div>
            <LucidePieChart size={20} className="text-brand" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Energia', value: 450000, color: '#D4AF37' },
                    { name: 'Manutenção', value: 300000, color: '#3b82f6' },
                    { name: 'Salários', value: 600000, color: '#10b981' },
                    { name: 'Segurança', value: 250000, color: '#f59e0b' },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Energia', value: 450000, color: '#D4AF37' },
                    { name: 'Manutenção', value: 300000, color: '#3b82f6' },
                    { name: 'Salários', value: 600000, color: '#10b981' },
                    { name: 'Segurança', value: 250000, color: '#f59e0b' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Gestão de Tesouraria</h3>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  console.log('PDF button clicked in FinanceView');
                  console.log('allTransactions:', allTransactions);
                  setIsGeneratingPDF(true);
                  try {
                    await generateFinancialPDF({
                      title: 'Movimentação de Tesouraria',
                      transactions: allTransactions,
                      type: 'all'
                    });
                  } catch (error) {
                    console.error('Error in PDF button click:', error);
                    alert('Erro ao gerar PDF');
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
                disabled={isGeneratingPDF}
                className={`p-2 border rounded-xl transition-all flex items-center justify-center ${
                  isGeneratingPDF 
                    ? 'bg-brand/20 border-brand/30 text-brand animate-pulse' 
                    : 'bg-white/5 border-white/10 text-ink-muted hover:bg-white/10'
                }`}
                title={isGeneratingPDF ? 'Gerando PDF...' : 'Exportar PDF'}
              >
                {isGeneratingPDF ? (
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download size={16} />
                )}
              </button>
              <button 
                onClick={() => {
                  setTransactionType('Pagamento');
                  setIsTransactionModalOpen(true);
                }}
                className="px-4 py-2 bg-brand/10 text-brand rounded-xl text-xs font-bold uppercase tracking-widest border border-brand/20 hover:bg-brand hover:text-black transition-all"
              >
                Nova Receita
              </button>
              <button 
                onClick={() => {
                  setTransactionType('Despesa');
                  setIsTransactionModalOpen(true);
                }}
                className="px-4 py-2 bg-red-400/10 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-400/20 hover:bg-red-400 hover:text-white transition-all"
              >
                Nova Despesa
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {allTransactions.slice(0, 8).map((t, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", t.type === 'Pagamento' ? "bg-brand/10 text-brand" : "bg-red-400/10 text-red-400")}>
                    {t.type === 'Pagamento' ? <Wallet size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.description}</p>
                    <p className="text-[10px] text-ink-muted uppercase font-bold">{t.resident_name ? `${t.resident_name} (${t.unit})` : 'Operação Geral'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-mono font-bold", t.type === 'Pagamento' ? "text-brand" : "text-red-400")}>
                    {t.type === 'Pagamento' ? '+' : '-'}{CURRENCY_FORMAT.format(t.amount)}
                  </p>
                  <p className="text-[9px] text-ink-muted font-mono">{t.date}</p>
                </div>
              </div>
            ))}
            {allTransactions.length === 0 && (
              <p className="text-center py-10 text-ink-muted text-xs italic">Nenhum movimento registado.</p>
            )}
          </div>
        </div>

        {/* Fixed Expenses Section */}
        <div className="lg:col-span-1 glass-card p-8 border-brand/10">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-brand" size={20} />
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Despesas Fixas</h3>
          </div>
          
          <button 
            onClick={() => {
              setEditingFixedExpense(null);
              setIsFixedExpenseModalOpen(true);
            }}
            className="w-full mb-3 py-3 border border-brand/20 text-brand bg-brand/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Nova Despesa Fixa
          </button>

          <button 
            onClick={() => setIsExtraFeeModalOpen(true)}
            className="w-full mb-6 py-3 border border-white/10 text-white hover:border-brand/40 hover:text-brand transition-all rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Nova Taxa Extra
          </button>

          <div className="space-y-4">
            {fixedExpenses.length === 0 && extraFees.length === 0 && (
              <p className="text-[10px] text-ink-muted text-center py-4 italic">Nenhum registo financeiro encontrado.</p>
            )}
            {fixedExpenses.map((fixed, i) => (
              <div key={i} className="group p-3 bg-white/5 border border-white/5 rounded-xl hover:border-brand/30 transition-all relative">
                <div className="flex justify-between items-start mb-1 pr-8">
                  <span className="text-sm font-medium text-white">{fixed.description}</span>
                  <span className="text-xs font-mono text-brand font-bold">{CURRENCY_FORMAT.format(fixed.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-ink-muted uppercase tracking-widest font-bold">Fixa • Vencimento: {fixed.due_date}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                </div>
                <button 
                  onClick={() => {
                    setEditingFixedExpense(fixed);
                    setIsFixedExpenseModalOpen(true);
                  }}
                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-brand hover:text-black rounded-lg transition-all"
                >
                  <Pencil size={12} />
                </button>
              </div>
            ))}
            {extraFees.map((fee, i) => (
              <div key={i} className="group p-3 bg-brand/5 border border-brand/20 rounded-xl hover:border-brand/40 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-white">{fee.description}</span>
                  <span className="text-xs font-mono text-brand font-bold">{CURRENCY_FORMAT.format(fee.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-ink-muted uppercase tracking-widest font-bold">Extra ({fee.unit}) • Vencimento: {fee.due_date}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                </div>
              </div>
            ))}
            
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-ink-muted font-bold uppercase">Total Mensal Previsto</span>
              <span className="text-lg font-mono font-bold text-white tracking-tighter">
                {CURRENCY_FORMAT.format(
                  (fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0) || 870000) + 
                  extraFees.reduce((acc, curr) => acc + curr.amount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FinanceView;
