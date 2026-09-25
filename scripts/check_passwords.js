const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
  const passwords = ['cristovao123', 'admin123', 'vendedor123', '123456'];
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`\n--- ${u.email} ---`);
    for (const pw of passwords) {
      const ok = await bcrypt.compare(pw, u.passwordHash);
      if (ok) console.log(`  ✅ Senha correcta: "${pw}"`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
