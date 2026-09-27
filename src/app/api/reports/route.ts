import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listReports, saveDailyReport, getReportByDate } from '@/lib/reportsRepository';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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

    // Definir posto alvo: administradores podem escolher; vendedores usam seu posto ou o selecionado
    let candidatePostoId = user.role === 'admin'
      ? (parsed.data.postoId || user.postoId)
      : (user.postoId || parsed.data.postoId);

    // Resolver Posto real no banco (suporta UUID, código como 'posto-1' ou fallback para o 1º posto)
    let targetPostoId = candidatePostoId;
    if (candidatePostoId) {
      const postoMatch = await prisma.posto.findFirst({
        where: {
          OR: [
            { id: candidatePostoId },
            { codigo: candidatePostoId },
            { nome: candidatePostoId },
          ],
        },
      });
      if (postoMatch) {
        targetPostoId = postoMatch.id;
      }
    }

    if (!targetPostoId) {
      const firstPosto = await prisma.posto.findFirst();
      if (firstPosto) {
        targetPostoId = firstPosto.id;
      }
    }

    if (!targetPostoId) {
      return NextResponse.json(
        { error: 'Nenhum posto de vendas encontrado no sistema. Crie um posto antes de gravar relatórios.' },
        { status: 400 }
      );
    }

    // Resolver Utilizador real no banco para garantir integridade referencial
    let effectiveUserId = user.id;
    let userRecord = await prisma.user.findUnique({ where: { id: user.id } }).catch(() => null);
    if (!userRecord && user.email) {
      userRecord = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase().trim() },
      }).catch(() => null);
      if (userRecord) {
        effectiveUserId = userRecord.id;
      }
    }
    if (!userRecord) {
      const adminFallback = await prisma.user.findFirst({
        where: { papel: 'admin' },
      }).catch(() => null);
      if (adminFallback) {
        effectiveUserId = adminFallback.id;
      }
    }

    const report = await saveDailyReport({
      data: parsed.data.data,
      postoId: targetPostoId,
      status: parsed.data.status,
      observacoes: parsed.data.observacoes,
      channels: parsed.data.channels,
      akiBonus: parsed.data.akiBonus,
      expenses: parsed.data.expenses,
      userId: effectiveUserId,
    });

    const response = NextResponse.json({
      message: parsed.data.status === 'fechado'
        ? 'Relatório diário fechado com sucesso'
        : 'Rascunho guardado com sucesso',
      report,
    });

    try {
      const { createSessionToken, COOKIE_NAME } = await import('@/lib/auth');
      const token = await createSessionToken({
        id: effectiveUserId,
        nome: user.name,
        email: user.email,
        papel: user.role,
        postoId: targetPostoId,
        postoNome: user.postoNome,
      });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch {
      // Ignorar erro ao emitir cookie
    }

    return response;
  } catch (error: any) {
    console.error('Erro ao salvar relatório diário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar relatório diário' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas o Administrador tem permissão para apagar o histórico de relatórios.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      const { clearAllReports } = await import('@/lib/reportsRepository');
      const result = await clearAllReports(true);
      return NextResponse.json({
        message: `Histórico apagado com sucesso. ${result.count} relatórios eliminados.`,
        count: result.count,
      });
    }

    return NextResponse.json({ error: 'Parâmetro de eliminação inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao apagar histórico:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar eliminação de histórico' },
      { status: 500 }
    );
  }
}
