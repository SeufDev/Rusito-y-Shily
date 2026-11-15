-- Rusito & Shily · base de datos (pegar entero en Supabase → SQL Editor → Run)

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

-- Solo la cuenta de ustedes (ya logueada) puede leer o escribir.
alter table public.items enable row level security;
drop policy if exists "solo nosotros" on public.items;
create policy "solo nosotros" on public.items
  for all to authenticated using (true) with check (true);

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
create policy "fotos: leer" on storage.objects for select to authenticated using (bucket_id = 'photos');
create policy "fotos: subir" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "fotos: borrar" on storage.objects for delete to authenticated using (bucket_id = 'photos');
