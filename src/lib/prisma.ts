import { PrismaClient } from '@prisma/client';

const DEFAULT_DB_URL = 'postgresql://postgres.zqcpcpbntayqkerwvieu:1XlZkpwKuvGAOyZQ@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const DEFAULT_DIRECT_URL = 'postgresql://postgres.zqcpcpbntayqkerwvieu:1XlZkpwKuvGAOyZQ@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = DEFAULT_DIRECT_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || DEFAULT_DB_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
