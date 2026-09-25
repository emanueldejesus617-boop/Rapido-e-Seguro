import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie, hashPassword } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Credenciais padrão do sistema (Administrador e Vendedor)
const DEFAULT_USERS = [
  {
    email: 'cristovao@rapidoeseguro.ao',
    nome: 'Cristovão',
    senhaPadrao: 'cristovao123',
    papel: 'admin',
  },
  {
    email: 'admin@rapidoeseguro.ao',
    nome: 'Administrador Geral',
    senhaPadrao: 'admin123',
    papel: 'admin',
  },
  {
    email: 'vendedor@rapidoeseguro.ao',
    nome: 'Vendedor Balcão',
    senhaPadrao: 'vendedor123',
    papel: 'vendedor',
  },
];

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
    const cleanEmail = email.toLowerCase().trim();

    // 1. Tentar autenticação via Banco de Dados (Supabase PostgreSQL / SQLite)
    let user = null;
    let dbAvailable = false;

    const hasDatabaseUrl = Boolean(
      process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.startsWith('postgres://') ||
       process.env.DATABASE_URL.startsWith('postgresql://'))
    );

    if (hasDatabaseUrl) {
      try {
        user = await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: {
            posto: {
              select: { id: true, nome: true, codigo: true },
            },
          },
        });
        dbAvailable = true;

        // Se o banco estiver vazio ou o utilizador padrão ainda não existir no banco,
        // auto-registar o utilizador padrão caso as credenciais coincidam
        if (!user) {
          const defaultAccount = DEFAULT_USERS.find(
            (u) => u.email === cleanEmail && u.senhaPadrao === password
          );

          if (defaultAccount) {
            try {
              // Garantir existência de pelo menos 1 posto
              let posto = await prisma.posto.findFirst();
              if (!posto) {
                posto = await prisma.posto.create({
                  data: { nome: 'Posto 1', codigo: 'posto-1' },
                });
                await prisma.posto.create({
                  data: { nome: 'Posto 2', codigo: 'posto-2' },
                });
              }

              const newPasswordHash = await hashPassword(password);
              user = await prisma.user.create({
                data: {
                  nome: defaultAccount.nome,
                  email: defaultAccount.email,
                  passwordHash: newPasswordHash,
                  papel: defaultAccount.papel,
                  postoId: defaultAccount.papel === 'admin' ? null : posto.id,
                },
                include: {
                  posto: {
                    select: { id: true, nome: true, codigo: true },
                  },
                },
              });
            } catch (autoSeedErr) {
              console.warn('Aviso: Não foi possível auto-registar utilizador no banco:', autoSeedErr);
            }
          }
        }
      } catch (dbErr: any) {
        console.warn('Aviso: Falha ao consultar base de dados:', dbErr.message);
        dbAvailable = false;
      }
    }

    // 2. Se o utilizador foi encontrado no banco, validar palavra-passe com bcrypt
    if (user) {
      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Palavra-passe incorreta.' },
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

      const response = NextResponse.json({
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

      // Garantir cookie na resposta HTTP explicitamente
      response.cookies.set('rs_session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 3. Fallback de Contingência / Demonstração (caso o banco não esteja configurado ou acessível)
    const fallbackMatch = DEFAULT_USERS.find(
      (u) => u.email === cleanEmail && u.senhaPadrao === password
    );

    if (fallbackMatch) {
      const fallbackUser = {
        id: `demo-${fallbackMatch.papel}`,
        nome: fallbackMatch.nome,
        email: fallbackMatch.email,
        papel: fallbackMatch.papel,
        postoId: null,
        postoNome: 'Acesso Geral',
      };

      const token = await createSessionToken(fallbackUser);
      await setSessionCookie(token);

      const response = NextResponse.json({
        message: dbAvailable
          ? 'Login realizado com sucesso'
          : 'Login efetuado (Modo de Demonstração / DATABASE_URL pendente)',
        warning: !dbAvailable
          ? 'Base de dados Supabase não conectada. Configure a DATABASE_URL nas variáveis de ambiente do Vercel para persistência permanente.'
          : undefined,
        user: {
          id: fallbackUser.id,
          name: fallbackUser.nome,
          email: fallbackUser.email,
          role: fallbackUser.papel,
          postoId: null,
          postoNome: 'Acesso Geral',
          isActive: true,
        },
      });

      // Garantir cookie na resposta HTTP explicitamente
      response.cookies.set('rs_session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 4. Credenciais inválidas
    return NextResponse.json(
      { 
        error: 'Credenciais inválidas. Verifique o email e a palavra-passe.',
        dica: 'Utilize o email "cristovao@rapidoeseguro.ao" com a senha "cristovao123"'
      },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Erro na rota de login:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar autenticação',
        detalhe: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
