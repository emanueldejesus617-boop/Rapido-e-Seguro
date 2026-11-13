import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listWholesaleCustomers, createWholesaleCustomer } from '@/lib/wholesaleRepository';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const customerCreateSchema = z.object({
  nome: z.string().min(2, 'Nome do cliente deve ter pelo menos 2 caracteres'),
  telefone: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  postoId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    // Vendas a grosso não possui vinculação por postos: lista geral de clientes
    const customers = await listWholesaleCustomers({ search });

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Erro ao listar clientes de atacado:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const parsed = customerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const customer = await createWholesaleCustomer({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone || undefined,
      localizacao: parsed.data.localizacao || undefined,
      postoId: null, // Sem vinculação a postos
    });

    return NextResponse.json({ customer, message: 'Cliente cadastrado com sucesso!' }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao cadastrar cliente de atacado:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

