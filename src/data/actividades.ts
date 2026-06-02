import type { DefinicionActividad, Opcion, Ronda } from '../types'
import { aleatorio, barajar, ColaNoRepetida } from './palabras'
import {
  SEGMENTACION_FONEMICA, SEGMENTACION_SILABICA, FRASES_CONTEO, FRASES_DICTADO, contarPalabras, emojiDe,
  type PalabraSegmentada,
} from './guia'

// pool fonémico del material de la guía (todas con emoji)
const POOL_GUIA = SEGMENTACION_FONEMICA
const iniDe = (p: PalabraSegmentada) => p.fonemas[0]
const finDe = (p: PalabraSegmentada) => p.fonemas[p.fonemas.length - 1]

// ── Colas sin repetición globales por actividad ──────────────────────────────
// Una cola por actividad garantiza que dentro de una sesión de 10 rondas
// no se repita ninguna palabra hasta haber visto todas.
// Se crean una vez (module scope) y persisten durante la sesión de navegación.
const colaFonemaInicial  = new ColaNoRepetida(POOL_GUIA)
const colaConteoFonemas  = new ColaNoRepetida(POOL_GUIA)
const colaConteoSilabico = new ColaNoRepetida(SEGMENTACION_SILABICA)
const colaSilabIntrusa   = new ColaNoRepetida(SEGMENTACION_SILABICA)
const colaSonidoModelo   = new ColaNoRepetida(POOL_GUIA)
const colaSonidoFinal    = new ColaNoRepetida(POOL_GUIA.filter(p => POOL_GUIA.some(q => finDe(q) === finDe(p) && q !== p)))
const colaFrases         = new ColaNoRepetida([...FRASES_CONTEO, ...FRASES_DICTADO].filter(f => f.split(/\s+/).length >= 2))

const SONIDOS_DISTRACTORES = ['s', 'm', 'p', 't', 'l', 'f', 'k', 'r', 'n', 'b', 'd', 'g']

function opcionesNumericas(correcto: number, dif: number): { opciones: Opcion[]; correctaId: string } {
  const ancho = Math.min(2 + dif, 4)
  const rango = new Set<number>([correcto])
  // expande la ventana de forma determinista hasta tener suficientes opciones (sin bucle infinito)
  for (let delta = 1; rango.size < ancho && delta <= 12; delta++) {
    if (correcto - delta >= 1) rango.add(correcto - delta)
    if (rango.size < ancho && correcto + delta <= 12) rango.add(correcto + delta)
  }
  const nums = barajar([...rango])
  return {
    opciones: nums.map((n) => ({ id: String(n), etiqueta: String(n) })),
    correctaId: String(correcto),
  }
}

// 1. Fonema inicial: ¿con qué sonido empieza?
const fonemaInicial: DefinicionActividad = {
  id: 'fonema-inicial',
  titulo: 'El primer sonido',
  descripcion: '¿Con qué sonido empieza la palabra?',
  emoji: '🔤',
  dominio: 'fonologica',
  generar(_dif): Ronda {
    const palabra = colaFonemaInicial.siguiente()
    const correcto = iniDe(palabra).toLowerCase()
    const distractores = barajar(SONIDOS_DISTRACTORES.filter((s) => s !== correcto)).slice(0, 3)
    const opciones = barajar<Opcion>([
      { id: correcto, etiqueta: correcto.toUpperCase() },
      ...distractores.map((s) => ({ id: s, etiqueta: s.toUpperCase() })),
    ])
    return {
      enunciado: '¿Con qué sonido empieza?',
      locucion: `¿Con qué sonido empieza ${palabra.palabra}?`,
      estimuloEmoji: emojiDe(palabra.palabra),
      estimuloTexto: palabra.palabra,
      opciones,
      correctaId: correcto,
      ayuda: `Di la palabra despacio: ${palabra.palabra}. El primer sonido es "${correcto.toUpperCase()}".`,
      dificultad: 1,
    }
  },
}

// 2. Conteo de fonemas: ¿cuántos sonidos tiene?
const conteoFonemas: DefinicionActividad = {
  id: 'conteo-fonemas',
  titulo: 'Cuenta los sonidos',
  descripcion: '¿Cuántos sonidos tiene la palabra?',
  emoji: '🔢',
  dominio: 'fonologica',
  generar(dif): Ronda {
    const palabra = colaConteoFonemas.siguiente()
    const correcto = palabra.fonemas.length
    const { opciones, correctaId } = opcionesNumericas(correcto, dif)
    return {
      enunciado: '¿Cuántos sonidos tiene?',
      locucion: `¿Cuántos sonidos tiene la palabra ${palabra.palabra}?`,
      estimuloEmoji: emojiDe(palabra.palabra),
      estimuloTexto: palabra.palabra,
      opciones,
      correctaId,
      ayuda: `Suena cada parte: ${palabra.fonemas.join(' - ')}. Son ${correcto} sonidos.`,
      dificultad: dif,
    }
  },
}

// 3. Conteo silábico: ¿cuántas sílabas?
const conteoSilabico: DefinicionActividad = {
  id: 'conteo-silabico',
  titulo: 'Palmas por sílaba',
  descripcion: '¿Cuántas sílabas tiene la palabra?',
  emoji: '👏',
  dominio: 'silabica',
  generar(dif): Ronda {
    const palabra = colaConteoSilabico.siguiente()
    const correcto = palabra.silabas.length
    const { opciones, correctaId } = opcionesNumericas(correcto, dif)
    return {
      enunciado: '¿Cuántas sílabas tiene?',
      locucion: `Da una palmada por cada sílaba de ${palabra.palabra}`,
      estimuloEmoji: emojiDe(palabra.palabra),
      estimuloTexto: palabra.palabra,
      opciones,
      correctaId,
      ayuda: `Date palmas: ${palabra.silabas.join(' - ')}. Son ${correcto} sílabas.`,
      dificultad: dif,
    }
  },
}

// 4. Sílaba intrusa: 4 palabras, 3 empiezan igual, ¿cuál sobra?
const silabaIntrusa: DefinicionActividad = {
  id: 'silaba-intrusa',
  titulo: 'La sílaba intrusa',
  descripcion: 'Encuentra la palabra que empieza diferente.',
  emoji: '🕵️',
  dominio: 'silabica',
  generar(_dif): Ronda {
    // usa el corpus de la guía (SEGMENTACION_SILABICA)
    const pool = SEGMENTACION_SILABICA
    const grupos = new Map<string, typeof pool>()
    for (const p of pool) {
      const k = p.silabas[0]
      grupos.set(k, [...(grupos.get(k) || []), p])
    }
    const candidatos = [...grupos.values()].filter((g) => g.length >= 2)
    const grupo = candidatos[Math.floor(Math.random() * candidatos.length)]
    const silabaBase = grupo[0].silabas[0]
    const base = barajar(grupo).slice(0, 3)
    const intruso = colaSilabIntrusa.siguiente()
    const p = intruso.silabas[0] === silabaBase
      ? pool.find(x => x.silabas[0] !== silabaBase) ?? pool[0]
      : intruso
    const conjunto = barajar([...base, p])
    return {
      enunciado: '¿Cuál empieza diferente?',
      locucion: `Escucha: ${conjunto.map((x) => x.palabra).join(', ')}. ¿Cuál empieza diferente?`,
      opciones: conjunto.map((x) => ({ id: x.palabra, etiqueta: x.palabra, emoji: emojiDe(x.palabra) })),
      correctaId: p.palabra,
      ayuda: `Casi todas empiezan por "${silabaBase}". La que no es "${p.palabra}".`,
      dificultad: _dif,
    }
  },
}

// 5. Fonema intruso (Act.5): 4 palabras, 3 empiezan por el mismo sonido, 1 no.
const fonemaIntruso: DefinicionActividad = {
  id: 'fonema-intruso',
  titulo: 'El intruso',
  descripcion: 'Encuentra la palabra que empieza por un sonido diferente.',
  emoji: '🔍',
  dominio: 'fonologica',
  generar(dif): Ronda {
    const grupos = new Map<string, PalabraSegmentada[]>()
    for (const p of POOL_GUIA) grupos.set(iniDe(p), [...(grupos.get(iniDe(p)) || []), p])
    const candidatos = [...grupos.entries()].filter(([, g]) => g.length >= 3)
    const [iniBase, grupo] = aleatorio(candidatos)
    const base = barajar(grupo).slice(0, 3)
    const intruso = aleatorio(POOL_GUIA.filter((p) => iniDe(p) !== iniBase))
    const conjunto = barajar<PalabraSegmentada>([...base, intruso])
    return {
      enunciado: '¿Cuál empieza por un sonido diferente?',
      locucion: `Escucha: ${conjunto.map((p) => p.palabra).join(', ')}. ¿Cuál empieza diferente?`,
      opciones: conjunto.map((p) => ({ id: p.palabra, etiqueta: p.palabra, emoji: emojiDe(p.palabra) })),
      correctaId: intruso.palabra,
      ayuda: `Casi todas empiezan por "${iniBase}". La que no es ${intruso.palabra}.`,
      dificultad: dif,
    }
  },
}

// 6. Sonido modelo (Act.6): marca el que empieza como la palabra modelo.
const sonidoModelo: DefinicionActividad = {
  id: 'sonido-modelo',
  titulo: 'Como el modelo',
  descripcion: 'Marca el dibujo que empieza con el mismo sonido que el modelo.',
  emoji: '🎯',
  dominio: 'fonologica',
  generar(dif): Ronda {
    const modelo = colaSonidoModelo.siguiente()
    const correcto = aleatorio(POOL_GUIA.filter((p) => iniDe(p) === iniDe(modelo) && p.palabra !== modelo.palabra)) || modelo
    const n = Math.min(2 + dif, 4)
    const distractores = barajar(POOL_GUIA.filter((p) => iniDe(p) !== iniDe(modelo))).slice(0, n - 1)
    const opciones = barajar<PalabraSegmentada>([correcto, ...distractores])
    return {
      enunciado: `¿Cuál empieza como ${modelo.palabra}?`,
      locucion: `${modelo.palabra} empieza por ${iniDe(modelo)}. ¿Cuál empieza igual?`,
      estimuloEmoji: emojiDe(modelo.palabra),
      estimuloTexto: modelo.palabra,
      opciones: opciones.map((p) => ({ id: p.palabra, etiqueta: p.palabra, emoji: emojiDe(p.palabra) })),
      correctaId: correcto.palabra,
      ayuda: `${modelo.palabra} empieza por "${iniDe(modelo)}". Busca otra que empiece por "${iniDe(modelo)}".`,
      dificultad: dif,
    }
  },
}

// 8. Sonido final (Act.8): marca el que termina con el mismo sonido.
const sonidoFinal: DefinicionActividad = {
  id: 'sonido-final',
  titulo: 'El mismo final',
  descripcion: 'Marca el dibujo que termina con el mismo sonido que el modelo.',
  emoji: '🏁',
  dominio: 'fonologica',
  generar(dif): Ronda {
    const modelo = colaSonidoFinal.siguiente()
    const correcto = aleatorio(POOL_GUIA.filter((p) => finDe(p) === finDe(modelo) && p.palabra !== modelo.palabra)) ?? modelo
    const n = Math.min(2 + dif, 4)
    const distractores = barajar(POOL_GUIA.filter((p) => finDe(p) !== finDe(modelo))).slice(0, n - 1)
    const opciones = barajar<PalabraSegmentada>([correcto, ...distractores])
    return {
      enunciado: `¿Cuál termina como ${modelo.palabra}?`,
      locucion: `${modelo.palabra} termina por ${finDe(modelo)}. ¿Cuál termina igual?`,
      estimuloEmoji: emojiDe(modelo.palabra),
      estimuloTexto: modelo.palabra,
      opciones: opciones.map((p) => ({ id: p.palabra, etiqueta: p.palabra, emoji: emojiDe(p.palabra) })),
      correctaId: correcto.palabra,
      ayuda: `${modelo.palabra} termina por "${finDe(modelo)}". Busca otra que termine por "${finDe(modelo)}".`,
      dificultad: dif,
    }
  },
}

// Léxica Act.1/3: ¿cuántas palabras tiene la frase?
const contarPalabrasFrase: DefinicionActividad = {
  id: 'contar-palabras',
  titulo: 'Cuenta las palabras',
  descripcion: 'Escucha la frase y cuenta cuántas palabras tiene.',
  emoji: '✍️',
  dominio: 'lexica',
  generar(_dif): Ronda {
    const frase = colaFrases.siguiente()
    const correcto = contarPalabras(frase)
    const { opciones, correctaId } = opcionesNumericas(correcto, 2)
    return {
      enunciado: '¿Cuántas palabras tiene la frase?',
      locucion: frase,
      estimuloTexto: frase,
      opciones,
      correctaId,
      ayuda: `Cuenta cada palabra: ${frase.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).join(' · ')}. Son ${correcto}.`,
      dificultad: 2,
    }
  },
}

export const ACTIVIDADES: DefinicionActividad[] = [
  fonemaInicial,
  conteoFonemas,
  conteoSilabico,
  silabaIntrusa,
  fonemaIntruso,
  sonidoModelo,
  sonidoFinal,
  contarPalabrasFrase,
]

export function getActividad(id: string): DefinicionActividad | undefined {
  return ACTIVIDADES.find((a) => a.id === id)
}
