import { useRef } from 'react'
import type { Dominio, ResultadoRonda, Sesion } from '../types'
import { getPacientes, guardarPaciente, guardarSesion } from './storage'
import { uid } from './id'

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
    guardarSesion(sesion)
    const p = getPacientes().find((x) => x.id === pacienteId)
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
