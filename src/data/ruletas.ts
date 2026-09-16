/**
 * Datos de las Ruletas fonológicas.
 *
 * No hay vocabulario propio: se usa el de la guía (EMOJI), el mismo que ya tiene
 * dibujo en el resto de FonoMundos. Lo que se añade es su transcripción a
 * sonidos, para poder preguntar por el sonido y no por la letra: «cena» empieza
 * por /θ/ aunque se escriba con C, y «queso» por /k/.
 */
import { EMOJI } from './guia'
import { decirFonema } from '../lib/pronunciacion'

/** Sonidos con las mismas claves que usa pronunciacion.ts (decirFonema). */
export type Fonema =
  | 'A' | 'E' | 'I' | 'O' | 'U'
  | 'M' | 'N' | 'Ñ' | 'P' | 'B' | 'T' | 'D' | 'K' | 'G'
  | 'F' | 'S' | 'Z' | 'J' | 'L' | 'R' | 'RR' | 'CH' | 'Y'

const VOCAL = new Set(['A', 'E', 'I', 'O', 'U'])

function sinTildes(p: string) {
  // Se quitan tildes y diéresis letra a letra, sin normalize(): la Ñ no es una
  // N con tilde y no debe perderse.
  const SIN: Record<string, string> = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U' }
  return [...p.toLocaleUpperCase('es-ES')].map((l) => SIN[l] ?? l).join('')
}

/**
 * Transcripción de una palabra escrita a sus sonidos (español de España,
 * con distinción S/Z). Solo lo necesario para el vocabulario infantil.
 */
export function fonemasDe(palabra: string): Fonema[] {
  const w = sinTildes(palabra).replace(/[^A-ZÑ]/g, '')
  const out: Fonema[] = []
  for (let i = 0; i < w.length; i++) {
    const c = w[i]
    const sig = w[i + 1] ?? ''
    const ant = w[i - 1] ?? ''
    const ei = sig === 'E' || sig === 'I'
    if (c === 'C' && sig === 'H') { out.push('CH'); i++; continue }
    if (c === 'L' && sig === 'L') { out.push('Y'); i++; continue } // yeísmo: LL suena como Y
    if (c === 'R' && sig === 'R') { out.push('RR'); i++; continue }
    if (c === 'Q' && sig === 'U') { out.push('K'); i++; continue }
    if (c === 'G' && sig === 'U' && (w[i + 2] === 'E' || w[i + 2] === 'I')) { out.push('G'); i++; continue }
    if (c === 'C') { out.push(ei ? 'Z' : 'K'); continue }
    if (c === 'G') { out.push(ei ? 'J' : 'G'); continue }
    if (c === 'V') { out.push('B'); continue }
    if (c === 'X') { out.push('K', 'S'); continue }
    if (c === 'W') { out.push('U'); continue }
    if (c === 'R') { out.push(i === 0 || 'NLS'.includes(ant) ? 'RR' : 'R'); continue }
    if (c === 'Y') { out.push(!sig || !VOCAL.has(sig) ? 'I' : 'Y'); continue }
    out.push(c as Fonema)
  }
  return out
}

export interface PalabraRuleta {
  texto: string
  emoji: string
  fonemas: Fonema[]
}

export const VOCABULARIO: PalabraRuleta[] = Object.entries(EMOJI)
  // Hay claves internas como «SIRENA2» (una segunda imagen): se leerían en voz alta.
  .filter(([texto, emoji]) => !!emoji && /^[A-ZÁÉÍÓÚÜÑ]+$/.test(texto))
  .map(([texto, emoji]) => ({ texto, emoji, fonemas: fonemasDe(texto) }))

export type Posicion = 'principio' | 'medio' | 'final'

export const POSICIONES: Posicion[] = ['principio', 'medio', 'final']

export const TEXTO_POSICION: Record<Posicion, string> = {
  principio: 'al principio',
  medio: 'en medio',
  final: 'al final',
}

export function tieneEn(p: PalabraRuleta, f: Fonema, pos: Posicion): boolean {
  const s = p.fonemas
  if (pos === 'principio') return s[0] === f
  if (pos === 'final') return s[s.length - 1] === f
  return s.slice(1, -1).includes(f)
}

/** Palabras que no llevan el sonido en ninguna parte: distractores sin ambigüedad. */
export function sinSonido(f: Fonema): PalabraRuleta[] {
  return VOCABULARIO.filter((p) => !p.fonemas.includes(f))
}

/**
 * Sonidos de la ruleta. La Y queda fuera: con yeísmo, «silla» y «yoyó» llevan el
 * mismo sonido y la tarea se vuelve discutible para un niño.
 */
const SONIDOS_RULETA: Fonema[] = ['A', 'E', 'I', 'O', 'U', 'M', 'N', 'P', 'B', 'T', 'D', 'K', 'G', 'F', 'S', 'Z', 'J', 'L', 'RR', 'CH']

/** Para buscar dibujos que empiezan por el sonido hacen falta al menos 3 correctos. */
export const SONIDOS_INICIO: Fonema[] = SONIDOS_RULETA
  .filter((f) => VOCABULARIO.filter((p) => tieneEn(p, f, 'principio')).length >= 3)

/** Pares sonido + posición con al menos 2 palabras que lo cumplen. */
export const COMBINACIONES_POSICION: { fonema: Fonema; posicion: Posicion }[] = SONIDOS_RULETA
  .flatMap((fonema) => POSICIONES.map((posicion) => ({ fonema, posicion })))
  .filter(({ fonema, posicion }) => VOCABULARIO.filter((p) => tieneEn(p, fonema, posicion)).length >= 2)

// ─── Sílabas ────────────────────────────────────────────────────────────────

export type TipoSilaba = 'directa' | 'inversa' | 'trabada'

export const VOCALES = ['A', 'E', 'I', 'O', 'U'] as const
type Vocal = typeof VOCALES[number]

/**
 * Consonantes de la ruleta de sílabas directas. Cada una sabe escribirse delante
 * de cada vocal: /k/ es CA · QUE · QUI · CO · CU; /θ/ es ZA · CE · CI · ZO · ZU.
 */
export const CONSONANTES: { id: string; etiqueta: string; escribe: (v: Vocal) => string }[] = [
  { id: 'M', etiqueta: 'M', escribe: (v) => `M${v}` },
  { id: 'P', etiqueta: 'P', escribe: (v) => `P${v}` },
  { id: 'L', etiqueta: 'L', escribe: (v) => `L${v}` },
  { id: 'S', etiqueta: 'S', escribe: (v) => `S${v}` },
  { id: 'N', etiqueta: 'N', escribe: (v) => `N${v}` },
  { id: 'T', etiqueta: 'T', escribe: (v) => `T${v}` },
  { id: 'D', etiqueta: 'D', escribe: (v) => `D${v}` },
  { id: 'F', etiqueta: 'F', escribe: (v) => `F${v}` },
  { id: 'B', etiqueta: 'B', escribe: (v) => `B${v}` },
  { id: 'RR', etiqueta: 'R', escribe: (v) => `R${v}` },       // a principio de sílaba suena fuerte
  { id: 'K', etiqueta: 'C·QU', escribe: (v) => (v === 'E' || v === 'I' ? `QU${v}` : `C${v}`) },
  { id: 'G', etiqueta: 'G·GU', escribe: (v) => (v === 'E' || v === 'I' ? `GU${v}` : `G${v}`) },
  { id: 'Z', etiqueta: 'Z·C', escribe: (v) => (v === 'E' || v === 'I' ? `C${v}` : `Z${v}`) },
  { id: 'J', etiqueta: 'J', escribe: (v) => `J${v}` },
  { id: 'CH', etiqueta: 'CH', escribe: (v) => `CH${v}` },
  { id: 'Ñ', etiqueta: 'Ñ', escribe: (v) => `Ñ${v}` },
  { id: 'LL', etiqueta: 'LL', escribe: (v) => `LL${v}` },
]

/** Consonantes que pueden cerrar sílaba en español: AL, EN, IS, OR, UZ, AD. */
export const FINALES_INVERSA = ['L', 'N', 'S', 'R', 'Z', 'D'] as const

/** Grupos de las sílabas trabadas. */
export const GRUPOS_TRABADA = ['PL', 'PR', 'BL', 'BR', 'TR', 'DR', 'CL', 'CR', 'GL', 'GR', 'FL', 'FR'] as const

export function silabasDe(tipo: TipoSilaba): { izquierda: string[]; derecha: string[]; forma: (a: string, b: string) => string } {
  if (tipo === 'directa') {
    return {
      izquierda: CONSONANTES.map((c) => c.id),
      derecha: [...VOCALES],
      forma: (c, v) => CONSONANTES.find((x) => x.id === c)!.escribe(v as Vocal),
    }
  }
  if (tipo === 'inversa') {
    return { izquierda: [...VOCALES], derecha: [...FINALES_INVERSA], forma: (v, c) => `${v}${c}` }
  }
  return { izquierda: [...GRUPOS_TRABADA], derecha: [...VOCALES], forma: (g, v) => `${g}${v}` }
}

export function etiquetaIzquierda(tipo: TipoSilaba, id: string) {
  return tipo === 'directa' ? CONSONANTES.find((c) => c.id === id)?.etiqueta ?? id : id
}

/** Todas las sílabas posibles: sirve para pregenerar su audio. */
export function todasLasSilabas(): string[] {
  const out = new Set<string>()
  for (const tipo of ['directa', 'inversa', 'trabada'] as TipoSilaba[]) {
    const { izquierda, derecha, forma } = silabasDe(tipo)
    for (const a of izquierda) for (const b of derecha) out.add(forma(a, b))
  }
  return [...out]
}

export function barajar<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Texto a locutar para un sonido de la ruleta. La RR usa la grabación de la R,
 * que ya es la vibrante múltiple sostenida: no hay otra y no hace falta.
 */
export function vozSonido(f: Fonema): string {
  return decirFonema(f === 'RR' ? 'R' : f)
}
