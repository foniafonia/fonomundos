/**
 * Reproductor de voz pregenerada.
 *
 * El problema que resuelve: `speechSynthesis` usa la voz del dispositivo, así
 * que FonoMundos sonaba distinto en cada móvil —de ahí «la voz es muy fea» y
 * «no me gusta la voz que sale automática»— y no había forma de controlarlo
 * desde el código. Con audio pregenerado suena igual en todas partes.
 *
 * Voz: Piper es_ES-sharvard-medium, hablante femenino (España), CC-BY 3.0.
 * Ver la atribución en la pantalla «Qué es FonoMundos».
 *
 * Si un texto no tiene fichero, `hablar()` cae al sintetizador de siempre: la
 * app nunca se queda muda por un clip que falte.
 */
import INDICE from '../data/vozIndice.json'

const MAPA = INDICE as Record<string, string>
const BASE = '/voz'

/** Cache de elementos ya cargados, para no volver a pedir el mismo fichero. */
const cache = new Map<string, HTMLAudioElement>()
let sonando: HTMLAudioElement | null = null

function normalizar(texto: string) {
  return texto.trim().replace(/\s+/g, ' ')
}

/** ¿Hay un clip pregenerado para este texto? */
export function tieneClip(texto: string): boolean {
  return Boolean(MAPA[normalizar(texto)])
}

function elementoDe(texto: string): HTMLAudioElement | null {
  const clave = MAPA[normalizar(texto)]
  if (!clave) return null
  let el = cache.get(clave)
  if (!el) {
    el = new Audio(`${BASE}/${clave}.mp3`)
    el.preload = 'auto'
    cache.set(clave, el)
  }
  return el
}

export function pararClip() {
  if (!sonando) return
  sonando.pause()
  sonando.currentTime = 0
  sonando = null
}

/**
 * Reproduce el clip del texto. Devuelve una promesa que resuelve al terminar,
 * o `null` si no hay clip (el llamante hará entonces el fallback).
 * `ritmo` multiplica la velocidad: mantiene vivo el control 🐢/🐇 del panel.
 */
export function reproducirClip(texto: string, ritmo = 1): Promise<void> | null {
  const el = elementoDe(texto)
  if (!el) return null

  pararClip()
  el.currentTime = 0
  el.playbackRate = Math.min(4, Math.max(0.25, ritmo))
  sonando = el

  return new Promise<void>((resolve) => {
    const fin = () => {
      el.removeEventListener('ended', fin)
      el.removeEventListener('error', fin)
      if (sonando === el) sonando = null
      resolve()
    }
    el.addEventListener('ended', fin)
    el.addEventListener('error', fin)
    // Safari puede rechazar hasta que haya interacción: no debe romper nada.
    el.play().catch(fin)
  })
}

/** Precarga los clips de una lista (los de la ronda que viene). */
export function precargar(textos: string[]) {
  for (const t of textos) elementoDe(t)
}

export const CREDITO_VOZ =
  'Voz: Piper (Open Home Foundation) · modelo es_ES-sharvard-medium, ' +
  'entrenado sobre el corpus de la Universidad de Edimburgo. Licencia CC-BY 3.0.'
