import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Tenta enriquecer com dados do banco de dados se acessível
  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        postoId: true,
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
        createdAt: true,
      },
    });

    if (user) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.papel,
          postoId: user.postoId,
          postoNome: user.posto?.nome || null,
          isActive: true,
        },
      });
    }
  } catch (dbErr) {
    console.warn('Aviso: Falha ao carregar utilizador do banco em /api/auth/me, usando dados da sessão:', dbErr);
  }

  // Fallback garantido: os dados da sessão JWT são válidos
  return NextResponse.json({
    user: {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
      postoId: sessionUser.postoId || null,
      postoNome: sessionUser.postoNome || null,
      isActive: true,
    },
  });
}
