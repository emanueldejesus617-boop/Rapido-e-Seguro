import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getWholesaleSummary } from '@/lib/wholesaleRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const summary = await getWholesaleSummary();
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Erro ao buscar resumo de vendas a grosso:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

