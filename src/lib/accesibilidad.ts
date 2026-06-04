/**
 * Accesibilidad — gestión de preferencias globales
 * Persiste en localStorage. Se aplica añadiendo clases a <html>.
 */

export type ModoAccesibilidad = {
  dislexia: boolean       // OpenDyslexic + interletraje
  altoContraste: boolean  // más contraste
  textoGrande: boolean    // +2px en todo
}

const KEY = 'fonomundos.accesibilidad'
const DEFAULTS: ModoAccesibilidad = { dislexia: false, altoContraste: false, textoGrande: false }

export function getAccesibilidad(): ModoAccesibilidad {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
  catch { return DEFAULTS }
}

export function setAccesibilidad(prefs: Partial<ModoAccesibilidad>) {
  const actual = getAccesibilidad()
  const nuevo = { ...actual, ...prefs }
  localStorage.setItem(KEY, JSON.stringify(nuevo))
  aplicarClases(nuevo)
}

export function aplicarClases(prefs?: ModoAccesibilidad) {
  const p = prefs ?? getAccesibilidad()
  const html = document.documentElement
  html.classList.toggle('dislexia', p.dislexia)
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
