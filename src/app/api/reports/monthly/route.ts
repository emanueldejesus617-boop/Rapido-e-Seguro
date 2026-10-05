import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listReports } from '@/lib/reportsRepository';
import { MonthlyReport } from '@/types';

export const dynamic = 'force-dynamic';

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
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

    // Buscar todos os relatórios (sem filtro de data — queremos todos os meses)
    const reports = await listReports({ postoId: effectivePostoId });

    // Agrupar por YYYY-MM
    const monthMap = new Map<string, MonthlyReport>();

    for (const rep of reports) {
      const ym = toYearMonth(rep.data);

      if (!monthMap.has(ym)) {
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
        });
      }

      const entry = monthMap.get(ym)!;

      const vendas = rep.total_vendas_brutas || 0;
      const lucro = rep.soma_lucros_parciais || 0;
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

      // Recolher nomes dos postos únicos neste mês
      const postoNome = rep.posto?.nome;
      if (postoNome && !entry.postos.includes(postoNome)) {
        entry.postos.push(postoNome);
      }
    }

    // Ordenar do mais recente para o mais antigo
    const months: MonthlyReport[] = Array.from(monthMap.values()).sort(
      (a, b) => b.yearMonth.localeCompare(a.yearMonth)
    );

    return NextResponse.json({ months, totalMonths: months.length });
  } catch (error) {
    console.error('Erro ao calcular histórico mensal:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular histórico mensal' },
      { status: 500 }
    );
  }
}
