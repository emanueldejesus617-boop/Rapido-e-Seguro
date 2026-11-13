import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createWholesaleSale } from '@/lib/wholesaleRepository';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const wholesaleSaleSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  data: z.string().min(10, 'Data da venda é obrigatória'),
  produto: z.string().min(1, 'Produto é obrigatório'),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  valor: z.number().min(0, 'Valor não pode ser negativo'),
  bonus: z.number().default(0),
  total: z.number().optional(),
  observacoes: z.string().optional().nullable(),
  postoId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || undefined;
    const produto = searchParams.get('produto') || undefined;
    const dataInicio = searchParams.get('startDate') || undefined;
    const dataFim = searchParams.get('endDate') || undefined;
    const postoIdParam = searchParams.get('postoId') || undefined;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (produto) where.produto = produto;
    if (dataInicio && dataFim) {
      where.data = { gte: dataInicio, lte: dataFim };
    } else if (dataInicio) {
      where.data = { gte: dataInicio };
    } else if (dataFim) {
      where.data = { lte: dataFim };
    }

    if (user.role === 'vendedor') {
      if (user.postoId) where.postoId = user.postoId;
    } else if (postoIdParam && postoIdParam !== 'all') {
      where.postoId = postoIdParam;
    }

    const sales = await prisma.wholesaleSale.findMany({
      where,
      include: {
        customer: { select: { id: true, nome: true, telefone: true } },
        user: { select: { id: true, nome: true } },
        posto: { select: { id: true, nome: true } },
      },
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error('Erro ao listar vendas a grosso:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const parsed = wholesaleSaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const effectivePostoId = user.role === 'vendedor'
      ? user.postoId
      : (parsed.data.postoId || user.postoId);

    const sale = await createWholesaleSale({
      customerId: parsed.data.customerId,
      userId: user.id,
      postoId: effectivePostoId || undefined,
      data: parsed.data.data,
      produto: parsed.data.produto,
      quantidade: parsed.data.quantidade,
      valor: parsed.data.valor,
      bonus: parsed.data.bonus,
      total: parsed.data.total,
      observacoes: parsed.data.observacoes || undefined,
    });

    return NextResponse.json({ sale, message: 'Venda a grosso registada com sucesso!' }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao registar venda a grosso:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

