/* Comprobaciones de la Ruta: datos, voz y motor.
   Ejecutar: npx tsx src/ruta/validarRuta.ts
   (No toca scripts/validar.ts: la Ruta vive aislada en src/ruta.) */
import { tieneClip } from '../lib/vozArchivos'
import { decirFonema, decirPalabra } from '../lib/pronunciacion'
import { PARADAS_3_ANOS } from './paradas'
import { CATALOGO_RUTA } from './catalogo'
import { PALABRAS_ARTICULACION, PALABRAS_MEMORIA, SILABAS_GESTOS, escribirSilaba, imagenDe } from './vocabulario'
import { textosSinClip } from './locucion'
import {
  type DatosSesion, type EstadoRuta, MINIMO_FIABLE, NIVEL_AYUDA_MAX,
  estadoDeTarea, estadoInicial, planDeHoy, registrarSesion,
} from './motor'

let errores = 0
let avisos = 0
const err = (m: string) => { console.log('❌ ' + m); errores++ }
const warn = (m: string) => { console.log('⚠️  ' + m); avisos++ }
const ok = (m: string) => console.log('✅ ' + m)
const esperar = (cond: boolean, m: string) => (cond ? ok(m) : err(m))

// ── 1. Paradas ──────────────────────────────────────────────────────────────
esperar(PARADAS_3_ANOS.length === 8, 'La Ruta de 3 años tiene 8 paradas')
PARADAS_3_ANOS.forEach((t, i) => {
  const id = `r3-p${i + 1}`
  if (t.id !== id || t.numero !== i + 1) err(`Parada ${i + 1}: id ${t.id} / número ${t.numero}, se esperaba ${id} (el orden no se toca)`)
  if (t.sesionesMinimas !== t.tareas.length * 2) err(`${t.id}: total mínimo ${t.sesionesMinimas} ≠ 2 × ${t.tareas.length} tareas`)
  t.tareas.forEach((ta, j) => {
    if (ta.num !== j + 1) err(`${t.id}: tarea en posición ${j + 1} numerada ${ta.num}`)
    if (!CATALOGO_RUTA[ta.actividadId]) err(`${t.id}#${ta.num}: «${ta.actividadId}» no está en el catálogo`)
    if (ta.actividadId === 'articulacion' && !ta.config.sonido) err(`${t.id}#${ta.num}: articulación sin sonido`)
    if (ta.actividadId === 'memoria-series' && !ta.config.n) err(`${t.id}#${ta.num}: memoria-series sin N`)
  })
  if (t.repaso && !CATALOGO_RUTA[t.repaso.actividadId]) err(`${t.id}: repaso «${t.repaso.actividadId}» no está en el catálogo`)
})
if (!errores) ok('Paradas: en orden, tareas numeradas y en el catálogo')

// ── 2. Vocabulario y voz ────────────────────────────────────────────────────
function comprobarPalabras(lista: string[], ctx: string) {
  const dibujos = new Set<string>()
  for (const p of lista) {
    const img = imagenDe(p)
    if (!img) err(`${ctx}: «${p}» sin dibujo`)
    else if (dibujos.has(img)) err(`${ctx}: «${p}» repite dibujo ${img}`)
    dibujos.add(img)
    if (!tieneClip(decirPalabra(p))) err(`${ctx}: «${p}» sin clip de voz ("${decirPalabra(p)}")`)
  }
}
comprobarPalabras(PALABRAS_MEMORIA, 'memoria-series')
esperar(PALABRAS_MEMORIA.length >= 8, `memoria-series: ${PALABRAS_MEMORIA.length} palabras con dibujo y voz`)

const sonidos = new Set(PARADAS_3_ANOS.flatMap((t) => t.tareas).map((ta) => ta.config.sonido).filter(Boolean) as string[])
for (const s of sonidos) {
  const lista = PALABRAS_ARTICULACION[s]
  if (!lista) { err(`articulación /${s}/: sin palabras`); continue }
  if (lista.length < 4) err(`articulación /${s}/: solo ${lista.length} palabras`)
  comprobarPalabras(lista, `articulación /${s}/`)
  if (!tieneClip(decirFonema(s))) warn(`articulación /${s}/: el sonido aislado ("${decirFonema(s)}") no tiene clip; no se locuta hasta generarlo`)
}

// Monta la sílaba: solo con sonidos grabados (consonante + vocal). Sin clip, no hay sílaba.
for (const s of SILABAS_GESTOS) {
  if (!tieneClip(decirFonema(s.consonante)) || !tieneClip(decirFonema(s.vocal))) err(`Monta la sílaba: «${s.texto}» sin su sonido grabado`)
}
esperar(SILABAS_GESTOS.length >= 40, `Monta la sílaba: ${SILABAS_GESTOS.length} sílabas con voz grabada`)
esperar(escribirSilaba('Z', 'E') === 'ce' && escribirSilaba('Z', 'A') === 'za', 'Monta la sílaba: z + e se escribe «ce»')

const pendientes = textosSinClip()
if (pendientes.length) warn(`Textos de la Ruta pendientes de generar con Piper (dados de alta en recolectar-voz.ts): ${pendientes.map((t) => `"${t}"`).join(', ')}`)

// ── 3. Motor ────────────────────────────────────────────────────────────────
let reloj = 1_000_000
function jugar(estado: EstadoRuta, aciertos: number, total: number, parcial = false) {
  const plan = planDeHoy(estado)
  if (plan.tipo !== 'sesion') throw new Error(`Se esperaba sesión y el plan es ${plan.tipo}`)
  const datos: DatosSesion = {
    id: `s${reloj}`, fecha: reloj++, duracionMs: 300_000, parcial,
    objetivo: { aciertos, total }, repaso: null, cierre: null, sesionIds: [],
  }
  return { plan, ...registrarSesion(estado, plan, datos) }
}

{
  let e = estadoInicial()
  const p = planDeHoy(e)
  esperar(p.tipo === 'sesion' && p.parada.id === 'r3-p1' && p.tarea.num === 1 && !p.repaso, 'Inicio: parada 1, tarea 1, sin repaso')

  const orden: number[] = []
  for (let i = 0; i < 7; i++) { const r = jugar(e, 10, 10); orden.push(r.plan.tarea.num); e = r.estado }
  esperar(orden.join(',') === '1,2,3,4,1,2,3', `Rotación en el orden fijado (${orden.join(',')})`)
  esperar(estadoDeTarea(e, 'r3-p1', 1).dominada, 'Tarea dominada tras 2 sesiones seguidas ≥ 80 %')
  esperar(e.paradaId === 'r3-p1', 'No avanza de parada antes de ver cada tarea 2 veces')
  const r8 = jugar(e, 10, 10); e = r8.estado
  esperar(e.paradaId === 'r3-p2', `Parada 1 superada en la sesión 8 (el mínimo) → parada 2`)

  const p2 = planDeHoy(e)
  esperar(p2.tipo === 'sesion' && p2.repaso?.actividadId === 'memoria-series', 'La parada 2 trae repaso de memoria-series')
}

{
  // Si cuesta: < 50 % dos veces → más ayuda; con la máxima no se salta.
  let e = estadoInicial()
  const tarea1 = () => estadoDeTarea(e, 'r3-p1', 1)
  const soloTarea1 = (a: number) => {
    const r = jugar(e, a, 10); e = r.estado
    // Las otras tres tareas con resultado neutro (60 %) para que la rotación vuelva a la 1.
    for (let k = 0; k < 3; k++) e = jugar(e, 6, 10).estado
  }
  soloTarea1(3); soloTarea1(2)
  esperar(tarea1().nivelAyuda === 1 && !tarea1().dominada, '< 50 % en 2 sesiones seguidas → nivel de ayuda 1')
  soloTarea1(2); soloTarea1(4)
  esperar(tarea1().nivelAyuda === 2, '… y otra vez → nivel 2')
  soloTarea1(1); soloTarea1(1)
  esperar(tarea1().nivelAyuda === NIVEL_AYUDA_MAX && e.paradaId === 'r3-p1', 'Con la ayuda máxima no baja más ni salta la parada')
  soloTarea1(9); soloTarea1(8)
  esperar(tarea1().nivelAyuda === 1 && !tarea1().dominada, '≥ 80 % dos veces con ayuda → se retira un nivel, aún no dominada')
  soloTarea1(5); soloTarea1(9)
  esperar(tarea1().nivelAyuda === 1, 'Sesiones no seguidas ≥ 80 % no cambian nada')
}

{
  // Parcial con menos del mínimo fiable: se guarda pero no decide.
  let e = estadoInicial()
  e = jugar(e, 2, 2, true).estado
  const tras = planDeHoy(e)
  esperar(tras.tipo === 'sesion' && tras.tarea.num === 1, 'Tras salir con 2 ítems, la próxima sesión repite la misma tarea')
  // 2/2 y luego 10/10: si la parcial contara, ya serían «2 seguidas ≥ 80 %».
  const r = jugar(e, 10, 10); e = r.estado
  const t = estadoDeTarea(e, 'r3-p1', 1)
  esperar(r.plan.tarea.num === 1 && t.pasadas.length === 2 && !t.dominada, `Sesión parcial de 2 ítems (< ${MINIMO_FIABLE}) no cuenta como una de las 2 seguidas`)
}

{
  // La articulación no frena la parada si las fonológicas están dominadas.
  let e = estadoInicial()
  for (let i = 0; i < 8; i++) {
    const plan = planDeHoy(e)
    const esArt = plan.tipo === 'sesion' && plan.tarea.actividadId === 'articulacion'
    e = jugar(e, esArt ? 4 : 10, 10).estado
  }
  esperar(e.paradaId === 'r3-p2' && !estadoDeTarea(e, 'r3-p1', 4).dominada, 'Articulación al 40 %: la parada se supera igual (solo cuentan las fonológicas)')
}

{
  // Las paradas 3 a 6 ya se juegan; la 7 necesita compuestas y rimas: la Ruta se para, no salta.
  for (const id of ['r3-p3', 'r3-p4', 'r3-p5', 'r3-p6']) {
    const pl = planDeHoy({ ...estadoInicial(), paradaId: id })
    if (pl.tipo !== 'sesion') err(`${id}: debería poder jugarse y el plan es ${pl.tipo}`)
  }
  const r6 = planDeHoy({ ...estadoInicial(), paradaId: 'r3-p6' })
  esperar(r6.tipo === 'sesion' && r6.repaso?.actividadId === 'memoria-quitado', 'Paradas 3 a 6 jugables; la 6 repasa ¿Cuál falta?')
  const e: EstadoRuta = { ...estadoInicial(), paradaId: 'r3-p7' }
  const p = planDeHoy(e)
  esperar(p.tipo === 'bloqueado' && p.faltan.includes('compuestas-suma'), 'Parada 7 detenida: faltan compuestas y rimas')
  const fin = planDeHoy({ ...estadoInicial(), paradaId: null })
  esperar(fin.tipo === 'terminada', 'Sin parada actual → Ruta terminada')
}

console.log(`\n──────── RUTA: ${errores} errores, ${avisos} avisos ────────`)
if (errores > 0) throw new Error(`validarRuta: ${errores} errores`)
