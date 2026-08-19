-- Marca de sesión parcial
--
-- Una sesión parcial es la que se cerró antes de la última ronda. Hasta ahora
-- esas sesiones no existían: al pulsar Salir se perdía todo lo jugado. Ahora se
-- guardan, y el panel necesita poder distinguirlas de las completas para no
-- mezclar "hizo 3 rondas y paró" con "hizo las 10".
--
-- Aditiva y con valor por defecto: las filas existentes quedan como completas,
-- que es lo que eran. No rompe nada ni requiere parar la app.
--
-- Aplicar en Supabase → SQL Editor, o con la CLI:
--   supabase db push

alter table public.sesiones
  add column if not exists parcial boolean not null default false;

comment on column public.sesiones.parcial is
  'true = se salió antes de completar la actividad. Los resultados son válidos, la sesión no está completa.';

-- El panel filtra por parcial al calcular índices y evolución.
create index if not exists sesiones_parcial_idx
  on public.sesiones (profesional_id, parcial);
