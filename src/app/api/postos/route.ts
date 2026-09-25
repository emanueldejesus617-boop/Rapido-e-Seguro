import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    try {
      const postos = await prisma.posto.findMany({
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      });

      if (postos && postos.length > 0) {
        return NextResponse.json({ postos });
      }
    } catch (dbErr) {
      console.warn('Aviso: Falha ao buscar postos no banco, usando postos padrão:', dbErr);
    }

    // Postos padrão caso o banco ainda não possua registros
    return NextResponse.json({
      postos: [
        { id: 'posto-1', nome: 'Posto 1', codigo: 'posto-1' },
        { id: 'posto-2', nome: 'Posto 2', codigo: 'posto-2' },
      ],
    });
  } catch (error) {
    console.error('Erro ao buscar postos:', error);
    return NextResponse.json({ error: 'Erro ao buscar postos de venda' }, { status: 500 });
  }
}
