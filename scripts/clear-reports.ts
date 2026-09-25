import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearReports() {
  console.log('A eliminar dados dos relatórios...');

  // A ordem importa: apagar os filhos antes do pai (apesar de Cascade estar configurado)
  const salesEntries = await prisma.salesEntry.deleteMany({});
  console.log(`✅ SalesEntries eliminados: ${salesEntries.count}`);

  const akiBonuses = await prisma.akiBonus.deleteMany({});
  console.log(`✅ AkiBonuses eliminados: ${akiBonuses.count}`);

  const expenses = await prisma.expense.deleteMany({});
  console.log(`✅ Expenses eliminadas: ${expenses.count}`);

  const reports = await prisma.dailyReport.deleteMany({});
  console.log(`✅ DailyReports eliminados: ${reports.count}`);

  console.log('\n✅ Todos os dados dos relatórios foram eliminados com sucesso!');
  console.log('ℹ️  Utilizadores e postos mantidos intactos.');
}

clearReports()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
