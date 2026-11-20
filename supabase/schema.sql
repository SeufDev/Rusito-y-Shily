-- Rusito & Shily · base de datos (pegar entero en Supabase → SQL Editor → Run)
-- Antes de correrlo: creá las dos cuentas en Authentication → Users y cambiá los
-- dos emails de la sección "QUIÉN ES QUIÉN" (más abajo) por los de ustedes.

-- Todo lo que hacen en la web vive en una sola tabla flexible.
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  author text check (author in ('a', 'b')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_kind_idx on public.items (kind);
create index if not exists items_created_idx on public.items (created_at);

-- QUIÉN ES QUIÉN: cada cuenta es una persona ('a' = Shily, 'b' = Rusito).
create table if not exists public.people (
  user_id uuid primary key references auth.users (id) on delete cascade,
  who text not null unique check (who in ('a', 'b'))
);
alter table public.people enable row level security;
drop policy if exists "people: leer" on public.people;
create policy "people: leer" on public.people for select to authenticated using (true);

insert into public.people (user_id, who)
select id, 'a' from auth.users where lower(email) = lower('shily@rusitoyshily.love')   -- ← email de Shily
on conflict (user_id) do update set who = excluded.who;
insert into public.people (user_id, who)
select id, 'b' from auth.users where lower(email) = lower('rusito@rusitoyshily.love')  -- ← email de Rusito
on conflict (user_id) do update set who = excluded.who;

create or replace function public.my_who() returns text
language sql stable security definer set search_path = public
as $$ select who from public.people where user_id = auth.uid() $$;

-- Sin trampas: cada uno solo puede escribir a su nombre y borrar lo suyo.
alter table public.items enable row level security;
drop policy if exists "solo nosotros" on public.items;
drop policy if exists "items: leer" on public.items;
drop policy if exists "items: crear" on public.items;
drop policy if exists "items: editar" on public.items;
drop policy if exists "items: borrar" on public.items;
create policy "items: leer" on public.items for select to authenticated using (public.my_who() is not null);
create policy "items: crear" on public.items for insert to authenticated with check (author = public.my_who());
create policy "items: editar" on public.items for update to authenticated using (public.my_who() is not null) with check (public.my_who() is not null);
create policy "items: borrar" on public.items for delete to authenticated using (author = public.my_who());

-- Los proyectos nuevos de Supabase ya no dan permiso automático a las tablas nuevas: se lo damos a mano.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant select on public.people to authenticated;
grant execute on function public.my_who() to authenticated;

-- Al editar algo del otro (marcar una carta como leída, encontrar una nota) el autor no cambia nunca.
create or replace function public.keep_author() returns trigger
language plpgsql as $$
begin
  new.author := old.author;
  new.created_at := old.created_at;
  return new;
end $$;
drop trigger if exists keep_author on public.items;
create trigger keep_author before update on public.items for each row execute function public.keep_author();

-- Tiempo real: lo que hace uno aparece al instante en la pantalla del otro.
alter table public.items replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null; end $$;

-- Fotos privadas (se ven con links temporales firmados).
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "fotos: leer" on storage.objects;
drop policy if exists "fotos: subir" on storage.objects;
drop policy if exists "fotos: borrar" on storage.objects;
create policy "fotos: leer" on storage.objects for select to authenticated using (bucket_id = 'photos' and public.my_who() is not null);
create policy "fotos: subir" on storage.objects for insert to authenticated with check (bucket_id = 'photos' and public.my_who() is not null);
create policy "fotos: borrar" on storage.objects for delete to authenticated using (bucket_id = 'photos' and public.my_who() is not null);
