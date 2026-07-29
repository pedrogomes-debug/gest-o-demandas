# Gestão de demandas

Sistema interno para acompanhar o trabalho da empresa. Kanban e gantt são duas
visualizações da mesma tabela `demandas`: o kanban lê `status` e `ordem`, o
gantt lê `data_inicio` e `data_fim`.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind 4, Supabase (Postgres, auth e
realtime), dnd-kit no kanban. O gantt é CSS Grid puro, sem biblioteca. Deploy
na Vercel.

## Setup

1. **Node 22** via nvm. O `.nvmrc` fixa a versão:

   ```sh
   nvm use
   npm install
   ```

2. **Projeto no Supabase.** Pelo CLI:

   ```sh
   npx supabase login
   npx supabase projects create gestao-demandas --region sa-east-1
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   ```

   Ou pelo painel em [supabase.com/dashboard](https://supabase.com/dashboard),
   região São Paulo, colando `supabase/migrations/20260729174500_init.sql`
   inteiro no SQL Editor.

   O `supabase/seed.sql` tem dados de exemplo e só roda no banco local
   (`supabase db reset`) — não vai para produção.

3. **Variáveis.** Copie `.env.local.example` para `.env.local` e preencha com
   os valores de Project Settings > API. O app não exige login: quem tem a URL
   acessa. Ajuste as policies se um dia quiser fechar o acesso.

4. **Verificar.**

   ```sh
   npm run smoke
   npm run dev
   ```

## Estrutura

```
src/
  app/
    (app)/            clientes, pessoas (e depois kanban/gantt)
  lib/
    supabase/         clientes do browser e do servidor
    types.ts          Status, Cliente, Pessoa, Demanda, DemandaView
  components/
    estilos.ts        classes Tailwind compartilhadas
supabase/
  config.toml         configuração do CLI e do stack local
  migrations/         fonte da verdade do banco
  seed.sql            dados de exemplo, só no banco local
scripts/
  smoke.mjs           verificação de conectividade
```

## Autenticação

Sem login no MVP. O RLS libera a chave anônima (`anon`) para ler e escrever.
A URL da Vercel funciona como “porta”: quem conhece, usa. Se precisar trancar
depois, volte as policies para `authenticated` e reative o fluxo de auth.

## Convenções

- **Leitura vai na view, escrita vai na tabela.** `v_demandas` traz o nome e a
  cor do cliente já resolvidos, mas o join a torna somente leitura no
  PostgREST. Todo `insert`/`update`/`delete` vai direto em `demandas`.
- **`ordem` é fracionária.** Ao soltar um card entre dois outros, grave a média
  das ordens vizinhas e atualize só a linha movida:

  ```ts
  const novaOrdem =
    acima && abaixo ? (acima.ordem + abaixo.ordem) / 2
    : abaixo         ? abaixo.ordem - 1000
    : acima          ? acima.ordem + 1000
    : 1000;
  ```

- **Status é um enum no banco**, não uma tabela de configuração. Para criar uma
  coluna nova no kanban:

  ```sql
  alter type status_demanda add value 'pausado' before 'entregue';
  ```

  E acrescente o valor em `STATUS` e `STATUS_LABEL` em `src/lib/types.ts`.

## Fora do escopo

Subtarefas, dependências entre demandas, timesheet, permissões granulares e
acesso do cliente ficam de fora. Cada um deles dobra a complexidade do
sistema.
