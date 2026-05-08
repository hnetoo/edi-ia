import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Users, 
  AlertTriangle, 
  CircleCheck, 
  Construction, 
  Bot, 
  TrendingUp, 
  Zap, 
  ChevronRight, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CURRENCY_FORMAT, MOCK_STATS, MOCK_HISTORY, MOCK_DEBT_HISTORY } from '../../constants';
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

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  residents: any[];
  maintenanceTickets: any[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, residents, maintenanceTickets }) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Valor em Caixa" 
          value={CURRENCY_FORMAT.format(MOCK_STATS.cashInHand)} 
          trend="+12%" 
          icon={Wallet} 
        />
        <MetricCard 
          label="Despesas com Staff" 
          value={CURRENCY_FORMAT.format(MOCK_STATS.staffExpenses)} 
          icon={Users} 
        />
        <MetricCard 
          label="Taxa Inadimplência" 
          value={`${MOCK_STATS.delinquencyRate}%`} 
          trend="-2%" 
          icon={AlertTriangle} 
        />
        <MetricCard 
          label="Funcionários Ativos" 
          value={`${MOCK_STATS.activeEmployees}/${MOCK_STATS.totalEmployees}`} 
          icon={CircleCheck} 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Ciclo Financeiro</h3>
              <p className="text-sm text-ink-muted">Comparativo Receita vs Despesa (AOA)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand rounded-full" />
                <span className="text-xs text-ink-muted">Receita</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand/30 rounded-full" />
                <span className="text-xs text-ink-muted">Despesa</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_HISTORY}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  tickFormatter={(value) => `${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#15161C', 
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '12px',
                    color: '#F5F2ED'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expense" stroke="rgba(212,175,55,0.1)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Controlo de Moradores</h3>
          <div className="space-y-6 flex-grow">
             {residents && residents.length > 0 ? (
               residents.slice(0, 4).map((resident, i) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className="flex gap-3 items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px]",
                        resident.balance > 0 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                      )}>
                        {resident.name ? resident.name.split(' ').map(n=>n[0]).join('') : 'M'}
                      </div>
                      <div>
                         <p className="text-sm font-semibold text-white">{resident.name || 'Morador Sem Nome'}</p>
                         <p className="text-[10px] text-ink-muted uppercase">{resident.unit || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs font-mono font-bold",
                        resident.balance > 0 ? "text-red-400" : "text-green-400"
                      )}>
                        {resident.balance === 0 ? 'Regular' : CURRENCY_FORMAT.format(resident.balance)}
                      </p>
                    </div>
                 </div>
               ))
             ) : (
               <div className="text-center py-8">
                 <Users size={32} className="mx-auto text-ink-muted/30 mb-3" />
                 <p className="text-sm text-ink-muted">Nenhum morador registado</p>
                 <p className="text-xs text-ink-muted/60 mt-1">Adicione moradores para ver o controlo aqui</p>
               </div>
             )}
          </div>
          <button 
            onClick={() => setActiveTab('residents')}
            className="mt-8 w-full py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
          >
            Ver Todos os Moradores
          </button>
        </div>

        {/* New Debt Evolution Chart */}
        <div className="lg:col-span-3 glass-card p-8 mt-4">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Evolução do Saldo Devedor Médio</h3>
                <p className="text-sm text-ink-muted">Média por morador nos últimos 6 meses (AOA)</p>
              </div>
              <AlertTriangle className="text-brand opacity-30" size={24} />
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={MOCK_DEBT_HISTORY}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                 <XAxis 
                   dataKey="month" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94A3B8', fontSize: 12 }}
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94A3B8', fontSize: 10 }}
                   tickFormatter={(value) => `${value/1000}k`}
                 />
                 <Tooltip 
                   cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                   contentStyle={{ 
                     backgroundColor: '#15161C', 
                     border: '1px solid rgba(212,175,55,0.2)',
                     borderRadius: '12px',
                     color: '#F5F2ED'
                   }}
                   formatter={(value: number) => [CURRENCY_FORMAT.format(value), 'Dívida Média']}
                 />
                 <Bar 
                    dataKey="avgDebt" 
                    fill="#D4AF37" 
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Bottom Row: AI & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Construction className="text-brand" size={24} />
              <h3 className="text-xl font-bold text-white">Estado das Obras</h3>
            </div>
            <div className="space-y-4">
               {maintenanceTickets && maintenanceTickets.length > 0 ? (
                 maintenanceTickets.slice(0, 3).map((ticket, i) => (
                   <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex justify-between mb-2">
                         <span className="text-sm font-semibold">{ticket.title || 'Sem Título'}</span>
                         <span className={`text-xs px-2 py-1 rounded ${
                           ticket.status === 'Concluído' ? 'bg-green-500/10 text-green-500' :
                           ticket.status === 'Em Curso' ? 'bg-brand/10 text-brand' :
                           'bg-orange-500/10 text-orange-500'
                         }`}>
                           {ticket.status || 'Pendente'}
                         </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-ink-muted">
                         <span>{ticket.type || 'Geral'}</span>
                         <span>{ticket.priority || 'Normal'}</span>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-8">
                   <Construction size={32} className="mx-auto text-ink-muted/30 mb-3" />
                   <p className="text-sm text-ink-muted">Nenhuma obra em andamento</p>
                   <p className="text-xs text-ink-muted/60 mt-1">Crie tickets de manutenção para acompanhar</p>
                 </div>
               )}
            </div>
         </div>

         <div className="glass-card p-8 bg-brand/5 border-brand/20 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 bg-brand/20 blur-2xl w-64 h-64 rounded-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity" />
            
            <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                    <Bot size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-none">Previsões Inteligentes IA</h3>
                    <p className="text-[10px] text-ink-muted uppercase font-bold tracking-tighter mt-1">Análise preditiva baseada no histórico</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-surface-dark border border-white/5 rounded-2xl hover:border-brand/30 transition-all group/card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[9px] text-ink-muted uppercase font-bold tracking-widest mb-1">Análise de Dados</p>
                        <p className="text-xl font-bold text-brand">
                          {residents && residents.length > 0 ? `${residents.length} moradores` : 'Sem dados'}
                          <span className="text-[10px] text-ink-muted font-normal ml-1">registados</span>
                        </p>
                      </div>
                      <TrendingUp size={16} className="text-brand opacity-50" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-ink-muted">Moradores Ativos</span>
                        <span className="text-white font-bold">{residents ? residents.length : 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-ink-muted">Tickets Abertos</span>
                        <span className="text-white font-bold">{maintenanceTickets ? maintenanceTickets.filter(t => t.status !== 'Concluído').length : 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-ink-muted">Sistema Operacional</span>
                        <span className="text-green-400 font-bold">100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-surface-dark border border-white/5 rounded-2xl flex flex-col justify-between group/alerts">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[9px] text-ink-muted uppercase font-bold tracking-widest">Status do Sistema</p>
                        {maintenanceTickets && maintenanceTickets.filter(t => t.priority === 'Alta' && t.status !== 'Concluído').length > 0 && (
                          <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-ping" />
                        )}
                      </div>
                      <div className="space-y-4">
                        {maintenanceTickets && maintenanceTickets.filter(t => t.priority === 'Alta' && t.status !== 'Concluído').length > 0 ? (
                          maintenanceTickets
                            .filter(t => t.priority === 'Alta' && t.status !== 'Concluído')
                            .slice(0, 2)
                            .map((alert, i) => (
                              <div 
                                key={i} 
                                className="flex justify-between items-center group/item cursor-pointer" 
                                onClick={() => setActiveTab('maintenance')}
                              >
                                <div>
                                  <p className="text-xs font-semibold text-white group-hover/item:text-brand transition-colors">{alert.title || 'Alerta'}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                                    <p className="text-[9px] font-bold uppercase text-orange-400">Prioridade Alta</p>
                                  </div>
                                </div>
                                <ArrowUpRight size={14} className="text-ink-muted group-hover/item:text-brand transition-transform group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5" />
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-4">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <CircleCheck size={16} className="text-green-500" />
                            </div>
                            <p className="text-xs text-green-400 font-semibold">Sistema Estável</p>
                            <p className="text-[9px] text-ink-muted mt-1">Sem alertas críticos</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('maintenance')}
                      className="mt-6 text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-2 group-hover/alerts:gap-3 transition-all"
                    >
                      Ver sistema completo <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="h-full flex flex-col justify-center gap-6">
                  <div className="glass-card p-6 border-brand/10 bg-brand/[0.02] relative border-l-4 border-l-brand">
                    <p className="text-sm text-ink/90 italic leading-relaxed mb-4 font-serif">
                      "A análise de consumo energético detetou picos anómalos entre as 14h e as 16h. Recomendamos re-calibração dos condensadores do sistema central para evitar falhas críticas no próximo mês."
                    </p>
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-brand fill-brand/20" />
                       <span className="text-[10px] font-black text-brand uppercase tracking-[0.15em]">Insight Operacional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardView;
