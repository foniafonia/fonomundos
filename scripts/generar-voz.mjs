/**
 * Genera un MP3 por cada texto de src/data/locuciones.json con Piper.
 *
 * Por qué ficheros y no el sintetizador del navegador: `speechSynthesis` usa la
 * voz del dispositivo, así que FonoMundos sonaba distinto en cada móvil y no
 * había forma de controlarlo. Con audio pregenerado suena idéntico en todas
 * partes y no cuesta nada por uso.
 *
 * Requisitos (solo para regenerar; los MP3 ya van versionados):
 *   pip install piper-tts
 *   curl -L -o es_ES-sharvard-medium.onnx      <hf>/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx
 *   curl -L -o es_ES-sharvard-medium.onnx.json <hf>/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json
 *   node scripts/generar-voz.mjs /ruta/al/modelo.onnx
 *
 * Voz: es_ES-sharvard-medium, hablante 1 (femenino, España). CC-BY 3.0.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const MODELO = process.argv[2]
const HABLANTE = '1'          // 1 = femenino en sharvard
const VELOCIDAD = '1.35'      // la comunidad pidió cuatro veces que fuera más lenta
const DESTINO = join(RAIZ, 'public/voz')
const TMP = join(RAIZ, '.voz-tmp')

if (!MODELO || !existsSync(MODELO)) {
  console.error('Falta el modelo. Uso: node scripts/generar-voz.mjs /ruta/es_ES-sharvard-medium.onnx')
  process.exit(1)
}

/** Nombre de fichero estable a partir del texto. */
export const claveDe = (texto) =>
  createHash('sha1').update(texto.trim().toLocaleLowerCase('es-ES')).digest('hex').slice(0, 16)

const textos = JSON.parse(readFileSync(join(RAIZ, 'src/data/locuciones.json'), 'utf8'))
mkdirSync(DESTINO, { recursive: true })
mkdirSync(TMP, { recursive: true })

const indice = {}
let hechos = 0, saltados = 0

for (const texto of textos) {
  const clave = claveDe(texto)
  indice[texto] = clave
  const mp3 = join(DESTINO, `${clave}.mp3`)
  if (existsSync(mp3)) { saltados++; continue }

  const wav = join(TMP, `${clave}.wav`)
  execFileSync('python3', [
    '-m', 'piper', '-m', MODELO, '-s', HABLANTE,
    '--length-scale', VELOCIDAD, '-f', wav,
  ], { input: texto, encoding: 'utf8' })

  // Mono 22 kHz y 64 kbps: de sobra para voz y mantiene el peso total bajo.
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', wav,
    '-ar', '22050', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', mp3,
  ])

  hechos++
  if (hechos % 50 === 0) console.log(`  ${hechos + saltados}/${textos.length}`)
}

rmSync(TMP, { recursive: true, force: true })
writeFileSync(join(RAIZ, 'src/data/vozIndice.json'), JSON.stringify(indice) + '\n')

console.log(`\nGenerados : ${hechos}`)
console.log(`Ya estaban: ${saltados}`)
console.log(`Índice    : src/data/vozIndice.json (${Object.keys(indice).length} entradas)`)
