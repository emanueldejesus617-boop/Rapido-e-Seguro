/**
 * scripts/ensure-db-provider.js
 * Garante automaticamente que o schema.prisma utiliza o provider correto (sqlite vs postgresql)
 * de acordo com a variável DATABASE_URL do ambiente (.env ou Vercel).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
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

function ensureDbProvider() {
  loadEnv();

  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV);
  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = isVercel || dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠️ schema.prisma não encontrado em:', schemaPath);
    return;
  }

  let schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Verificar provider atual
  const providerMatch = schemaContent.match(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/);
  const currentProvider = providerMatch ? providerMatch[1] : null;

  const directUrlRegex = /\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g;
  const hasDirectUrl = directUrlRegex.test(schemaContent);

  let needsUpdate = false;

  if (currentProvider !== targetProvider) {
    needsUpdate = true;
  }

  if (isPostgres && !hasDirectUrl) {
    needsUpdate = true;
  }

  if (!isPostgres && hasDirectUrl) {
    needsUpdate = true;
  }

  if (needsUpdate) {
    console.log(`🔄 Adaptando prisma/schema.prisma para ${targetProvider.toUpperCase()} (${isPostgres ? 'Supabase' : 'SQLite local'})...`);

    if (isPostgres) {
      // Configurar para PostgreSQL com directUrl
      schemaContent = schemaContent.replace(
        /datasource\s+db\s*\{[\s\S]*?\}/,
        `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
      );
    } else {
      // Configurar para SQLite sem directUrl
      schemaContent = schemaContent.replace(
        /datasource\s+db\s*\{[\s\S]*?\}/,
        `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
      );
    }

    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log(`✅ schema.prisma atualizado para provider "${targetProvider}". Regenerando Prisma Client...`);

    try {
      execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      console.log('✅ Prisma Client regenerado com sucesso.');
    } catch (err) {
      console.warn('⚠️ Aviso ao regenerar Prisma Client:', err.message);
    }
  } else {
    console.log(`✅ Prisma schema já configurado corretamente para ${targetProvider.toUpperCase()}.`);
  }
}

ensureDbProvider();
