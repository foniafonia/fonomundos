import type { ResultadoRonda } from '../types'

/**
 * Adaptación automática de dificultad.
 * Mira las últimas 3 rondas: si van bien sube, si van mal baja.
 */
export function ajustarDificultad(dificultad: number, historial: ResultadoRonda[]): number {
  const ultimas = historial.slice(-3)
  if (ultimas.length < 3) return dificultad

  const aciertosLimpios = ultimas.filter(
    (r) => r.acierto && r.intentos === 1 && !r.ayudaUsada,
  ).length
  const fallos = ultimas.filter((r) => !r.acierto).length

  if (aciertosLimpios === 3) return Math.min(5, dificultad + 1)
  if (fallos >= 2) return Math.max(1, dificultad - 1)
  return dificultad
}
