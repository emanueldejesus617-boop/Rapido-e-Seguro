import { WholesaleProduct, WholesaleSale } from '@/types';

export interface ProductOption {
  id: WholesaleProduct;
  label: string;
  defaultValor: number;
  badgeClass: string;
  category: 'recarga' | 'cartao';
}

export const WHOLESALE_PRODUCTS: ProductOption[] = [
  {
    id: 'afrivendas',
    label: 'Afrivendas',
    defaultValor: 0,
    badgeClass: 'bg-blue-950/80 text-blue-400 border border-blue-800/60',
    category: 'recarga',
  },
  {
    id: 'zap',
    label: 'Zap',
    defaultValor: 0,
    badgeClass: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
    category: 'recarga',
  },
  {
    id: 'cartoes_500',
    label: 'Cartões de 500kz',
    defaultValor: 500,
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
    category: 'cartao',
  },
  {
    id: 'cartoes_200',
    label: 'Cartões de 200kz',
    defaultValor: 200,
    badgeClass: 'bg-teal-950/80 text-teal-400 border border-teal-800/60',
    category: 'cartao',
  },
  {
    id: 'africel',
    label: 'Africel',
    defaultValor: 0,
    badgeClass: 'bg-purple-950/80 text-purple-400 border border-purple-800/60',
    category: 'recarga',
  },
  {
    id: 'unitel',
    label: 'Unitel',
    defaultValor: 0,
    badgeClass: 'bg-orange-950/80 text-orange-400 border border-orange-800/60',
    category: 'recarga',
  },
];

export function getProductConfig(id: string): ProductOption {
  const found = WHOLESALE_PRODUCTS.find((p) => p.id === id);
  if (found) return found;
  return {
    id: id as WholesaleProduct,
    label: id,
    defaultValor: 0,
    badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    category: 'recarga',
  };
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function formatYearMonthPt(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth || 'Sem Data';
  const parts = yearMonth.split('-');
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_PT[monthIdx] || parts[1];
  return `${monthName} de ${year}`;
}

export interface ProductSubtotalItem {
  produto: string;
  label: string;
  badgeClass: string;
  quantidade: number;
  valorTotal: number;
  bonusTotal: number;
  totalFinal: number;
}

export interface MonthSubtotals {
  yearMonth: string; // "2026-11"
  label: string;     // "Novembro de 2026"
  totalQuantidade: number;
  totalValor: number;
  totalBonus: number;
  totalFinal: number;
  salesCount: number;
  byProduct: Record<string, ProductSubtotalItem>;
  sales: WholesaleSale[];
}

export function groupSalesByMonth(sales: WholesaleSale[]): MonthSubtotals[] {
  const map = new Map<string, MonthSubtotals>();

  for (const s of sales) {
    const ym = s.data && s.data.length >= 7 ? s.data.slice(0, 7) : 'outros';

    if (!map.has(ym)) {
      map.set(ym, {
        yearMonth: ym,
        label: formatYearMonthPt(ym),
        totalQuantidade: 0,
        totalValor: 0,
        totalBonus: 0,
        totalFinal: 0,
        salesCount: 0,
        byProduct: {},
        sales: [],
      });
    }

    const m = map.get(ym)!;
    const qtd = Number(s.quantidade) || 0;
    const valUnit = Number(s.valor) || 0;
    const bns = Number(s.bonus) || 0;
    const tot = Number(s.total) || 0;
    const valBruto = qtd * valUnit;

    m.totalQuantidade += qtd;
    m.totalValor += valBruto;
    m.totalBonus += bns;
    m.totalFinal += tot;
    m.salesCount += 1;
    m.sales.push(s);

    const cfg = getProductConfig(s.produto);
    if (!m.byProduct[s.produto]) {
      m.byProduct[s.produto] = {
        produto: s.produto,
        label: cfg.label,
        badgeClass: cfg.badgeClass,
        quantidade: 0,
        valorTotal: 0,
        bonusTotal: 0,
        totalFinal: 0,
      };
    }
    m.byProduct[s.produto].quantidade += qtd;
    m.byProduct[s.produto].valorTotal += valBruto;
    m.byProduct[s.produto].bonusTotal += bns;
    m.byProduct[s.produto].totalFinal += tot;
  }

  // Ordenar decrescente por ano-mês
  return Array.from(map.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}
