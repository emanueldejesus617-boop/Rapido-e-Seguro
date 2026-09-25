import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou utilizador não cadastrado.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    const authUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      papel: user.papel,
      postoId: user.postoId,
      postoNome: user.posto?.nome || null,
    };

    const token = await createSessionToken(authUser);
    await setSessionCookie(token);

    return NextResponse.json({
      message: 'Login realizado com sucesso',
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
  } catch (error: any) {
    console.error('Erro na rota de login:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar autenticação' },
      { status: 500 }
    );
  }
}
