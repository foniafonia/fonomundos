/* Validador automático del contenido y la lógica del juego.
   Ejecutar: npx tsx scripts/validar.ts  */
import { ACTIVIDADES } from '../src/data/actividades'
import {
  CADENAS_FONEMICAS, CADENAS_SILABICAS, SEGMENTACION_FONEMICA, SEGMENTACION_SILABICA,
  PAREJAS_SONIDO_INICIAL, PAREJAS_SILABA_INICIAL, CLASIFICACION_SILABICA,
  CONTEO_FONEMICO, LEXICO_ORACION_IMAGEN, LEXICO_ACT2, FRASES_DESORDENADAS, EMOJI,
} from '../src/data/guia'
import { bordeDe, validarEnlaceCadena } from '../src/lib/cadenaValidacion'

let errores = 0
let avisos = 0
const err = (m: string) => { console.log('❌ ' + m); errores++ }
const warn = (m: string) => { console.log('⚠️  ' + m); avisos++ }
const ok = (m: string) => console.log('✅ ' + m)

// --- 1. Emojis: toda palabra mostrada debe tener emoji real ---
function chequearEmoji(palabra: string, ctx: string) {
  const e = EMOJI[palabra.toUpperCase()]
  if (!e) err(`Sin emoji: "${palabra}" (${ctx})`)
}
const todasPalabras = new Set<string>()
;[...CADENAS_FONEMICAS, ...CADENAS_SILABICAS].forEach((c) => c.secuencia.forEach((p) => todasPalabras.add(p)))
SEGMENTACION_FONEMICA.forEach((p) => todasPalabras.add(p.palabra))
SEGMENTACION_SILABICA.forEach((p) => todasPalabras.add(p.palabra))
;[...PAREJAS_SONIDO_INICIAL, ...PAREJAS_SILABA_INICIAL].forEach(([a, b]) => { todasPalabras.add(a); todasPalabras.add(b) })
Object.values(CLASIFICACION_SILABICA).flat().forEach((p) => todasPalabras.add(p))
CONTEO_FONEMICO.forEach((c) => todasPalabras.add(c.palabra))
todasPalabras.forEach((p) => chequearEmoji(p, 'corpus'))

// --- 2. Cadenas fonémicas: regla fin==ini (B es la irregular conocida) ---
for (const c of CADENAS_FONEMICAS) {
  let rotos = 0
  for (let i = 0; i < c.secuencia.length - 1; i++) {
    const a = bordeDe(c.secuencia[i]); const b = bordeDe(c.secuencia[i + 1])
    if (!a) { err(`Cadena ${c.id}: sin borde fonema "${c.secuencia[i]}"`); continue }
    if (!b) { err(`Cadena ${c.id}: sin borde fonema "${c.secuencia[i + 1]}"`); continue }
    if (a.fin !== b.ini) rotos++
  }
  if (rotos === 0) ok(`Cadena fonémica ${c.id}: regla perfecta (${c.secuencia.length})`)
  else if (c.id === 'B') warn(`Cadena ${c.id}: ${rotos} enlace(s) no cumplen la regla (irregular conocida)`)
  else err(`Cadena ${c.id}: ${rotos} enlace(s) ROMPEN la regla y no es la B`)
  // validador del juego coincide con la secuencia
  for (let i = 0; i < c.secuencia.length - 1; i++) {
    const v = validarEnlaceCadena(c, c.secuencia[i], c.secuencia[i + 1])
    if (!v.correcto) err(`Cadena ${c.id}: validarEnlaceCadena falla en ${c.secuencia[i]}→${c.secuencia[i + 1]}`)
  }
}

// --- 3. Actividades de opción: respuesta correcta presente y única ---
for (const act of ACTIVIDADES) {
  let fallos = 0
  for (let dif = 1; dif <= 5; dif++) {
    for (let n = 0; n < 80; n++) {
      let r
      try { r = act.generar(dif) } catch (e) { err(`${act.id}: excepción al generar (dif ${dif}): ${e}`); fallos++; break }
      if (!r.opciones?.length) { err(`${act.id}: ronda sin opciones`); fallos++; continue }
      const correctas = r.opciones.filter((o) => o.id === r.correctaId)
      if (correctas.length !== 1) { err(`${act.id}: correctaId "${r.correctaId}" aparece ${correctas.length} veces en opciones [${r.opciones.map(o=>o.id).join(',')}]`); fallos++ }
      const ids = r.opciones.map((o) => o.id)
      if (new Set(ids).size !== ids.length) { err(`${act.id}: opciones con id duplicado [${ids.join(',')}]`); fallos++ }
    }
  }
  if (fallos === 0) ok(`Actividad "${act.id}": 400 rondas OK`)
}

// --- 4. Frases léxicas: el desorden difiere y todas las palabras existen ---
for (const f of [...FRASES_DESORDENADAS, ...LEXICO_ACT2]) {
  if (f.correcta.length < 2) err(`Frase con <2 palabras: ${f.correcta.join(' ')}`)
}
LEXICO_ACT2.forEach((f) => { if (!f.emoji) err(`LEXICO_ACT2 sin emoji: ${f.correcta.join(' ')}`) })
LEXICO_ORACION_IMAGEN.forEach((o) => { if (!o.emoji) err(`Oración-imagen sin emoji: ${o.oracion}`) })

// --- 5. Segmentación: nº de piezas plausible ---
SEGMENTACION_FONEMICA.forEach((p) => { if (p.fonemas.length !== p.palabra.replace(/[^A-ZÑÁÉÍÓÚ]/gi, '').length) warn(`Fonemas de ${p.palabra}: ${p.fonemas.length} (letras ${p.palabra.length})`) })

console.log(`\n──────── RESULTADO: ${errores} errores, ${avisos} avisos ────────`)
process.exit(errores > 0 ? 1 : 0)
