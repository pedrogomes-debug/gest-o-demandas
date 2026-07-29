-- Acesso sem login: a chave anônima passa a ler e escrever tudo.
-- O app deixa de exigir autenticação; o controle de quem entra é o fato
-- de a URL ser privada / conhecida pela equipe.

drop policy if exists "equipe acessa clientes" on clientes;
drop policy if exists "equipe acessa pessoas" on pessoas;
drop policy if exists "equipe acessa demandas" on demandas;

create policy "acesso publico clientes" on clientes
  for all to anon, authenticated using (true) with check (true);

create policy "acesso publico pessoas" on pessoas
  for all to anon, authenticated using (true) with check (true);

create policy "acesso publico demandas" on demandas
  for all to anon, authenticated using (true) with check (true);
