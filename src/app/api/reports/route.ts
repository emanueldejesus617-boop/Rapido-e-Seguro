import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listReports, saveDailyReport, getReportByDate } from '@/lib/reportsRepository';
import { z } from 'zod';

const channelSchema = z.object({
  canal: z.enum(['aki', 'afrivendas', 'zap', 'unitel', 'cartoes', 'chips']),
  valor_vendido: z.number().min(0, 'Valor não pode ser negativo'),
  taxa: z.number().min(0, 'Taxa não pode ser negativa').default(0),
});

const expenseSchema = z.object({
  categoria: z.enum(['renda', 'saldo', 'taxi', 'outros']),
  descricao: z.string().optional().nullable().transform((val) => {
    if (val && typeof val === 'string' && val.trim() !== '') return val.trim();
    return 'Despesa';
  }),
  valor: z.number().min(0, 'Valor da saída não pode ser negativo'),
});

const reportPayloadSchema = z.object({
  data: z.string().min(10, 'Data obrigatória'),
  postoId: z.string().optional().nullable(),
  status: z.enum(['rascunho', 'fechado']).default('rascunho'),
  observacoes: z.string().optional().nullable(),
  channels: z.array(channelSchema),
  akiBonus: z.number().min(0).default(0),
  expenses: z.array(expenseSchema).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dataParam = searchParams.get('data');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const postoIdParam = searchParams.get('postoId') || undefined;

    // Se for vendedor, restringe estritamente ao seu posto
    const effectivePostoId = user.role === 'vendedor' ? (user.postoId || undefined) : postoIdParam;

    if (dataParam) {
      const report = await getReportByDate(dataParam, effectivePostoId);
      return NextResponse.json({ report });
    }

    const reports = await listReports({ startDate, endDate, status, postoId: effectivePostoId });
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Erro ao listar relatórios:', error);
    return NextResponse.json({ error: 'Erro ao buscar relatórios diários' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const parsed = reportPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados do relatório inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Definir posto alvo: vendedores usam seu posto obrigatório; administradores podem escolher
    let targetPostoId = user.postoId;
    if (user.role === 'admin') {
      targetPostoId = parsed.data.postoId || user.postoId;
    }

    if (!targetPostoId) {
      return NextResponse.json(
        { error: 'Posto de vendas não especificado. Selecione o posto para o relatório.' },
        { status: 400 }
      );
    }

    const report = await saveDailyReport({
      data: parsed.data.data,
      postoId: targetPostoId,
      status: parsed.data.status,
      observacoes: parsed.data.observacoes,
      channels: parsed.data.channels,
      akiBonus: parsed.data.akiBonus,
      expenses: parsed.data.expenses,
      userId: user.id,
    });

    return NextResponse.json({
      message: 'Relatório diário salvo com sucesso',
      report,
    });
  } catch (error: any) {
    console.error('Erro ao salvar relatório diário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar relatório diário' },
      { status: 400 }
    );
  }
}
