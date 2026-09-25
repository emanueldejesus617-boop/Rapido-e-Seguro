const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users.map(u => ({ id: u.id, email: u.email, nome: u.nome, papel: u.papel })));
  
  for (const u of users) {
    const isMatchAdmin = await bcrypt.compare('admin123', u.passwordHash);
    const isMatchVendedor = await bcrypt.compare('vendedor123', u.passwordHash);
    console.log(`User ${u.email}: admin123=${isMatchAdmin}, vendedor123=${isMatchVendedor}`);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
