import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  FileText, 
  CircleCheck, 
  AlertTriangle, 
  ChevronRight, 
  Search, 
  Filter, 
  Download, 
  Users, 
  Clock 
} from 'lucide-react';
import { CURRENCY_FORMAT } from '../../constants';
import { generateFinancialPDF } from '../../lib/pdf';
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

interface ReportsViewProps {
  allTransactions: any[];
  residents: any[];
  reportSubView: string;
  setReportSubView: (view: string) => void;
  transactionFilters: any;
  setTransactionFilters: React.Dispatch<React.SetStateAction<any>>;
  generatePDF: (options: any) => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({
  allTransactions,
  residents,
  reportSubView,
  setReportSubView,
  transactionFilters,
  setTransactionFilters,
  generatePDF
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {reportSubView === 'selection' ? (
        <>
          {/* Report Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'cashflow', title: 'Fluxo de Caixa', desc: 'Resumo de entradas e saídas mensais', icon: Wallet },
              { id: 'expenses', title: 'Relatório de Despesas', desc: 'Detalhamento de custos operacionais', icon: FileText },
              { id: 'payments', title: 'Histórico de Pagamentos', desc: 'Registo detalhado de taxas e despesas por morador', icon: CircleCheck },
              { id: 'delinquency', title: 'Inadimplência', desc: 'Lista de moradores com pagamentos em atraso', icon: AlertTriangle },
            ].map((report, i) => (
              <div 
                key={i} 
                onClick={() => {
                  if (report.id === 'payments') setReportSubView('payments');
                  else if (report.id === 'delinquency') setReportSubView('delinquency');
                  else if (report.id === 'cashflow') {
                    generateFinancialPDF({
                      title: 'Fluxo de Caixa',
                      transactions: allTransactions,
                      type: 'all'
                    });
                  } else if (report.id === 'expenses') {
                    generateFinancialPDF({
                      title: 'Relatório de Despesas',
                      transactions: allTransactions.filter(t => t.type !== 'Pagamento'),
                      type: 'expense'
                    });
                  }
                }}
                className="glass-card p-6 border-brand/10 hover:border-brand/40 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                  <report.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{report.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-6">{report.desc}</p>
                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand hover:gap-3 transition-all">
                  {['payments', 'delinquency'].includes(report.id) ? 'Abrir Relatório' : 'Gerar PDF'} <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Recent Transactions / Report Data */}
          <div className="glass-card p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Extrato Detalhado</h3>
                <p className="text-sm text-ink-muted">Últimas transações registadas no sistema</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand/50 w-full"
                  />
                </div>
                <button className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-ink-muted transition-colors">
                  <Filter size={20} />
                </button>
                <button 
                  onClick={() => {
                    generateFinancialPDF({
                      title: 'Extrato Detalhado',
                      transactions: allTransactions,
                      type: 'all'
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                >
                  <Download size={16} /> Exportar PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-ink-muted uppercase tracking-widest font-bold">
                    <th className="pb-4 font-bold">Data</th>
                    <th className="pb-4 font-bold">Descrição</th>
                    <th className="pb-4 font-bold">Categoria</th>
                    <th className="pb-4 font-bold text-right">Valor (AOA)</th>
                    <th className="pb-4 font-bold text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allTransactions.map((row, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-xs font-mono text-ink-muted">{row.date}</td>
                      <td className="py-4 text-sm text-white font-medium">{row.description}</td>
                      <td className="py-4">
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-ink-muted uppercase font-bold tracking-tighter">
                          {row.resident_name ? `Morador (${row.unit})` : row.type}
                        </span>
                      </td>
                      <td className={cn(
                        "py-4 text-sm font-mono font-bold text-right",
                        row.type === 'Pagamento' ? 'text-brand' : 'text-red-400'
                      )}>
                        {row.type === 'Pagamento' ? '+' : '-'}{CURRENCY_FORMAT.format(row.amount)}
                      </td>
                      <td className="py-4 text-right">
                        <div className={cn(
                          "w-2 h-2 rounded-full ml-auto",
                          row.status === 'Pago' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-orange-400 shadow-[0_0_8px_#fb923c]"
                        )} />
                      </td>
                    </tr>
                  ))}
                  {allTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-muted italic">Nenhum registo financeiro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : reportSubView === 'payments' ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setReportSubView('selection')}
              className="p-2 hover:bg-white/5 rounded-xl text-brand group"
            >
              <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Histórico de Pagamentos</h3>
              <p className="text-sm text-ink-muted">Relatório detalhado por unidade e período</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 space-y-6 h-fit lg:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand">Filtros</h4>
              <div className="space-y-2">
                <label className="text-[10px] text-ink-muted uppercase font-bold">Unidade</label>
                <select 
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand/50 outline-none appearance-none"
                >
                  <option value="">Todas as Unidades</option>
                  {[...new Set(residents.map(r => r.unit))].sort().map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-ink-muted uppercase font-bold">Data Início</label>
                <input 
                  type="date" 
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand/50 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-ink-muted uppercase font-bold">Data Fim</label>
                <input 
                  type="date" 
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand/50 outline-none" 
                />
              </div>
              <button 
                onClick={() => setTransactionFilters({ type: '', startDate: '', endDate: '', unit: '' })}
                className="w-full py-3 bg-brand/10 text-brand border border-brand/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand hover:text-black transition-all"
              >
                Limpar Filtros
              </button>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="glass-card p-8">
                 <div className="flex justify-between items-center mb-8">
                    <span className="text-xs text-ink-muted font-bold uppercase tracking-widest">Registos Filtrados</span>
                    <button 
                      onClick={() => {
                        const filtered = allTransactions.filter(t => {
                          const matchUnit = !transactionFilters.unit || t.unit === transactionFilters.unit;
                          const matchStart = !transactionFilters.startDate || t.date >= transactionFilters.startDate;
                          const matchEnd = !transactionFilters.endDate || t.date <= transactionFilters.endDate;
                          return t.type === 'Pagamento' && matchUnit && matchStart && matchEnd;
                        });
                        generatePDF({
                          title: 'Histórico de Pagamentos',
                          subtitle: `Unidade: ${transactionFilters.unit || 'Todas'} | Período: ${transactionFilters.startDate || 'Início'} até ${transactionFilters.endDate || 'Fim'}`,
                          columns: ['Morador', 'Unidade', 'Data', 'Valor'],
                          rows: filtered.map(t => [t.resident_name || '', t.unit || '', t.date, CURRENCY_FORMAT.format(t.amount)]),
                          filename: `pagamentos_${transactionFilters.unit || 'todos'}`,
                          metadata: {
                            total: CURRENCY_FORMAT.format(filtered.reduce((sum, t) => sum + t.amount, 0)),
                            count: filtered.length,
                            period: `${transactionFilters.startDate || 'Início'} até ${transactionFilters.endDate || 'Fim'}`
                          }
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                    >
                       <Download size={16} /> Exportar PDF
                    </button>
                 </div>
                 <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-ink-muted uppercase tracking-widest font-bold">
                        <th className="pb-4">Morador</th>
                        <th className="pb-4 text-center">Unidade</th>
                        <th className="pb-4">Data</th>
                        <th className="pb-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allTransactions
                        .filter(t => {
                          const matchUnit = !transactionFilters.unit || t.unit === transactionFilters.unit;
                          const matchStart = !transactionFilters.startDate || t.date >= transactionFilters.startDate;
                          const matchEnd = !transactionFilters.endDate || t.date <= transactionFilters.endDate;
                          return t.type === 'Pagamento' && matchUnit && matchStart && matchEnd;
                        })
                        .map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-4 text-sm font-medium text-white">{row.resident_name}</td>
                          <td className="py-4 text-center text-xs font-mono text-brand font-bold">{row.unit}</td>
                          <td className="py-4 text-xs text-brand/60 font-mono">{row.date}</td>
                          <td className="py-4 text-right text-sm font-mono font-bold text-white">{CURRENCY_FORMAT.format(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : reportSubView === 'delinquency' ? (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setReportSubView('selection')} className="p-2 hover:bg-white/5 rounded-xl text-brand group">
              <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            </button>
            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Relatório de Inadimplência</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
              label="Total em Dívida" 
              value={CURRENCY_FORMAT.format(residents.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0))} 
              icon={AlertTriangle} 
            />
            <MetricCard 
              label="Moradores Inadimplentes" 
              value={residents.filter(r => r.balance > 0).length.toString()} 
              icon={Users} 
            />
            <MetricCard 
              label="Média de Atraso" 
              value="42 dias" 
              icon={Clock} 
            />
          </div>

          <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
                  <Download size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold">Exportar Dados</h4>
                  <p className="text-xs text-ink-muted">Gerar relatório de inadimplência em PDF</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const data = residents
                    .filter(r => r.balance > 0)
                    .map(res => {
                      const pendingTxs = allTransactions.filter(t => t.resident_id === res.id && t.status === 'Pendente');
                      const oldestTx = pendingTxs.sort((a, b) => a.date.localeCompare(b.date))[0];
                      const oldestDate = oldestTx ? oldestTx.date : 'N/D';
                      let days = 0;
                      if (oldestTx) {
                        days = Math.ceil(Math.abs(new Date().getTime() - new Date(oldestTx.date).getTime()) / (1000 * 3600 * 24));
                      }
                      return { ...res, oldestDate, days };
                    })
                    .sort((a, b) => b.days - a.days);

                  generatePDF({
                    title: 'Relatório de Inadimplência',
                    columns: ['Morador', 'Unidade', 'Dívida Total', 'Vencimento mais Antigo', 'Atraso (Dias)'],
                    rows: data.map(r => [r.name, r.unit, CURRENCY_FORMAT.format(r.balance), r.oldestDate, `${r.days} dias`]),
                    filename: 'relatorio_inadimplencia',
                    metadata: {
                      total: CURRENCY_FORMAT.format(data.reduce((sum, r) => sum + r.balance, 0)),
                      count: data.length,
                      period: new Date().toLocaleDateString('pt-PT')
                    }
                  });
                }}
                className="px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
              >
                <Download size={16} /> Descarregar PDF
              </button>
          </div>

          <div className="glass-card p-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-ink-muted uppercase tracking-widest font-bold">
                    <th className="pb-4">Morador</th>
                    <th className="pb-4">Unidade</th>
                    <th className="pb-4 text-right">Dívida Total</th>
                    <th className="pb-4 text-center">Vencimento Mais Antigo</th>
                    <th className="pb-4 text-right">Atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {residents
                    .filter(r => r.balance > 0)
                    .map(res => {
                      const pendingTxs = allTransactions.filter(t => t.resident_id === res.id && t.status === 'Pendente');
                      const oldestTx = pendingTxs.sort((a, b) => a.date.localeCompare(b.date))[0];
                      const oldestDate = oldestTx ? oldestTx.date : 'N/D';
                      let days = 0;
                      if (oldestTx) {
                        days = Math.ceil(Math.abs(new Date().getTime() - new Date(oldestTx.date).getTime()) / (1000 * 3600 * 24));
                      }
                      return { ...res, oldestDate, days };
                    })
                    .sort((a, b) => b.days - a.days)
                    .map((res, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <span className="text-sm font-medium text-white">{res.name}</span>
                        </td>
                        <td className="py-4 text-center text-xs font-mono text-brand font-bold">{res.unit}</td>
                        <td className="py-4 text-right text-sm font-mono font-bold text-red-500">
                          {CURRENCY_FORMAT.format(res.balance)}
                        </td>
                        <td className="py-4 text-center text-xs text-ink-muted font-mono">{res.oldestDate}</td>
                        <td className="py-4 text-right">
                          <span className={cn(
                            "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                            res.days > 60 ? "bg-red-500 text-white" : 
                            res.days > 30 ? "bg-orange-500/20 text-orange-400" : 
                            "bg-yellow-500/20 text-yellow-500"
                          )}>
                            {res.days} dias
                          </span>
                        </td>
                      </tr>
                    ))}
                  {residents.filter(r => r.balance > 0).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-muted italic">Nenhuma inadimplência registada no momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default ReportsView;
