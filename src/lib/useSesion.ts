import { useRef } from 'react'
import type { Dominio, ResultadoRonda, Sesion } from '../types'
import { getPacientes, guardarPaciente, guardarSesion } from './storage'
import { guardarSesionCloud, getUser } from './storageCloud'
import { uid } from './id'
import { enqueueSyncItem } from './syncQueue'
import { registrarEventoUso } from './analytics'

/** Registro de sesión reutilizable por actividades con UI propia (policubos, cadenas...). */
export function useSesion(pacienteId: string, actividadId: string, dominio: Dominio) {
  const resultados = useRef<ResultadoRonda[]>([])
  const inicio = useRef<number>(Date.now())

  function registrar(r: {
    acierto: boolean
    intentos: number
    ayudaUsada: boolean
    tiempoMs: number
    dificultad: number
    itemSeleccionadoId?: string
  }) {
    resultados.current.push({ actividadId, dominio, ts: Date.now(), ...r })
  }

  function finalizar(opciones: { parcial?: boolean } = {}): Sesion {
    const sesion: Sesion = {
      id: uid(),
      pacienteId,
      inicio: inicio.current,
      fin: Date.now(),
      resultados: resultados.current,
      ...(opciones.parcial ? { parcial: true } : {}),
    }
    // Guardar local siempre (fallback)
    guardarSesion(sesion)
    // Guardar en Supabase si hay usuario autenticado
    getUser().then((user) => {
      if (user) {
        guardarSesionCloud(sesion, user.id)
          .then(() => console.info('[FM] ✅ Sesión guardada en Supabase:', sesion.id))
          .catch((e) => {
            enqueueSyncItem('session', { sesion, profesionalId: user.id }, 'No se pudo subir la sesión')
            console.error('[FM] ❌ Error guardando sesión en Supabase:', e)
          })
      } else {
        console.info('[FM] ⚠️ Sin usuario autenticado — sesión guardada solo en local')
      }
    })
    // Actualizar gamificación
    const lista = getPacientes()
    const p = lista.find((x) => x.id === pacienteId)
    if (p) {
      const ok = resultados.current.filter((r) => r.acierto).length
      p.monedas += ok * 5
      p.xp += ok * 10
      guardarPaciente(p)
    }
    return sesion
  }

  /**
   * Salida antes de terminar. Antes se perdía todo: si el niño se cansaba en la
   * ronda 7 —lo normal en consulta— el profesional pulsaba Salir y las 7 rondas
   * no llegaban ni al panel ni a Supabase. Ahora se guardan marcadas como
   * parciales y se registra en qué ronda se dejó, para poder ver dónde se
   * abandona en vez de solo cuántas sesiones no se completan.
   */
  function abandonar(rondasTotales?: number): Sesion | null {
    const hechas = resultados.current.length
    registrarEventoUso('actividad_abandonada', {
      actividadId,
      dominio,
      rondasHechas: hechas,
      rondasTotales: rondasTotales ?? null,
      aciertos: resultados.current.filter((r) => r.acierto).length,
      duracionMs: Math.max(0, Date.now() - inicio.current),
    })
    if (!hechas) return null
    return finalizar({ parcial: true })
  }

  return { registrar, finalizar, abandonar, resultados }
}
