/**
 * Modo Evaluación — contexto global que desactiva gamificación
 * para cumplir el protocolo profesional de cribado (20-30 min).
 * En modo evaluación:
 * - Sin animaciones largas de refuerzo
 * - Sin monedas/XP visibles
 * - Paso inmediato entre rondas
 * - Notas cualitativas habilitadas
 */

let _activo = false

export function modoEvaluacion() { return _activo }
export function setModoEvaluacion(v: boolean) { _activo = v }

/** Retardo entre rondas: 0 en evaluación, 850ms en juego */
export function retardoRonda() { return _activo ? 0 : 850 }

/** Retardo de refuerzo: 0 en evaluación, 1500ms en juego */
export function retardoRefuerzo() { return _activo ? 400 : 1500 }
