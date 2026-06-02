import type { Palabra } from '../types'

// Corpus infantil. Dígrafos ch/ll/rr/qu/gu cuentan como 1 fonema.
export const PALABRAS: Palabra[] = [
  { texto: 'sol', emoji: '☀️', silabas: ['sol'], fonemas: ['s', 'o', 'l'] },
  { texto: 'pez', emoji: '🐟', silabas: ['pez'], fonemas: ['p', 'e', 's'] },
  { texto: 'pan', emoji: '🍞', silabas: ['pan'], fonemas: ['p', 'a', 'n'] },
  { texto: 'mar', emoji: '🌊', silabas: ['mar'], fonemas: ['m', 'a', 'r'] },
  { texto: 'oso', emoji: '🐻', silabas: ['o', 'so'], fonemas: ['o', 's', 'o'] },
  { texto: 'uva', emoji: '🍇', silabas: ['u', 'va'], fonemas: ['u', 'b', 'a'] },
  { texto: 'flor', emoji: '🌸', silabas: ['flor'], fonemas: ['f', 'l', 'o', 'r'] },
  { texto: 'casa', emoji: '🏠', silabas: ['ca', 'sa'], fonemas: ['k', 'a', 's', 'a'] },
  { texto: 'pato', emoji: '🦆', silabas: ['pa', 'to'], fonemas: ['p', 'a', 't', 'o'] },
  { texto: 'mesa', emoji: '🪑', silabas: ['me', 'sa'], fonemas: ['m', 'e', 's', 'a'] },
  { texto: 'luna', emoji: '🌙', silabas: ['lu', 'na'], fonemas: ['l', 'u', 'n', 'a'] },
  { texto: 'gato', emoji: '🐱', silabas: ['ga', 'to'], fonemas: ['g', 'a', 't', 'o'] },
  { texto: 'perro', emoji: '🐶', silabas: ['pe', 'rro'], fonemas: ['p', 'e', 'rr', 'o'] },
  { texto: 'queso', emoji: '🧀', silabas: ['que', 'so'], fonemas: ['k', 'e', 's', 'o'] },
  { texto: 'rosa', emoji: '🌹', silabas: ['ro', 'sa'], fonemas: ['r', 'o', 's', 'a'] },
  { texto: 'dedo', emoji: '👆', silabas: ['de', 'do'], fonemas: ['d', 'e', 'd', 'o'] },
  { texto: 'nube', emoji: '☁️', silabas: ['nu', 'be'], fonemas: ['n', 'u', 'b', 'e'] },
  { texto: 'foca', emoji: '🦭', silabas: ['fo', 'ca'], fonemas: ['f', 'o', 'k', 'a'] },
  { texto: 'sapo', emoji: '🐸', silabas: ['sa', 'po'], fonemas: ['s', 'a', 'p', 'o'] },
  { texto: 'vela', emoji: '🕯️', silabas: ['ve', 'la'], fonemas: ['b', 'e', 'l', 'a'] },
  { texto: 'mano', emoji: '✋', silabas: ['ma', 'no'], fonemas: ['m', 'a', 'n', 'o'] },
  { texto: 'lobo', emoji: '🐺', silabas: ['lo', 'bo'], fonemas: ['l', 'o', 'b', 'o'] },
  { texto: 'jirafa', emoji: '🦒', silabas: ['ji', 'ra', 'fa'], fonemas: ['x', 'i', 'r', 'a', 'f', 'a'] },
  { texto: 'tomate', emoji: '🍅', silabas: ['to', 'ma', 'te'], fonemas: ['t', 'o', 'm', 'a', 't', 'e'] },
  { texto: 'pelota', emoji: '⚽', silabas: ['pe', 'lo', 'ta'], fonemas: ['p', 'e', 'l', 'o', 't', 'a'] },
  { texto: 'manzana', emoji: '🍎', silabas: ['man', 'za', 'na'], fonemas: ['m', 'a', 'n', 's', 'a', 'n', 'a'] },
  { texto: 'plátano', emoji: '🍌', silabas: ['plá', 'ta', 'no'], fonemas: ['p', 'l', 'a', 't', 'a', 'n', 'o'] },
  { texto: 'caballo', emoji: '🐴', silabas: ['ca', 'ba', 'llo'], fonemas: ['k', 'a', 'b', 'a', 'll', 'o'] },
  { texto: 'elefante', emoji: '🐘', silabas: ['e', 'le', 'fan', 'te'], fonemas: ['e', 'l', 'e', 'f', 'a', 'n', 't', 'e'] },
  { texto: 'mariposa', emoji: '🦋', silabas: ['ma', 'ri', 'po', 'sa'], fonemas: ['m', 'a', 'r', 'i', 'p', 'o', 's', 'a'] },
]

/** Sonido inicial "audible" para una palabra (primer fonema). */
export function sonidoInicial(p: Palabra): string {
  return p.fonemas[0]
}

export function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function barajar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Filtra palabras por longitud según dificultad 1..5 (más difícil = palabras más largas). */
export function porDificultad(dif: number): Palabra[] {
  const maxSilabas = Math.min(2 + Math.floor(dif / 1.5), 4) // dif1→2, dif5→4
  const subset = PALABRAS.filter((p) => p.silabas.length <= maxSilabas)
  return subset.length >= 4 ? subset : PALABRAS
}

/**
 * Cola sin repetición: baraja el pool y lo devuelve en orden aleatorio.
 * Cuando se agota, rebaraja automáticamente para empezar otro ciclo.
 * Garantiza que cada palabra aparezca UNA vez antes de repetirse.
 */
export class ColaNoRepetida<T> {
  private cola: T[] = []
  private pool: T[]

  constructor(pool: T[]) {
    this.pool = pool
    this.rellenar()
  }

  private rellenar() {
    this.cola = barajar([...this.pool])
  }

  siguiente(): T {
    if (this.cola.length === 0) this.rellenar()
    return this.cola.pop()!
  }
}
