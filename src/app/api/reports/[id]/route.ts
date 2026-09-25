import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getReportById, closeReport, deleteReport } from '@/lib/reportsRepository';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const report = await getReportById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    if (body.action === 'close') {
      const closed = await closeReport(params.id);
      return NextResponse.json({
        message: 'Relatório diário fechado com sucesso!',
        report: closed,
      });
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao fechar relatório' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    await deleteReport(params.id);
    return NextResponse.json({ message: 'Relatório eliminado com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao eliminar relatório' }, { status: 400 });
  }
}
