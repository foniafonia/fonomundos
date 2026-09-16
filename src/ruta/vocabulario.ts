import { EMOJI } from '../data/guia'
import { PALABRAS } from '../data/palabras'

/**
 * Vocabulario de las actividades propias de la Ruta.
 *
 * Solo palabras que YA están en el corpus (guia.ts / palabras.ts), con dibujo
 * y con clip de voz. Es una selección provisional para poder jugar, pendiente
 * de que José la revise.
 * validarRuta.ts comprueba que ninguna se quede sin clip ni sin dibujo.
 */

export function imagenDe(palabra: string): string {
  const clave = palabra.toLocaleUpperCase('es-ES')
  return EMOJI[clave] || PALABRAS.find((p) => p.texto.toLocaleUpperCase('es-ES') === clave)?.emoji || ''
}

/** Objetos y animales que nombra un niño de 3 años, con dibujos que no se confunden entre sí. */
export const PALABRAS_MEMORIA = [
  'PATO', 'GATO', 'PERRO', 'SOL', 'LUNA', 'PEZ', 'CASA', 'COCHE', 'PAN', 'SILLA',
  'OSO', 'MANO', 'QUESO', 'TARTA', 'PELOTA', 'LECHE', 'TORO', 'VELA', 'NUBE', 'FOCA',
  'LOBO', 'MOTO', 'LLAVE', 'TAZA', 'TREN',
]

/** Palabras con el sonido, primero en posición inicial y luego en medio. */
export const PALABRAS_ARTICULACION: Record<string, string[]> = {
  P: ['PATO', 'PALA', 'PAN', 'PINO', 'PIÑA', 'PELOTA', 'PERRO', 'PEZ', 'PALOMA', 'SAPO', 'SOPA', 'MAPA'],
  K: ['CASA', 'CAMA', 'COCHE', 'COCO', 'QUESO', 'CABALLO', 'CALABAZA', 'TACO', 'FOCA', 'ROCA'],
  G: ['GATO', 'GALLO', 'GORILA', 'GORRA', 'GUANTES', 'ORUGA', 'LAGARTIJA'],
  D: ['DEDO', 'DINERO', 'NIDO', 'TENEDOR'],
  T: ['TARTA', 'TAZA', 'TOMATE', 'TORO', 'TETERA', 'PATO', 'GATO', 'MOTO', 'BOTA', 'PELOTA'],
  L: ['LUNA', 'LUPA', 'LATA', 'LAZO', 'LOBO', 'LECHE', 'LIMÓN', 'PALA', 'VELA', 'OLA'],
  F: ['FOCA', 'CAFÉ', 'JIRAFA', 'ELEFANTE', 'ELFO'],
  S: ['SOL', 'SAPO', 'SOPA', 'SILLA', 'SIRENA', 'SANDÍA', 'SERPIENTE', 'OSO', 'CASA', 'ROSA'],
  CH: ['CHAMPÚ', 'CHAQUETA', 'COCHE', 'LECHE', 'OCHO'],
}

/**
 * Fonogestos: la imagen de cómo se coloca todo para decir cada sonido.
 * Solo los validados por José (a, e, o, u, m, p, b/v). Si un sonido no tiene,
 * se enseña solo el audio. Las imágenes son ligeras (360 px, ~30 KB).
 */
const GESTOS_VALIDADOS: Record<string, string> = {
  A: 'a', E: 'e', O: 'o', U: 'u', M: 'm', P: 'p', B: 'b', V: 'b',
}

export function gestoDe(sonido: string): string | null {
  const clave = GESTOS_VALIDADOS[sonido.toLocaleUpperCase('es-ES')]
  return clave ? `/fonogestos/${clave}.jpg` : null
}

/**
 * Sonidos que José grabó con su voz. Con ellos se montan las sílabas: la
 * sílaba se oye juntando su consonante y su vocal sin pausa («mmm·o»).
 * Las sílabas del sintetizador confunden «mo» y «mu», por eso no se usan.
 */
export const VOCALES = ['A', 'E', 'I', 'O', 'U']
/** Se pueden alargar, y por eso juntar con la vocal. */
export const CONSONANTES_CONTINUAS = ['M', 'N', 'Ñ', 'S', 'F', 'Z', 'J', 'L', 'R']
/** No se pueden alargar: su sílaba solo vale grabada entera (pa, bo…). */
export const CONSONANTES_OCLUSIVAS = ['P', 'B']

export interface SilabaGestos {
  consonante: string
  vocal: string
  /** Como se escribe: «mo», «ce» (z + e). */
  texto: string
}

export function escribirSilaba(consonante: string, vocal: string) {
  const letra = consonante === 'Z' && (vocal === 'E' || vocal === 'I') ? 'C' : consonante
  return `${letra}${vocal}`.toLocaleLowerCase('es-ES')
}

export const SILABAS_GESTOS: SilabaGestos[] = CONSONANTES_CONTINUAS.flatMap((consonante) =>
  VOCALES.map((vocal) => ({ consonante, vocal, texto: escribirSilaba(consonante, vocal) })),
)
