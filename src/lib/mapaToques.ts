/**
 * Mapa de toques — dónde caen los dedos sobre la interfaz.
 *
 * Decisiones de diseño, porque esto lo usan menores:
 * - No se guarda ninguna coordenada suelta. Se acumula un contador por celda de
 *   una rejilla de 40x40 sobre el viewport y se envía el recuento agregado.
 *   De un recuento no se puede reconstruir el gesto de nadie.
 * - No viaja pacienteId ni profesionalId: al mapa le da igual quién toca.
 * - Se envía por lotes (cada 45 s y al ocultar la pestaña). Un niño toca mucho:
 *   un evento por toque inundaría analytics y costaría dinero.
 * - Solo dentro de actividades. Fuera no aporta y no se recoge.
 */
import { registrarEventoUso } from './analytics'

const COLUMNAS = 40
const FILAS = 40
const INTERVALO_ENVIO_MS = 45_000
const MINIMO_PARA_ENVIAR = 5

let celdas = new Map<string, number>()
let vistaActual = ''
let timer: number | null = null
let activo = false

function clave(xNorm: number, yNorm: number) {
  const col = Math.min(COLUMNAS - 1, Math.max(0, Math.floor(xNorm * COLUMNAS)))
  const fil = Math.min(FILAS - 1, Math.max(0, Math.floor(yNorm * FILAS)))
  return `${col},${fil}`
}

function enviar() {
  if (celdas.size < MINIMO_PARA_ENVIAR) return
  const recuento: Record<string, number> = {}
  let total = 0
  for (const [k, n] of celdas) { recuento[k] = n; total += n }
  celdas = new Map()
  registrarEventoUso('toques', {
    vista: vistaActual,
    columnas: COLUMNAS,
    filas: FILAS,
    total,
    celdas: recuento,
  })
}

function onPointer(e: PointerEvent) {
  if (!activo) return
  const w = window.innerWidth || 1
  const h = window.innerHeight || 1
  const k = clave(e.clientX / w, e.clientY / h)
  celdas.set(k, (celdas.get(k) ?? 0) + 1)
}

function onVisibilidad() {
  if (document.visibilityState === 'hidden') enviar()
}

/** Empieza a contar toques en la actividad indicada. */
export function iniciarMapaToques(vista: string) {
  if (typeof window === 'undefined') return
  if (activo) detenerMapaToques()
  vistaActual = vista
  activo = true
  window.addEventListener('pointerdown', onPointer, { passive: true })
  document.addEventListener('visibilitychange', onVisibilidad)
  timer = window.setInterval(enviar, INTERVALO_ENVIO_MS)
}

/** Deja de contar y envía lo pendiente. */
export function detenerMapaToques() {
  if (!activo) return
  activo = false
  window.removeEventListener('pointerdown', onPointer)
  document.removeEventListener('visibilitychange', onVisibilidad)
  if (timer !== null) { window.clearInterval(timer); timer = null }
  enviar()
}
