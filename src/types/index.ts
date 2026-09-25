export type UserRole = 'admin' | 'vendedor';

export interface Posto {
  id: string;
  nome: string;
  codigo: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  postoId?: string | null;
  postoNome?: string | null;
  isActive?: boolean;
}

export type ChannelName = 'aki' | 'afrivendas' | 'zap' | 'unitel' | 'cartoes' | 'chips';
export type ExpenseCategory = 'renda' | 'saldo' | 'taxi' | 'outros';
export type ReportStatus = 'rascunho' | 'fechado';

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
  user?: {
    id: string;
    nome: string;
    email: string;
    papel: UserRole;
    postoId?: string | null;
    posto?: Posto | null;
  };
  sales_entries?: SalesEntry[];
  aki_bonus?: AkiBonus | null;
  expenses?: Expense[];
  soma_lucros_parciais?: number;
  total_vendas_brutas?: number;
  lucro_operacional?: number;
  total_saidas?: number;
  total_final?: number;
}

export interface FinancialSummary {
  period: {
    start: string;
    end: string;
    label: string;
  };
  posto?: {
    id: string | null;
    nome: string;
  };
  sales: {
    totalSales: number;
    totalGrossProfit: number;
    totalTaxas: number;
    totalAkiBonus: number;
  };
  expenses: {
    totalExpenses: number;
    byCategory: Record<string, number>;
  };
  netResult: number;
  reportCount: number;
  closedReportsCount: number;
}

export interface HistoryEntry {
  id: string;
  reportId: string;
  date: string;
  time: string;
  type: 'VENDA' | 'SAIDA' | 'BONUS' | 'RELATORIO';
  title: string;
  description: string;
  amount: number;
  category?: string;
  operatorName: string;
  postoNome?: string;
  postoId?: string;
  status: ReportStatus;
}
