-- ============================================================================
-- FonoMundos · Esquema completo Supabase
-- Arquitectura: Profesional → Pacientes → Sesiones → Resultados
-- Row Level Security: cada profesional SOLO ve SUS datos
-- Ejecutar en: supabase.com → SQL Editor
-- ============================================================================

-- Tabla de profesionales (amplía auth.users)
create table if not exists profesionales (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  especialidad text,
  centro text,
  creado_at timestamptz default now()
);

-- Tabla de pacientes (pseudonimizados: Paciente 1, 2, 3... — RGPD)
create table if not exists pacientes (
  id uuid default gen_random_uuid() primary key,
  profesional_id uuid not null references profesionales(id) on delete cascade,
  codigo text not null,
  edad text,
  curso text,
  diagnostico text,
  observaciones text,
  objetivos text,
  itinerario text default 'prevencion',
  antec_familiares boolean default false,
  lengua_materna text default 'español',
  deficit_sensorial boolean default false,
  monedas integer default 0,
  xp integer default 0,
  creado_at timestamptz default now()
);

-- Tabla de sesiones
create table if not exists sesiones (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid not null references pacientes(id) on delete cascade,
  profesional_id uuid not null references profesionales(id) on delete cascade,
  inicio bigint not null,
  fin bigint not null,
  modo_evaluacion boolean default false,
  notas_logopeda text,
  resultados jsonb not null default '[]',
  creado_at timestamptz default now()
);

-- Tabla de feedback de la comunidad
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  profesional_id uuid references profesionales(id) on delete set null,
  actividad text not null,
  item_actual text,
  tipo text not null,
  mensaje text,
  version text
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profesionales enable row level security;
alter table pacientes enable row level security;
alter table sesiones enable row level security;
alter table feedback enable row level security;

create policy "profesional_propio" on profesionales for all using (auth.uid() = id);
create policy "pacientes_propios" on pacientes for all using (auth.uid() = profesional_id);
create policy "sesiones_propias" on sesiones for all using (auth.uid() = profesional_id);
create policy "feedback_insert" on feedback for insert with check (true);
create policy "feedback_select" on feedback for select using (true);

-- ============================================================================
-- Trigger: crea perfil profesional al registrarse
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profesionales (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Índices
create index if not exists idx_pacientes_profesional on pacientes(profesional_id);
create index if not exists idx_sesiones_paciente on sesiones(paciente_id);
create index if not exists idx_sesiones_profesional on sesiones(profesional_id);
