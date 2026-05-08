/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { 
  CircleCheck, 
  Clock, 
  AlertTriangle, 
  Construction,
  X,
  Users,
  Wallet,
  Settings,
  Shield,
  LayoutDashboard,
  MessageSquare,
  Wrench,
  Bot,
  Lock,
  LogOut,
  ChevronRight,
  FileText,
  Download,
  Search,
  Filter,
  Share2,
  Send,
  Plus,
  Pencil,
  Trash2,
  UserCircle,
  TrendingUp,
  PieChart as LucidePieChart,
  ArrowUpRight,
  Zap,
  Loader2,
  Calendar,
  Folder,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { CURRENCY_FORMAT, MOCK_STATS, MOCK_HISTORY } from './constants';
import { getBuildingInsights } from './services/geminiService';
import { MaintenanceStatus, getRoleLabel, DBResident, DBEmployee, DBMaintenanceTicket, DBTransaction, DBFixedExpense, DBExtraFee, User, DBSettings, DBVacation, DBPayroll, Project } from './types';

import { generatePDF, generateFinancialPDF } from './lib/pdf';

// UI Components
import { SidebarItem } from './components/ui/SidebarItem';
import { MetricCard } from './components/ui/MetricCard';
import { FormField } from './components/ui/FormField';

// Lazy Loaded Views
const LoginPage = lazy(() => import('./components/LoginPage'));
const DashboardView = lazy(() => import('./components/views/DashboardView'));
const ResidentsView = lazy(() => import('./components/views/ResidentsView'));
const FinanceView = lazy(() => import('./components/views/FinanceView'));
const ReportsView = lazy(() => import('./components/views/ReportsView'));
const StaffView = lazy(() => import('./components/views/StaffView'));
const MaintenanceView = lazy(() => import('./components/views/MaintenanceView'));
const ProjectsView = lazy(() => import('./components/views/ProjectsView'));
const CommunicationsView = lazy(() => import('./components/views/CommunicationsView'));
const ReservationsView = lazy(() => import('./components/views/ReservationsView'));
const DocumentsView = lazy(() => import('./components/views/DocumentsView'));
const BackupView = lazy(() => import('./components/views/BackupView'));
const SettingsView = lazy(() => import('./components/views/SettingsView'));
const MobileManagementView = lazy(() => import('./components/views/MobileManagementView'));

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// --- Main App ---

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [reportSubView, setReportSubView] = React.useState<'selection' | 'payments' | 'delinquency'>('selection');
  const [isFixedExpenseModalOpen, setIsFixedExpenseModalOpen] = React.useState(false);
  const [isExtraFeeModalOpen, setIsExtraFeeModalOpen] = React.useState(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isAdvancePayment, setIsAdvancePayment] = React.useState(false);
  const [advanceMonths, setAdvanceMonths] = React.useState(1);
  const [monthlyFee, setMonthlyFee] = React.useState(150000);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
  const [transactionType, setTransactionType] = React.useState<'Pagamento' | 'Despesa'>('Pagamento');
  const [editingResident, setEditingResident] = React.useState<DBResident | null>(null);
  const [editingFixedExpense, setEditingFixedExpense] = React.useState<DBFixedExpense | null>(null);
  const [selectedResidentForHistory, setSelectedResidentForHistory] = React.useState<DBResident | null>(null);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = React.useState<DBResident | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([
    { id: '1', title: 'Remodelação Reclamação Lazer', progress: 65, budget: 1200000, deadline: '15 Jun 2026', items: ['Piscina', 'Deck Madeira', 'Iluminação LED'], status: 'Em Curso' },
    { id: '2', title: 'Sistema de CCTV Avançado', progress: 30, budget: 2500000, deadline: '30 Jul 2026', items: ['Câmaras 4K', 'Central de Monitorização', 'IA Reconhecimento'], status: 'Em Curso' },
  ]);
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [projectFormErrors, setProjectFormErrors] = React.useState<Record<string, string>>({});
  const [fixedExpenses, setFixedExpenses] = React.useState<DBFixedExpense[]>([]);
  const [extraFees, setExtraFees] = React.useState<DBExtraFee[]>([]);
  const [residents, setResidents] = React.useState<DBResident[]>([]);
  const [residentTransactions, setResidentTransactions] = React.useState<DBTransaction[]>([]);
  const [allTransactions, setAllTransactions] = React.useState<DBTransaction[]>([]);
  const [transactionFilters, setTransactionFilters] = React.useState({ type: '', startDate: '', endDate: '', unit: '' });
  const [settings, setSettings] = React.useState<Record<string, string>>({ building_name: 'EDI IA', currency: 'AOA' });
  const [settingsTab, setSettingsTab] = React.useState<'geral' | 'utilizadores'>('geral');
  const [users, setUsers] = React.useState<User[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userFormErrors, setUserFormErrors] = React.useState<Record<string, string>>({});
  const [insights, setInsights] = React.useState<string[]>([]);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [maintenanceTickets, setMaintenanceTickets] = React.useState<DBMaintenanceTicket[]>([]);
  const [maintenanceFilter, setMaintenanceFilter] = React.useState('Pendente');
  const [isTicketModalOpen, setIsTicketModalOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<DBMaintenanceTicket | null>(null);
  const [isSubmittingResident, setIsSubmittingResident] = React.useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = React.useState(false);

  // HR State
  const [employees, setEmployees] = React.useState<DBEmployee[]>([]);
  const [vacations, setVacations] = React.useState<DBVacation[]>([]);
  const [payroll, setPayroll] = React.useState<DBPayroll[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<DBEmployee | null>(null);
  const [isVacationModalOpen, setIsVacationModalOpen] = React.useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = React.useState(false);
  const [hrActiveView, setHrActiveView] = React.useState<'funcionarios' | 'ferias' | 'folha'>('funcionarios');

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  // Form Error States
  const [residentErrors, setResidentErrors] = React.useState<Record<string, string>>({});
  const [employeeErrors, setEmployeeErrors] = React.useState<Record<string, string>>({});
  const [vacationErrors, setVacationErrors] = React.useState<Record<string, string>>({});
  const [payrollErrors, setPayrollErrors] = React.useState<Record<string, string>>({});
  const [ticketErrors, setTicketErrors] = React.useState<Record<string, string>>({});
  const [fixedExpenseErrors, setFixedExpenseErrors] = React.useState<Record<string, string>>({});
  const [extraFeeErrors, setExtraFeeErrors] = React.useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = React.useState<Record<string, string>>({});
  const [transactionErrors, setTransactionErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!user) return;
    const fetchInsights = async () => {
      setLoadingAI(true);
      const data = await getBuildingInsights(MOCK_STATS, [], []);
      setInsights(data);
      setLoadingAI(false);
    };
    fetchInsights();
  }, [user]);

  const fetchFixedExpenses = async () => {
    try {
      const res = await fetch('/api/finance/fixed-expenses');
      const data = await res.json();
      if (data.success) {
        setFixedExpenses(data.expenses);
      }
    } catch (err) {
      console.error("Erro ao carregar despesas fixas");
    }
  };

  const fetchExtraFees = async () => {
    try {
      const res = await fetch('/api/finance/extra-fees');
      const data = await res.json();
      if (data.success) {
        setExtraFees(data.fees);
      }
    } catch (err) {
      console.error("Erro ao carregar taxas extras");
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await fetch('/api/residents');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setResidents(data.residents);
      } else {
        console.error("Erro ao carregar moradores:", data.message);
      }
    } catch (err) {
      console.error("Erro ao carregar moradores:", err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const fetchMaintenanceTickets = async () => {
    try {
      const res = await fetch('/api/maintenance/tickets');
      const data = await res.json();
      if (data.success) {
        setMaintenanceTickets(data.tickets);
      }
    } catch (err) {
      console.error("Erro ao carregar tickets");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch (err) { console.error("Erro ao carregar funcionários"); }
  };

  const fetchVacations = async () => {
    try {
      const res = await fetch('/api/vacations');
      const data = await res.json();
      if (data.success) setVacations(data.vacations);
    } catch (err) { console.error("Erro ao carregar férias"); }
  };

  const fetchPayroll = async () => {
    try {
      const res = await fetch('/api/payroll');
      const data = await res.json();
      if (data.success) setPayroll(data.payroll);
    } catch (err) { console.error("Erro ao carregar folha"); }
  };

  const fetchResidentTransactions = async (residentId: number) => {
    try {
      // Seed if none exists
      await fetch(`/api/residents/${residentId}/seed-transactions`, { method: 'POST' });
      
      const res = await fetch(`/api/residents/${residentId}/transactions`);
      const data = await res.json();
      if (data.success) {
        setResidentTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Erro ao carregar transações");
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const res = await fetch('/api/finance/all-transactions');
      const data = await res.json();
      if (data.success) {
        setAllTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Erro ao carregar transações globais");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Erro ao carregar definições");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Erro ao carregar utilizadores");
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  React.useEffect(() => {
    if (activeTab === 'finance' || activeTab === 'residents' || activeTab === 'settings' || activeTab === 'maintenance' || activeTab === 'hr') {
      fetchFixedExpenses();
      fetchExtraFees();
      fetchResidents();
      fetchAllTransactions();
      fetchMaintenanceTickets();
      fetchEmployees();
      fetchVacations();
      fetchPayroll();
    }
    if (activeTab === 'settings') {
      fetchUsers();
    }
  }, [activeTab]);

  if (!user) {
    return <LoginPage onLogin={setUser} buildingName={settings.building_name} />;
  }

  return (
    <div className="flex h-screen bg-surface-dark tech-grid selection:bg-brand selection:text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-white/5 p-6 flex flex-col gap-8 bg-surface-dark/50 backdrop-blur-xl h-screen overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 px-4 py-2 shrink-0">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center brand-glow">
            <span className="font-bold text-white text-xl">{settings.building_name?.[0] || 'E'}</span>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tighter text-white">{settings.building_name || 'EDI IA'}</h1>
            <p className="text-[10px] text-brand uppercase tracking-[0.2em] font-bold">Angola v1.0</p>
          </div>
        </div>

        <div className="mx-2 p-4 glass-card bg-brand/5 border-brand/20 hover:bg-brand/10 transition-all group cursor-default text-center">
          <div className="flex items-center justify-center gap-2 text-brand mb-2 relative -top-[5px]">
            <Bot size={18} className="animate-bounce shrink-0" />
            <span className="text-[12px] font-black uppercase tracking-tight font-mono">
              {currentTime.toLocaleString('pt-AO', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
          <AnimatePresence mode="wait">
            {loadingAI ? (
              <p className="text-[10px] text-ink-muted animate-pulse">A analisar dados...</p>
            ) : (
              <p className="text-[11px] leading-relaxed text-ink/90 italic">
                "{insights[0] || 'Otimize a gestão dos seus funcionários e despesas mensais.'}"
              </p>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <SidebarItem icon={LayoutDashboard} label="Painel Principal" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Wallet} label="Financeiro" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <SidebarItem icon={Users} label="Recursos Humanos" active={activeTab === 'hr'} onClick={() => setActiveTab('hr')} />
          <SidebarItem icon={UserCircle} label="Moradores" active={activeTab === 'residents'} onClick={() => setActiveTab('residents')} />
          <SidebarItem icon={Calendar} label="Reservas" active={activeTab === 'reservations'} onClick={() => setActiveTab('reservations')} />
          <SidebarItem icon={Folder} label="Documentos" active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
          <SidebarItem icon={Construction} label="Obras e Projetos" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
          <SidebarItem icon={Wrench} label="Manutenção" active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} />
          <SidebarItem icon={FileText} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <SidebarItem icon={MessageSquare} label="Comunicados" active={activeTab === 'comms'} onClick={() => setActiveTab('comms')} />
          <SidebarItem icon={Cloud} label="Backup" active={activeTab === 'backup'} onClick={() => setActiveTab('backup')} />
        </nav>

        <div className="border-t border-white/5 pt-6 flex flex-col gap-2">
          <SidebarItem icon={Settings} label="Definições" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <SidebarItem icon={LogOut} label="Sair" onClick={() => setUser(null)} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow min-w-0 overflow-y-auto px-10 py-8 relative hide-scrollbar">
        {/* Header Section */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-2">
              {activeTab === 'dashboard' ? 'Bem-vindo ao Comando' : 
               activeTab === 'finance' ? 'Gestão Financeira' : 
               activeTab === 'hr' ? 'Gestão de Staff' : 
               activeTab === 'residents' ? 'Gestão de Moradores' :
               activeTab === 'reservations' ? 'Gestão de Reservas' :
               activeTab === 'documents' ? 'Gestão de Documentos' :
               activeTab === 'reports' ? 'Centro de Relatórios' : 
               activeTab === 'projects' ? 'Obras e Projetos' :
               activeTab === 'maintenance' ? 'Manutenção' :
               activeTab === 'comms' ? 'Comunicados' :
               activeTab === 'backup' ? 'Backup na Nuvem' : 'Definições'}
            </h2>
            <p className="text-ink-muted flex items-center gap-2">
              <Clock size={16} /> Central de Gestão Condomínio • Luanda, Angola
            </p>
          </div>

          <div className="flex gap-4">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-ink-muted uppercase tracking-widest font-bold">Estado do Sistema</span>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                 <span className="text-xs font-mono text-green-500">Operacional</span>
               </div>
             </div>
          </div>
        </header>

        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} residents={residents} maintenanceTickets={maintenanceTickets} />}

        {activeTab === 'reports' && (
          <ReportsView 
            reportSubView={reportSubView}
            setReportSubView={setReportSubView}
            allTransactions={allTransactions}
            residents={residents}
            transactionFilters={transactionFilters}
            setTransactionFilters={setTransactionFilters}
            generatePDF={generatePDF}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView 
            allTransactions={allTransactions}
            fixedExpenses={fixedExpenses}
            extraFees={extraFees}
            setTransactionType={setTransactionType}
            setIsTransactionModalOpen={setIsTransactionModalOpen}
            setEditingFixedExpense={setEditingFixedExpense}
            setIsFixedExpenseModalOpen={setIsFixedExpenseModalOpen}
            setIsExtraFeeModalOpen={setIsExtraFeeModalOpen}
            generatePDF={generatePDF}
          />
        )}

        {activeTab === 'residents' && (
          <ResidentsView 
            residents={residents}
            fetchResidents={fetchResidents}
            setEditingResident={setEditingResident}
            setIsResidentModalOpen={setIsResidentModalOpen}
            setSelectedResidentForHistory={setSelectedResidentForHistory}
            fetchResidentTransactions={fetchResidentTransactions}
            setSelectedResidentForPayment={setSelectedResidentForPayment}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            generatePDF={generatePDF}
            selectedResidentForHistory={selectedResidentForHistory}
          />
        )}

        {activeTab === 'hr' && (
          <StaffView 
            employees={employees}
            vacations={vacations}
            payroll={payroll}
            hrActiveView={hrActiveView}
            setHrActiveView={setHrActiveView}
            setIsEmployeeModalOpen={setIsEmployeeModalOpen}
            setIsVacationModalOpen={setIsVacationModalOpen}
            setIsPayrollModalOpen={setIsPayrollModalOpen}
            setEditingEmployee={setEditingEmployee}
            fetchEmployees={fetchEmployees}
            generatePDF={generatePDF}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            setProjects={setProjects}
            setSelectedProject={setSelectedProject}
            setEditingProject={setEditingProject}
            setIsProjectModalOpen={setIsProjectModalOpen}
          />
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit mb-8">
              {([
                { key: 'geral' as const, label: 'Geral', icon: Settings },
                { key: 'utilizadores' as const, label: 'Utilizadores', icon: Users },
                { key: 'mobile' as const, label: 'Gestão Mobile', icon: Cloud },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSettingsTab(tab.key)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    settingsTab === tab.key ? "bg-brand text-black shadow-lg" : "text-ink-muted hover:text-white"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {settingsTab === 'geral' && (
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Definições Gerais</h3>
                
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
                        <option value="AOA">Kwanza (AOA)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dólar (USD)</option>
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
            )}

            {settingsTab === 'mobile' && (
              <Suspense fallback={<div className="text-white text-center py-8">Carregando...</div>}>
                <MobileManagementView 
                  residents={residents}
                  onResidentsUpdate={setResidents}
                />
              </Suspense>
            )}

            {settingsTab === 'utilizadores' && (
              <div className="max-w-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Gestão de Utilizadores</h3>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setIsUserModalOpen(true);
                      setUserFormErrors({});
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    <Plus size={16} /> Novo Utilizador
                  </button>
                </div>

                {/* User List */}
                <div className="glass-card p-8">
                  {users.length === 0 ? (
                    <div className="py-20 text-center glass-card border-dashed">
                      <Users size={48} className="mx-auto text-brand/20 mb-4" />
                      <p className="text-ink-muted italic">Nenhum utilizador registado.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-white/5">
                            <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Utilizador</th>
                            <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Nome</th>
                            <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black">Função</th>
                            <th className="pb-4 text-[10px] uppercase tracking-widest text-ink-muted font-black text-right">Acções</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {users.map((u: any, i: number) => (
                            <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-brand border border-white/5">
                                    <Shield size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-white">{u.username}</span>
                                </div>
                              </td>
                              <td className="py-4 text-sm text-ink-muted">{u.display_name || '-'}</td>
                              <td className="py-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                                  u.role === 'administrator' ? "bg-brand/10 text-brand" :
                                  u.role === 'gestor' ? "bg-blue-500/10 text-blue-500" :
                                  u.role === 'operador' ? "bg-green-500/10 text-green-500" :
                                  "bg-white/5 text-ink-muted"
                                )}>
                                  {getRoleLabel(u.role)}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setIsUserModalOpen(true);
                                      setUserFormErrors({});
                                    }}
                                    className="p-2 hover:bg-white/5 rounded-lg text-ink-muted hover:text-white transition-colors"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Tem certeza que deseja eliminar o utilizador "${u.username}"?`)) {
                                        try {
                                          const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
                                          const data = await res.json();
                                          if (data.success) {
                                            fetchUsers();
                                          } else {
                                            alert(data.message || "Erro ao eliminar utilizador");
                                          }
                                        } catch (err) {
                                          alert("Erro ao eliminar utilizador");
                                        }
                                      }
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg text-ink-muted hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* User Create/Edit Modal */}
                {isUserModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setIsUserModalOpen(false);
                        setUserFormErrors({});
                      }
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-surface-dark border border-white/10 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">
                          {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
                        </h3>
                        <button
                          onClick={() => {
                            setIsUserModalOpen(false);
                            setUserFormErrors({});
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-ink-muted hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const payload: any = {
                          username: formData.get('username'),
                          display_name: formData.get('display_name'),
                          role: formData.get('role'),
                        };
                        if (!editingUser || formData.get('pin')) {
                          payload.pin = formData.get('pin');
                        }

                        const errors: any = {};
                        if (!payload.username?.trim()) errors.username = 'Username é obrigatório';
                        if (!editingUser && !payload.pin) errors.pin = 'PIN é obrigatório';
                        if (Object.keys(errors).length > 0) {
                          setUserFormErrors(errors);
                          return;
                        }

                        try {
                          const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
                          const method = editingUser ? 'PUT' : 'POST';
                          const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setIsUserModalOpen(false);
                            setUserFormErrors({});
                            fetchUsers();
                          } else {
                            alert(data.message || "Erro ao guardar utilizador");
                          }
                        } catch (err) {
                          alert("Erro ao guardar utilizador");
                        }
                      }} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Username *</label>
                          <input
                            name="username"
                            defaultValue={editingUser?.username || ''}
                            required
                            className={cn(
                              "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none",
                              userFormErrors.username ? "border-red-400" : "border-white/10 focus:border-brand/50",
                            )}
                          />
                          {userFormErrors.username && (
                            <p className="text-[10px] text-red-400 mt-1">{userFormErrors.username}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Nome de Exibição</label>
                          <input
                            name="display_name"
                            defaultValue={editingUser?.display_name || ''}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">
                            PIN {editingUser ? '(deixe em branco para manter o atual)' : '*'}
                          </label>
                          <input
                            name="pin"
                            type="password"
                            maxLength={6}
                            required={!editingUser}
                            className={cn(
                              "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none",
                              userFormErrors.pin ? "border-red-400" : "border-white/10 focus:border-brand/50",
                            )}
                          />
                          {userFormErrors.pin && (
                            <p className="text-[10px] text-red-400 mt-1">{userFormErrors.pin}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Função</label>
                          <select
                            name="role"
                            defaultValue={editingUser?.role || 'operador'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none appearance-none"
                          >
                            <option value="administrator" className="bg-surface-dark">Administrador</option>
                            <option value="gestor" className="bg-surface-dark">Gestor</option>
                            <option value="operador" className="bg-surface-dark">Operador</option>
                            <option value="visualizador" className="bg-surface-dark">Visualizador</option>
                          </select>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserModalOpen(false);
                              setUserFormErrors({});
                            }}
                            className="flex-1 py-3 border border-white/10 text-ink-muted rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-3 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-all"
                          >
                            {editingUser ? 'Actualizar' : 'Criar Utilizador'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'maintenance' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                {['Todos', 'Pendente', 'Em Curso', 'Concluído'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setMaintenanceFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      maintenanceFilter === f ? "border border-brand text-brand" : "text-ink-muted hover:text-white"
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
                      columns: ['Título', 'Estado', 'Tipo', 'Prioridade', 'Data'],
                      rows: maintenanceTickets.map(t => [t.title, t.status, t.type, t.priority, t.date]),
                      filename: 'tickets_manutencao'
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
        )}

        {activeTab === 'comms' && <CommunicationsView residents={residents} />}

        {activeTab === 'reservations' && <ReservationsView residents={residents} />}

        {activeTab === 'documents' && <DocumentsView generatePDF={generatePDF} />}

        {activeTab === 'backup' && <BackupView />}
      </main>

      <AnimatePresence>
        {isFixedExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFixedExpenseModalOpen(false)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20 brand-glow-soft"
            >
              <h3 className="text-2xl font-bold text-white mb-6 tracking-tighter">
                {editingFixedExpense ? 'Editar Despesa Fixa' : 'Registar Despesa Fixa'}
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const description = formData.get('description') as string;
                const amount = parseFloat(formData.get('amount') as string);
                const due_date = formData.get('due_date') as string;

                // Final validation
                const isDescValid = description && description.length >= 3;
                const isAmountValid = amount > 0;
                const isDueDateValid = !!due_date;

                if (!isDescValid || !isAmountValid || !isDueDateValid) {
                  setFixedExpenseErrors({
                    description: !isDescValid ? (description ? "Mínimo de 3 caracteres" : "Descrição obrigatória") : "",
                    amount: !isAmountValid ? "Valor deve ser superior a 0" : "",
                    due_date: !isDueDateValid ? "Vencimento obrigatório" : ""
                  });
                  return;
                }

                try {
                  const url = editingFixedExpense ? `/api/finance/fixed-expenses/${editingFixedExpense.id}` : '/api/finance/fixed-expenses';
                  const method = editingFixedExpense ? 'PUT' : 'POST';
                  
                  const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount, due_date })
                  });
                  if (res.ok) {
                    setIsFixedExpenseModalOpen(false);
                    setFixedExpenseErrors({});
                    fetchFixedExpenses();
                  }
                } catch (err) {
                  alert("Erro ao guardar despesa");
                }
              }} className="space-y-4">
                <FormField label="Descrição" error={fixedExpenseErrors.description}>
                  <input 
                    name="description" 
                    required 
                    defaultValue={editingFixedExpense?.description}
                    placeholder="Ex: Contrato Elevadores"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setFixedExpenseErrors(p => ({...p, description: "Descrição obrigatória"}));
                      else if (val.length < 3) setFixedExpenseErrors(p => ({...p, description: "Mínimo de 3 caracteres"}));
                      else setFixedExpenseErrors(p => ({...p, description: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      fixedExpenseErrors.description ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Valor (AOA)" error={fixedExpenseErrors.amount}>
                  <input 
                    name="amount" 
                    type="number" 
                    required 
                    defaultValue={editingFixedExpense?.amount}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val) || val <= 0) setFixedExpenseErrors(p => ({...p, amount: "Valor superior a 0"}));
                      else setFixedExpenseErrors(p => ({...p, amount: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors",
                      fixedExpenseErrors.amount ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Vencimento (Dia ou Período)" error={fixedExpenseErrors.due_date}>
                  <input 
                    name="due_date" 
                    required 
                    defaultValue={editingFixedExpense?.due_date}
                    placeholder="Ex: Dia 10 de cada mês"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setFixedExpenseErrors(p => ({...p, due_date: "Obrigatório"}));
                      else setFixedExpenseErrors(p => ({...p, due_date: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      fixedExpenseErrors.due_date ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsFixedExpenseModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 text-ink-muted font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all brand-glow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isExtraFeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExtraFeeModalOpen(false)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
            >
              <h3 className="text-2xl font-bold text-white mb-6 tracking-tighter">Lançar Taxa Extra</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const description = formData.get('description') as string;
                const amount = parseFloat(formData.get('amount') as string);
                const due_date = formData.get('due_date') as string;
                const unit = formData.get('unit') as string;

                const isDescValid = description && description.length >= 3;
                const isAmountValid = amount > 0;
                const isUnitValid = !!unit;

                if (!isDescValid || !isAmountValid || !isUnitValid) {
                  setExtraFeeErrors({
                    description: !isDescValid ? "Mínimo 3 caracteres" : "",
                    amount: !isAmountValid ? "Valor superior a 0" : "",
                    unit: !isUnitValid ? "Unidade obrigatória" : ""
                  });
                  return;
                }

                try {
                  const res = await fetch('/api/finance/extra-fees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount, due_date, unit })
                  });
                  if (res.ok) {
                    setIsExtraFeeModalOpen(false);
                    setExtraFeeErrors({});
                    fetchExtraFees();
                  }
                } catch (err) {
                  alert("Erro ao guardar taxa extra");
                }
              }} className="space-y-4">
                <FormField label="Descrição da Taxa" error={extraFeeErrors.description}>
                  <input 
                    name="description" 
                    required 
                    placeholder="Ex: Pintura Extra Bloco A"
                    onChange={(e) => {
                      if (e.target.value.length < 3) setExtraFeeErrors(p => ({...p, description: "Mínimo 3 caracteres"}));
                      else setExtraFeeErrors(p => ({...p, description: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-colors",
                      extraFeeErrors.description ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Unidade/Apartamento" error={extraFeeErrors.unit}>
                  <input 
                    name="unit" 
                    required 
                    placeholder="Ex: T2-104 ou Todos"
                    onChange={(e) => {
                      if (!e.target.value) setExtraFeeErrors(p => ({...p, unit: "Obrigatória"}));
                      else setExtraFeeErrors(p => ({...p, unit: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-colors",
                      extraFeeErrors.unit ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Valor (AOA)" error={extraFeeErrors.amount}>
                    <input 
                      name="amount" 
                      type="number" 
                      required 
                      placeholder="0.00"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val <= 0) setExtraFeeErrors(p => ({...p, amount: "Valor inválido"}));
                        else setExtraFeeErrors(p => ({...p, amount: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500/50 outline-none transition-colors",
                        extraFeeErrors.amount ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                  <FormField label="Vencimento">
                    <input 
                      name="due_date" 
                      required 
                      placeholder="Ex: 25 Mai"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-colors"
                    />
                  </FormField>
                </div>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => { setIsExtraFeeModalOpen(false); setExtraFeeErrors({}); }}
                    className="flex-1 py-3 bg-white/5 text-ink-muted font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    Lançar Taxa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResidentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResidentModalOpen(false)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20 brand-glow-soft"
            >
              <h3 className="text-2xl font-bold text-white mb-6 tracking-tighter">
                {editingResident ? 'Editar Morador' : 'Registar Morador'}
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const unit = formData.get('unit') as string;
                const contact = formData.get('contact') as string;
                const type = formData.get('type') as string;
                const phone = formData.get('phone') as string;
                const balance = parseFloat(formData.get('balance') as string);

                // Final validation
                const isNameValid = name && name.length >= 3;
                const isUnitValid = !!unit;
                const isContactValid = contact && /^\d{9}$/.test(contact.replace(/\s/g, ""));
                const isBalanceValid = !isNaN(balance);

                if (!isNameValid || !isUnitValid || !isContactValid || !isBalanceValid) {
                  setResidentErrors({
                    name: !isNameValid ? (name ? "Mínimo de 3 caracteres" : "Nome obrigatório") : "",
                    unit: !isUnitValid ? "Unidade obrigatória" : "",
                    contact: !isContactValid ? "Contacto inválido (9 dígitos)" : "",
                    balance: !isBalanceValid ? "Valor inválido" : ""
                  });
                  return;
                }

                try {
                  setIsSubmittingResident(true);
                  const url = editingResident ? `/api/residents/${editingResident.id}` : '/api/residents';
                  const method = editingResident ? 'PUT' : 'POST';
                  
                  const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, unit, contact, type, phone, balance })
                  });
                  if (res.ok) {
                    setIsResidentModalOpen(false);
                    setResidentErrors({});
                    fetchResidents();
                  }
                } catch (err) {
                  alert("Erro ao guardar morador");
                } finally {
                  setIsSubmittingResident(false);
                }
              }} className="space-y-4">
                <FormField label="Nome Completo" error={residentErrors.name}>
                  <input 
                    name="name" 
                    required 
                    defaultValue={editingResident?.name}
                    placeholder="Ex: Francisco Silva"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setResidentErrors(p => ({...p, name: "Nome obrigatório"}));
                      else if (val.length < 3) setResidentErrors(p => ({...p, name: "Mínimo de 3 caracteres"}));
                      else setResidentErrors(p => ({...p, name: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      residentErrors.name ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Unidade" error={residentErrors.unit}>
                    <input 
                      name="unit" 
                      required 
                      defaultValue={editingResident?.unit}
                      placeholder="Ex: T2-104"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) setResidentErrors(p => ({...p, unit: "Obrigatória"}));
                        else setResidentErrors(p => ({...p, unit: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                        residentErrors.unit ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                  <FormField label="Contacto" error={residentErrors.contact}>
                    <input 
                      name="contact" 
                      required 
                      defaultValue={editingResident?.contact}
                      placeholder="9xx xxx xxx"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s/g, "");
                        if (!val) setResidentErrors(p => ({...p, contact: "Obrigatório"}));
                        else if (!/^\d{9}$/.test(val)) setResidentErrors(p => ({...p, contact: "9 dígitos"}));
                        else setResidentErrors(p => ({...p, contact: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                        residentErrors.contact ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tipo de Morador">
                    <select 
                      name="type" 
                      defaultValue={editingResident?.type || 'Proprietário'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors"
                    >
                      <option value="Proprietário" className="bg-surface-dark">Proprietário</option>
                      <option value="Inquilino" className="bg-surface-dark">Inquilino</option>
                      <option value="Outro" className="bg-surface-dark">Outro</option>
                    </select>
                  </FormField>
                  <FormField label="Telefone Alternativo">
                    <input 
                      name="phone" 
                      defaultValue={editingResident?.phone}
                      placeholder="9xx xxx xxx"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors"
                    />
                  </FormField>
                </div>
                <FormField label="Saldo Devedor (AOA)" error={residentErrors.balance}>
                  <input 
                    name="balance" 
                    type="number" 
                    required 
                    defaultValue={editingResident?.balance || 0}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setResidentErrors(p => ({...p, balance: "Valor obrigatório"}));
                      else setResidentErrors(p => ({...p, balance: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors",
                      residentErrors.balance ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsResidentModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 text-ink-muted font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingResident}
                    className={cn(
                      "flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all brand-glow-sm flex items-center justify-center gap-2",
                      isSubmittingResident ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    {isSubmittingResident ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Guardando...
                      </>
                    ) : (
                      editingResident ? 'Guardar' : 'Registar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTicketModalOpen(false)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20 brand-glow-soft"
            >
              <h3 className="text-2xl font-bold text-white mb-6 tracking-tighter">Novo Ticket de Manutenção</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingTicket(true);
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const type = formData.get('type') as string;
                const priority = formData.get('priority') as string;
                const description = formData.get('description') as string;

                const isTitleValid = title && title.length >= 5;
                const isTypeValid = !!type;
                const isPriorityValid = !!priority;

                if (!isTitleValid || !isTypeValid || !isPriorityValid) {
                  setTicketErrors({
                    title: !isTitleValid ? (title ? "Mínimo de 5 caracteres" : "Título obrigatório") : "",
                    type: !isTypeValid ? "Tipo obrigatório" : "",
                    priority: !isPriorityValid ? "Prioridade obrigatória" : ""
                  });
                  setIsSubmittingTicket(false);
                  return;
                }

                const body = { title, type, priority, description, status: 'Pendente' };

                try {
                  const res = await fetch('/api/maintenance/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  });
                  if (res.ok) {
                    setIsTicketModalOpen(false);
                    setTicketErrors({});
                    fetchMaintenanceTickets();
                  }
                } catch (err) {
                  alert("Erro ao criar ticket");
                } finally {
                  setIsSubmittingTicket(false);
                }
              }} className="space-y-4">
                <FormField label="Título da Ocorrência" error={ticketErrors.title}>
                  <input 
                    name="title" 
                    required 
                    placeholder="Ex: Infiltração Elevador B" 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setTicketErrors(p => ({...p, title: "Obrigatório"}));
                      else if (val.length < 5) setTicketErrors(p => ({...p, title: "Mínimo 5 letras"}));
                      else setTicketErrors(p => ({...p, title: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      ticketErrors.title ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tipo">
                    <select name="type" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors">
                      <option value="Reparação" className="bg-surface-dark text-white">Reparação</option>
                      <option value="Preventiva" className="bg-surface-dark text-white">Preventiva</option>
                      <option value="Limpeza" className="bg-surface-dark text-white">Limpeza</option>
                      <option value="Outro" className="bg-surface-dark text-white">Outro</option>
                    </select>
                  </FormField>
                  <FormField label="Prioridade">
                    <select name="priority" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors">
                      <option value="Baixa" className="bg-surface-dark text-white">Baixa</option>
                      <option value="Média" className="bg-surface-dark text-white">Média</option>
                      <option value="Alta" className="bg-surface-dark text-white">Alta</option>
                      <option value="Crítica" className="bg-surface-dark text-red-500">Crítica</option>
                    </select>
                  </FormField>
                </div>
                <FormField label="Descrição Detalhada">
                  <textarea name="description" rows={3} placeholder="Descreva os detalhes do problema..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors resize-none" />
                </FormField>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsTicketModalOpen(false); setTicketErrors({}); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmittingTicket} className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
                    {isSubmittingTicket ? <Loader2 className="animate-spin" size={16} /> : 'Criar Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20 shadow-[0_0_50px_rgba(204,255,0,0.1)]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded",
                    selectedTicket.priority === 'Crítica' ? "bg-red-500/10 text-red-500" : "bg-brand/10 text-brand"
                  )}>
                    Prioridade {selectedTicket.priority}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-4">{selectedTicket.title}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/5 rounded-full text-ink-muted hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] text-ink-muted uppercase font-bold mb-2">Descrição</p>
                  <p className="text-sm text-ink/80 leading-relaxed">{selectedTicket.description || 'Nenhuma descrição detalhada.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-ink-muted uppercase font-bold mb-1">Tipo</p>
                    <p className="text-sm text-white font-bold">{selectedTicket.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-muted uppercase font-bold mb-1">Abertura</p>
                    <p className="text-sm text-white font-mono">{selectedTicket.date}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                   <p className="text-[10px] text-ink-muted uppercase font-bold mb-4">Atualizar Estado</p>
                   <div className="flex flex-wrap gap-2">
                     {['Pendente', 'Em Curso', 'Concluído'].map((s) => (
                       <button 
                         key={s}
                         onClick={async () => {
                           try {
                             const res = await fetch(`/api/maintenance/tickets/${selectedTicket.id}`, {
                               method: 'PUT',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ status: s })
                             });
                             if (res.ok) {
                               setSelectedTicket(st => st ? {...st, status: s} : null);
                               fetchMaintenanceTickets();
                             }
                           } catch (err) {
                             alert("Erro ao atualizar ticket");
                           }
                         }}
                         className={cn(
                           "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                           selectedTicket.status === s ? "bg-brand text-black" : "bg-white/5 text-ink-muted hover:bg-white/10"
                         )}
                       >
                         {s}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isPaymentModalOpen && selectedResidentForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20 brand-glow-soft"
            >
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tighter">Registar Pagamento</h3>
              <p className="text-xs text-ink-muted mb-6 uppercase font-bold tracking-widest">Destino: {selectedResidentForPayment.name} ({selectedResidentForPayment.unit})</p>
              
              <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setIsAdvancePayment(false)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                    !isAdvancePayment ? "bg-brand text-black" : "text-ink-muted hover:text-white"
                  )}
                >
                  Normal
                </button>
                <button 
                  onClick={() => setIsAdvancePayment(true)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                    isAdvancePayment ? "bg-brand text-black" : "text-ink-muted hover:text-white"
                  )}
                >
                  Antecipado
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                let amount = parseFloat(formData.get('amount') as string);
                let description = formData.get('description') as string;
                const date = formData.get('date') as string;

                if (isAdvancePayment) {
                  amount = monthlyFee * advanceMonths;
                  description = `Pagamento Antecipado (${advanceMonths} meses): ${description}`;
                }

                // Final validation
                const isAmountValid = amount > 0;
                const isDescValid = !!description;
                const isDateValid = !!date;

                if (!isAmountValid || !isDescValid || !isDateValid) {
                  setPaymentErrors({
                    amount: !isAmountValid ? "Valor superior a 0" : "",
                    description: !isDescValid ? "Descrição obrigatória" : "",
                    date: !isDateValid ? "Data obrigatória" : ""
                  });
                  return;
                }

                try {
                  const res = await fetch(`/api/residents/${selectedResidentForPayment.id}/pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, description, date })
                  });
                  if (res.ok) {
                    setIsPaymentModalOpen(false);
                    setPaymentErrors({});
                    setIsAdvancePayment(false);
                    setAdvanceMonths(1);
                    fetchResidents();
                    fetchAllTransactions();
                    if (selectedResidentForHistory) fetchResidentTransactions(selectedResidentForHistory.id);
                  }
                } catch (err) {
                  alert("Erro ao registar pagamento");
                }
              }} className="space-y-4">
                {isAdvancePayment ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Valor Mensal (AOA)">
                        <input 
                          type="number" 
                          value={monthlyFee}
                          onChange={(e) => setMonthlyFee(parseFloat(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors"
                        />
                      </FormField>
                      <FormField label="Meses">
                        <select 
                          value={advanceMonths}
                          onChange={(e) => setAdvanceMonths(parseInt(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors"
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i+1} value={i+1} className="bg-surface-dark text-white">{i+1} meses</option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                    <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-ink-muted uppercase font-bold">Total Antecipado</span>
                        <span className="text-lg font-mono font-bold text-brand">{CURRENCY_FORMAT.format(monthlyFee * advanceMonths)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <FormField label="Valor do Pagamento (AOA)" error={paymentErrors.amount}>
                    <input 
                      name="amount" 
                      type="number" 
                      required 
                      placeholder="0.00"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val <= 0) setPaymentErrors(p => ({...p, amount: "Superior a 0"}));
                        else setPaymentErrors(p => ({...p, amount: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors",
                        paymentErrors.amount ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                )}

                <FormField label="Observações / Referência" error={paymentErrors.description}>
                  <input 
                    name="description" 
                    required 
                    placeholder={isAdvancePayment ? "Ex: Antecipação 2026/2027" : "Ex: Pagamento Anual 2026"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setPaymentErrors(p => ({...p, description: "Obrigatória"}));
                      else setPaymentErrors(p => ({...p, description: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      paymentErrors.description ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Data do Pagamento" error={paymentErrors.date}>
                  <input 
                    name="date" 
                    type="date"
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setPaymentErrors(p => ({...p, date: "Obrigatória"}));
                      else setPaymentErrors(p => ({...p, date: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      paymentErrors.date ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 text-ink-muted font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all brand-glow-sm"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20 brand-glow-soft"
            >
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tighter">
                {transactionType === 'Pagamento' ? 'Registar Receita' : 'Registar Despesa'}
              </h3>
              <p className="text-xs text-ink-muted mb-6 uppercase font-bold tracking-widest">Movimentação de Tesouraria Geral</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const amount = parseFloat(formData.get('amount') as string);
                const description = formData.get('description') as string;
                const date = formData.get('date') as string;

                // Final validation
                const isAmountValid = amount > 0;
                const isDescValid = !!description;
                const isDateValid = !!date;

                if (!isAmountValid || !isDescValid || !isDateValid) {
                  setTransactionErrors({
                    amount: !isAmountValid ? "Valor superior a 0" : "",
                    description: !isDescValid ? "Descrição obrigatória" : "",
                    date: !isDateValid ? "Data obrigatória" : ""
                  });
                  return;
                }

                try {
                  const res = await fetch('/api/finance/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      amount, 
                      description, 
                      date, 
                      type: transactionType,
                      status: 'Pago' 
                    })
                  });
                  if (res.ok) {
                    setIsTransactionModalOpen(false);
                    setTransactionErrors({});
                    fetchAllTransactions();
                  }
                } catch (err) {
                  alert("Erro ao registar movimento");
                }
              }} className="space-y-4">
                <FormField label="Valor (AOA)" error={transactionErrors.amount}>
                  <input 
                    name="amount" 
                    type="number" 
                    required 
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val) || val <= 0) setTransactionErrors(p => ({...p, amount: "Superior a 0"}));
                      else setTransactionErrors(p => ({...p, amount: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors",
                      transactionErrors.amount ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Descrição" error={transactionErrors.description}>
                  <input 
                    name="description" 
                    required 
                    placeholder="Ex: Venda de Sucata de Elevadores"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setTransactionErrors(p => ({...p, description: "Obrigatória"}));
                      else setTransactionErrors(p => ({...p, description: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      transactionErrors.description ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Data" error={transactionErrors.date}>
                  <input 
                    name="date" 
                    type="date"
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setTransactionErrors(p => ({...p, date: "Obrigatória"}));
                      else setTransactionErrors(p => ({...p, date: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      transactionErrors.date ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsTransactionModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 text-ink-muted font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={cn(
                      "flex-1 py-3 font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all text-black",
                      transactionType === 'Pagamento' ? "bg-brand" : "bg-red-400 text-white"
                    )}
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg p-10 relative z-10 border-brand/20 brand-glow-soft"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Construction className="text-brand" size={24} />
                    <h3 className="text-3xl font-bold text-white tracking-tighter">{selectedProject.title}</h3>
                  </div>
                  <p className="text-xs text-ink-muted uppercase font-bold tracking-[0.2em]">Detalhes Técnicos & Execução</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-white/5 rounded-full text-ink-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[10px] text-ink-muted uppercase font-black mb-2 tracking-widest">Orçamento Total</p>
                  <p className="text-xl font-mono font-bold text-brand">{CURRENCY_FORMAT.format(selectedProject.budget)}</p>
                </div>
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[10px] text-ink-muted uppercase font-black mb-2 tracking-widest">Data Limite</p>
                  <p className="text-xl font-mono font-bold text-white">{selectedProject.deadline}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-2">
                    <span>Execução Atual</span>
                    <span className="text-brand">{selectedProject.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand brand-glow" style={{ width: `${selectedProject.progress}%` }} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-ink-muted uppercase font-black mb-4 tracking-widest">Principais Tarefas</p>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedProject.items.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-brand/30 transition-all">
                        <div className="w-2 h-2 rounded-full bg-brand/50 group-hover:bg-brand transition-colors" />
                        <span className="text-sm text-ink-muted group-hover:text-white transition-colors">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedProject(null)}
                className="w-full mt-10 py-4 bg-brand text-black font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all brand-glow-sm"
              >
                Fechar Detalhes
              </button>

              {selectedProject.status !== 'Concluído' && (
                <button
                  onClick={() => {
                    setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, progress: 100, status: 'Concluído' } : p));
                    setSelectedProject({ ...selectedProject, progress: 100, status: 'Concluído' });
                    alert('Projeto marcado como concluído!');
                  }}
                  className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <CircleCheck size={18} /> Marcar como Concluído
                  </span>
                </button>
              )}
            </motion.div>
          </div>
        )}
        {isEmployeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEmployeeModalOpen(false)} className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20">
              <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-tighter">{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const position = formData.get('position') as string;
                const salary = parseFloat(formData.get('salary') as string);
                const hiring_date = formData.get('hiring_date') as string;
                const status = (formData.get('status') || 'Ativo') as string;

                const isNameValid = name && name.length >= 3;
                const isPositionValid = !!position;
                const isSalaryValid = !isNaN(salary) && salary > 0;
                const isDateValid = !!hiring_date;

                if (!isNameValid || !isPositionValid || !isSalaryValid || !isDateValid) {
                  setEmployeeErrors({
                    name: !isNameValid ? (name ? "Mínimo de 3 caracteres" : "Nome obrigatório") : "",
                    position: !isPositionValid ? "Cargo obrigatório" : "",
                    salary: !isSalaryValid ? "Salário deve ser maior que 0" : "",
                    hiring_date: !isDateValid ? "Data obrigatória" : ""
                  });
                  return;
                }

                const body = { name, position, salary, hiring_date, status };
                const res = await fetch(editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees', {
                  method: editingEmployee ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (res.ok) {
                  setIsEmployeeModalOpen(false);
                  setEmployeeErrors({});
                  fetchEmployees();
                }
              }} className="space-y-4">
                <FormField label="Nome Completo" error={employeeErrors.name}>
                  <input 
                    name="name" 
                    defaultValue={editingEmployee?.name} 
                    required 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setEmployeeErrors(p => ({...p, name: "Nome obrigatório"}));
                      else if (val.length < 3) setEmployeeErrors(p => ({...p, name: "Mínimo de 3 caracteres"}));
                      else setEmployeeErrors(p => ({...p, name: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      employeeErrors.name ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <FormField label="Cargo / Função" error={employeeErrors.position}>
                  <input 
                    defaultValue={editingEmployee?.position} 
                    name="position" 
                    required 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) setEmployeeErrors(p => ({...p, position: "Cargo obrigatório"}));
                      else setEmployeeErrors(p => ({...p, position: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      employeeErrors.position ? "border-red-400/50" : "border-white/10"
                    )}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Salário Base" error={employeeErrors.salary}>
                    <input 
                      name="salary" 
                      type="number" 
                      defaultValue={editingEmployee?.salary} 
                      required 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val <= 0) setEmployeeErrors(p => ({...p, salary: "Valor inválido"}));
                        else setEmployeeErrors(p => ({...p, salary: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors",
                        employeeErrors.salary ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                  <FormField label="Data de Contratação" error={employeeErrors.hiring_date}>
                    <input 
                      name="hiring_date" 
                      type="date" 
                      defaultValue={editingEmployee?.hiring_date} 
                      required 
                      onChange={(e) => {
                        if (!e.target.value) setEmployeeErrors(p => ({...p, hiring_date: "Data obrigatória"}));
                        else setEmployeeErrors(p => ({...p, hiring_date: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                        employeeErrors.hiring_date ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                </div>
                {editingEmployee && (
                  <FormField label="Estado">
                    <select name="status" defaultValue={editingEmployee.status} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors">
                      <option value="Ativo" className="bg-surface-dark text-white">Ativo</option>
                      <option value="Férias" className="bg-surface-dark text-white">Férias</option>
                      <option value="Inativo" className="bg-surface-dark text-white">Inativo</option>
                    </select>
                  </FormField>
                )}
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsEmployeeModalOpen(false); setEmployeeErrors({}); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all">Guardar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProjectModalOpen(false)} className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20">
              <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-tighter">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const budget = parseFloat(formData.get('budget') as string);
                const deadline = formData.get('deadline') as string;
                const progress = parseInt(formData.get('progress') as string);
                const itemsRaw = formData.get('items') as string;
                const items = itemsRaw.split(',').map(s => s.trim()).filter(Boolean);

                const errors: any = {};
                if (!title || title.length < 3) errors.title = 'Título obrigatório (mín. 3 caracteres)';
                if (isNaN(budget) || budget <= 0) errors.budget = 'Orçamento inválido';
                if (!deadline) errors.deadline = 'Data limite obrigatória';
                if (isNaN(progress) || progress < 0 || progress > 100) errors.progress = 'Progresso deve estar entre 0 e 100';
                if (items.length === 0) errors.items = 'Pelo menos um item é obrigatório';

                if (Object.keys(errors).length > 0) {
                  setProjectFormErrors(errors);
                  return;
                }

                if (editingProject) {
                  setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, title, budget, deadline, progress, items, status: progress === 100 ? 'Concluído' : p.status } : p));
                } else {
                  const newProject = {
                    id: Date.now().toString(),
                    title,
                    budget,
                    deadline,
                    progress,
                    items,
                    status: progress === 100 ? 'Concluído' : 'Em Curso' as const,
                  };
                  setProjects(prev => [...prev, newProject]);
                }
                setIsProjectModalOpen(false);
                setProjectFormErrors({});
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Título do Projeto</label>
                  <input name="title" defaultValue={editingProject?.title} required className={cn("w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors", projectFormErrors.title ? "border-red-400/50" : "border-white/10")} />
                  {projectFormErrors.title && <p className="text-[10px] text-red-400">{projectFormErrors.title}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Orçamento</label>
                    <input name="budget" type="number" defaultValue={editingProject?.budget} required className={cn("w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors", projectFormErrors.budget ? "border-red-400/50" : "border-white/10")} />
                    {projectFormErrors.budget && <p className="text-[10px] text-red-400">{projectFormErrors.budget}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Progresso (%)</label>
                    <input name="progress" type="number" min="0" max="100" defaultValue={editingProject?.progress ?? 0} required className={cn("w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors", projectFormErrors.progress ? "border-red-400/50" : "border-white/10")} />
                    {projectFormErrors.progress && <p className="text-[10px] text-red-400">{projectFormErrors.progress}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Data Limite</label>
                  <input name="deadline" type="date" defaultValue={editingProject?.deadline} required className={cn("w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors", projectFormErrors.deadline ? "border-red-400/50" : "border-white/10")} />
                  {projectFormErrors.deadline && <p className="text-[10px] text-red-400">{projectFormErrors.deadline}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Itens (separados por vírgula)</label>
                  <input name="items" defaultValue={editingProject?.items?.join(', ')} required placeholder="Ex: Piscina, Deck, Iluminação" className={cn("w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors", projectFormErrors.items ? "border-red-400/50" : "border-white/10")} />
                  {projectFormErrors.items && <p className="text-[10px] text-red-400">{projectFormErrors.items}</p>}
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsProjectModalOpen(false); setProjectFormErrors({}); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all">Guardar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isVacationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsVacationModalOpen(false)} className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20">
              <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-tighter">Agendar Férias</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const empId = parseInt(formData.get('employee_id') as string);
                const start_date = formData.get('start_date') as string;
                const end_date = formData.get('end_date') as string;

                const isEmployeeValid = !!empId;
                const isStartValid = !!start_date;
                const isEndValid = !!end_date && (new Date(end_date) > new Date(start_date));

                if (!isEmployeeValid || !isStartValid || !isEndValid) {
                  setVacationErrors({
                    employee_id: !isEmployeeValid ? "Selecione um funcionário" : "",
                    start_date: !isStartValid ? "Data inicial obrigatória" : "",
                    end_date: !isEndValid ? (end_date ? "Deve ser após o início" : "Data final obrigatória") : ""
                  });
                  return;
                }

                const body = { employee_id: empId, start_date, end_date };
                const res = await fetch('/api/vacations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (res.ok) {
                  setIsVacationModalOpen(false);
                  setVacationErrors({});
                  fetchVacations();
                }
              }} className="space-y-4">
                <FormField label="Funcionário" error={vacationErrors.employee_id}>
                  <select 
                    name="employee_id" 
                    required 
                    onChange={(e) => {
                      if (!e.target.value) setVacationErrors(p => ({...p, employee_id: "Obrigatório"}));
                      else setVacationErrors(p => ({...p, employee_id: ""}));
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      vacationErrors.employee_id ? "border-red-400/50" : "border-white/10"
                    )}
                  >
                    <option value="" className="bg-surface-dark text-white">Selecionar...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id} className="bg-surface-dark text-white">{e.name}</option>
                    ))}
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Início" error={vacationErrors.start_date}>
                    <input 
                      name="start_date" 
                      type="date" 
                      required 
                      onChange={(e) => {
                        if (!e.target.value) setVacationErrors(p => ({...p, start_date: "Obrigatório"}));
                        else setVacationErrors(p => ({...p, start_date: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                        vacationErrors.start_date ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                  <FormField label="Fim" error={vacationErrors.end_date}>
                    <input 
                      name="end_date" 
                      type="date" 
                      required 
                      onChange={(e) => {
                        if (!e.target.value) setVacationErrors(p => ({...p, end_date: "Obrigatório"}));
                        else setVacationErrors(p => ({...p, end_date: ""}));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                        vacationErrors.end_date ? "border-red-400/50" : "border-white/10"
                      )}
                    />
                  </FormField>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsVacationModalOpen(false); setVacationErrors({}); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all">Confirmar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isPayrollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayrollModalOpen(false)} className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card w-full max-w-md p-8 relative z-10 border-brand/20">
              <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-tighter">Gerar Pagamento</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const empId = parseInt(formData.get('employee_id') as string);
                
                const isEmployeeValid = !!empId;
                if (!isEmployeeValid) {
                  setPayrollErrors({ employee_id: "Selecione um funcionário" });
                  return;
                }

                const employee = employees.find(e => e.id === empId);
                const bonus = parseFloat(formData.get('bonus') as string || '0');
                const deductions = parseFloat(formData.get('deductions') as string || '0');

                const body = {
                  employee_id: empId,
                  month: formData.get('month'),
                  year: parseInt(formData.get('year') as string),
                  base_salary: employee?.salary || 0,
                  bonus: bonus,
                  deductions: deductions,
                  payment_date: new Date().toISOString().split('T')[0]
                };
                
                const res = await fetch('/api/payroll', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (res.ok) {
                  setIsPayrollModalOpen(false);
                  setPayrollErrors({});
                  fetchPayroll();
                }
              }} className="space-y-4">
                <FormField label="Funcionário" error={payrollErrors.employee_id}>
                  <select 
                    name="employee_id" 
                    required 
                    onChange={(e) => {
                      if (!e.target.value) setPayrollErrors({ employee_id: "Obrigatório" });
                      else setPayrollErrors({ employee_id: "" });
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors",
                      payrollErrors.employee_id ? "border-red-400/50" : "border-white/10"
                    )}
                  >
                    <option value="" className="bg-surface-dark text-white">Selecionar...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id} className="bg-surface-dark text-white">{e.name}</option>
                    ))}
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Mês">
                    <select name="month" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors">
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                        <option key={m} value={m} className="bg-surface-dark text-white">{m}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Ano">
                    <input name="year" type="number" defaultValue={new Date().getFullYear()} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none transition-colors" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Bónus / Subsídios">
                    <input name="bonus" type="number" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors" />
                  </FormField>
                  <FormField label="Deduções">
                    <input name="deductions" type="number" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand/50 outline-none transition-colors" />
                  </FormField>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsPayrollModalOpen(false); setPayrollErrors({}); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all">Gerar Recibo</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
