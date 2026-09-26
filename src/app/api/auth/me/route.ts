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
    let user = await prisma.user.findUnique({
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

    if (!user && sessionUser.email) {
      user = await prisma.user.findUnique({
        where: { email: sessionUser.email.toLowerCase().trim() },
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
    }

    if (user) {
      const response = NextResponse.json({
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

      // Se o ID da sessão era diferente (ex: demo-*), atualizar cookie para a sessão real
      if (sessionUser.id !== user.id) {
        const { createSessionToken } = await import('@/lib/auth');
        const token = await createSessionToken({
          id: user.id,
          nome: user.nome,
          email: user.email,
          papel: user.papel,
          postoId: user.postoId,
          postoNome: user.posto?.nome || null,
        });
        response.cookies.set('rs_session_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      return response;
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
