const DEFAULT_DB_URL = 'postgresql://postgres.zqcpcpbntayqkerwvieu:1XlZkpwKuvGAOyZQ@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const DEFAULT_DIRECT_URL = 'postgresql://postgres.zqcpcpbntayqkerwvieu:1XlZkpwKuvGAOyZQ@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';
const DEFAULT_JWT_SECRET = 'rapido_e_seguro_jwt_secret_2026_super_seguro';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = DEFAULT_DIRECT_URL;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || DEFAULT_DB_URL,
    DIRECT_URL: process.env.DIRECT_URL || DEFAULT_DB_URL,
    JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

export default nextConfig;
