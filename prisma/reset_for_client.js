/**
 * SCRIPT DE RESET PARA ENTREGA AO CLIENTE
 * ----------------------------------------
 * - Apaga TODOS os dados operacionais (relatórios, vendas, despesas, etc.)
 * - Elimina TODOS os utilizadores excepto o Cristovão (admin)
 * - Mantém os Postos de Venda (estrutura necessária)
 * - Mantém as AppSettings (configurações da app)
 * - Deixa o banco de dados limpo e pronto para uso real
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('========================================');
  console.log('  RESET PARA ENTREGA AO CLIENTE');
  console.log('========================================');
  console.log('');

  // ── PASSO 1: Apagar todos os dados operacionais ──
  console.log('[1/5] A apagar todas as despesas...');
  await prisma.expense.deleteMany({});

  console.log('[2/5] A apagar todos os bónus AKI...');
  await prisma.akiBonus.deleteMany({});

  console.log('[3/5] A apagar todas as entradas de vendas...');
  await prisma.salesEntry.deleteMany({});

  console.log('[4/5] A apagar todos os relatórios diários...');
  await prisma.dailyReport.deleteMany({});

  // ── PASSO 2: Apagar todos os utilizadores ──
  console.log('[5/5] A apagar todos os utilizadores...');
  await prisma.user.deleteMany({});

  console.log('');
  console.log('✓ Banco de dados limpo com sucesso!');
  console.log('');

  // ── PASSO 3: Criar APENAS a credencial do Cristovão ──
  console.log('A criar credencial de Cristovão (Gerente)...');
  const cristovaoPass = await bcrypt.hash('cristovao123', 10);

  const cristovao = await prisma.user.create({
    data: {
      nome: 'Cristovão',
      email: 'cristovao@rapidoeseguro.ao',
      papel: 'admin',
      postoId: null, // Acesso a todos os postos
      passwordHash: cristovaoPass,
    },
  });

  console.log('');
  console.log('========================================');
  console.log('  CREDENCIAL CRIADA');
  console.log('========================================');
  console.log(`  Nome  : ${cristovao.nome}`);
  console.log(`  Email : ${cristovao.email}`);
  console.log(`  Senha : cristovao123`);
  console.log(`  Papel : Administrador (acesso total)`);
  console.log('========================================');
  console.log('');

  // ── PASSO 4: Verificar postos existentes ──
  const postos = await prisma.posto.findMany();
  if (postos.length === 0) {
    console.log('A criar Postos de Venda...');
    await prisma.posto.create({ data: { nome: 'Posto 1', codigo: 'posto-1' } });
    await prisma.posto.create({ data: { nome: 'Posto 2', codigo: 'posto-2' } });
    console.log('✓ Postos criados: Posto 1 e Posto 2');
  } else {
    console.log(`✓ Postos existentes mantidos: ${postos.map(p => p.nome).join(', ')}`);
  }

  console.log('');
  console.log('✅ SISTEMA PRONTO PARA ENTREGA AO CLIENTE!');
  console.log('');
  console.log('   • Banco de dados limpo (sem dados de demonstração)');
  console.log('   • Apenas 1 credencial activa: cristovao@rapidoeseguro.ao');
  console.log('   • O cliente pode criar os restantes utilizadores no sistema');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ ERRO no reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
