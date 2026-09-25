import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const postos = await prisma.posto.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    });

    return NextResponse.json({ postos });
  } catch (error) {
    console.error('Erro ao buscar postos:', error);
    return NextResponse.json({ error: 'Erro ao buscar postos de venda' }, { status: 500 });
  }
}
