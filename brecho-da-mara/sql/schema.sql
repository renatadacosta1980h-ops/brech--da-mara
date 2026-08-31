-- ==========================================================================
-- Brechó da Mara — schema do Supabase
-- Rode este script inteiro em: Supabase > SQL Editor > New query > Run
-- ==========================================================================

create extension if not exists "pgcrypto";

create table if not exists produtos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  categoria   text not null,
  tamanho     text not null,
  preco       numeric(10,2) not null,
  imagem_url  text,
  status      text not null default 'disponivel' check (status in ('disponivel', 'vendido')),
  criado_em   timestamptz not null default now()
);

-- Segurança em nível de linha (RLS): sem isso, qualquer pessoa com a chave
-- pública poderia alterar o catálogo. Com RLS, só o admin logado pode.
alter table produtos enable row level security;

drop policy if exists "Qualquer pessoa pode ver os produtos" on produtos;
create policy "Qualquer pessoa pode ver os produtos"
  on produtos for select
  using (true);

drop policy if exists "Admin autenticado pode inserir" on produtos;
create policy "Admin autenticado pode inserir"
  on produtos for insert
  to authenticated
  with check (true);

drop policy if exists "Admin autenticado pode atualizar" on produtos;
create policy "Admin autenticado pode atualizar"
  on produtos for update
  to authenticated
  using (true);

drop policy if exists "Admin autenticado pode excluir" on produtos;
create policy "Admin autenticado pode excluir"
  on produtos for delete
  to authenticated
  using (true);

-- ==========================================================================
-- Storage (fotos das peças)
-- ==========================================================================
-- O SQL Editor não cria buckets. Faça isso pela interface:
--   Supabase > Storage > New bucket
--   Nome: produtos
--   Public bucket: ATIVADO (marcado)
--
-- Depois de criar o bucket, rode o bloco abaixo para liberar upload
-- apenas para o admin autenticado (a leitura pública já vem do bucket público):

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "Leitura publica das imagens" on storage.objects;
create policy "Leitura publica das imagens"
  on storage.objects for select
  using (bucket_id = 'produtos');

drop policy if exists "Admin autenticado pode enviar imagens" on storage.objects;
create policy "Admin autenticado pode enviar imagens"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'produtos');

drop policy if exists "Admin autenticado pode excluir imagens" on storage.objects;
create policy "Admin autenticado pode excluir imagens"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'produtos');
