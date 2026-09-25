import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listReports } from '@/lib/reportsRepository';
import { HistoryEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const postoIdParam = searchParams.get('postoId') || undefined;

    // Vendedor vê apenas o seu posto; Gerente pode ver todos ou filtrar por posto
    const effectivePostoId = user.role === 'vendedor' ? (user.postoId || undefined) : (postoIdParam === 'all' ? undefined : postoIdParam);

    // 🔍 Pesquisa agora delegada ao Prisma — evita carregar todos os registos em memória
    const search = searchParams.get('search') || undefined;

    const reports = await listReports({ startDate, endDate, search, postoId: effectivePostoId });

    const unified: HistoryEntry[] = [];

    reports.forEach((rep) => {
      const postoNome = rep.posto?.nome || 'Posto';
      const postoId = rep.postoId;

      // 1. Entradas de Vendas por Canal
      (rep.sales_entries || []).forEach((s) => {
        if (s.valor_vendido > 0 || s.taxa > 0) {
          unified.push({
            id: `${rep.id}-sale-${s.canal}`,
            reportId: rep.id,
            date: rep.data,
            time: '23:59',
            type: 'VENDA',
            title: `Venda - ${s.canal.toUpperCase()}`,
            description: `Valor Vendido: ${s.valor_vendido} Kz | Taxa: ${s.taxa} Kz | Lucro: ${s.lucro_parcial} Kz`,
            amount: s.valor_vendido,
            category: s.canal,
            operatorName: rep.user?.nome || 'Operador',
            postoNome,
            postoId,
            status: rep.status,
          });
        }
      });

      // 2. Bónus AKI
      if (rep.aki_bonus && rep.aki_bonus.valor > 0) {
        unified.push({
          id: `${rep.id}-bonus-aki`,
          reportId: rep.id,
          date: rep.data,
          time: '23:59',
          type: 'BONUS',
          title: 'Bónus AKI (Informativo)',
          description: `Bónus atribuído pela plataforma AKI no valor de ${rep.aki_bonus.valor} Kz`,
          amount: rep.aki_bonus.valor,
          category: 'aki',
          operatorName: rep.user?.nome || 'Operador',
          postoNome,
          postoId,
          status: rep.status,
        });
      }

      // 3. Saídas / Despesas
      (rep.expenses || []).forEach((exp, idx) => {
        if (exp.valor > 0) {
          unified.push({
            id: `${rep.id}-exp-${idx}`,
            reportId: rep.id,
            date: rep.data,
            time: '23:59',
            type: 'SAIDA',
            title: `Saída: ${exp.descricao || exp.categoria.toUpperCase()}`,
            description: `Categoria: ${exp.categoria.toUpperCase()} | Despesa operacional`,
            amount: exp.valor,
            category: exp.categoria,
            operatorName: rep.user?.nome || 'Operador',
            postoNome,
            postoId,
            status: rep.status,
          });
        }
      });
    });

    unified.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      totalCount: unified.length,
      items: unified,
    });
  } catch (error) {
    console.error('Erro na consulta do histórico unificado:', error);
    return NextResponse.json({ error: 'Erro ao consultar histórico' }, { status: 500 });
  }
}
