-- SCHEMA SUPABASE / POSTGRESQL
-- Rápido e Seguro — Gestão de Vendas Diárias

-- 1. Tabela de Utilizadores
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('admin', 'vendedor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Relatórios Diários
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'fechado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Entradas de Vendas por Canal
CREATE TABLE IF NOT EXISTS sales_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('aki', 'afrivendas', 'zap', 'unitel', 'cartoes', 'chips')),
  valor_vendido NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxa NUMERIC(15, 2) NOT NULL DEFAULT 0,
  lucro_parcial NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_id, canal)
);

-- 4. Bónus do Aki (Lucro concedido pelo aplicativo aos vendedores)
CREATE TABLE IF NOT EXISTS aki_bonus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE UNIQUE,
  valor NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Saídas / Despesas do Dia
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('renda', 'saldo', 'taxi', 'outros')),
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para pesquisa rápida
CREATE INDEX IF NOT EXISTS idx_reports_data ON daily_reports(data);
CREATE INDEX IF NOT EXISTS idx_sales_report ON sales_entries(report_id);
CREATE INDEX IF NOT EXISTS idx_expenses_report ON expenses(report_id);

-- Inserir utilizadores padrão de demonstração
INSERT INTO users (id, nome, email, papel)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gerente Administrador', 'admin@rapidoeseguro.ao', 'admin'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Operador Vendedor', 'vendedor@rapidoeseguro.ao', 'vendedor')
ON CONFLICT (email) DO NOTHING;
