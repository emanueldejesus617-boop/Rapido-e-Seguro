import { NextResponse } from 'next/server';
import { removeSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  await removeSessionCookie();
  return NextResponse.json({ message: 'Sessão encerrada com sucesso' });
}
