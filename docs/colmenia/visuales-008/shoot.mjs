import { chromium } from 'playwright'
const jobs = [
  ['1-portada-articulo', 1200, 627],
  ['2-portada-vertical', 1080, 1920],
  ['3-cita-tesis',       1080, 1080],
  ['4-quien-hay-dentro', 1080, 1080],
  ['5-la-linea',         1080, 1080],
]
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
for (const [name, w, h] of jobs) {
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:2 })
  const errs = []
  p.on('pageerror', e => errs.push(e.message))
  await p.goto(`file:///home/user/visual/${name}.html`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(400)
  // aviso si algo desborda el lienzo
  const over = await p.evaluate(() => {
    const d = document.documentElement
    return { w: d.scrollWidth - window.innerWidth, h: d.scrollHeight - window.innerHeight }
  })
  await p.screenshot({ path: `out/${name}.png` })
  console.log(name, w+'x'+h, 'desborde', over, errs.length?errs:'')
  await p.close()
}
await b.close()
