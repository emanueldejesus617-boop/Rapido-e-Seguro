import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listReports } from '@/lib/reportsRepository';
import { MonthlyReport, ChannelName, ExpenseCategory, MonthlyChannelMetric, MonthlyExpenseMetric } from '@/types';

export const dynamic = 'force-dynamic';

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ALL_CHANNELS: { id: ChannelName; nome: string }[] = [
  { id: 'aki', nome: 'AKI' },
  { id: 'afrivendas', nome: 'Afrivendas' },
  { id: 'zap', nome: 'ZAP' },
  { id: 'unitel', nome: 'Unitel' },
  { id: 'cartoes', nome: 'Cartões' },
  { id: 'chips', nome: 'Chips' },
];

const ALL_EXPENSE_CATEGORIES: { id: ExpenseCategory; nome: string }[] = [
  { id: 'renda', nome: 'Renda' },
  { id: 'saldo', nome: 'Saldo' },
  { id: 'taxi', nome: 'Táxi' },
  { id: 'outros', nome: 'Outros' },
];

function toYearMonth(dateStr: string): string {
  // dateStr: 'YYYY-MM-DD' → 'YYYY-MM'
  return dateStr.slice(0, 7);
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_PT[monthIndex]} ${year}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postoIdParam = searchParams.get('postoId') || undefined;

    // Vendedor vê apenas o seu posto; Gerente pode ver todos ou filtrar
    const effectivePostoId =
      user.role === 'vendedor'
        ? (user.postoId || undefined)
        : postoIdParam === 'all' || !postoIdParam
        ? undefined
        : postoIdParam;

    // Buscar todos os relatórios
    const reports = await listReports({ postoId: effectivePostoId });

    // Estrutura interna para agrupar dados do mês
    interface MonthAccumulator {
      yearMonth: string;
      label: string;
      totalVendas: number;
      totalLucro: number;
      totalBonus: number;
      totalSaidas: number;
      resultadoLiquido: number;
      reportCount: number;
      closedCount: number;
      postos: string[];
      channelData: Record<string, { totalVendido: number; totalTaxa: number; count: number }>;
      expenseData: Record<string, number>;
    }

    const monthMap = new Map<string, MonthAccumulator>();

    for (const rep of reports) {
      const ym = toYearMonth(rep.data);

      if (!monthMap.has(ym)) {
        const initChannels: Record<string, { totalVendido: number; totalTaxa: number; count: number }> = {};
        ALL_CHANNELS.forEach((c) => {
          initChannels[c.id] = { totalVendido: 0, totalTaxa: 0, count: 0 };
        });

        const initExpenses: Record<string, number> = {};
        ALL_EXPENSE_CATEGORIES.forEach((e) => {
          initExpenses[e.id] = 0;
        });

        monthMap.set(ym, {
          yearMonth: ym,
          label: formatMonthLabel(ym),
          totalVendas: 0,
          totalLucro: 0,
          totalBonus: 0,
          totalSaidas: 0,
          resultadoLiquido: 0,
          reportCount: 0,
          closedCount: 0,
          postos: [],
          channelData: initChannels,
          expenseData: initExpenses,
        });
      }

      const entry = monthMap.get(ym)!;

      const vendas = rep.total_vendas_brutas || 0;
      const lucro = rep.total_taxas_acrescentadas || 0;
      const bonus = rep.aki_bonus?.valor || 0;
      const saidas = rep.total_saidas || 0;
      const liquido = rep.total_final || 0;

      entry.totalVendas += vendas;
      entry.totalLucro += lucro;
      entry.totalBonus += bonus;
      entry.totalSaidas += saidas;
      entry.resultadoLiquido += liquido;
      entry.reportCount += 1;
      if (rep.status === 'fechado') entry.closedCount += 1;

      // Postos
      const postoNome = rep.posto?.nome;
      if (postoNome && !entry.postos.includes(postoNome)) {
        entry.postos.push(postoNome);
      }

      // Acumular canais de venda
      if (rep.sales_entries && Array.isArray(rep.sales_entries)) {
        for (const s of rep.sales_entries) {
          const cid = s.canal;
          if (!entry.channelData[cid]) {
            entry.channelData[cid] = { totalVendido: 0, totalTaxa: 0, count: 0 };
          }
          entry.channelData[cid].totalVendido += s.valor_vendido || 0;
          entry.channelData[cid].totalTaxa += s.taxa || 0;
          if ((s.valor_vendido || 0) > 0 || (s.taxa || 0) > 0) {
            entry.channelData[cid].count += 1;
          }
        }
      }

      // Acumular despesas
      if (rep.expenses && Array.isArray(rep.expenses)) {
        for (const e of rep.expenses) {
          const cat = e.categoria;
          if (entry.expenseData[cat] === undefined) {
            entry.expenseData[cat] = 0;
          }
          entry.expenseData[cat] += e.valor || 0;
        }
      }
    }

    // Formatar meses finais com métricas calculadas
    const months: MonthlyReport[] = Array.from(monthMap.values())
      .map((acc) => {
        const channels: MonthlyChannelMetric[] = ALL_CHANNELS.map((ch) => {
          const d = acc.channelData[ch.id] || { totalVendido: 0, totalTaxa: 0, count: 0 };
          const totalArrecadado = d.totalVendido + d.totalTaxa;
          const participacaoVendas = acc.totalVendas > 0 ? (d.totalVendido / acc.totalVendas) * 100 : 0;
          return {
            canal: ch.id,
            nome: ch.nome,
            totalVendido: d.totalVendido,
            totalTaxa: d.totalTaxa,
            totalArrecadado,
            participacaoVendas,
            operacoesCount: d.count,
          };
        });

        const expensesByCategory: MonthlyExpenseMetric[] = ALL_EXPENSE_CATEGORIES.map((cat) => {
          const total = acc.expenseData[cat.id] || 0;
          const participacaoSaidas = acc.totalSaidas > 0 ? (total / acc.totalSaidas) * 100 : 0;
          return {
            categoria: cat.id,
            nome: cat.nome,
            total,
            participacaoSaidas,
          };
        });

        return {
          yearMonth: acc.yearMonth,
          label: acc.label,
          totalVendas: acc.totalVendas,
          totalLucro: acc.totalLucro,
          totalBonus: acc.totalBonus,
          totalSaidas: acc.totalSaidas,
          resultadoLiquido: acc.resultadoLiquido,
          reportCount: acc.reportCount,
          closedCount: acc.closedCount,
          postos: acc.postos,
          channels,
          expensesByCategory,
        };
      })
      .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

    return NextResponse.json({ months, totalMonths: months.length });
  } catch (error) {
    console.error('Erro ao calcular histórico mensal com métricas por canal:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular histórico mensal' },
      { status: 500 }
    );
  }
}
