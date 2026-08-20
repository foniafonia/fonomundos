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
} from '../src/data/guia'
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
  // RAN
  'Di el nombre de cada letra lo más rápido que puedas',
  'Di el nombre de cada número lo más rápido que puedas',
  'Di el nombre de cada color lo más rápido que puedas',
]
FIJAS.forEach(add)

// Fragmentos con fonema variable que aparecen en varias actividades
for (const f of fonemas) {
  const s = decirFonema(f)
  if (!s) continue
  add(`El primer sonido es ${s}`)
  add(`Casi todas empiezan por ${s}`)
  add(`empieza por ${s}`)
  add(`termina por ${s}`)
  add(`Busca otra que empiece por ${s}`)
  add(`Busca otra palabra que termine por ${s}`)
  add(`Busca la palabra que empieza por ${s}`)
  add(`Ahora busca una ficha que empiece por ${s}`)
  add(`Como ${s}`)
}
for (const s of silabas) {
  const v = decirSilaba(s)
  if (!v) continue
  add(`Casi todas empiezan por ${v}`)
  add(`Busca la palabra que empieza por ${v}`)
  add(`Ahora busca una ficha que empiece por ${v}`)
}
for (const p of palabras) {
  add(`Empieza por ${decirPalabra(p)}`)
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
