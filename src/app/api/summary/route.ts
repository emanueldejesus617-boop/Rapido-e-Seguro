import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listReports } from '@/lib/reportsRepository';

export const dynamic = 'force-dynamic';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'last_7_days';
    const postoIdParam = searchParams.get('postoId') || undefined;

    // Vendedor vê apenas o seu posto; Gerente pode ver todos (undefined) ou filtrar por posto específico
    const effectivePostoId = user.role === 'vendedor' ? (user.postoId || undefined) : (postoIdParam === 'all' ? undefined : postoIdParam);

    let startDate: string | undefined = searchParams.get('startDate') || undefined;
    let endDate: string | undefined = searchParams.get('endDate') || undefined;

    const now = new Date();
    let periodLabel = 'Últimos 7 Dias';

    if (period === 'today') {
      const todayStr = formatDate(now);
      startDate = todayStr;
      endDate = todayStr;
      periodLabel = 'Hoje';
    } else if (period === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDate(yest);
      startDate = yestStr;
      endDate = yestStr;
      periodLabel = 'Ontem';
    } else if (period === 'this_week' || period === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      startDate = formatDate(startOfWeek);
      endDate = formatDate(endOfWeek);
      periodLabel = 'Esta Semana';
    } else if (period === 'this_month' || period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      startDate = formatDate(startOfMonth);
      endDate = formatDate(endOfMonth);
      periodLabel = 'Este Mês';
    } else if (period === 'last_7_days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      startDate = formatDate(past7);
      endDate = formatDate(now);
      periodLabel = 'Últimos 7 Dias';
    } else if (period === 'last_30_days') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 29);
      startDate = formatDate(past30);
      endDate = formatDate(now);
      periodLabel = 'Últimos 30 Dias';
    } else if (period === 'all') {
      startDate = undefined;
      endDate = undefined;
      periodLabel = 'Todo o Histórico';
    } else if (period === 'custom') {
      if (!startDate || !endDate) {
        startDate = formatDate(now);
        endDate = formatDate(now);
      }
      periodLabel = `${startDate} até ${endDate}`;
    }

    const reports = await listReports({ startDate, endDate, postoId: effectivePostoId });

    let totalVendas = 0;
    let totalLucroBruto = 0;
    let totalTaxas = 0;
    let totalAkiBonus = 0;
    let totalSaidas = 0;
    let totalLiquido = 0;
    let closedCount = 0;

    const expensesByCategory: Record<string, number> = {
      renda: 0,
      saldo: 0,
      taxi: 0,
      outros: 0,
    };

    const timeline = reports.map((r) => {
      const v = r.total_vendas_brutas || 0;
      const l = r.soma_lucros_parciais || 0;
      const b = r.aki_bonus?.valor || 0;
      // Calcular saídas directamente das expenses do relatório (mais fiável)
      const expensesArr = r.expenses || [];
      const s = expensesArr.length > 0
        ? expensesArr.reduce((acc: number, exp: any) => acc + (Number(exp.valor) || 0), 0)
        : (r.total_saidas || 0);
      const f = r.total_final || 0;

      totalVendas += v;
      totalLucroBruto += l;
      totalTaxas += (r.sales_entries || []).reduce((acc: number, entry: any) => acc + (Number(entry.taxa) || 0), 0);
      totalAkiBonus += b;
      totalSaidas += s;
      totalLiquido += f; // Resultado Líquido oficial calculado (Vendas + Recarga Aki Lucro + Bónus Aki - Saídas)

      if (r.status === 'fechado') closedCount++;

      expensesArr.forEach((exp: any) => {
        const cat = exp.categoria?.toLowerCase() || 'outros';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(exp.valor || 0);
      });

      return {
        date: r.data,
        vendas: v,
        lucroBruto: l,
        bonusAki: b,
        saidas: s,
        resultadoLiquido: f,
        status: r.status,
        reportId: r.id,
      };
    });

    let bestDay = timeline.length > 0 ? timeline[0] : null;
    let worstDay = timeline.length > 0 ? timeline[0] : null;

    timeline.forEach((item) => {
      if (bestDay && item.resultadoLiquido > bestDay.resultadoLiquido) bestDay = item;
      if (worstDay && item.resultadoLiquido < worstDay.resultadoLiquido) worstDay = item;
    });

    const summary = {
      period: {
        start: startDate || (reports.length > 0 ? reports[reports.length - 1].data : ''),
        end: endDate || (reports.length > 0 ? reports[0].data : ''),
        label: periodLabel,
      },
      sales: {
        totalSales: totalVendas,
        totalGrossProfit: totalLucroBruto,
        totalTaxas: totalTaxas,
        totalAkiBonus: totalAkiBonus,
      },
      expenses: {
        totalExpenses: totalSaidas,
        byCategory: expensesByCategory,
      },
      netResult: totalLiquido,
      reportCount: reports.length,
      closedReportsCount: closedCount,
    };

    return NextResponse.json({
      summary,
      timeline,
      bestDay,
      worstDay,
      reports,
    });
  } catch (error) {
    console.error('Erro ao calcular sumário consolidado:', error);
    return NextResponse.json({ error: 'Erro ao calcular sumário consolidado' }, { status: 500 });
  }
}
