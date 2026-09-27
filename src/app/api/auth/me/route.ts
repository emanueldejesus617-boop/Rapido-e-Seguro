import { NextResponse } from 'next/server';
import { getCurrentUser, createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Tenta enriquecer com dados do banco de dados se acessível
  let effectiveUser = sessionUser;
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
        },
      });
    }

    if (user) {
      effectiveUser = {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.papel as any,
        postoId: user.postoId,
        postoNome: user.posto?.nome || null,
        isActive: true,
      };
    }
  } catch (dbErr) {
    console.warn('Aviso: Falha ao carregar utilizador do banco em /api/auth/me, usando dados da sessão:', dbErr);
  }

  const response = NextResponse.json({
    user: effectiveUser,
  });

  // Garantir cookie de sessão válido no browser
  try {
    const token = await createSessionToken({
      id: effectiveUser.id,
      nome: effectiveUser.name,
      email: effectiveUser.email,
      papel: effectiveUser.role,
      postoId: effectiveUser.postoId,
      postoNome: effectiveUser.postoNome,
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (tokenErr) {
    console.warn('Aviso: Falha ao emitir token em /api/auth/me:', tokenErr);
  }

  return response;
}
