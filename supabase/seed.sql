-- Dados de exemplo. Aplicados apenas no banco local (`supabase db reset`),
-- nunca em produção.

insert into clientes (nome, cor) values
  ('Cliente Exemplo A', '#2563EB'),
  ('Cliente Exemplo B', '#DC2626');

insert into pessoas (nome, email, papel) values
  ('Pedro', 'pedro@exemplo.com', 'direção');

insert into demandas (titulo, cliente_id, responsavel_id, status, data_inicio, data_fim, ordem)
select
  'Demanda de teste',
  (select id from clientes limit 1),
  (select id from pessoas limit 1),
  'fazendo',
  current_date,
  current_date + 7,
  1000;
