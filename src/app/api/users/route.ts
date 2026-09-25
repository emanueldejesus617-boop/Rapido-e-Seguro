import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  papel: z.enum(['admin', 'vendedor']),
});

const updateUserSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6).optional().nullable(),
  papel: z.enum(['admin', 'vendedor']),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    return NextResponse.json({ error: 'Erro ao listar utilizadores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe um utilizador com este email' }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const newUser = await prisma.user.create({
      data: {
        nome: parsed.data.nome.trim(),
        email: parsed.data.email.toLowerCase().trim(),
        passwordHash,
        papel: parsed.data.papel,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    return NextResponse.json({ error: 'Erro ao criar utilizador' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 });
    }

    const dataToUpdate: any = {
      nome: parsed.data.nome.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      papel: parsed.data.papel,
    };

    if (parsed.data.password && parsed.data.password.trim().length >= 6) {
      dataToUpdate.passwordHash = await hashPassword(parsed.data.password.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsed.data.id },
      data: dataToUpdate,
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    return NextResponse.json({ error: 'Erro ao atualizar utilizador' }, { status: 500 });
  }
}
