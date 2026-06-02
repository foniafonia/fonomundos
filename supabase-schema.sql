-- FonoMundos · Tabla de feedback de la comunidad
-- Ejecutar en: supabase.com → SQL Editor

create table if not exists feedback (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  actividad   text not null,
  item_actual text,
  tipo        text not null,
  mensaje     text,
  version     text
);

-- Cualquiera puede insertar (reportar un bug)
alter table feedback enable row level security;

create policy "insert_publico"
  on feedback for insert
  with check (true);

create policy "select_publico"
  on feedback for select
  using (true);
