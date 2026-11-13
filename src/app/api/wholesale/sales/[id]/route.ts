import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateWholesaleSale, deleteWholesaleSale } from '@/lib/wholesaleRepository';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const wholesaleSaleUpdateSchema = z.object({
  data: z.string().optional(),
  produto: z.string().optional(),
  quantidade: z.number().min(0.01).optional(),
  valor: z.number().min(0).optional(),
  bonus: z.number().optional(),
  total: z.number().optional(),
  observacoes: z.string().optional().nullable(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const parsed = wholesaleSaleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateWholesaleSale(params.id, parsed.data);
    return NextResponse.json({ sale: updated, message: 'Venda atualizada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao atualizar venda a grosso:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    await deleteWholesaleSale(params.id);
    return NextResponse.json({ success: true, message: 'Venda a grosso removida com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao excluir venda a grosso:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

