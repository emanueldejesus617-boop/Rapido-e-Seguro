/**
 * Sincronizador Automático de Banco de Dados para Build (Vercel / Produção)
 * Executa "prisma db push" apenas se DATABASE_URL e DIRECT_URL estiverem configurados.
 * Se não estiverem, pula a etapa sem quebrar o build.
 */
const { execSync } = require('child_process');

function syncDatabase() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasDirectUrl = Boolean(process.env.DIRECT_URL);

  if (hasDbUrl && hasDirectUrl) {
    console.log('🔄 Sincronizando schema com a base de dados (Supabase PostgreSQL)...');
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('✅ Schema sincronizado com a base de dados com sucesso.');
    } catch (error) {
      console.warn('⚠️ Aviso: prisma db push não pôde ser concluído durante o build:', error.message);
    }
  } else {
    console.log('ℹ️ DATABASE_URL ou DIRECT_URL não configurados no ambiente. Pulando sincronização automática durante build.');
  }
}

syncDatabase();
