/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PropertyStatus {
  OCCUPIED = 'Ocupado',
  VACANT = 'Vago',
  MAINTENANCE = 'Manutenção'
}

export enum TransactionType {
  INCOME = 'Receita',
  EXPENSE = 'Despesa'
}

export enum MaintenanceStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Curso',
  COMPLETED = 'Concluído'
}

export interface BuildingStats {
  cashInHand: number;
  monthlyExpenses: number;
  staffExpenses: number;
  totalEmployees: number;
  activeEmployees: number;
  delinquencyRate: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  isActive: boolean;
  joinDate: string;
}

export interface FinancialRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  dueDate: string;
}

export interface Resident {
  id: string;
  name: string;
  unit: string;
  phone: string;
  email: string;
  isDelinquent: boolean;
  balance: number;
}

export type UserRole = 'administrator' | 'gestor' | 'operador' | 'visualizador';

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: UserRole | string;
  created_at: string;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'administrator': 'Administrador',
    'gestor': 'Gestor',
    'operador': 'Operador',
    'visualizador': 'Visualizador',
  };
  return labels[role] || role;
}

export interface Project {
  id: string;
  title: string;
  progress: number;
  budget: number;
  deadline: string;
  items: string[];
  status: 'Em Curso' | 'Concluído';
}

// Interfaces para dados do banco de dados
export interface DBUser {
  id: number;
  username: string;
  pin: string;
  role: string;
  display_name?: string;
  created_at?: string;
}

export interface DBResident {
  id: number;
  name: string;
  unit: string;
  contact: string;
  type: string;
  phone: string;
  balance: number;
  created_at?: string;
}

export interface DBEmployee {
  id: number;
  name: string;
  position: string;
  salary: number;
  hiring_date: string;
  status: string;
}

export interface DBMaintenanceTicket {
  id: number;
  title: string;
  status: string;
  type: string;
  priority: string;
  description: string;
  date: string;
  created_at?: string;
}

export interface DBTransaction {
  id: number;
  resident_id?: number;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  resident_name?: string;
  unit?: string;
}

export interface DBFixedExpense {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  created_at?: string;
}

export interface DBExtraFee {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  unit: string;
  created_at?: string;
}

export interface DBVacation {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  status: string;
  employee_name?: string;
}

export interface DBPayroll {
  id: number;
  employee_id: number;
  month: string;
  year: number;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  employee_name?: string;
  employee_position?: string;
}

export interface DBSettings {
  key: string;
  value: string;
}
