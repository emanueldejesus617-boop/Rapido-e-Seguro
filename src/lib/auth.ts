import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AuthUser } from '@/types';

// 🔐 SEGURANÇA: Em produção, JWT_SECRET DEVE estar definido nas variáveis de ambiente.
// Nunca utilize a chave de fallback em produção — é apenas para desenvolvimento local.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error(
    '[auth.ts] ERRO CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente! ' +
    'Defina JWT_SECRET antes de iniciar o servidor em produção.'
  );
}

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'rapido_e_seguro_super_secret_jwt_key_2026_angola_finance'
);

const COOKIE_NAME = 'rs_session_token';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: {
  id: string;
  nome: string;
  email: string;
  papel: string;
  postoId?: string | null;
  postoNome?: string | null;
}): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.nome,
    email: user.email,
    role: user.papel,
    postoId: user.postoId ?? null,
    postoNome: user.postoNome ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as any,
      postoId: (payload.postoId as string) || null,
      postoNome: (payload.postoNome as string) || null,
      isActive: true,
    };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function removeSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
