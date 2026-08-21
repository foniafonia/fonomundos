/**
 * Recolecta TODO lo que la app puede llegar a locutar.
 *
 * No se adivina leyendo el código: se ejecutan los generadores de las
 * actividades muchas veces y se recoge lo que devuelven. Así el catálogo
 * refleja la realidad y no mi lectura de ella.
 *
 * Salida: src/data/locuciones.json — la lista ordenada de textos a generar.
 */
import { writeFileSync } from 'node:fs'
import { ACTIVIDADES } from '../src/data/actividades'
import {
  SEGMENTACION_FONEMICA, SEGMENTACION_SILABICA, FRASES_CONTEO, FRASES_DICTADO,
  CADENAS_FONEMICAS, CADENAS_SILABICAS, SILABAS_CREA_PALABRAS,
  PAREJAS_SONIDO_INICIAL, PAREJAS_SILABA_INICIAL, LEXICO_ORACION_IMAGEN,
  LEXICO_ACT2, FRASES_DESORDENADAS, CLASIFICACION_SILABICA,
} from '../src/data/guia'
import { MODELOS_BINGO } from '../src/data/bingo'
import { bordeDe } from '../src/lib/cadenaValidacion'
import { PALABRAS } from '../src/data/palabras'
import { decirFonema, decirPalabra, decirSilaba } from '../src/lib/pronunciacion'

const textos = new Set<string>()
const add = (t?: string | null) => {
  const s = (t ?? '').trim()
  if (s) textos.add(s)
}

// ── 1. Las 8 actividades del motor común ──────────────────────────────────
// Se generan muchas rondas por dificultad para agotar las colas del corpus.
for (const act of ACTIVIDADES) {
  for (let dif = 1; dif <= 5; dif++) {
    for (let i = 0; i < 400; i++) {
      const r = act.generar(dif)
      // Solo las PARTES: la app locuta siempre por bloques con pausa
      // (locucionPartes / ayudaPartes) y deja las frases enteras como
      // respaldo escrito. Generarlas todas dispararía el catálogo a miles.
      r.locucionPartes?.forEach(add)
      r.ayudaPartes?.forEach(add)
      if (!r.locucionPartes?.length) add(r.locucion)
      if (!r.ayudaPartes?.length) add(r.ayuda)
    }
  }
}

// ── 2. Piezas sueltas que las actividades con UI propia locutan ───────────
const palabras = new Set<string>()
SEGMENTACION_FONEMICA.forEach((p) => palabras.add(p.palabra))
SEGMENTACION_SILABICA.forEach((p) => palabras.add(p.palabra))
CADENAS_FONEMICAS.forEach((c) => c.secuencia.forEach((p) => palabras.add(p)))
CADENAS_SILABICAS.forEach((c) => c.secuencia.forEach((p) => palabras.add(p)))
PALABRAS.forEach((p) => palabras.add(p.texto.toLocaleUpperCase('es-ES')))
palabras.forEach((p) => add(decirPalabra(p)))

const fonemas = new Set<string>()
SEGMENTACION_FONEMICA.forEach((p) => p.fonemas.forEach((f) => fonemas.add(f)))
fonemas.forEach((f) => add(decirFonema(f)))

const silabas = new Set<string>()
SEGMENTACION_SILABICA.forEach((p) => p.silabas.forEach((s) => silabas.add(s)))
SILABAS_CREA_PALABRAS.forEach((s) => silabas.add(s))
silabas.forEach((s) => add(decirSilaba(s)))

;[...FRASES_CONTEO, ...FRASES_DICTADO].forEach(add)

// ── 2b. Actividades con corpus propio ─────────────────────────────────────
// Cada una locuta sus items. Si falta uno, esa actividad entera se oye con la
// voz del dispositivo: es lo que pasaba en el Bingo.
MODELOS_BINGO.forEach((m) => {
  m.items.forEach((it) => add(m.tipo === 'silaba' ? decirSilaba(it) : decirPalabra(it)))
})
;[...PAREJAS_SONIDO_INICIAL, ...PAREJAS_SILABA_INICIAL].forEach(([izq, der]) => {
  add(decirPalabra(izq)); add(decirPalabra(der))
})
// Los bordes de las cadenas no coinciden con SEGMENTACION_*: hay que sacarlos
// de las propias cadenas o falta justo la pieza que enlaza una ficha con otra.
CADENAS_FONEMICAS.forEach((c) => c.secuencia.forEach((p) => {
  const b = bordeDe(p)
  if (b?.ini) add(decirFonema(b.ini))
  if (b?.fin) add(decirFonema(b.fin))
}))
CADENAS_SILABICAS.forEach((c) => c.secuencia.forEach((p) => {
  const b = bordeDe(p)
  if (b?.ini) add(decirSilaba(b.ini))
  if (b?.fin) add(decirSilaba(b.fin))
}))
LEXICO_ORACION_IMAGEN.forEach((o) => add(o.oracion))
// Detectar rima: sus pares viven en el componente.
const PALABRAS_RIMA = ['BAR', 'BOCA', 'COL', 'CUNA', 'FOCA', 'GATO', 'LUNA', 'MAR', 'MARIPOSA', 'MESA', 'NUBE', 'PATO', 'PESA', 'PEZ', 'PINO', 'PORO', 'ROSA', 'SOL', 'TELA', 'TORO', 'TUBE', 'VELA', 'VEZ', 'VINO']
PALABRAS_RIMA.forEach((w) => add(decirPalabra(w)))

LEXICO_ACT2.forEach((f) => add(f.frase))
FRASES_DESORDENADAS.forEach((f) => add(f.correcta.join(' ')))
Object.values(CLASIFICACION_SILABICA).flat().forEach((p) => add(decirPalabra(p)))

// ── 3. Consignas y refuerzos fijos de los componentes ─────────────────────
// Literales que están escritos a mano en los .tsx y no salen de un generador.
const FIJAS = [
  'Muy bien.', 'Inténtalo otra vez.', 'Inténtalo otra vez', '¡Correcto!', '¡Bingo!',
  'Prueba otra', 'Di la palabra despacio', 'Escucha por partes', 'Escucha por sílabas',
  'Cuenta cada palabra con una pausa', 'Escucha las palabras', 'Escucha la frase',
  '¿Cuál empieza diferente?', '¿Cuál empieza igual?',
  // Policubos
  'Pon un cubo por cada sonido', 'Pon un cubo por cada sílaba',
  'Escucha y cuenta los sonidos', 'Escucha y cuenta las sílabas',
  // Cadena-dominó
  'Cadena de sonidos', 'Cadena de sílabas',
  'El último sonido es el primero de la siguiente',
  'La última sílaba es la primera de la siguiente',
  // Busca-sonido
  'Busca todos los dibujos que empiezan por', 'Busca los que empiezan por',
  'Buscamos las que empiezan por',
  // Consignas con voz añadidas tras el aviso de que un niño solo no sabe qué hacer
  'Coloca las palabras en orden', '¿Estas palabras riman?',
  'y', 'sí riman', 'no riman',
  // RAN
  'Di el nombre de cada letra lo más rápido que puedas',
  'Di el nombre de cada número lo más rápido que puedas',
  'Di el nombre de cada color lo más rápido que puedas',
]
FIJAS.forEach(add)

// Fragmentos sueltos: el fonema NUNCA va dentro de la frase.
// Si se mete dentro, Piper genera la frase entera y lee «lll» como
// «ele ele ele» — y además la grabación del logopeda deja de aplicarse,
// porque solo sustituye el clip del fonema aislado.
;[
  'El primer sonido es', 'Casi todas empiezan por', 'empieza por', 'termina por',
  'Busca otra que empiece por', 'Busca otra palabra que termine por',
  'Busca la palabra que empieza por', 'Ahora busca una ficha que empiece por',
  'La que no empieza igual es', 'La que empieza diferente es',
  '¿Qué palabra termina por', 'como', 'Como', 'Empieza por',
].forEach(add)

// Caza del sonido: "Como <palabra>" usa la primera palabra de cada sonido.
// Si falta una sola parte, toda la secuencia cae al sintetizador del móvil y se
// oye otra voz distinta a mitad de actividad.
const POR_INICIAL_BUSCA: Record<string, string[]> = {
  M: ['MESA', 'MIEL', 'MAR', 'MAPA', 'MALETA', 'MARTILLO'],
  S: ['SOL', 'SAL', 'SAPO', 'SIRENA', 'SOPA', 'SELLO', 'SANDÍA'],
  P: ['PATO', 'PALA', 'PINO', 'PIÑA', 'PEZ', 'PALOMA', 'POLO', 'PELOTA'],
  R: ['ROSA', 'RANA', 'ROCA', 'RATÓN', 'RELOJ'],
}
for (const [inicial, ws] of Object.entries(POR_INICIAL_BUSCA)) {
  add(decirFonema(inicial))
  ws.forEach((w) => add(decirPalabra(w)))
}
for (let n = 1; n <= 12; n++) {
  add(`Tiene ${n} sonidos`)
  add(`Son ${n} ${n === 1 ? 'sílaba' : 'sílabas'}`)
  add(`Son ${n}`)
}

const lista = [...textos].sort((a, b) => a.localeCompare(b, 'es'))
const caracteres = lista.reduce((n, t) => n + t.length, 0)

writeFileSync(
  new URL('../src/data/locuciones.json', import.meta.url),
  JSON.stringify(lista, null, 0) + '\n',
)

console.log(`Textos distintos : ${lista.length}`)
console.log(`Caracteres       : ${caracteres}`)
console.log(`Más largo        : ${Math.max(...lista.map((t) => t.length))} car.`)
