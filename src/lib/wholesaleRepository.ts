import { prisma } from '@/lib/prisma';
import { WholesaleCustomer, WholesaleSale, WholesaleSummary } from '@/types';

export async function listWholesaleCustomers(options?: {
  search?: string;
  postoId?: string;
}): Promise<WholesaleCustomer[]> {
  try {
    const where: any = {};

    if (options?.postoId && options.postoId !== 'all') {
      const resolvedPosto = await prisma.posto.findFirst({
        where: {
          OR: [
            { id: options.postoId },
            { codigo: options.postoId },
            { nome: options.postoId },
          ],
        },
      });
      where.OR = [
        { postoId: resolvedPosto ? resolvedPosto.id : options.postoId },
        { postoId: null }, // Clientes globais
      ];
    }

    if (options?.search && options.search.trim() !== '') {
      const term = options.search.trim();
      where.OR = [
        { nome: { contains: term } },
        { telefone: { contains: term } },
        { localizacao: { contains: term } },
      ];
    }

    const customers = await prisma.wholesaleCustomer.findMany({
      where,
      include: {
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
        sales: {
          select: {
            id: true,
            total: true,
            bonus: true,
            data: true,
            createdAt: true,
          },
          orderBy: { data: 'desc' },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return customers.map((c) => {
      const salesCount = c.sales.length;
      const totalSpent = c.sales.reduce((acc, s) => acc + (s.total || 0), 0);
      const totalBonus = c.sales.reduce((acc, s) => acc + (s.bonus || 0), 0);
      const lastSaleDate = c.sales.length > 0 ? c.sales[0].data : null;

      return {
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        localizacao: c.localizacao,
        postoId: c.postoId,
        posto: c.posto,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        salesCount,
        totalSpent,
        totalBonus,
        lastSaleDate,
      };
    });
  } catch (err) {
    console.error('Erro ao listar clientes de vendas a grosso:', err);
    return [];
  }
}

export async function getWholesaleCustomerById(id: string): Promise<WholesaleCustomer | null> {
  try {
    const c = await prisma.wholesaleCustomer.findUnique({
      where: { id },
      include: {
        posto: {
          select: { id: true, nome: true, codigo: true },
        },
        sales: {
          include: {
            user: {
              select: { id: true, nome: true },
            },
            posto: {
              select: { id: true, nome: true, codigo: true },
            },
          },
          orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!c) return null;

    const salesCount = c.sales.length;
    const totalSpent = c.sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalBonus = c.sales.reduce((acc, s) => acc + (s.bonus || 0), 0);
    const lastSaleDate = c.sales.length > 0 ? c.sales[0].data : null;

    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      localizacao: c.localizacao,
      postoId: c.postoId,
      posto: c.posto,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      salesCount,
      totalSpent,
      totalBonus,
      lastSaleDate,
      sales: c.sales.map((s) => ({
        id: s.id,
        customerId: s.customerId,
        userId: s.userId,
        user: s.user,
        postoId: s.postoId,
        posto: s.posto,
        data: s.data,
        produto: s.produto,
        quantidade: s.quantidade,
        valor: s.valor,
        bonus: s.bonus,
        total: s.total,
        observacoes: s.observacoes,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  } catch (err) {
    console.error(`Erro ao buscar cliente ${id}:`, err);
    return null;
  }
}

export async function createWholesaleCustomer(data: {
  nome: string;
  telefone?: string | null;
  localizacao?: string | null;
  postoId?: string | null;
}) {
  return prisma.wholesaleCustomer.create({
    data: {
      nome: data.nome.trim(),
      telefone: data.telefone?.trim() || null,
      localizacao: data.localizacao?.trim() || null,
      postoId: data.postoId || null,
    },
    include: {
      posto: {
        select: { id: true, nome: true, codigo: true },
      },
    },
  });
}

export async function updateWholesaleCustomer(
  id: string,
  data: {
    nome?: string;
    telefone?: string | null;
    localizacao?: string | null;
    postoId?: string | null;
  }
) {
  const updateData: any = {};
  if (data.nome !== undefined) updateData.nome = data.nome.trim();
  if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null;
  if (data.localizacao !== undefined) updateData.localizacao = data.localizacao?.trim() || null;
  if (data.postoId !== undefined) updateData.postoId = data.postoId || null;

  return prisma.wholesaleCustomer.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteWholesaleCustomer(id: string) {
  return prisma.wholesaleCustomer.delete({
    where: { id },
  });
}

export async function createWholesaleSale(data: {
  customerId: string;
  userId: string;
  postoId?: string | null;
  data: string;
  produto: string;
  quantidade: number;
  valor: number;
  bonus: number;
  total?: number;
  observacoes?: string | null;
}) {
  const qtd = Number(data.quantidade) || 0;
  const val = Number(data.valor) || 0;
  const bns = Number(data.bonus) || 0;
  // TOTAL = VENDAS + BÓNUS  (Vendas = valor total das vendas; Bónus = valor de bónus)
  const calculatedTotal = data.total !== undefined ? Number(data.total) : val + bns;

  return prisma.wholesaleSale.create({
    data: {
      customerId: data.customerId,
      userId: data.userId,
      postoId: data.postoId || null,
      data: data.data,
      produto: data.produto,
      quantidade: qtd,
      valor: val,
      bonus: bns,
      total: calculatedTotal,
      observacoes: data.observacoes?.trim() || null,
    },
    include: {
      user: {
        select: { id: true, nome: true },
      },
      posto: {
        select: { id: true, nome: true, codigo: true },
      },
      customer: {
        select: { id: true, nome: true },
      },
    },
  });
}

export async function updateWholesaleSale(
  id: string,
  data: {
    data?: string;
    produto?: string;
    quantidade?: number;
    valor?: number;
    bonus?: number;
    total?: number;
    observacoes?: string | null;
  }
) {
  const current = await prisma.wholesaleSale.findUnique({ where: { id } });
  if (!current) throw new Error('Venda não encontrada');

  const qtd = data.quantidade !== undefined ? Number(data.quantidade) : current.quantidade;
  const val = data.valor !== undefined ? Number(data.valor) : current.valor;
  const bns = data.bonus !== undefined ? Number(data.bonus) : current.bonus;
  // TOTAL = VENDAS + BÓNUS  (Vendas = valor total das vendas; Bónus = valor de bónus)
  const calculatedTotal = data.total !== undefined ? Number(data.total) : val + bns;

  const updateData: any = {
    quantidade: qtd,
    valor: val,
    bonus: bns,
    total: calculatedTotal,
  };

  if (data.data) updateData.data = data.data;
  if (data.produto) updateData.produto = data.produto;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;

  return prisma.wholesaleSale.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteWholesaleSale(id: string) {
  return prisma.wholesaleSale.delete({
    where: { id },
  });
}

export async function getWholesaleSummary(postoId?: string): Promise<WholesaleSummary> {
  try {
    const whereCustomer: any = {};
    const whereSale: any = {};

    if (postoId && postoId !== 'all') {
      whereSale.postoId = postoId;
      whereCustomer.OR = [{ postoId }, { postoId: null }];
    }

    const totalCustomers = await prisma.wholesaleCustomer.count({ where: whereCustomer });

    const sales = await prisma.wholesaleSale.findMany({
      where: whereSale,
      select: {
        produto: true,
        quantidade: true,
        total: true,
        bonus: true,
      },
    });

    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalBonus = sales.reduce((acc, s) => acc + (s.bonus || 0), 0);

    // Contagem por produto para identificar o top seller
    const productMap: Record<string, { totalVendido: number; quantidade: number }> = {};
    sales.forEach((s) => {
      if (!productMap[s.produto]) {
        productMap[s.produto] = { totalVendido: 0, quantidade: 0 };
      }
      productMap[s.produto].totalVendido += s.total;
      productMap[s.produto].quantidade += s.quantidade;
    });

    let topProduct: { produto: string; totalVendido: number; quantidade: number } | null = null;
    for (const [prod, stats] of Object.entries(productMap)) {
      if (!topProduct || stats.totalVendido > topProduct.totalVendido) {
        topProduct = {
          produto: prod,
          totalVendido: stats.totalVendido,
          quantidade: stats.quantidade,
        };
      }
    }

    return {
      totalCustomers,
      totalSalesCount,
      totalRevenue,
      totalBonus,
      topProduct,
    };
  } catch (err) {
    console.error('Erro ao gerar resumo de vendas a grosso:', err);
    return {
      totalCustomers: 0,
      totalSalesCount: 0,
      totalRevenue: 0,
      totalBonus: 0,
      topProduct: null,
    };
  }
}

