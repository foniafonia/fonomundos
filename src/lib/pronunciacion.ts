/**
 * Capa de pronunciación clínica.
 *
 * Problema que resuelve (reportado por la comunidad, junio 2026):
 * el sintetizador lee las letras por su NOMBRE, no por su SONIDO.
 * En una tarea de conciencia fonémica eso invalida el ítem:
 *
 *   /S/  →  "ese"   → el niño oye una /e/ inicial que no existe en el fonema
 *   /M/  →  "eme"   → idem
 *   /C/  →  "ce"    → suena /θe/ cuando en CUNA el fonema es /k/
 *   /G/  →  "ge"    → suena /xe/ cuando en GATO el fonema es /g/
 *
 * Aquí se traduce cada grafema al texto que hace que el TTS emita el fonema.
 * Las continuas (fricativas, nasales, líquidas) se alargan porque se pueden
 * sostener de forma aislada. Las oclusivas no se pueden aislar en TTS: se
 * mantienen con vocal de apoyo mínima, que es la convención de los materiales
 * de conciencia fonológica en castellano.
 */

/** Grafema → texto que el TTS pronuncia como el fonema correspondiente. */
const SONIDO_FONEMA: Record<string, string> = {
  // Vocales: el nombre de la letra ya es el fonema
  A: 'a', E: 'e', I: 'i', O: 'o', U: 'u',

  // Continuas: se sostienen aisladas → se alargan para que no suene el nombre
  F: 'fff',
  J: 'jjj',
  L: 'lll',
  M: 'mmm',
  N: 'nnn',
  Ñ: 'ñññ',
  R: 'rrr',
  RR: 'rrrrr',
  S: 'sss',
  Z: 'zzz',

  // Oclusivas y africadas: vocal de apoyo mínima (no se pueden aislar en TTS)
  B: 'be',
  D: 'de',
  P: 'pe',
  T: 'te',
  C: 'ke',   // /k/ — NO "ce" (/θe/)
  K: 'ke',
  Q: 'ku',
  G: 'gue',  // /g/ — NO "ge" (/xe/)
  CH: 'che',
  LL: 'lle',
  Y: 'ye',
  V: 'be',   // en castellano /b/ y /v/ comparten fonema
  W: 'ua',
  X: 'ks',
  H: '',     // muda
}

/**
 * Palabras muy cortas aisladas: algunos motores (Google es-ES) las tratan como
 * siglas y las deletrean ("pez" → "pe-e-zeta"). Cerrar la locución como frase
 * evita esa heurística.
 */
const LONGITUD_RIESGO_SIGLA = 4

function cerrarComoFrase(texto: string) {
  const limpio = texto.trim()
  if (!limpio) return limpio
  if (/[.!?…]$/.test(limpio)) return limpio
  return `${limpio}.`
}

/** Texto a locutar para un fonema aislado. Devuelve '' si es mudo. */
export function decirFonema(grafema: string): string {
  const clave = grafema.trim().toLocaleUpperCase('es-ES')
  const sonido = SONIDO_FONEMA[clave]
  if (sonido !== undefined) return sonido
  return clave.toLocaleLowerCase('es-ES')
}

/** Texto a locutar para una sílaba aislada. */
export function decirSilaba(silaba: string): string {
  const limpio = silaba.trim().toLocaleLowerCase('es-ES')
  if (!limpio) return ''
  // Una sílaba de una sola letra es una vocal: se pronuncia igual que su nombre.
  if (limpio.length === 1) return limpio
  return cerrarComoFrase(limpio)
}

/** Texto a locutar para una palabra completa. */
export function decirPalabra(palabra: string): string {
  const limpio = palabra.trim().toLocaleLowerCase('es-ES')
  if (!limpio) return ''
  if (limpio.length <= LONGITUD_RIESGO_SIGLA) return cerrarComoFrase(limpio)
  return limpio
}

/** Lista de palabras en una sola locución, separadas por pausa breve. */
export function decirListaPalabras(palabras: string[]): string {
  return palabras.map((p) => p.trim().toLocaleLowerCase('es-ES')).filter(Boolean).join(', ')
}

/** Secuencia de fonemas para locutar por partes, sin los mudos. */
export function decirFonemas(fonemas: string[]): string[] {
  return fonemas.map(decirFonema).filter(Boolean)
}

/** Secuencia de sílabas para locutar por partes. */
export function decirSilabas(silabas: string[]): string[] {
  return silabas.map(decirSilaba).filter(Boolean)
}
