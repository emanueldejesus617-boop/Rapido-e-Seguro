import { prisma } from '@/lib/prisma';
import { calculateDailyReport, ChannelInput, ExpenseInput } from '@/lib/calculations';
import { DailyReport, ChannelName, ExpenseCategory } from '@/types/saas';

export async function getReportByDate(dataStr: string, postoId?: string): Promise<DailyReport | null> {
  try {
    const where: any = { data: dataStr };
    if (postoId) {
      where.postoId = postoId;
    }

    const report = await prisma.dailyReport.findFirst({
      where,
      include: {
        user: {
          select: { id: true, nome: true, email: true, papel: true },
        },
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
        salesEntries: true,
        akiBonus: true,
        expenses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!report) return null;

    return formatReportWithCalculations(report);
  } catch (err) {
    console.warn('Aviso: Falha ao buscar relatório por data:', err);
    return null;
  }
}

export async function getReportById(id: string): Promise<DailyReport | null> {
  try {
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nome: true, email: true, papel: true },
        },
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
        salesEntries: true,
        akiBonus: true,
        expenses: true,
      },
    });

    if (!report) return null;

    return formatReportWithCalculations(report);
  } catch (err) {
    console.warn('Aviso: Falha ao buscar relatório por id:', err);
    return null;
  }
}

export async function listReports(options?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string; // 🔍 Pesquisa filtrada na base de dados
  postoId?: string; // 🏢 Filtro por posto de venda
}): Promise<DailyReport[]> {
  try {
    const where: any = {};

    if (options?.startDate && options?.endDate) {
      where.data = { gte: options.startDate, lte: options.endDate };
    }
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status;
    }
    if (options?.postoId) {
      where.postoId = options.postoId;
    }

    // Filtro de pesquisa textual executado diretamente na BD
    if (options?.search && options.search.trim() !== '') {
      const term = options.search.trim();
      where.OR = [
        { data: { contains: term } },
        { user: { nome: { contains: term } } },
        { posto: { nome: { contains: term } } },
        { salesEntries: { some: { canal: { contains: term } } } },
        { expenses: { some: { descricao: { contains: term } } } },
        { expenses: { some: { categoria: { contains: term } } } },
        { observacoes: { contains: term } },
      ];
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        user: {
          select: { id: true, nome: true, email: true, papel: true },
        },
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
        salesEntries: true,
        akiBonus: true,
        expenses: true,
      },
      orderBy: { data: 'desc' },
    });

    return reports.map(formatReportWithCalculations);
  } catch (err) {
    console.warn('Aviso: Falha ao listar relatórios:', err);
    return [];
  }
}

export interface SaveReportDTO {
  id?: string;
  data: string;
  userId: string;
  postoId: string; // Obrigatório vincular a um posto
  status?: 'rascunho' | 'fechado';
  observacoes?: string | null;
  channels: {
    canal: ChannelName;
    valor_vendido: number;
    taxa?: number;
  }[];
  akiBonus: number;
  expenses: {
    categoria: ExpenseCategory;
    descricao: string;
    valor: number;
  }[];
}

export async function saveDailyReport(dto: SaveReportDTO): Promise<DailyReport> {
  const { data, userId, postoId, status = 'rascunho', observacoes, channels, akiBonus, expenses } = dto;

  if (!postoId) {
    throw new Error('É obrigatório associar o relatório a um Posto de Vendas.');
  }

  // 1. Verificar se o relatório existente deste posto já está fechado (não pode ser editado)
  const existing = await prisma.dailyReport.findUnique({
    where: {
      data_postoId: { data, postoId },
    },
  });

  if (existing && existing.status === 'fechado' && status !== 'rascunho') {
    const caller = await prisma.user.findUnique({ where: { id: userId } });
    if (caller?.papel !== 'admin') {
      throw new Error('Este relatório diário do posto está FECHADO e não pode ser editado.');
    }
  }

  // 2. Transação no banco para salvar relatório, canais, bónus e despesas
  const result = await prisma.$transaction(async (tx) => {
    // Upsert do Relatório Diário por [data, postoId]
    const report = await tx.dailyReport.upsert({
      where: {
        data_postoId: { data, postoId },
      },
      update: {
        status,
        observacoes,
        updatedAt: new Date(),
      },
      create: {
        data,
        postoId,
        userId,
        status,
        observacoes,
      },
    });

    // Limpar e reinserir canais de venda
    await tx.salesEntry.deleteMany({
      where: { reportId: report.id },
    });

    for (const ch of channels) {
      const valor = Number(ch.valor_vendido) || 0;
      const taxa = Number(ch.taxa) || 0;
      const lucroParcial = valor + taxa;

      await tx.salesEntry.create({
        data: {
          reportId: report.id,
          canal: ch.canal,
          valorVendido: valor,
          taxa: taxa,
          lucroParcial: lucroParcial,
        },
      });
    }

    // Upsert do Bónus do Aki
    await tx.akiBonus.upsert({
      where: { reportId: report.id },
      update: {
        valor: Number(akiBonus) || 0,
      },
      create: {
        reportId: report.id,
        valor: Number(akiBonus) || 0,
      },
    });

    // Limpar e reinserir saídas
    await tx.expense.deleteMany({
      where: { reportId: report.id },
    });

    for (const exp of expenses) {
      await tx.expense.create({
        data: {
          reportId: report.id,
          categoria: exp.categoria.toLowerCase(),
          descricao: exp.descricao.trim(),
          valor: Number(exp.valor) || 0,
        },
      });
    }

    return tx.dailyReport.findUnique({
      where: { id: report.id },
      include: {
        user: { select: { id: true, nome: true, email: true, papel: true } },
        posto: { select: { id: true, nome: true, codigo: true } },
        salesEntries: true,
        akiBonus: true,
        expenses: true,
      },
    });
  });

  return formatReportWithCalculations(result!);
}

export async function closeReport(id: string): Promise<DailyReport> {
  const updated = await prisma.dailyReport.update({
    where: { id },
    data: { status: 'fechado', updatedAt: new Date() },
    include: {
      user: { select: { id: true, nome: true, email: true, papel: true } },
      posto: { select: { id: true, nome: true, codigo: true } },
      salesEntries: true,
      akiBonus: true,
      expenses: true,
    },
  });

  return formatReportWithCalculations(updated);
}

export async function deleteReport(id: string): Promise<void> {
  const existing = await prisma.dailyReport.findUnique({ where: { id } });
  if (existing?.status === 'fechado') {
    throw new Error('Não é permitido eliminar um relatório que já foi fechado.');
  }
  await prisma.dailyReport.delete({ where: { id } });
}

function formatReportWithCalculations(report: any): DailyReport {
  const channelInputs: ChannelInput[] = (report.salesEntries || []).map((s: any) => ({
    canal: s.canal,
    valor_vendido: s.valorVendido,
    taxa: s.taxa,
  }));

  const expenseInputs: ExpenseInput[] = (report.expenses || []).map((e: any) => ({
    categoria: e.categoria,
    descricao: e.descricao,
    valor: e.valor,
  }));

  const bonusVal = report.akiBonus?.valor || 0;

  const calcs = calculateDailyReport(channelInputs, bonusVal, expenseInputs);

  return {
    id: report.id,
    data: report.data,
    user_id: report.userId,
    posto_id: report.postoId,
    postoId: report.postoId,
    posto: report.posto,
    status: report.status as 'rascunho' | 'fechado',
    observacoes: report.observacoes,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    user: report.user
      ? {
          id: report.user.id,
          nome: report.user.nome,
          email: report.user.email,
          papel: report.user.papel as any,
          postoId: report.postoId,
          posto: report.posto,
        }
      : undefined,
    sales_entries: calcs.canais.map((c) => ({
      canal: c.canal as any,
      valor_vendido: c.valor_vendido,
      taxa: c.taxa,
      lucro_parcial: c.lucro_parcial,
    })),
    aki_bonus: { valor: bonusVal },
    expenses: expenseInputs as any,
    soma_lucros_parciais: calcs.soma_lucros_parciais,
    total_vendas_brutas: calcs.total_vendas_brutas,
    total_taxas_acrescentadas: calcs.total_taxas_acrescentadas,
    recarga_aki_lucro: calcs.recarga_aki_lucro,
    lucro_operacional: calcs.lucro_operacional,
    total_saidas: calcs.total_saidas,
    total_final: calcs.total_final,
    total_final_sem_bonus: calcs.total_final_sem_bonus,
  };
}
