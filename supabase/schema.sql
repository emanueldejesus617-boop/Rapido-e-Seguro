-- ====================================================================================
-- RÁPIDO E SEGURO — SCHEMA OFICIAL SUPABASE (POSTGRESQL)
-- ====================================================================================
-- Este script pode ser executado diretamente no SQL Editor do Supabase
-- para criar todas as tabelas, índices e dados iniciais da aplicação.
-- ====================================================================================

-- 1. Tabela: Posto
CREATE TABLE IF NOT EXISTS "Posto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Posto_pkey" PRIMARY KEY ("id")
);

-- 2. Tabela: User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '$2a$10$wE8wYlW0w2mD1x8/P8q0OuG5m0wFq9K0n1v2x3y4z5a6b7c8d9e0f',
    "papel" TEXT NOT NULL DEFAULT 'vendedor',
    "postoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 3. Tabela: DailyReport
CREATE TABLE IF NOT EXISTS "DailyReport" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "postoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- 4. Tabela: SalesEntry
CREATE TABLE IF NOT EXISTS "SalesEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "valorVendido" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lucroParcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesEntry_pkey" PRIMARY KEY ("id")
);

-- 5. Tabela: AkiBonus
CREATE TABLE IF NOT EXISTS "AkiBonus" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AkiBonus_pkey" PRIMARY KEY ("id")
);

-- 6. Tabela: Expense
CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- 7. Tabela: AppSettings
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("key")
);

-- Índices e Restrições Únicas
CREATE UNIQUE INDEX IF NOT EXISTS "Posto_nome_key" ON "Posto"("nome");
CREATE UNIQUE INDEX IF NOT EXISTS "Posto_codigo_key" ON "Posto"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_postoId_idx" ON "User"("postoId");
CREATE INDEX IF NOT EXISTS "DailyReport_data_idx" ON "DailyReport"("data");
CREATE INDEX IF NOT EXISTS "DailyReport_postoId_idx" ON "DailyReport"("postoId");
CREATE INDEX IF NOT EXISTS "DailyReport_userId_idx" ON "DailyReport"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyReport_data_postoId_key" ON "DailyReport"("data", "postoId");
CREATE INDEX IF NOT EXISTS "SalesEntry_reportId_idx" ON "SalesEntry"("reportId");
CREATE UNIQUE INDEX IF NOT EXISTS "SalesEntry_reportId_canal_key" ON "SalesEntry"("reportId", "canal");
CREATE UNIQUE INDEX IF NOT EXISTS "AkiBonus_reportId_key" ON "AkiBonus"("reportId");
CREATE INDEX IF NOT EXISTS "Expense_reportId_idx" ON "Expense"("reportId");

-- Chaves Estrangeiras (Foreign Keys)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_postoId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyReport_postoId_fkey') THEN
    ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyReport_userId_fkey') THEN
    ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SalesEntry_reportId_fkey') THEN
    ALTER TABLE "SalesEntry" ADD CONSTRAINT "SalesEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AkiBonus_reportId_fkey') THEN
    ALTER TABLE "AkiBonus" ADD CONSTRAINT "AkiBonus_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_reportId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ------------------------------------------------------------------------------------
-- DADOS INICIAIS (SEED)
-- ------------------------------------------------------------------------------------

-- Postos de Venda
INSERT INTO "Posto" ("id", "nome", "codigo", "createdAt")
VALUES 
  ('posto-1', 'Posto 1', 'posto-1', NOW()),
  ('posto-2', 'Posto 2', 'posto-2', NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- Administrador Geral (Cristovão)
-- Email: cristovao@rapidoeseguro.ao | Senha: cristovao123
INSERT INTO "User" ("id", "nome", "email", "passwordHash", "papel", "postoId", "createdAt", "updatedAt")
VALUES
  ('user-admin-cristovao', 'Cristovão', 'cristovao@rapidoeseguro.ao', '$2a$10$5NTrlOOLYgAopOyMqIN1uuyQFVC1McvjKQE8Dw6pdReTNict4oiIK', 'admin', NULL, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
