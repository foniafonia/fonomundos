/**
 * Graba el vídeo de novedades: 1920x1080, la app real a la izquierda ocupando
 * el 70 % y el panel explicativo a la derecha.
 *
 * Reglas de montaje aprendidas por el camino:
 * - La app nunca se queda quieta: cada plano lleva algo moviéndose (una ronda
 *   que se acierta, un panel que se abre, un control que se desliza). Con el
 *   panel derecho cambiando y la izquierda congelada, aburre.
 * - Arranca en caliente: la entrada a la actividad se recorta después con
 *   ffmpeg usando el corte que imprime este script.
 * - Lo que no se puede oír se explica con ANTES/AHORA.
 *
 * Necesita el servidor de desarrollo levantado y public/demo-mejoras.html.
 *   npm run dev
 *   node scripts/grabar-video.cjs /tmp/fm-video
 */
const os = require('os')
const path = require('path')
const fs = require('fs')
const { chromium } = require(path.join(os.homedir(), 'node_modules/playwright-core'))

const CHROME = path.join(
  os.homedir(),
  'Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
)
const BASE = 'http://localhost:5173'
const OUT = process.argv[2] || '/tmp/fm-video'
const CAPS = path.join(OUT, 'capturas')
const W = 1920, H = 1080

fs.mkdirSync(CAPS, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  })
  const page = await ctx.newPage()
  const t0 = Date.now()

  const escena = (o) => page.evaluate((x) => window.escena(x), o)
  /** Cortinilla de marca a pantalla completa. */
  const marca = (texto) => page.evaluate((t) => window.marca(t), texto || '')
  const foco = (t) => page.evaluate((x) => window.foco(x), t || null)
  const zoom = (z) => page.evaluate((x) => window.zoomApp(x), z)
  const captura = async (n) => { await page.screenshot({ path: path.join(CAPS, `${n}.png`) }); console.log('  captura', n) }

  const pulsar = async (txt, espera = 1100) => {
    const ok = await page.evaluate((t) => {
      const d = document.getElementById('app').contentDocument
      const b = [...d.querySelectorAll('button')].find((x) => x.textContent.includes(t))
      if (!b) return false
      b.click(); return true
    }, txt)
    if (!ok) throw new Error('No encuentro: ' + txt)
    await sleep(espera)
  }

  /** Acierta la ronda: la opción correcta es la inicial de la palabra mostrada. */
  const acertar = async (espera = 1600) => {
    await page.evaluate(() => {
      const d = document.getElementById('app').contentDocument
      const palabra = [...d.querySelectorAll('main span')]
        .map((s) => s.textContent.trim())
        .find((t) => /^[A-ZÑÁÉÍÓÚ]{3,}$/.test(t))
      if (!palabra) return
      const b = [...d.querySelectorAll('main button')].find((x) => x.textContent.trim() === palabra[0])
      b?.click()
    })
    await sleep(espera)
  }

  const moverVelocidad = async (valores) => {
    for (const v of valores) {
      await page.evaluate((val) => {
        const d = document.getElementById('app').contentDocument
        const r = d.querySelector('input[type=range]')
        if (!r) return
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(r, String(val))
        r.dispatchEvent(new Event('input', { bubbles: true }))
      }, v)
      await sleep(400)
    }
  }

  console.log('Grabando...')
  await page.goto(`${BASE}/demo-mejoras.html`, { waitUntil: 'networkidle' })
  await sleep(1800)

  // ── PREPARACIÓN (se recorta) ──────────────────────────────────────────────
  await escena({ kicker: '', titulo: '', sub: '' })
  await pulsar('Jugar ahora', 900)
  await pulsar('Empieza aquí', 1500)
  const CORTE = (Date.now() - t0) / 1000
  console.log('  corte en', CORTE.toFixed(2), 's')

  // ── 0. APERTURA DE MARCA ──────────────────────────────────────────────────
  await marca('')
  await sleep(2200)
  await captura('00-marca')
  await marca(null)
  await sleep(400)

  // ── 1. GOLPE ──────────────────────────────────────────────────────────────
  await escena({
    kicker: 'Conciencia fonémica', titulo: 'Vuestro paciente oía «ese»',
    sub: 'Cuando debía oír /s/.',
  })
  await sleep(2600)
  await captura('01-golpe')
  await acertar()

  // ── 2. LA VOZ ─────────────────────────────────────────────────────────────
  await escena({
    kicker: 'Lo dijisteis sin rodeos', titulo: 'La voz no era nuestra',
    sub: 'La ponía el sintetizador de cada móvil. Por eso sonaba distinta en cada aparato.',
    antes: 'Cada dispositivo, <b>una voz</b>',
    ahora: 'Una sola voz, <b>igual en todos</b>',
  })
  await sleep(3800)
  await captura('02-voz')
  await acertar()

  // ── 3. LOS FONEMAS ────────────────────────────────────────────────────────
  await escena({
    kicker: 'Y esto no lo hace ninguna máquina', titulo: 'Los 18 sonidos los graba un logopeda',
    sub: 'Ningún sintetizador dice una /m/ aislada: siempre cuela una vocal.',
    antes: '/S/ se oía <b>«ese»</b> &nbsp;·&nbsp; /M/ se oía <b>«eme»</b>',
    ahora: '<b>sssss</b> &nbsp;·&nbsp; <b>mmmmm</b> — grabados en consulta',
  })
  await sleep(4200)
  await captura('03-fonemas')
  await acertar()

  // ── 4. RITMO ──────────────────────────────────────────────────────────────
  await escena({
    kicker: 'Lo pedisteis cuatro veces', titulo: 'A vuestro ritmo',
    sub: '',
    puntos: [
      '1,1 s de silencio antes de la palabra',
      'Velocidad 🐢 / 🐇 que se guarda',
      '«Solo sonido»: sin palabra escrita',
    ],
  })
  await pulsar('Letra', 1100)
  await moverVelocidad([1.15, 1.3, 1.05, 0.75, 0.6])
  await captura('04-ritmo')
  await sleep(600)
  await pulsar('Cerrar', 800)

  // ── 5. LA LETRA ───────────────────────────────────────────────────────────
  await escena({
    kicker: 'El fallo más silencioso', titulo: 'La letra para dislexia no cargaba',
    sub: 'Se pedía a un servidor donde nunca estuvo. Venía activada por defecto, así que lo sufría todo el mundo.',
    antes: 'Se veía Comic Sans: la <b>I</b> y la <b>l</b>, la misma forma',
    ahora: 'OpenDyslexic <b>dentro del programa</b>',
  })
  await foco('¿Con qué sonido')
  await sleep(2200)
  await foco(null)
  await sleep(1800)
  await captura('05-letra')

  // ── 6. SALIR Y GUARDAR ────────────────────────────────────────────────────
  await page.evaluate(() => {
    const d = document.getElementById('app').contentDocument
    const o = [...d.querySelectorAll('main button')].filter((b) => /^[A-ZÑ]$/.test(b.textContent.trim()))
    o[0]?.click()
  })
  await escena({
    kicker: 'La que más cambia la consulta', titulo: 'Parad cuando haga falta',
    sub: '',
    antes: 'Salir antes del final <b>perdía todo</b>',
    ahora: 'Se guarda como <b>sesión parcial</b>',
  })
  await sleep(1900)
  await foco('Salir y guardar')
  await sleep(2200)
  await foco(null)
  await captura('06-guardar')

  // ── 7. MÁS TARJETAS ───────────────────────────────────────────────────────
  await escena({
    kicker: 'También lo pedisteis', titulo: 'Más grande y más tarjetas',
    sub: '',
    antes: '<b>6</b> ítems por tablero',
    ahora: '<b>9</b> ítems por tablero',
  })
  await pulsar('Salir', 1100)
  await pulsar('Ver todos los juegos', 1000)
  await pulsar('Caza del sonido', 1800)
  await sleep(1500)
  await captura('07-tarjetas')

  // ── 8. MAPA DE CALOR ──────────────────────────────────────────────────────
  await escena({
    kicker: 'Y algo que no existía', titulo: 'Mapa de calor por fonema',
    sub: '',
    antes: 'Solo sabíais <b>cuánto</b> acierta',
    ahora: 'Ahora sabéis <b>qué le cuesta</b>',
  })
  await pulsar('Salir', 1000)
  await page.evaluate(() => { document.getElementById('app').contentWindow.location.href = '/#mejoras' })
  await sleep(2300)
  await zoom(1.3)
  await sleep(600)
  await page.evaluate(() => {
    const d = document.getElementById('app').contentDocument
    const h = [...d.querySelectorAll('h3')].find((x) => x.textContent.includes('Mapa de calor'))
    h?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  })
  await sleep(2400)
  await captura('08-mapa-calor')

  await escena({
    kicker: 'Cómo se lee', titulo: 'Rojo lo atascado, verde lo dominado',
    sub: '',
    puntos: [
      'De peor a mejor: por dónde entrar',
      'Toca una casilla y oye el fonema',
      'Punteado «?» = pocos intentos aún',
      'Se construye desde hoy, sesión a sesión',
    ],
  })
  await page.evaluate(() => {
    const d = document.getElementById('app').contentDocument
    d.defaultView.scrollBy({ top: 620, behavior: 'smooth' })
  })
  await sleep(4600)
  await captura('09-leer-mapa')

  // ── 9. REMATE ─────────────────────────────────────────────────────────────
  await escena({
    kicker: 'Sin coste, para siempre', titulo: 'Las frases van dentro del juego',
    sub: 'FonoMundos siempre dice lo mismo: 555 locuciones que se graban una vez. No hay nada que pagar por uso, ni ahora ni nunca.',
  })
  await page.evaluate(() => {
    const d = document.getElementById('app').contentDocument
    d.defaultView.scrollBy({ top: 700, behavior: 'smooth' })
  })
  await sleep(4600)
  await captura('10-sin-coste')

  await escena({
    kicker: 'Más de 250 comentarios vuestros', titulo: 'Vosotros la veis en consulta',
    sub: 'Ahí es donde se ve lo que hay que cambiar. Seguid dándole al 🐛.',
  })
  await page.evaluate(() => {
    const d = document.getElementById('app').contentDocument
    d.defaultView.scrollTo({ top: 0, behavior: 'smooth' })
  })
  await sleep(4400)
  await captura('11-cierre')

  // ── CIERRE DE MARCA ───────────────────────────────────────────────────────
  await marca('Aprendemos · Creamos · Transformamos')
  await sleep(3400)
  await captura('12-marca-final')

  await ctx.close()
  await browser.close()
  const webm = fs.readdirSync(OUT).find((f) => f.endsWith('.webm'))
  fs.writeFileSync(path.join(OUT, 'corte.txt'), String(CORTE))
  console.log('Vídeo bruto:', path.join(OUT, webm))
})().catch((e) => { console.error('ERROR', e.message); process.exit(1) })
