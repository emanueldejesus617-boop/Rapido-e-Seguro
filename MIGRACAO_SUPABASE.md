# Guia de Configuração e Migração — Supabase & Vercel

Este projeto está 100% preparado para funcionar com **Supabase (PostgreSQL)** em produção no **Vercel**.

---

## 1. Configurar o Supabase

1. Aceda a [supabase.com](https://supabase.com) e inicie sessão ou crie uma conta gratuita.
2. Clique em **New project** (Novo projeto).
3. Preencha os dados:
   - **Name**: `rapido-e-seguro`
   - **Database Password**: Defina uma senha forte e guarde-a.
   - **Region**: Selecione uma região próxima (ex: `Frankfurt / eu-central-1` ou `London / eu-west-2`).
4. Clique em **Create new project** e aguarde a conclusão da criação (cerca de 1 a 2 minutos).

---

## 2. Criar as Tabelas e o Administrador Inicial

Tem **duas opções** para criar as tabelas e o administrador inicial:

### Opção A: Pelo Editor SQL do Supabase (Mais Rápido e Fácil)
1. No painel do seu projeto no Supabase, clique no menu lateral em **SQL Editor**.
2. Clique em **New query**.
3. Abra o ficheiro [`supabase/schema.sql`](./supabase/schema.sql) deste repositório, copie todo o seu conteúdo e cole-o no SQL Editor do Supabase.
4. Clique no botão verde **Run** (Executar).
5. Pronto! Todas as tabelas (`Posto`, `User`, `DailyReport`, `SalesEntry`, `AkiBonus`, `Expense`, `AppSettings`), chaves estrangeiras, índices e o administrador inicial (`cristovao@rapidoeseguro.ao`) são criados imediatamente.

### Opção B: Por Linha de Comandos (Prisma)
1. Configure as variáveis no seu `.env` local com as URLs do Supabase.
2. Execute no terminal:
   ```bash
   npm run db:migrate
   ```

---

## 3. Obter as Chaves de Conexão do Supabase

No painel do Supabase:
1. Vá a **Project Settings** (ícone de engrenagem) > **Database**.
2. Desça até à secção **Connection string**:
   - **Aba "Transaction" (porta 6543)**: Copie a string. Substitua `[YOUR-PASSWORD]` pela senha que definiu ao criar o projeto. Esta será a sua `DATABASE_URL`.
   - **Aba "Session" ou "Direct connection" (porta 5432)**: Copie a string. Substitua `[YOUR-PASSWORD]`. Esta será a sua `DIRECT_URL`.

---

## 4. Configurar as Variáveis de Ambiente no Vercel

1. Aceda ao seu painel no [vercel.com](https://vercel.com) e entre no projeto **Rapido-e-Seguro**.
2. Vá a **Settings** > **Environment Variables**.
3. Adicione as 3 variáveis seguintes para os ambientes **Production**, **Preview** e **Development**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Uma chave segura com pelo menos 32 caracteres (ex: gere com `openssl rand -hex 32`) |

4. Vá à aba **Deployments** no Vercel e clique em **Redeploy** no último deploy (ou faça um novo push no GitHub).

---

## 5. Credenciais de Acesso Inicial

Após a sincronização, o sistema já vem com a conta do Gerente Administrador e os 2 postos configurados:

- **URL de Login**: `https://seu-dominio-vercel.app/login`
- **Email**: `cristovao@rapidoeseguro.ao`
- **Senha**: `cristovao123`
- **Papel**: Administrador (acesso aos 2 postos de venda)
