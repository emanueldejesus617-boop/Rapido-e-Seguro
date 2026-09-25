export type UserRole = 'admin' | 'vendedor';
export type ReportStatus = 'rascunho' | 'fechado';
export type ChannelName = 'aki' | 'afrivendas' | 'zap' | 'unitel' | 'cartoes' | 'chips';
export type ExpenseCategory = 'renda' | 'saldo' | 'taxi' | 'outros';

export interface Posto {
  id: string;
  nome: string;
  codigo: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  papel: UserRole;
  postoId?: string | null;
  posto?: Posto | null;
  created_at?: string;
}

export interface SalesEntry {
  id?: string;
  report_id?: string;
  canal: ChannelName;
  valor_vendido: number;
  taxa: number;
  lucro_parcial: number;
}

export interface AkiBonus {
  id?: string;
  report_id?: string;
  valor: number;
}

export interface Expense {
  id?: string;
  report_id?: string;
  categoria: ExpenseCategory;
  descricao: string;
  valor: number;
}

export interface DailyReport {
  id: string;
  data: string; // YYYY-MM-DD
  user_id: string;
  posto_id?: string;
  postoId?: string;
  posto?: Posto;
  status: ReportStatus;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
  sales_entries?: SalesEntry[];
  aki_bonus?: AkiBonus | null;
  expenses?: Expense[];
  // Campos calculados
  soma_lucros_parciais?: number;
  total_vendas_brutas?: number;
  lucro_operacional?: number;
  total_saidas?: number;
  total_final?: number;
}
