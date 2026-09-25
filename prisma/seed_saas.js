/**
 * SEED OFICIAL — RÁPIDO E SEGURO
 * --------------------------------
 * Cria apenas a credencial do Gerente (Cristovão) e os dois Postos.
 * Sem dados de demonstração. Pronto para uso em produção.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed Oficial do Rápido e Seguro ---');

  // 1. Criar os dois Postos de Venda
  const posto1 = await prisma.posto.upsert({
    where: { codigo: 'posto-1' },
    update: { nome: 'Posto 1' },
    create: { nome: 'Posto 1', codigo: 'posto-1' },
  });

  const posto2 = await prisma.posto.upsert({
    where: { codigo: 'posto-2' },
    update: { nome: 'Posto 2' },
    create: { nome: 'Posto 2', codigo: 'posto-2' },
  });

  console.log('Postos registados:', {
    posto1: `${posto1.nome} (${posto1.id})`,
    posto2: `${posto2.nome} (${posto2.id})`,
  });

  // 2. Criar APENAS a credencial do Gerente (Cristovão)
  const cristovaoPass = await bcrypt.hash('cristovao123', 10);

  const cristovao = await prisma.user.upsert({
    where: { email: 'cristovao@rapidoeseguro.ao' },
    update: {
      nome: 'Cristovão',
      papel: 'admin',
      postoId: null,
      passwordHash: cristovaoPass,
    },
    create: {
      nome: 'Cristovão',
      email: 'cristovao@rapidoeseguro.ao',
      papel: 'admin',
      postoId: null, // Acesso a todos os postos (Gerente)
      passwordHash: cristovaoPass,
    },
  });

  console.log('');
  console.log('========================================');
  console.log('  CREDENCIAL DO SISTEMA');
  console.log('========================================');
  console.log(`  Nome  : ${cristovao.nome}`);
  console.log(`  Email : ${cristovao.email}`);
  console.log(`  Senha : cristovao123`);
  console.log(`  Papel : Administrador (acesso total)`);
  console.log('========================================');
  console.log('');
  console.log('--- Seed Concluído. Sistema pronto para produção. ---');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
