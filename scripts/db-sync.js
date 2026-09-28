/**
 * Sincronizador Automático de Banco de Dados para Build (Vercel / Produção)
 * Executa "prisma db push" apenas se DATABASE_URL e DIRECT_URL estiverem configurados.
 * Se não estiverem, pula a etapa sem quebrar o build.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_DB_URL = 'postgresql://postgres.zqcpcpbntayqkerwvieu:1XlZkpwKuvGAOyZQ@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const DEFAULT_DIRECT_URL = 'postgresql://postgres.zqcpcpbntayqkerwvieu:1XlZkpwKuvGAOyZQ@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

function loadEnv() {
  const envFiles = ['.env.production', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, '..', file);
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV);
  if (isVercel || !process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = DEFAULT_DB_URL;
    }
  }
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = DEFAULT_DB_URL;
  }
}

function syncDatabase() {
  loadEnv();
  const hasDbUrl = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:'));
  const hasDirectUrl = Boolean(process.env.DIRECT_URL);

  if (hasDbUrl && hasDirectUrl) {
    console.log('🔄 Sincronizando schema com a base de dados (Supabase PostgreSQL)...');
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('✅ Schema sincronizado com a base de dados com sucesso.');

      try {
        console.log('🌱 Assegurando postos e dados padrão no Supabase...');
        execSync('node prisma/seed.js', { stdio: 'inherit' });
        console.log('✅ Dados padrão (seed) garantidos no Supabase.');
      } catch (seedError) {
        console.warn('⚠️ Aviso ao executar seed no Supabase:', seedError.message);
      }
    } catch (error) {
      console.warn('⚠️ Aviso: prisma db push não pôde ser concluído durante o build:', error.message);
    }
  } else {
    console.log('ℹ️ DATABASE_URL ou DIRECT_URL não configurados no ambiente. Pulando sincronização automática durante build.');
  }
}

syncDatabase();
