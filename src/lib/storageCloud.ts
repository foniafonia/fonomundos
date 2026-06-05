/**
 * StorageCloud — capa de almacenamiento multi-tenant.
 * Usa Supabase cuando está configurado; localStorage como fallback.
 * Los datos pertenecen siempre al profesional autenticado.
 */
import { supabase, supabaseActivo } from './supabase'
export { supabaseActivo } from './supabase'
import type { Paciente, Sesion } from '../types'
import { uid } from './id'
import { getSyncQueue, markSyncFailed, removeSyncItem } from './syncQueue'

// ---- Helpers ----
function localKey(suf: string) { return `fonomundos.${suf}` }
function leerLocal<T>(k: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(localKey(k)) || 'null') ?? def } catch { return def }
}
function escribirLocal(k: string, v: unknown) {
  localStorage.setItem(localKey(k), JSON.stringify(v))
}

// ---- AUTH ----
export async function getUser() {
  if (!supabaseActivo()) return null
  const { data } = await supabase!.auth.getUser()
  return data.user
}

export async function signIn(email: string, password: string) {
  if (!supabaseActivo()) return { error: { message: 'Supabase no configurado' } }
  return await supabase!.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  if (!supabaseActivo()) return { error: { message: 'Supabase no configurado' } }
  return await supabase!.auth.signUp({ email, password })
}

export async function requestPasswordReset(email: string) {
  if (!supabaseActivo()) return { error: { message: 'Supabase no configurado' } }
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  return await supabase!.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(password: string) {
  if (!supabaseActivo()) return { error: { message: 'Supabase no configurado' } }
  return await supabase!.auth.updateUser({ password })
}

export async function signOut() {
  if (supabaseActivo()) await supabase!.auth.signOut()
  // Limpia datos locales de sesión (no los pacientes)
  localStorage.removeItem(localKey('pacienteActivo'))
}

export function onAuthChange(cb: (uid: string | null) => void) {
  if (!supabaseActivo()) { cb(null); return () => {} }
  const { data } = supabase!.auth.onAuthStateChange((_e, s) => cb(s?.user?.id ?? null))
  return () => data.subscription.unsubscribe()
}

export function onAuthEvent(cb: (event: string, uid: string | null) => void) {
  if (!supabaseActivo()) { cb('SIGNED_OUT', null); return () => {} }
  const { data } = supabase!.auth.onAuthStateChange((event, session) => cb(event, session?.user?.id ?? null))
  return () => data.subscription.unsubscribe()
}

// ---- PACIENTES ----
function dbAPaciente(r: Record<string, unknown>): Paciente {
  return {
    id: r.id as string,
    nombre: r.codigo as string,
    edad: (r.edad ?? '') as string,
    curso: (r.curso ?? '') as string,
    diagnostico: (r.diagnostico ?? '') as string,
    observaciones: (r.observaciones ?? '') as string,
    objetivos: (r.objetivos ?? '') as string,
    itinerario: ((r.itinerario ?? 'prevencion') as 'prevencion' | 'intervencion'),
    antecFamiliares: !!(r.antec_familiares),
    lenguaMaterna: (r.lengua_materna ?? 'español') as string,
    deficitSensorial: !!(r.deficit_sensorial),
    monedas: (r.monedas ?? 0) as number,
    xp: (r.xp ?? 0) as number,
    creado: r.creado_at ? new Date(r.creado_at as string).getTime() : Date.now(),
  }
}

function pacienteADB(p: Partial<Paciente>, profesionalId: string): Record<string, unknown> {
  return {
    profesional_id: profesionalId,
    codigo: p.nombre ?? 'Paciente',
    edad: p.edad ?? '',
    curso: p.curso ?? '',
    diagnostico: p.diagnostico ?? '',
    observaciones: p.observaciones ?? '',
    objetivos: p.objetivos ?? '',
    itinerario: p.itinerario ?? 'prevencion',
    antec_familiares: p.antecFamiliares ?? false,
    lengua_materna: p.lenguaMaterna ?? 'español',
    deficit_sensorial: p.deficitSensorial ?? false,
    monedas: p.monedas ?? 0,
    xp: p.xp ?? 0,
  }
}

export async function getPacientes(): Promise<Paciente[]> {
  if (supabaseActivo()) {
    const { data } = await supabase!.from('pacientes').select('*').order('creado_at')
    return (data ?? []).map(dbAPaciente)
  }
  return leerLocal<Paciente[]>('pacientes', [])
}

export async function crearPacienteCloud(datos: Partial<Paciente>, profesionalId: string): Promise<Paciente> {
  if (supabaseActivo()) {
    const { data, error } = await supabase!
      .from('pacientes')
      .insert(pacienteADB(datos, profesionalId))
      .select()
      .single()
    if (error) throw error
    return dbAPaciente(data as Record<string, unknown>)
  }
  // Fallback local
  const p: Paciente = {
    id: uid(),
    nombre: datos.nombre ?? 'Paciente',
    edad: datos.edad ?? '', curso: datos.curso ?? '',
    diagnostico: datos.diagnostico ?? '', observaciones: datos.observaciones ?? '',
    objetivos: datos.objetivos ?? '', itinerario: datos.itinerario ?? 'prevencion',
    antecFamiliares: datos.antecFamiliares ?? false,
    lenguaMaterna: datos.lenguaMaterna ?? 'español',
    deficitSensorial: datos.deficitSensorial ?? false,
    monedas: 0, xp: 0, creado: Date.now(),
  }
  const lista = leerLocal<Paciente[]>('pacientes', [])
  lista.push(p)
  escribirLocal('pacientes', lista)
  return p
}

export async function actualizarPacienteCloud(p: Paciente, profesionalId: string): Promise<void> {
  if (supabaseActivo()) {
    await supabase!.from('pacientes').update(pacienteADB(p, profesionalId)).eq('id', p.id)
    return
  }
  const lista = leerLocal<Paciente[]>('pacientes', [])
  const i = lista.findIndex((x) => x.id === p.id)
  if (i >= 0) lista[i] = p
  else lista.push(p)
  escribirLocal('pacientes', lista)
}

export async function eliminarPacienteCloud(id: string): Promise<void> {
  if (supabaseActivo()) {
    await supabase!.from('pacientes').delete().eq('id', id)
    return
  }
  const lista = leerLocal<Paciente[]>('pacientes', []).filter((p) => p.id !== id)
  escribirLocal('pacientes', lista)
}

// ---- SESIONES ----
export async function getSesionesCloud(pacienteId?: string): Promise<Sesion[]> {
  if (supabaseActivo()) {
    let q = supabase!.from('sesiones').select('*').order('creado_at', { ascending: false })
    if (pacienteId) q = q.eq('paciente_id', pacienteId)
    const { data } = await q
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      pacienteId: r.paciente_id as string,
      inicio: r.inicio as number,
      fin: r.fin as number,
      resultados: ((r.resultados ?? []) as Sesion['resultados']),
    }))
  }
  const all = leerLocal<Sesion[]>('sesiones', [])
  return pacienteId ? all.filter((s) => s.pacienteId === pacienteId) : all
}

export async function guardarSesionCloud(s: Sesion, profesionalId: string): Promise<void> {
  if (supabaseActivo()) {
    const { error } = await supabase!.from('sesiones').insert({
      id: s.id,
      paciente_id: s.pacienteId,
      profesional_id: profesionalId,
      inicio: s.inicio,
      fin: s.fin,
      resultados: s.resultados,
    })
    if (error?.code === '23505') return
    if (error) throw error
    return
  }
  const lista = leerLocal<Sesion[]>('sesiones', [])
  lista.push(s)
  escribirLocal('sesiones', lista)
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size)
  )
}

export async function sincronizarSesionesPendientes(): Promise<{ ok: number; pendientes: number }> {
  const pendientes = getSyncQueue().filter((item) => item.kind === 'session')
  let ok = 0
  if (!supabaseActivo()) {
    for (const item of pendientes) {
      markSyncFailed(item.id, 'Supabase no configurado para reintentar sesiones')
    }
    return { ok, pendientes: pendientes.length }
  }

  const chunks = chunkArray(pendientes, 10)
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(item => {
        const payload = item.payload as { sesion: Sesion; profesionalId: string }
        return guardarSesionCloud(payload.sesion, payload.profesionalId)
      })
    )

    results.forEach((result, idx) => {
      const item = chunk[idx]
      if (result.status === 'fulfilled') {
        removeSyncItem(item.id)
        ok++
      } else {
        markSyncFailed(item.id, result.status === 'rejected' ? String(result.reason) : 'Fallo al guardar sesión')
      }
    })
  }

  return { ok, pendientes: getSyncQueue().filter((item) => item.kind === 'session').length }
}

// ---- PACIENTE ACTIVO (local) ----
export function getPacienteActivoId(): string | null {
  return localStorage.getItem(localKey('pacienteActivo'))
}
export function setPacienteActivo(id: string | null) {
  if (id) localStorage.setItem(localKey('pacienteActivo'), id)
  else localStorage.removeItem(localKey('pacienteActivo'))
}

// ---- MIGRACIÓN: localStorage → Supabase al hacer login ----
/**
 * Cuando el usuario crea cuenta después de jugar como invitado,
 * migra automáticamente todos sus pacientes y sesiones locales a Supabase.
 * Se llama una sola vez tras el primer login exitoso.
 */
export async function migrarDatosLocalesASupabase(profesionalId: string): Promise<{ pacientes: number; sesiones: number }> {
  if (!supabaseActivo()) return { pacientes: 0, sesiones: 0 }

  const pacientesLocales = leerLocal<Paciente[]>('pacientes', [])
  const sesionesLocales = leerLocal<Sesion[]>('sesiones', [])

  if (!pacientesLocales.length && !sesionesLocales.length) return { pacientes: 0, sesiones: 0 }

  let pacientesMigrados = 0
  let sesionesMigradas = 0
  const mapaIds = new Map<string, string>() // id local → id nuevo en Supabase

  // Migrar pacientes
  for (const p of pacientesLocales) {
    try {
      const { data } = await supabase!
        .from('pacientes')
        .insert({
          profesional_id: profesionalId,
          codigo: p.nombre,
          edad: p.edad ?? '',
          curso: p.curso ?? '',
          diagnostico: p.diagnostico ?? '',
          observaciones: p.observaciones ?? '',
          objetivos: p.objetivos ?? '',
          itinerario: p.itinerario ?? 'prevencion',
          antec_familiares: p.antecFamiliares ?? false,
          lengua_materna: p.lenguaMaterna ?? 'español',
          deficit_sensorial: p.deficitSensorial ?? false,
          monedas: p.monedas ?? 0,
          xp: p.xp ?? 0,
        })
        .select('id')
        .single()
      if (data) {
        mapaIds.set(p.id, data.id)
        pacientesMigrados++
      }
    } catch (e) {
      console.error(`[FM] ❌ Fallo migrando paciente "${p.nombre}" (${p.id}):`, e)
    }
  }

  // Migrar sesiones usando los nuevos IDs
  for (const s of sesionesLocales) {
    const nuevoPacienteId = mapaIds.get(s.pacienteId)
    if (!nuevoPacienteId) {
      console.warn(`[FM] ⚠️ Sesión ${s.id} — paciente no migrado`)
      continue
    }
    try {
      await supabase!.from('sesiones').insert({
        id: uid(),
        paciente_id: nuevoPacienteId,
        profesional_id: profesionalId,
        inicio: s.inicio,
        fin: s.fin,
        resultados: s.resultados,
      })
      sesionesMigradas++
    } catch (e) {
      console.error(`[FM] ❌ Fallo migrando sesión ${s.id}:`, e)
    }
  }

  // Limpiar localStorage tras migración exitosa
  if (pacientesMigrados > 0) {
    localStorage.removeItem(localKey('pacientes'))
    localStorage.removeItem(localKey('sesiones'))
    localStorage.removeItem(localKey('pacienteActivo'))
    console.info(`[FM] ✅ Migración completada: ${pacientesMigrados} pacientes, ${sesionesMigradas} sesiones`)
  }

  return { pacientes: pacientesMigrados, sesiones: sesionesMigradas }
}
