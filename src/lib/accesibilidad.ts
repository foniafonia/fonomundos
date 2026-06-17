/**
 * Accesibilidad — gestión de preferencias globales
 * Persiste en localStorage. Se aplica añadiendo clases a <html>.
 */

export type ModoAccesibilidad = {
  dislexia: boolean       // OpenDyslexic + interletraje por defecto
  altoContraste: boolean  // más contraste
  textoGrande: boolean    // +2px en todo
}

const KEY = 'fonomundos.accesibilidad'
const OPEN_DYSLEXIC_BASE = 1
const DEFAULTS: ModoAccesibilidad = { dislexia: true, altoContraste: false, textoGrande: false }

export function getAccesibilidad(): ModoAccesibilidad {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<ModoAccesibilidad> & { openDyslexicBase?: number }
    const migradas = raw.openDyslexicBase === OPEN_DYSLEXIC_BASE
      ? raw
      : { ...raw, dislexia: true }
    return { ...DEFAULTS, ...migradas }
  }
  catch { return DEFAULTS }
}

export function setAccesibilidad(prefs: Partial<ModoAccesibilidad>) {
  const actual = getAccesibilidad()
  const nuevo = { ...actual, ...prefs }
  localStorage.setItem(KEY, JSON.stringify({ ...nuevo, openDyslexicBase: OPEN_DYSLEXIC_BASE }))
  aplicarClases(nuevo)
}

export function aplicarClases(prefs?: ModoAccesibilidad) {
  const p = prefs ?? getAccesibilidad()
  const html = document.documentElement
  html.classList.toggle('dislexia', p.dislexia)
  html.classList.toggle('fuente-normal', !p.dislexia)
  html.classList.toggle('alto-contraste', p.altoContraste)
  html.classList.toggle('texto-grande', p.textoGrande)
  if (p.textoGrande) {
    html.style.fontSize = '18px'
  } else {
    html.style.fontSize = ''
  }
}

/** Llamar una vez al arrancar la app */
export function iniciarAccesibilidad() {
  aplicarClases()
}
