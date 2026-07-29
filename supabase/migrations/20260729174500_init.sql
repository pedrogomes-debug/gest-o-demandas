-- =====================================================================
-- Sistema interno de gestão de demandas — kanban + gantt
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enum de status (as colunas do kanban)
-- Para adicionar uma coluna nova depois:
--   alter type status_demanda add value 'pausado' before 'entregue';
-- ---------------------------------------------------------------------
create type status_demanda as enum ('backlog', 'fazendo', 'revisao', 'entregue');

-- ---------------------------------------------------------------------
-- CLIENTES — só um rótulo colorido, sem portal, sem contato
-- ---------------------------------------------------------------------
create table clientes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  cor        text not null default '#6B7280',  -- hex, usado no kanban e no gantt
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_clientes_ativo on clientes (ativo) where ativo;

-- ---------------------------------------------------------------------
-- PESSOAS — a equipe. user_id liga ao login do Supabase Auth.
-- Fica nulo até a pessoa fazer o primeiro login (o trigger abaixo casa
-- pelo e-mail).
-- ---------------------------------------------------------------------
create table pessoas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  email      text not null unique,
  papel      text,                              -- texto livre: 'design', 'social', etc.
  ativo      boolean not null default true,
  user_id    uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_pessoas_ativo on pessoas (ativo) where ativo;

-- ---------------------------------------------------------------------
-- DEMANDAS — a tabela que importa. Kanban lê status + ordem,
-- gantt lê data_inicio + data_fim. Mesma linha, duas telas.
-- ---------------------------------------------------------------------
create table demandas (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  cliente_id    uuid references clientes (id) on delete set null,
  responsavel_id uuid references pessoas (id) on delete set null,
  status        status_demanda not null default 'backlog',
  data_inicio   date,
  data_fim      date,
  ordem         numeric not null default 1000,  -- fracionário de propósito, ver nota
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint datas_coerentes check (
    data_inicio is null or data_fim is null or data_fim >= data_inicio
  )
);

-- Índices que sustentam as duas telas
create index idx_demandas_kanban on demandas (status, ordem);
create index idx_demandas_cliente on demandas (cliente_id);
create index idx_demandas_responsavel on demandas (responsavel_id);
create index idx_demandas_periodo on demandas (data_inicio, data_fim);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_demandas_updated_at
  before update on demandas
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Casa o login novo com a pessoa já cadastrada (pelo e-mail)
-- ---------------------------------------------------------------------
create or replace function vincular_pessoa_ao_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update pessoas
     set user_id = new.id
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

create trigger trg_vincular_pessoa
  after insert on auth.users
  for each row execute function vincular_pessoa_ao_login();

-- ---------------------------------------------------------------------
-- RLS — sistema 100% interno: quem está logado, vê e edita tudo.
-- O controle de quem entra é feito no painel do Supabase:
-- Authentication > Sign In / Providers > desligue "Allow new users to
-- sign up" e convide os e-mails da equipe manualmente.
-- ---------------------------------------------------------------------
alter table clientes enable row level security;
alter table pessoas  enable row level security;
alter table demandas enable row level security;

create policy "equipe acessa clientes" on clientes
  for all to authenticated using (true) with check (true);

create policy "equipe acessa pessoas" on pessoas
  for all to authenticated using (true) with check (true);

create policy "equipe acessa demandas" on demandas
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- View pronta para as telas — evita join no front.
--
-- security_invoker faz a view rodar com os privilégios de quem consulta.
-- Sem isso ela roda como o owner e o RLS das tabelas base é ignorado,
-- o que deixaria os dados legíveis pela chave anônima.
--
-- É somente leitura: o join impede update/insert via PostgREST.
-- O front lê de v_demandas e escreve em demandas.
-- ---------------------------------------------------------------------
create view v_demandas
with (security_invoker = on)
as
select
  d.id,
  d.titulo,
  d.descricao,
  d.status,
  d.data_inicio,
  d.data_fim,
  d.ordem,
  d.updated_at,
  d.cliente_id,
  c.nome as cliente_nome,
  c.cor  as cliente_cor,
  d.responsavel_id,
  p.nome as responsavel_nome
from demandas d
left join clientes c on c.id = d.cliente_id
left join pessoas  p on p.id = d.responsavel_id;

-- ---------------------------------------------------------------------
-- Realtime — o kanban de uma pessoa reflete o arrasto da outra.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table demandas;
  end if;
end;
$$;

-- =====================================================================
-- NOTA SOBRE `ordem`
-- É numeric, não integer, de propósito. Ao soltar um card entre dois
-- outros, você grava a média das duas ordens vizinhas:
--   nova_ordem = (ordem_de_cima + ordem_de_baixo) / 2
-- Só a linha movida é atualizada — nunca a coluna inteira.
-- Card solto no topo:  primeira_ordem - 1000
-- Card solto no fim:   ultima_ordem  + 1000
-- =====================================================================
