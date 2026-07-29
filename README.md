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

3. **Fechar o cadastro.** Em Authentication > Sign In / Providers, desligue
   "Allow new users to sign up". A equipe entra por convite manual em
   Authentication > Users > Invite. O trigger `trg_vincular_pessoa` casa o
   login novo com a linha de `pessoas` pelo e-mail.

4. **Variáveis.** Copie `.env.local.example` para `.env.local` e preencha com
   os valores de Project Settings > API.

5. **Verificar.**

   ```sh
   npm run smoke   # banco no ar, schema aplicado, RLS barrando a chave anônima
   npm run dev
   ```

## Estrutura

```
src/
  proxy.ts            renova a sessão e barra quem não está logado
  app/
    login/            magic link
    auth/callback/    troca o link pela sessão
    (app)/            tudo que exige login: layout, clientes, pessoas
  lib/
    supabase/         clientes do browser, do servidor e do proxy
    types.ts          Status, Cliente, Pessoa, Demanda, DemandaView
  components/
    estilos.ts        classes Tailwind compartilhadas
supabase/
  config.toml         configuração do CLI e do stack local
  migrations/         fonte da verdade do banco
  seed.sql            dados de exemplo, só no banco local
scripts/
  smoke.mjs           verificação de conectividade e RLS
```

## Autenticação

Login por magic link, sem senha. O `signInWithOtp` usa `shouldCreateUser: false`,
então digitar um e-mail não cadastrado não cria conta — a entrada da equipe é
sempre por convite em Authentication > Users.

O `/auth/callback` aceita tanto `?code=` (template de e-mail padrão do Supabase,
fluxo PKCE) quanto `?token_hash=&type=`. Se algum dia quiser abrir o link num
navegador diferente daquele que pediu o acesso, troque o template de e-mail para
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`, que
dispensa o code verifier guardado no cookie.

O proxy usa `getUser()`, não `getSession()`: só o primeiro revalida o token
contra o servidor do Supabase.

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
