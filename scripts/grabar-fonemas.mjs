/**
 * Grabadora de fonemas.
 *
 * Ningún TTS produce un fonema aislado: están entrenados con habla encadenada
 * y siempre cuelan una vocal. Se midió sobre la /m/ generada con Piper y la
 * energía en la banda de vocales (500-2500 Hz) estaba a solo 2,5 dB de la
 * banda nasal; en una /m/ real esa diferencia son 15-25 dB.
 *
 * Así que los 18 fonemas los graba el logopeda. El resto de las locuciones
 * (consignas, palabras, sílabas) las sigue poniendo Piper, que para habla
 * normal va sobrado.
 *
 *   node scripts/grabar-fonemas.mjs
 *
 * Abre http://localhost:4321, graba, y los MP3 caen en public/voz con el
 * nombre correcto. Al terminar, se recarga la app y ya suenan.
 */
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = join(RAIZ, 'public/voz')
const PUERTO = 4321

mkdirSync(DESTINO, { recursive: true })

const claveDe = (texto) =>
  createHash('sha1').update(texto.trim().toLocaleLowerCase('es-ES')).digest('hex').slice(0, 16)

/**
 * Los 18 fonemas del corpus. `texto` es la clave del índice (lo que ya usa la
 * app); `pista` es solo ayuda visual mientras grabas.
 */
const FONEMAS = [
  { letra: 'M', texto: 'mmm', pista: 'Nasal sostenida, sin vocal. Como MESA.' },
  { letra: 'N', texto: 'nnn', pista: 'Nasal alveolar sostenida. Como NUBE.' },
  { letra: 'Ñ', texto: 'ñññ', pista: 'Nasal palatal sostenida. Como PIÑA.' },
  { letra: 'S', texto: 'sss', pista: 'Fricativa sorda sostenida. Como SOL.' },
  { letra: 'F', texto: 'fff', pista: 'Fricativa labiodental. Como FOCA.' },
  { letra: 'Z', texto: 'zzz', pista: 'Interdental /θ/. Como LAZO.' },
  { letra: 'J', texto: 'jjj', pista: 'Velar /x/. Como JAULA.' },
  { letra: 'L', texto: 'lll', pista: 'Lateral sostenida. Como LUNA.' },
  { letra: 'R', texto: 'rrr', pista: 'Vibrante múltiple. Como ROSA, RANA.' },
  { letra: 'A', texto: 'a', pista: 'Vocal abierta, sostenida y estable.' },
  { letra: 'E', texto: 'e', pista: 'Vocal media anterior.' },
  { letra: 'I', texto: 'i', pista: 'Vocal cerrada anterior.' },
  { letra: 'O', texto: 'o', pista: 'Vocal media posterior.' },
  { letra: 'U', texto: 'u', pista: 'Vocal cerrada posterior.' },
  { letra: 'P', texto: 'pe', pista: 'Oclusiva: no se puede aislar. Vocal de apoyo mínima.' },
  { letra: 'T', texto: 'te', pista: 'Oclusiva con vocal de apoyo mínima.' },
  { letra: 'B / V', texto: 'be', pista: 'Oclusiva con vocal de apoyo mínima.' },
  { letra: 'C / K', texto: 'ke', pista: 'Oclusiva velar. Como CUNA (no «ce»).' },
]

const PAGINA = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Grabar fonemas · FonoMundos</title>
<style>
 *{box-sizing:border-box;margin:0;padding:0}
 body{font-family:system-ui,-apple-system,sans-serif;background:#17130f;color:#fff;padding:32px;max-width:840px;margin:0 auto}
 h1{font-size:30px;margin-bottom:6px}
 .sub{opacity:.65;margin-bottom:26px;line-height:1.5}
 .f{display:flex;align-items:center;gap:16px;padding:14px 16px;border-radius:12px;background:#221c16;margin-bottom:10px}
 .f.ok{background:#1d2b1d}
 .letra{font-size:32px;font-weight:800;width:74px;flex-shrink:0}
 .info{flex:1;min-width:0}
 .txt{font-family:ui-monospace,monospace;font-size:14px;color:#e8b73a}
 .pista{font-size:14px;opacity:.6;margin-top:3px}
 button{font:inherit;font-size:15px;padding:9px 16px;border:0;border-radius:9px;cursor:pointer;background:#3a332b;color:#fff}
 button:hover{background:#4a4238}
 button.rec{background:#e53935}
 button.grabando{background:#b71c1c;animation:pulso .9s infinite}
 button:disabled{opacity:.4;cursor:default}
 @keyframes pulso{50%{opacity:.55}}
 .estado{font-size:13px;opacity:.55;margin-top:22px;line-height:1.6}
</style></head><body>
<h1>Grabar los 18 fonemas</h1>
<p class="sub">Pulsa <b>Grabar</b>, di el sonido aislado y vuelve a pulsar para parar.<br>
Se guarda solo, con el nombre que espera la app. Puedes repetir las veces que quieras.</p>
<div id="lista"></div>
<p class="estado" id="estado">Micrófono sin activar. La primera grabación lo pedirá.</p>
<script>
const FONEMAS = ${JSON.stringify(FONEMAS)}
const lista = document.getElementById('lista')
const estado = document.getElementById('estado')
let rec = null, activo = null

FONEMAS.forEach((f, i) => {
  const d = document.createElement('div')
  d.className = 'f'; d.id = 'f' + i
  d.innerHTML = \`<div class="letra">\${f.letra}</div>
    <div class="info"><div class="txt">\${f.texto}</div><div class="pista">\${f.pista}</div></div>
    <button class="rec" data-i="\${i}">Grabar</button>
    <button data-play="\${i}" disabled>Oír</button>\`
  lista.appendChild(d)
})

lista.addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return
  if (b.dataset.play !== undefined) {
    new Audio('/oir/' + b.dataset.play + '?t=' + Date.now()).play()
    return
  }
  const i = Number(b.dataset.i)
  if (activo === i) { rec.stop(); return }
  if (rec && rec.state === 'recording') rec.stop()

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const trozos = []
  rec = new MediaRecorder(stream)
  rec.ondataavailable = (ev) => trozos.push(ev.data)
  rec.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop())
    b.textContent = 'Guardando…'; b.classList.remove('grabando')
    const r = await fetch('/guardar/' + i, { method: 'POST', body: new Blob(trozos) })
    const ok = r.ok
    b.textContent = ok ? 'Regrabar' : 'Error'
    document.getElementById('f' + i).classList.toggle('ok', ok)
    document.querySelector('[data-play="' + i + '"]').disabled = !ok
    estado.textContent = ok
      ? \`Guardado /\${FONEMAS[i].texto}/. Llevas \${document.querySelectorAll('.f.ok').length} de 18.\`
      : 'No se pudo guardar: ' + await r.text()
    activo = null
  }
  rec.start(); activo = i
  b.textContent = 'Parar'; b.classList.add('grabando')
  estado.textContent = 'Grabando /' + FONEMAS[i].texto + '/…'
})
</script></body></html>`

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const trozos = []
    req.on('data', (c) => trozos.push(c))
    req.on('end', () => resolve(Buffer.concat(trozos)))
    req.on('error', reject)
  })
}

createServer(async (req, res) => {
  const [, ruta, idx] = req.url.split('?')[0].split('/')

  if (!ruta) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(PAGINA)
  }

  const f = FONEMAS[Number(idx)]
  if (!f) { res.writeHead(404); return res.end('fonema desconocido') }
  const destino = join(DESTINO, `${claveDe(f.texto)}.mp3`)

  if (ruta === 'guardar' && req.method === 'POST') {
    const bruto = join(tmpdir(), `fm-${Date.now()}.webm`)
    try {
      writeFileSync(bruto, await leerCuerpo(req))
      // Recorta silencios de los extremos y normaliza: al grabar a mano siempre
      // sobra un pelín antes de empezar y después de soltar el botón.
      execFileSync('ffmpeg', [
        '-y', '-loglevel', 'error', '-i', bruto,
        '-af', 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB:'
             + 'detection=peak,areverse,'
             + 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB:'
             + 'detection=peak,areverse,loudnorm=I=-18:TP=-2',
        '-ar', '22050', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', destino,
      ])
      console.log(`  ✓ /${f.texto}/ -> ${destino.split('/').pop()}`)
      res.writeHead(200); res.end('ok')
    } catch (e) {
      console.error('  ✗', f.texto, e.message)
      res.writeHead(500); res.end(String(e.message))
    } finally {
      if (existsSync(bruto)) unlinkSync(bruto)
    }
    return
  }

  if (ruta === 'oir') {
    if (!existsSync(destino)) { res.writeHead(404); return res.end('sin grabar') }
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' })
    return res.end(readFileSync(destino))
  }

  res.writeHead(404); res.end('no')
}).listen(PUERTO, () => {
  console.log(`\n  Grabadora de fonemas: http://localhost:${PUERTO}\n`)
  console.log('  Graba los 18, cierra con Ctrl+C y recarga FonoMundos.\n')
})
