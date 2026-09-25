const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do Banco de Dados Rápido e Seguro ---');

  // 1. Criar Senha Hasheada
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const operatorPasswordHash = await bcrypt.hash('operador123', 10);

  // 2. Criar ou Atualizar Usuários
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rapidoeseguro.ao' },
    update: {},
    create: {
      name: 'Emanuel de Jesus (Administrador)',
      email: 'admin@rapidoeseguro.ao',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operador@rapidoeseguro.ao' },
    update: {},
    create: {
      name: 'Operador de Caixa',
      email: 'operador@rapidoeseguro.ao',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
      isActive: true,
    },
  });

  console.log('Usuários criados:', { admin: adminUser.email, operator: operatorUser.email });

  // 3. Configurações Globais
  const defaultConfig = {
    companyName: 'Rápido e Seguro — Gestão de Vendas',
    nif: '5001239841',
    phone: '+244 923 000 000 / +244 931 000 000',
    address: 'Luanda, Angola',
    currency: 'Kz',
    defaultAkiFeePercentage: 2.5,
    defaultAfrivendasMarginPercentage: 5.0,
    cardCatalog: [
      { name: 'Unitel 500 Kz', operator: 'Unitel', defaultPrice: 500, defaultProfit: 30 },
      { name: 'Unitel 1.000 Kz', operator: 'Unitel', defaultPrice: 1000, defaultProfit: 60 },
      { name: 'Unitel 2.000 Kz', operator: 'Unitel', defaultPrice: 2000, defaultProfit: 120 },
      { name: 'Unitel 5.000 Kz', operator: 'Unitel', defaultPrice: 5000, defaultProfit: 300 },
      { name: 'Africell 500 Kz', operator: 'Africell', defaultPrice: 500, defaultProfit: 35 },
      { name: 'Africell 1.000 Kz', operator: 'Africell', defaultPrice: 1000, defaultProfit: 70 },
      { name: 'Africell 2.000 Kz', operator: 'Africell', defaultPrice: 2000, defaultProfit: 140 },
      { name: 'Movicel 500 Kz', operator: 'Movicel', defaultPrice: 500, defaultProfit: 30 },
      { name: 'Movicel 1.000 Kz', operator: 'Movicel', defaultPrice: 1000, defaultProfit: 60 },
    ],
    chipCatalog: [
      { name: 'CHIP Unitel 4G/5G', operator: 'Unitel', defaultPrice: 1000, defaultProfit: 350 },
      { name: 'CHIP Africell 4G', operator: 'Africell', defaultPrice: 500, defaultProfit: 200 },
      { name: 'CHIP Movicel 4G', operator: 'Movicel', defaultPrice: 500, defaultProfit: 150 },
    ],
    expenseCategories: ['RENDA', 'TAXI', 'SALDO', 'OUTROS', 'ALIMENTAÇÃO', 'MATERIAL'],
  };

  await prisma.configuration.upsert({
    where: { key: 'app_settings' },
    update: { value: JSON.stringify(defaultConfig) },
    create: {
      key: 'app_settings',
      value: JSON.stringify(defaultConfig),
    },
  });

  console.log('Configurações padrão salvas.');

  // 4. Inserir dados de demonstração representativos se não existirem
  const countAki = await prisma.akiSale.count();
  if (countAki === 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

    // AKI (Demonstração com o exemplo das regras de negócio)
    await prisma.akiSale.createMany({
      data: [
        {
          date: today,
          time: '09:30',
          salesAmount: 450000,
          feeCharged: 25000,
          feeProfit: 25000, // Lucro das taxas
          accountingProfit: 10000, // Valor contabilístico AKI (NÃO entra no lucro líquido)
          notes: 'Operações de carregamento e transferências AKI da manhã',
          userId: operatorUser.id,
        },
        {
          date: today,
          time: '15:15',
          salesAmount: 320000,
          feeCharged: 18000,
          feeProfit: 18000,
          accountingProfit: 8000,
          notes: 'Operações do turno da tarde',
          userId: adminUser.id,
        },
        {
          date: yesterday,
          time: '11:00',
          salesAmount: 600000,
          feeCharged: 35000,
          feeProfit: 35000,
          accountingProfit: 15000,
          notes: 'Fecho AKI dia anterior',
          userId: operatorUser.id,
        },
        {
          date: twoDaysAgo,
          time: '14:20',
          salesAmount: 510000,
          feeCharged: 28000,
          feeProfit: 28000,
          accountingProfit: 12000,
          notes: 'Movimento regular',
          userId: operatorUser.id,
        },
      ],
    });

    // Afrivendas
    await prisma.afrivendasSale.createMany({
      data: [
        {
          date: today,
          time: '10:10',
          salesAmount: 280000,
          costAmount: 260000,
          profitAmount: 20000,
          notes: 'Vendas da manhã Afrivendas',
          userId: operatorUser.id,
        },
        {
          date: yesterday,
          time: '16:00',
          salesAmount: 350000,
          costAmount: 325000,
          profitAmount: 25000,
          notes: 'Recargas e pagamentos',
          userId: adminUser.id,
        },
        {
          date: twoDaysAgo,
          time: '12:45',
          salesAmount: 210000,
          costAmount: 195000,
          profitAmount: 15000,
          notes: 'Movimento normal',
          userId: operatorUser.id,
        },
      ],
    });

    // Cartões
    await prisma.cardSale.createMany({
      data: [
        {
          date: today,
          time: '08:45',
          cardType: 'Unitel 1.000 Kz',
          operator: 'Unitel',
          quantity: 25,
          unitPrice: 1000,
          totalAmount: 25000,
          unitProfit: 60,
          totalProfit: 1500,
          notes: 'Lote 1',
          userId: operatorUser.id,
        },
        {
          date: today,
          time: '11:30',
          cardType: 'Unitel 2.000 Kz',
          operator: 'Unitel',
          quantity: 15,
          unitPrice: 2000,
          totalAmount: 30000,
          unitProfit: 120,
          totalProfit: 1800,
          notes: 'Lote 2',
          userId: operatorUser.id,
        },
        {
          date: today,
          time: '14:00',
          cardType: 'Africell 1.000 Kz',
          operator: 'Africell',
          quantity: 20,
          unitPrice: 1000,
          totalAmount: 20000,
          unitProfit: 70,
          totalProfit: 1400,
          notes: 'Africell recargas',
          userId: operatorUser.id,
        },
        {
          date: yesterday,
          time: '10:00',
          cardType: 'Unitel 5.000 Kz',
          operator: 'Unitel',
          quantity: 10,
          unitPrice: 5000,
          totalAmount: 50000,
          unitProfit: 300,
          totalProfit: 3000,
          notes: 'Venda a cliente empresarial',
          userId: adminUser.id,
        },
      ],
    });

    // CHIPs
    await prisma.chipSale.createMany({
      data: [
        {
          date: today,
          time: '09:00',
          chipType: 'CHIP Unitel 4G/5G',
          operator: 'Unitel',
          quantity: 8,
          unitPrice: 1000,
          totalAmount: 8000,
          unitProfit: 350,
          totalProfit: 2800,
          notes: 'Registo e ativação de novos clientes',
          userId: operatorUser.id,
        },
        {
          date: today,
          time: '13:30',
          chipType: 'CHIP Africell 4G',
          operator: 'Africell',
          quantity: 12,
          unitPrice: 500,
          totalAmount: 6000,
          unitProfit: 200,
          totalProfit: 2400,
          notes: 'Promoção ativação Africell',
          userId: operatorUser.id,
        },
        {
          date: yesterday,
          time: '15:00',
          chipType: 'CHIP Unitel 4G/5G',
          operator: 'Unitel',
          quantity: 15,
          unitPrice: 1000,
          totalAmount: 15000,
          unitProfit: 350,
          totalProfit: 5250,
          notes: 'Vendas balcão',
          userId: operatorUser.id,
        },
      ],
    });

    // Saídas / Despesas
    await prisma.expense.createMany({
      data: [
        {
          date: today,
          time: '12:00',
          category: 'TAXI',
          description: 'Deslocação para levantamento de cartões e depósitos',
          amount: 3500,
          notes: 'Táxi ida e volta',
          userId: operatorUser.id,
        },
        {
          date: today,
          time: '13:00',
          category: 'SALDO',
          description: 'Recarga do telemóvel de serviço do balcão',
          amount: 2000,
          notes: 'Plano mensal de dados',
          userId: operatorUser.id,
        },
        {
          date: today,
          time: '17:00',
          category: 'OUTROS',
          description: 'Água mineral e copos descartáveis para o balcão',
          amount: 4500,
          notes: 'Compra no fornecedor local',
          userId: adminUser.id,
        },
        {
          date: yesterday,
          time: '09:00',
          category: 'RENDA',
          description: 'Comparticipação semanal do espaço comercial',
          amount: 15000,
          notes: 'Pago com recibo',
          userId: adminUser.id,
        },
      ],
    });

    // Auditoria Inicial
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'SystemSeed',
        entityId: 'initial_setup',
        details: 'Instalação e inicialização do sistema Rápido e Seguro com dados de demonstração.',
        userId: adminUser.id,
      },
    });

    console.log('Dados de demonstração inseridos com sucesso!');
  }

  console.log('--- Seed Concluído com Sucesso ---');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
