import { useRef } from 'react'
import type { Dominio, ResultadoRonda, Sesion } from '../types'
import { getPacientes, guardarPaciente, guardarSesion } from './storage'
import { guardarSesionCloud, getUser } from './storageCloud'
import { uid } from './id'
import { enqueueSyncItem } from './syncQueue'

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
  }) {
    resultados.current.push({ actividadId, dominio, ts: Date.now(), ...r })
  }

  function finalizar(): Sesion {
    const sesion: Sesion = {
      id: uid(),
      pacienteId,
      inicio: inicio.current,
      fin: Date.now(),
      resultados: resultados.current,
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

  return { registrar, finalizar, resultados }
}
