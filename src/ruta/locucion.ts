import { tieneClip } from '../lib/vozArchivos'
import { PAUSA_TRAS_ENUNCIADO_MS, getRitmoVoz, hablarSecuencia } from '../lib/voz'
import { decirFonema, decirPalabra } from '../lib/pronunciacion'
import { CONSONANTES_CONTINUAS, CONSONANTES_OCLUSIVAS, PALABRAS_ARTICULACION, PALABRAS_MEMORIA, VOCALES } from './vocabulario'

/**
 * Todo lo que dice la Ruta pasa por aquí.
 *
 * Regla de la voz: si una parte no tiene clip pregenerado, hablarSecuencia
 * manda la secuencia ENTERA al sintetizador del móvil y se oye otra voz a
 * mitad de actividad. Por eso aquí una parte sin clip no se dice: se calla.
 * Las consignas nuevas están dadas de alta en scripts/recolectar-voz.ts y
 * empezarán a sonar en cuanto se regeneren los clips con Piper.
 */

const PAUSA_ENTRE_PARTES_MS = 850

export const CONSIGNAS = {
  escuchaPalabras: 'Escucha las palabras',
  muyBien: 'Muy bien.',
  otraVez: 'Inténtalo otra vez.',
  // Nuevas: pendientes de generar.
  tocaEnOrden: 'Toca los dibujos en el mismo orden',
  escuchaRepite: 'Escucha y repite',
  montaSilaba: 'Escucha y monta la sílaba',
  cualFalta: '¿Cuál falta?',
  cualNueva: '¿Cuál es la nueva?',
} as const

/** Textos que la Ruta puede llegar a locutar. Lo consume scripts/recolectar-voz.ts. */
export function textosRuta(): string[] {
  const textos = new Set<string>(Object.values(CONSIGNAS))
  PALABRAS_MEMORIA.forEach((p) => textos.add(decirPalabra(p)))
  for (const [sonido, palabras] of Object.entries(PALABRAS_ARTICULACION)) {
    textos.add(decirFonema(sonido))
    palabras.forEach((p) => textos.add(decirPalabra(p)))
  }
  ;[...CONSONANTES_CONTINUAS, ...CONSONANTES_OCLUSIVAS, ...VOCALES].forEach((s) => textos.add(decirFonema(s)))
  return [...textos].filter(Boolean)
}

export function textosSinClip(): string[] {
  return textosRuta().filter((t) => !tieneClip(t))
}

export function locutar(partes: string[], opciones: { pausaMs?: number } = {}) {
  const limpias = partes.map((p) => p.trim()).filter(Boolean)
  const conClip = limpias.filter((p) => tieneClip(p))
  if (conClip.length < limpias.length) {
    console.warn('[Ruta] Sin clip, no se locuta:', limpias.filter((p) => !tieneClip(p)))
  }
  if (!conClip.length) return
  if (opciones.pausaMs !== undefined) {
    hablarSecuencia(conClip, opciones.pausaMs, { pausaPrimeraMs: opciones.pausaMs })
    return
  }
  const empiezaPorConsigna = conClip[0] === limpias[0]
  hablarSecuencia(conClip, PAUSA_ENTRE_PARTES_MS, {
    pausaPrimeraMs: empiezaPorConsigna && conClip.length > 1 ? PAUSA_TRAS_ENUNCIADO_MS : PAUSA_ENTRE_PARTES_MS,
  })
}

/**
 * Cuánto tarda más o menos una secuencia en sonar. hablarSecuencia no avisa al
 * terminar; se usa para no enseñar los dibujos mientras el niño aún escucha.
 */
export function duracionEstimadaMs(partes: string[]) {
  const conClip = partes.filter((p) => tieneClip(p))
  if (!conClip.length) return 0
  // Calibrado con los clips reales: «Escucha las palabras» 1,6 s, «mano.» 0,5 s.
  const habla = conClip.reduce((ms, p) => ms + 300 + p.length * 60, 0)
  const pausas = (conClip.length - 1) * PAUSA_ENTRE_PARTES_MS + (PAUSA_TRAS_ENUNCIADO_MS - PAUSA_ENTRE_PARTES_MS)
  return Math.round((habla + pausas) / getRitmoVoz())
}

/** Tope de lo que dura un sonido grabado por José (el más largo, /x/, 1,5 s). */
const DURACION_SONIDO_GRABADO_MS = 1600

/** Cuánto tardan en sonar sonidos grabados seguidos, con la pausa indicada. */
export function duracionGrabadaMs(partes: string[], pausaMs = PAUSA_ENTRE_PARTES_MS) {
  const n = partes.filter((p) => tieneClip(p)).length
  if (!n) return 0
  return Math.round((n * DURACION_SONIDO_GRABADO_MS + (n - 1) * pausaMs) / getRitmoVoz())
}
