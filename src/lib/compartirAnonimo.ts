/**
 * Resultados anónimos de quien juega sin cuenta (modo invitado).
 *
 * Las sesiones de un invitado se guardan solo en su dispositivo, así que no
 * sabíamos qué sonidos fallan ni cuánto se acierta fuera de las cuentas. Esto
 * manda UN registro por sesión con lo mínimo para saberlo.
 *
 * Qué NO viaja nunca: nombre, edad, curso, diagnóstico, observaciones, el
 * identificador del paciente, ni texto libre de ningún tipo. Solo números y la
 * unidad bajo prueba (el fonema o la sílaba), que es lo que alimenta el mapa
 * de calor. El visitante es el identificador aleatorio de analítica de siempre.
 *
 * Quien tiene cuenta no pasa por aquí: sus sesiones ya suben a su cuenta.
 */
import type { Sesion } from '../types'
import { registrarEventoUso } from './analytics'

const CLAVE = 'fonomundos.compartirAnonimo'
/** Con 5000 caracteres por evento caben de sobra; más rondas que esto no tiene sentido. */
const MAX_RONDAS = 40

export function compartirActivo(): boolean {
  try { return localStorage.getItem(CLAVE) !== '0' } catch { return true }
}

export function setCompartirActivo(valor: boolean) {
  try { localStorage.setItem(CLAVE, valor ? '1' : '0') } catch { /* sin espacio */ }
}

/** Cada ronda, en una fila corta: [acierto, intentos, ayuda, tiempoMs, dificultad, foco, tipo]. */
export function compactarSesion(sesion: Sesion) {
  const rondas = sesion.resultados.slice(0, MAX_RONDAS).map((r) => [
    r.acierto ? 1 : 0,
    Math.min(r.intentos, 9),
    r.ayudaUsada ? 1 : 0,
    Math.min(Math.round(r.tiempoMs), 600000),
    r.dificultad,
    // Solo la unidad (fonema, sílaba…): recortada, sin nada que pueda ser un nombre.
    (r.foco ?? '').slice(0, 20),
    r.focoTipo ?? '',
  ])
  const actividadId = sesion.resultados[0]?.actividadId ?? ''
  const dominio = sesion.resultados[0]?.dominio ?? ''
  return {
    actividadId,
    dominio,
    parcial: !!sesion.parcial,
    evaluacion: !!sesion.modoEvaluacion,
    duracionMs: Math.max(0, sesion.fin - sesion.inicio),
    total: sesion.resultados.length,
    rondas,
  }
}

export function enviarResultadoAnonimo(sesion: Sesion) {
  if (!compartirActivo() || !sesion.resultados.length) return
  // Sin contexto: ni profesional ni paciente.
  registrarEventoUso('sesion_anonima', compactarSesion(sesion))
}
