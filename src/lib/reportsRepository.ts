import { prisma } from '@/lib/prisma';
import { calculateDailyReport, ChannelInput, ExpenseInput } from '@/lib/calculations';
import { DailyReport, ChannelName, ExpenseCategory } from '@/types/saas';
import { randomUUID } from 'crypto';

export async function getReportByDate(dataStr: string, postoId?: string): Promise<DailyReport | null> {
  try {
    const where: any = { data: dataStr };
    if (postoId) {
      const resolvedPosto = await prisma.posto.findFirst({
        where: {
          OR: [{ id: postoId }, { codigo: postoId }, { nome: postoId }],
        },
      });
      where.postoId = resolvedPosto ? resolvedPosto.id : postoId;
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
      const resolvedPosto = await prisma.posto.findFirst({
        where: {
          OR: [
            { id: options.postoId },
            { codigo: options.postoId },
            { nome: options.postoId },
          ],
        },
      });
      where.postoId = resolvedPosto ? resolvedPosto.id : options.postoId;
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
  let { data, userId, postoId, status = 'rascunho', observacoes, channels, akiBonus, expenses } = dto;

  // 1. Garantir postoId válido no banco (suporta UUID ou código ex: 'posto-1')
  let resolvedPosto = await prisma.posto.findFirst({
    where: {
      OR: [
        { id: postoId },
        { codigo: postoId },
        { nome: postoId },
      ],
    },
  });

  if (!resolvedPosto) {
    resolvedPosto = await prisma.posto.findFirst();
  }

  // Se a tabela Posto estiver completamente vazia no Supabase, auto-inicializar Posto 1 e Posto 2
  if (!resolvedPosto) {
    try {
      resolvedPosto = await prisma.posto.create({
        data: { id: 'posto-1', nome: 'Posto 1', codigo: 'posto-1' },
      });
      await prisma.posto.create({
        data: { id: 'posto-2', nome: 'Posto 2', codigo: 'posto-2' },
      });
    } catch {
      resolvedPosto = await prisma.posto.findFirst();
    }
  }

  if (!resolvedPosto) {
    throw new Error('É obrigatório associar o relatório a um Posto de Vendas.');
  }

  const effectivePostoId = resolvedPosto.id;

  // 2. Garantir userId válido no banco para integridade referencial
  let caller = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!caller) {
    caller = await prisma.user.findFirst({ where: { papel: 'admin' } }).catch(() => null);
  }
  if (!caller) {
    caller = await prisma.user.findFirst().catch(() => null);
  }

  // Se a tabela User estiver vazia no Supabase, auto-criar administrador padrão
  if (!caller) {
    try {
      const bcrypt = await import('bcryptjs');
      const pass = await bcrypt.hash('cristovao123', 10);
      caller = await prisma.user.create({
        data: {
          id: 'user-admin-cristovao',
          nome: 'Cristovão',
          email: 'cristovao@rapidoeseguro.ao',
          papel: 'admin',
          passwordHash: pass,
        },
      });
    } catch {
      caller = await prisma.user.findFirst().catch(() => null);
    }
  }

  const effectiveUserId = caller?.id || userId;

  // 3. Verificar se o relatório existente deste posto já está fechado (não pode ser editado por não-admin)
  const existing = await prisma.dailyReport.findUnique({
    where: {
      data_postoId: { data, postoId: effectivePostoId },
    },
  });

  if (existing && existing.status === 'fechado') {
    const adminCheck = caller?.papel === 'admin';
    if (!adminCheck) {
      throw new Error('Este relatório diário do posto está FECHADO e não pode ser editado.');
    }
  }

  // 4. Transação no banco com timeout estendido e UUIDs explícitos para compatibilidade Supabase/PgBouncer
  const result = await prisma.$transaction(
    async (tx) => {
      // Upsert do Relatório Diário por [data, postoId]
      const report = await tx.dailyReport.upsert({
        where: {
          data_postoId: { data, postoId: effectivePostoId },
        },
        update: {
          status,
          observacoes,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          data,
          postoId: effectivePostoId,
          userId: effectiveUserId,
          status,
          observacoes,
        },
      });

      // Limpar entradas de vendas anteriores
      await tx.salesEntry.deleteMany({
        where: { reportId: report.id },
      });

      if (channels && channels.length > 0) {
        for (const ch of channels) {
          const valor = Number(ch.valor_vendido) || 0;
          const taxa = Number(ch.taxa) || 0;
          const lucroParcial = valor + taxa;

          await tx.salesEntry.create({
            data: {
              id: randomUUID(),
              reportId: report.id,
              canal: ch.canal,
              valorVendido: valor,
              taxa: taxa,
              lucroParcial: lucroParcial,
            },
          });
        }
      }

      // Upsert do Bónus do Aki
      const existingBonus = await tx.akiBonus.findUnique({
        where: { reportId: report.id },
      });

      if (existingBonus) {
        await tx.akiBonus.update({
          where: { reportId: report.id },
          data: {
            valor: Number(akiBonus) || 0,
          },
        });
      } else {
        await tx.akiBonus.create({
          data: {
            id: randomUUID(),
            reportId: report.id,
            valor: Number(akiBonus) || 0,
          },
        });
      }

      // Limpar e reinserir saídas
      await tx.expense.deleteMany({
        where: { reportId: report.id },
      });

      if (expenses && expenses.length > 0) {
        for (const exp of expenses) {
          await tx.expense.create({
            data: {
              id: randomUUID(),
              reportId: report.id,
              categoria: (exp.categoria || 'outros').toLowerCase(),
              descricao: (exp.descricao || 'Despesa').trim(),
              valor: Number(exp.valor) || 0,
            },
          });
        }
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
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

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

export async function deleteReport(id: string, isAdmin: boolean = false): Promise<void> {
  const existing = await prisma.dailyReport.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Relatório não encontrado.');
  }

  if (existing.status === 'fechado' && !isAdmin) {
    throw new Error('Não é permitido eliminar um relatório que já foi fechado. Apenas o Administrador pode realizar esta operação.');
  }

  await prisma.$transaction([
    prisma.salesEntry.deleteMany({ where: { reportId: id } }),
    prisma.akiBonus.deleteMany({ where: { reportId: id } }),
    prisma.expense.deleteMany({ where: { reportId: id } }),
    prisma.dailyReport.delete({ where: { id } }),
  ]);
}

export async function clearAllReports(isAdmin: boolean = false): Promise<{ count: number }> {
  if (!isAdmin) {
    throw new Error('Apenas o Administrador tem permissão para apagar todo o histórico de relatórios.');
  }

  const count = await prisma.dailyReport.count();

  await prisma.$transaction([
    prisma.salesEntry.deleteMany({}),
    prisma.akiBonus.deleteMany({}),
    prisma.expense.deleteMany({}),
    prisma.dailyReport.deleteMany({}),
  ]);

  return { count };
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
    created_at: report.createdAt instanceof Date ? report.createdAt.toISOString() : (report.createdAt ? String(report.createdAt) : new Date().toISOString()),
    updated_at: report.updatedAt instanceof Date ? report.updatedAt.toISOString() : (report.updatedAt ? String(report.updatedAt) : new Date().toISOString()),
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
