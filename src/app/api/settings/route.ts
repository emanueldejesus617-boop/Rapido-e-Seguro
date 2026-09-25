import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Configurações padrão — usadas como fallback se a BD não tiver entradas
const DEFAULT_SETTINGS = {
  companyName: 'Rápido e Seguro — Gestão de Vendas',
  nif: '5001239841',
  phone: '+244 923 000 000 / +244 931 000 000',
  address: 'Luanda, Angola',
  currency: 'Kz',
  defaultAkiFeePercentage: 2.5,
  defaultAfrivendasMarginPercentage: 5.0,
  expenseCategories: ['renda', 'saldo', 'taxi', 'outros'],
};

/** Lê todas as entradas da BD e reconstrói o objeto de settings */
async function loadSettingsFromDb(): Promise<typeof DEFAULT_SETTINGS> {
  const rows = await prisma.appSettings.findMany();
  if (rows.length === 0) return DEFAULT_SETTINGS;

  // Começa com os valores padrão e sobrescreve com o que estiver na BD
  const merged: Record<string, any> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    try {
      merged[row.key] = JSON.parse(row.value);
    } catch {
      merged[row.key] = row.value; // fallback: string simples
    }
  }
  return merged as typeof DEFAULT_SETTINGS;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const settings = await loadSettingsFromDb();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[settings GET] Erro ao carregar configurações:', error);
    // Fallback seguro: devolve os valores padrão mesmo em caso de erro da BD
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas Administradores podem alterar configurações' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Persistir cada campo individualmente na tabela AppSettings
    const upsertPromises = Object.entries(body).map(([key, value]) =>
      prisma.appSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      })
    );

    await Promise.all(upsertPromises);

    // Devolver as configurações atualizadas (merged com defaults)
    const updated = await loadSettingsFromDb();

    return NextResponse.json({
      message: 'Configurações guardadas com sucesso',
      settings: updated,
    });
  } catch (error) {
    console.error('[settings POST] Erro ao guardar configurações:', error);
    return NextResponse.json({ error: 'Erro ao guardar configurações' }, { status: 500 });
  }
}
