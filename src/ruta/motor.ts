import type { Repaso, Tarea, Parada } from './tipos'
import { PARADAS_3_ANOS } from './paradas'
import { entradaDe } from './catalogo'

/**
 * Motor de la Ruta: en qué parada va cada niño, qué toca hoy y cuándo avanza.
 * Funciones puras sobre un estado que se guarda en localStorage; así se puede
 * comprobar sin pantalla (validarRuta.ts) y no depende de Supabase.
 *
 * Criterios:
 * - Tarea dominada: ≥ 80 % en 2 sesiones seguidas con al menos 3 ítems.
 * - Parada superada: todas sus tareas fonológicas dominadas → parada siguiente.
 * - < 50 % en 2 sesiones seguidas → misma tarea con más ayuda. Nunca se salta.
 */

export const UMBRAL_DOMINIO = 0.8
export const UMBRAL_CUESTA = 0.5
export const SESIONES_SEGUIDAS = 2
/** Mismo mínimo que MINIMO_FIABLE del mapa de calor: por debajo, el % es ruido. */
export const MINIMO_FIABLE = 3
export const NIVEL_AYUDA_MAX = 2
export const HISTORIAL_MAX = 300

const PREFIJO_CLAVE = 'fonomundos.ruta.'

export interface Pasada {
  fecha: number
  aciertos: number
  total: number
  nivelAyuda: number
  parcial: boolean
}

export interface EstadoTarea {
  pasadas: Pasada[]
  dominada: boolean
  nivelAyuda: number
}

export interface ResumenBloque {
  actividadId: string
  aciertos: number
  total: number
}

export interface SesionRuta {
  id: string
  fecha: number
  paradaId: string
  tareaNum: number
  actividadId: string
  aciertos: number
  total: number
  nivelAyuda: number
  parcial: boolean
  duracionMs: number
  repaso: ResumenBloque | null
  cierre: ResumenBloque | null
  /** Ids de las sesiones guardadas en la ficha del paciente (storage/Supabase). */
  sesionIds: string[]
  cambios: string[]
}

export interface EstadoRuta {
  version: 2
  nivel: 'tres'
  /** Parada actual; `null` cuando ya se han superado todas las paradas del nivel. */
  paradaId: string | null
  /** Índice de la tarea por la que sigue la rotación dentro de la parada. */
  puntero: number
  /** Clave `r3-p1#2` → estado de la tarea 2 de la parada 1. */
  tareas: Record<string, EstadoTarea>
  historial: SesionRuta[]
  creado: number
}

export function claveTarea(paradaId: string, num: number) {
  return `${paradaId}#${num}`
}

export function estadoInicial(ahora = Date.now()): EstadoRuta {
  return { version: 2, nivel: 'tres', paradaId: PARADAS_3_ANOS[0].id, puntero: 0, tareas: {}, historial: [], creado: ahora }
}

export function paradaPorId(id: string | null): Parada | undefined {
  return id ? PARADAS_3_ANOS.find((t) => t.id === id) : undefined
}

export function estadoDeTarea(estado: EstadoRuta, paradaId: string, num: number): EstadoTarea {
  return estado.tareas[claveTarea(paradaId, num)] ?? { pasadas: [], dominada: false, nivelAyuda: 0 }
}

export function pasadasFiables(t: EstadoTarea) {
  return t.pasadas.filter((p) => p.total >= MINIMO_FIABLE)
}

export function porcentaje(aciertos: number, total: number) {
  return total > 0 ? aciertos / total : 0
}

/** Actividades que la parada necesita y todavía no existen. Si hay alguna, la Ruta se para ahí. */
export function actividadesQueFaltan(parada: Parada): string[] {
  const ids = parada.tareas.map((t) => t.actividadId)
  return [...new Set(ids.filter((id) => !entradaDe(id)?.construida))]
}

export type PlanDeHoy =
  | { tipo: 'terminada' }
  | { tipo: 'bloqueado'; parada: Parada; faltan: string[] }
  | {
      tipo: 'sesion'
      parada: Parada
      tarea: Tarea
      indice: number
      nivelAyuda: number
      /** `null` si la parada no trae repaso o su actividad no admite un bloque corto todavía. */
      repaso: Repaso | null
      /** Motivo por el que el repaso de la parada no se hace hoy, para decírselo al adulto. */
      repasoOmitido: string | null
    }

export function planDeHoy(estado: EstadoRuta): PlanDeHoy {
  const parada = paradaPorId(estado.paradaId)
  if (!parada) return { tipo: 'terminada' }
  const faltan = actividadesQueFaltan(parada)
  if (faltan.length) return { tipo: 'bloqueado', parada, faltan }

  // Rotación en el orden fijado, saltando solo lo ya dominado.
  const n = parada.tareas.length
  let indice = -1
  for (let k = 0; k < n; k++) {
    const i = (estado.puntero + k) % n
    if (!estadoDeTarea(estado, parada.id, parada.tareas[i].num).dominada) { indice = i; break }
  }
  // Todo dominado pero la parada no avanzó (falta alguna pasada mínima): se
  // sigue rotando igual; registrarSesion lo resolverá.
  if (indice === -1) indice = estado.puntero % n
  const tarea = parada.tareas[indice]

  let repaso: Repaso | null = null
  let repasoOmitido: string | null = null
  if (parada.repaso) {
    const entrada = entradaDe(parada.repaso.actividadId)
    if (!entrada?.construida) repasoOmitido = `«${entrada?.titulo ?? parada.repaso.actividadId}» aún no está construida`
    else if (!entrada.admiteItems) repasoOmitido = `«${entrada.titulo}» todavía no admite un bloque corto de 3-4 ítems`
    else repaso = parada.repaso
  }

  return {
    tipo: 'sesion', parada, tarea, indice,
    nivelAyuda: estadoDeTarea(estado, parada.id, tarea.num).nivelAyuda,
    repaso, repasoOmitido,
  }
}

export interface DatosSesion {
  id: string
  fecha: number
  duracionMs: number
  parcial: boolean
  objetivo: { aciertos: number; total: number }
  repaso: ResumenBloque | null
  cierre: ResumenBloque | null
  sesionIds: string[]
}

/** Aplica el resultado de una sesión. Devuelve un estado nuevo y los cambios en lenguaje llano. */
export function registrarSesion(estado: EstadoRuta, plan: Extract<PlanDeHoy, { tipo: 'sesion' }>, datos: DatosSesion) {
  const { parada, tarea, indice } = plan
  const clave = claveTarea(parada.id, tarea.num)
  const previo = estadoDeTarea(estado, parada.id, tarea.num)
  const t: EstadoTarea = { ...previo, pasadas: [...previo.pasadas] }
  const cambios: string[] = []
  const entrada = entradaDe(tarea.actividadId)
  const nombre = `Parada ${parada.numero} · tarea ${tarea.num} (${entrada?.titulo ?? tarea.actividadId})`

  if (datos.objetivo.total > 0) {
    t.pasadas.push({
      fecha: datos.fecha,
      aciertos: datos.objetivo.aciertos,
      total: datos.objetivo.total,
      nivelAyuda: t.nivelAyuda,
      parcial: datos.parcial,
    })
  }
  if (datos.objetivo.total > 0 && datos.objetivo.total < MINIMO_FIABLE) {
    cambios.push(`${nombre}: solo ${datos.objetivo.total} ${datos.objetivo.total === 1 ? 'ítem' : 'ítems'}, no cuenta para decidir (mínimo ${MINIMO_FIABLE}).`)
  }

  // «2 sesiones seguidas»: las dos últimas pasadas fiables, y las dos con la
  // ayuda actual. Al cambiar de nivel la cuenta vuelve a empezar.
  const ultimas = pasadasFiables(t).slice(-SESIONES_SEGUIDAS)
  const mismasCondiciones = ultimas.length === SESIONES_SEGUIDAS && ultimas.every((p) => p.nivelAyuda === t.nivelAyuda)
  if (mismasCondiciones && !t.dominada) {
    const pcts = ultimas.map((p) => porcentaje(p.aciertos, p.total))
    if (pcts.every((p) => p >= UMBRAL_DOMINIO)) {
      if (t.nivelAyuda > 0) {
        t.nivelAyuda -= 1
        cambios.push(`${nombre}: ≥ 80 % dos veces con ayuda → se retira un nivel de ayuda.`)
      } else {
        t.dominada = true
        cambios.push(`${nombre}: dominada (≥ 80 % en 2 sesiones seguidas).`)
      }
    } else if (pcts.every((p) => p < UMBRAL_CUESTA)) {
      if (t.nivelAyuda < NIVEL_AYUDA_MAX) {
        t.nivelAyuda += 1
        cambios.push(`${nombre}: < 50 % dos veces → misma tarea con más ayuda (nivel ${t.nivelAyuda}). No se salta.`)
      } else {
        cambios.push(`${nombre}: sigue por debajo del 50 % con la máxima ayuda. Conviene revisarla con el profesional.`)
      }
    }
  }

  const tareas = { ...estado.tareas, [clave]: t }
  let paradaId: string | null = estado.paradaId
  // Si la tarea no llegó al mínimo (salió antes de tiempo), la rotación no
  // avanza: la próxima sesión repite la misma tarea y el orden se mantiene.
  let puntero = datos.objetivo.total >= MINIMO_FIABLE ? (indice + 1) % parada.tareas.length : estado.puntero

  // Parada superada: las tareas fonológicas dominadas y cada tarea vista al
  // menos 2 sesiones (cada tarea sale como mínimo en 2 sesiones).
  const provisional = { ...estado, tareas }
  const paradaDominada = parada.tareas.every((ta) => {
    const et = estadoDeTarea(provisional, parada.id, ta.num)
    const vista = pasadasFiables(et).length >= SESIONES_SEGUIDAS
    const fonologica = entradaDe(ta.actividadId)?.fonologica ?? true
    return vista && (!fonologica || et.dominada)
  })
  if (paradaDominada) {
    const i = PARADAS_3_ANOS.findIndex((x) => x.id === parada.id)
    const siguiente = PARADAS_3_ANOS[i + 1]
    paradaId = siguiente?.id ?? null
    puntero = 0
    cambios.push(siguiente
      ? `Parada ${parada.numero} superada → pasa a la parada ${siguiente.numero}: ${siguiente.nombre}.`
      : `Parada ${parada.numero} superada: Ruta de 3 años completa.`)
  }

  const registro: SesionRuta = {
    id: datos.id,
    fecha: datos.fecha,
    paradaId: parada.id,
    tareaNum: tarea.num,
    actividadId: tarea.actividadId,
    aciertos: datos.objetivo.aciertos,
    total: datos.objetivo.total,
    nivelAyuda: previo.nivelAyuda,
    parcial: datos.parcial,
    duracionMs: datos.duracionMs,
    repaso: datos.repaso,
    cierre: datos.cierre,
    sesionIds: datos.sesionIds,
    cambios,
  }

  const nuevo: EstadoRuta = {
    ...estado,
    paradaId,
    puntero,
    tareas,
    historial: [...estado.historial, registro].slice(-HISTORIAL_MAX),
  }
  return { estado: nuevo, cambios }
}

// ── Persistencia ────────────────────────────────────────────────────────────

export function claveAlmacen(pacienteId: string) {
  return `${PREFIJO_CLAVE}${pacienteId}`
}

export function cargarEstado(pacienteId: string): EstadoRuta {
  try {
    const raw = localStorage.getItem(claveAlmacen(pacienteId))
    if (!raw) return estadoInicial()
    const e = JSON.parse(raw) as EstadoRuta
    return e?.version === 2 ? e : estadoInicial()
  } catch {
    return estadoInicial()
  }
}

export function guardarEstado(pacienteId: string, estado: EstadoRuta) {
  try {
    localStorage.setItem(claveAlmacen(pacienteId), JSON.stringify(estado))
  } catch (e) {
    console.error('[Ruta] No se pudo guardar el estado:', e)
  }
}
