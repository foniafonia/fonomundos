import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Paciente, Sesion } from '../types'
import { getActividad } from '../data/actividades'
import { FRASES_DESORDENADAS, LEXICO_ACT2 } from '../data/guia'
import { getSesiones } from '../lib/storage'
import { registrarEventoUso } from '../lib/analytics'
import { uid } from '../lib/id'
import JugarActividad from '../components/JugarActividad'
import OrdenarFrase from '../components/OrdenarFrase'
import EmparejarOracion from '../components/EmparejarOracion'
import NavBar from '../components/NavBar'
import BloqueRuta from './BloqueRuta'
import { entradaDe } from './catalogo'
import { CONSIGNAS, locutar } from './locucion'
import {
  type PlanDeHoy, type ResumenBloque, cargarEstado, guardarEstado, planDeHoy, porcentaje, registrarSesion,
} from './motor'
import type { ConfigTarea, Corte, ResultadoBloque, Parada } from './tipos'

/**
 * La sesión diaria de la Ruta: repaso 1-2 min → objetivo 4-6 min →
 * cierre 1 min, cortando a los 10 minutos.
 *
 * Las actividades que ya existían se LANZAN tal cual (JugarActividad,
 * OrdenarFrase, EmparejarOracion) y guardan su propia sesión. A los 10
 * minutos, las propias de la Ruta y las lanzadas (con su prop `cortar`) se
 * paran en el momento y guardan lo hecho como sesión parcial.
 */

export const LIMITE_MS = 10 * 60 * 1000
const ITEMS = { repaso: 4, objetivo: 10, cierre: 2 }

type Bloque = 'repaso' | 'objetivo' | 'cierre'
type Fase = 'inicio' | Bloque | 'fin'
type PlanSesion = Extract<PlanDeHoy, { tipo: 'sesion' }>

interface Spec {
  actividadId: string
  config: ConfigTarea
  nivelAyuda: number
  items: number
  guardar: boolean
}

interface Resumen {
  parcial: boolean
  porTiempo: boolean
  repaso: ResumenBloque | null
  objetivo: ResumenBloque | null
  cierre: ResumenBloque | null
  cambios: string[]
  siguiente: PlanDeHoy
}

const NOMBRE_BLOQUE: Record<Bloque, string> = { repaso: 'Repaso', objetivo: 'Objetivo', cierre: 'Cierre' }

function specDe(bloque: Bloque, plan: PlanSesion): Spec {
  if (bloque === 'repaso' && plan.repaso) {
    return { actividadId: plan.repaso.actividadId, config: plan.repaso.config, nivelAyuda: 0, items: ITEMS.repaso, guardar: true }
  }
  if (bloque === 'cierre') {
    // Acierto seguro: la serie más fácil y con el audio dos veces. No se
    // guarda ni cuenta para avanzar; es para acabar bien.
    return { actividadId: 'memoria-series', config: { n: 2 }, nivelAyuda: 2, items: ITEMS.cierre, guardar: false }
  }
  return { actividadId: plan.tarea.actividadId, config: plan.tarea.config, nivelAyuda: plan.nivelAyuda, items: ITEMS.objetivo, guardar: true }
}

/**
 * Qué frases usa OrdenarFrase. Nivel 1 (y la ayuda) → las frases de 3
 * palabras; niveles 2-4 → las de dibujo, algo más largas. Provisional hasta
 * tener frases propias para cada nivel.
 */
function frasesOrdenar(juego: number | undefined, nivelAyuda: number) {
  return nivelAyuda > 0 || !juego || juego <= 1 ? FRASES_DESORDENADAS : LEXICO_ACT2
}

function notaLanzada(spec: Spec) {
  switch (entradaDe(spec.actividadId)?.lanzador) {
    case 'jugar': return 'Se abre la actividad de siempre, con sus 10 rondas.'
    case 'ordenar-frase': return `Se abre «Ordena la frase» con ${frasesOrdenar(spec.config.juego, spec.nivelAyuda).length} frases.`
    case 'emparejar-oracion': return 'Se abre «Frase y dibujo» completa: 12 frases en grupos de 4.'
    default: return null
  }
}


function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function resumenDeSesion(s: Sesion | null, parcial: boolean): ResultadoBloque {
  return {
    aciertos: s ? s.resultados.filter((r) => r.acierto).length : 0,
    total: s ? s.resultados.length : 0,
    parcial,
    sesionId: s?.id ?? null,
  }
}

function Chip({ children, fondo = 'var(--cera-coral)' }: { children: ReactNode; fondo?: string }) {
  return (
    <span className="mano text-xs font-normal ml-2 px-2 py-0.5 rounded-full align-middle text-white" style={{ background: fondo }}>
      {children}
    </span>
  )
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="crayon p-4 text-left" style={{ background: 'var(--papel-2)' }}>
      <h2 className="mano text-sm mb-1" style={{ color: 'var(--cera-lila)' }}>{titulo}</h2>
      {children}
    </section>
  )
}

function BotonesRuta({ onPanel, onJuegos }: { onPanel: () => void; onJuegos: () => void }) {
  return (
    <>
      <button onClick={onJuegos} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
        🔍 Juegos
      </button>
      <button onClick={onPanel} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
        📋 Panel
      </button>
    </>
  )
}

function VersionOral({ parada }: { parada: Parada }) {
  return (
    <details className="crayon p-3 text-left" style={{ background: 'var(--papel)' }}>
      <summary className="mano text-base cursor-pointer">Para hacerlo sin pantalla (versión oral)</summary>
      <ul className="mano text-sm mt-2 flex flex-col gap-1 list-disc pl-5">
        {parada.versionOral.map((v) => <li key={v}>{v}</li>)}
      </ul>
    </details>
  )
}

interface Props {
  paciente: Paciente
  onPanel: () => void
  onJuegos: () => void
  onSalir: () => void
}

export default function SesionHoy({ paciente, onPanel, onJuegos, onSalir }: Props) {
  // El plan se fija al abrir: lo que se juega es lo que se ha anunciado.
  const [inicial] = useState(() => {
    const estado = cargarEstado(paciente.id)
    return { estado, plan: planDeHoy(estado) }
  })
  const plan = inicial.plan
  const [fase, setFase] = useState<Fase>('inicio')
  const [corte, setCorte] = useState<Corte>(null)
  const [tiempoCumplido, setTiempoCumplido] = useState(false)
  const [transcurrido, setTranscurrido] = useState(0)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  // Refs: los onFin llegan desde temporizadores de las actividades, con el
  // render de entonces; el estado de React podría estar desfasado.
  const corteRef = useRef<Corte>(null)
  const tiempoRef = useRef(false)
  const inicio = useRef(0)
  const inicioBloque = useRef(0)
  const cerrada = useRef(false)
  const acumulado = useRef({
    repaso: null as ResumenBloque | null,
    objetivo: null as ResumenBloque | null,
    cierre: null as ResumenBloque | null,
    parcial: false,
    sesionIds: [] as string[],
  })

  const contexto = { patientId: paciente.id }

  // Se llega desde abajo de Mundo 1: sin esto cada pantalla se abre a media altura.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [fase])
  const enBloque = fase === 'repaso' || fase === 'objetivo' || fase === 'cierre'

  useEffect(() => {
    if (!enBloque) return
    const tic = () => setTranscurrido(Date.now() - inicio.current)
    tic()
    const id = window.setInterval(tic, 1000)
    return () => window.clearInterval(id)
  }, [enBloque])

  useEffect(() => {
    if (!enBloque || tiempoRef.current || transcurrido < LIMITE_MS || plan.tipo !== 'sesion') return
    tiempoRef.current = true
    setTiempoCumplido(true)
    if (entradaDe(specDe(fase, plan).actividadId)?.lanzador === 'ruta') cortar('tiempo')
  }, [transcurrido])

  if (plan.tipo !== 'sesion') {
    return <SinSesion plan={plan} paciente={paciente} onPanel={onPanel} onJuegos={onJuegos} onSalir={onSalir} />
  }
  const planSesion = plan

  function cortar(motivo: Exclude<Corte, null>) {
    if (corteRef.current) return
    corteRef.current = motivo
    setCorte(motivo)
  }

  function iniciarBloque(b: Bloque) {
    inicioBloque.current = Date.now()
    const spec = specDe(b, planSesion)
    registrarEventoUso('actividad_iniciada', {
      actividadId: spec.actividadId, origen: 'ruta', bloque: b, paradaId: planSesion.parada.id,
    }, contexto)
    setFase(b)
  }

  function empezar() {
    inicio.current = Date.now()
    iniciarBloque(planSesion.repaso ? 'repaso' : 'objetivo')
  }

  function terminarBloque(b: Bloque, r: ResultadoBloque) {
    const spec = specDe(b, planSesion)
    const acc = acumulado.current
    if (r.sesionId) acc.sesionIds.push(r.sesionId)
    // «A medias» se refiere a la tarea del día: cortar el cierre no la estropea.
    if (r.parcial && b !== 'cierre') acc.parcial = true
    acc[b] = { actividadId: spec.actividadId, aciertos: r.aciertos, total: r.total }

    const detalle = {
      actividadId: spec.actividadId, origen: 'ruta', bloque: b, paradaId: planSesion.parada.id,
      aciertos: r.aciertos, total: r.total,
    }
    // Las que guardan sesión ya avisan del abandono por su cuenta.
    if (!r.parcial) registrarEventoUso('actividad_terminada', detalle, contexto)
    else if (!spec.guardar || entradaDe(spec.actividadId)?.dominio === null) registrarEventoUso('actividad_abandonada', detalle, contexto)

    const seguir = !r.parcial && !corteRef.current && !tiempoRef.current
    if (seguir && b === 'repaso') iniciarBloque('objetivo')
    else if (seguir && b === 'objetivo') iniciarBloque('cierre')
    else cerrarSesion()
  }

  function cerrarSesion() {
    if (cerrada.current) return
    cerrada.current = true
    const acc = acumulado.current
    const ahora = Date.now()
    const { estado, cambios } = registrarSesion(inicial.estado, planSesion, {
      id: uid(),
      fecha: ahora,
      duracionMs: ahora - inicio.current,
      parcial: acc.parcial || !acc.objetivo,
      objetivo: { aciertos: acc.objetivo?.aciertos ?? 0, total: acc.objetivo?.total ?? 0 },
      repaso: acc.repaso,
      cierre: acc.cierre,
      sesionIds: acc.sesionIds,
    })
    guardarEstado(paciente.id, estado)
    const parcial = acc.parcial || !acc.objetivo
    setResumen({
      parcial, porTiempo: tiempoRef.current,
      repaso: acc.repaso, objetivo: acc.objetivo, cierre: acc.cierre,
      cambios, siguiente: planDeHoy(estado),
    })
    setFase('fin')
    if (!parcial) locutar([CONSIGNAS.muyBien])
  }

  /**
   * Las actividades lanzadas ya guardaron lo jugado antes de avisar: se
   * recupera de ahí. Se descartan las sesiones ya contadas en otro bloque para
   * no atribuirle a este lo que se jugó en el anterior.
   */
  function salirDeLanzada(b: Bloque) {
    cortar(tiempoRef.current ? 'tiempo' : 'salir')
    const contadas = acumulado.current.sesionIds
    const propias = getSesiones(paciente.id)
      .filter((s) => s.inicio >= inicioBloque.current - 1000 && !contadas.includes(s.id))
    terminarBloque(b, resumenDeSesion(propias.length ? propias[propias.length - 1] : null, true))
  }

  // ── Pantalla de inicio ────────────────────────────────────────────────────
  if (fase === 'inicio') {
    const { parada, tarea } = planSesion
    const entrada = entradaDe(tarea.actividadId)
    const objetivo = specDe('objetivo', planSesion)
    const nota = notaLanzada(objetivo)
    const repasoEntrada = planSesion.repaso ? entradaDe(planSesion.repaso.actividadId) : undefined
    return (
      <div className="papel min-h-full text-[var(--tinta)]">
        <NavBar titulo={`Ruta · ${paciente.nombre}`} onVolver={onSalir} feedbackActividad="ruta" feedbackItem={`parada ${parada.numero} · inicio`}>
          <BotonesRuta onPanel={onPanel} onJuegos={onJuegos} />
        </NavBar>
        <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
          <div className="text-center">
            <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
              Sesión de hoy<Chip>BORRADOR</Chip>
            </span>
            <h1 className="mano text-4xl mt-1">Parada {parada.numero} · {parada.nombre}</h1>
            <p className="mano text-base mt-2" style={{ opacity: 0.75 }}>{parada.objetivo}</p>
          </div>

          <Tarjeta titulo="1 · Repaso · 1–2 min">
            {planSesion.repaso && repasoEntrada ? (
              <p className="mano text-base">{repasoEntrada.emoji} {repasoEntrada.titulo} · {ITEMS.repaso} ítems de lo ya dominado</p>
            ) : (
              <p className="mano text-base" style={{ opacity: 0.75 }}>
                {planSesion.repasoOmitido ? `Hoy sin repaso: ${planSesion.repasoOmitido}.` : 'Sin repaso: es la primera parada de la Ruta.'}
              </p>
            )}
          </Tarjeta>

          <Tarjeta titulo={`2 · Objetivo · 4–6 min · tarea ${tarea.num} de ${parada.tareas.length}`}>
            <p className="mano text-xl">
              {entrada?.emoji} {entrada?.titulo}
              <Chip fondo={tarea.modo === 'acompanada' ? 'var(--cera-lila)' : 'var(--cera-verde)'}>
                {tarea.modo === 'acompanada' ? 'Acompañada: tú valoras con ✓/✗' : 'Solo: la app corrige'}
              </Chip>
            </p>
            <p className="mano text-sm mt-1" style={{ opacity: 0.75 }}>{tarea.parametros}</p>
            {nota && <p className="mano text-sm mt-1">{nota}</p>}
            {planSesion.nivelAyuda > 0 && (
              <p className="mano text-sm mt-2 crayon px-3 py-2" style={{ background: 'var(--cera-mostaza)' }}>
                Con más ayuda (nivel {planSesion.nivelAyuda}) porque le ha costado dos sesiones seguidas:{' '}
                {tarea.ayuda}.
                {entrada?.lanzador !== 'ruta' && ' Esta actividad todavía no la aplica sola: dásela tú.'}
              </p>
            )}
          </Tarjeta>

          <Tarjeta titulo="3 · Cierre · 1 min">
            <p className="mano text-base">👂 {ITEMS.cierre} series fáciles para acabar con un acierto. No cuentan para avanzar.</p>
          </Tarjeta>

          <button onClick={empezar} className="crayon mano mt-2 px-6 py-4 text-2xl text-white active:scale-95"
            style={{ background: 'var(--cera-verde)' }}>
            ▶ Empezar
          </button>
          <p className="mano text-sm text-center" style={{ opacity: 0.65 }}>
            Unos 5–10 minutos. A los 10 se corta sola y lo hecho se guarda.
          </p>
          <VersionOral parada={parada} />
        </main>
      </div>
    )
  }

  // ── Pantalla final ────────────────────────────────────────────────────────
  if (fase === 'fin' && resumen) {
    const fila = (nombre: string, r: ResumenBloque | null) => {
      if (!r) return null
      const e = entradaDe(r.actividadId)
      return (
        <li key={nombre} className="mano text-lg">
          {nombre}: {e?.emoji} {e?.titulo} ·{' '}
          {r.total > 0 ? `${r.aciertos}/${r.total} (${Math.round(porcentaje(r.aciertos, r.total) * 100)} %)` : 'sin ítems jugados'}
        </li>
      )
    }
    const sig = resumen.siguiente
    const sinJugar = !resumen.objetivo || resumen.objetivo.total === 0
    return (
      <div className="papel min-h-full text-[var(--tinta)]">
        <NavBar titulo={`Ruta · ${paciente.nombre}`} onVolver={onSalir} feedbackActividad="ruta" feedbackItem={`parada ${planSesion.parada.numero} · fin`} />
        <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4 text-center">
          <h1 className="mano text-4xl">{resumen.parcial ? 'Sesión guardada a medias' : '¡Sesión terminada!'}</h1>
          {resumen.porTiempo && <p className="mano text-base">Se ha cortado a los 10 minutos.</p>}
          <Tarjeta titulo="Hoy">
            <ul className="flex flex-col gap-1">
              {fila('Repaso', resumen.repaso)}
              {fila('Objetivo', resumen.objetivo)}
              {fila('Cierre', resumen.cierre)}
              {!resumen.objetivo && <li className="mano text-base">No se llegó a la tarea del día.</li>}
            </ul>
          </Tarjeta>
          <Tarjeta titulo="Qué cambia en la Ruta">
            {resumen.cambios.length ? (
              <ul className="mano text-base flex flex-col gap-1 list-disc pl-5">
                {resumen.cambios.map((c) => <li key={c}>{c}</li>)}
              </ul>
            ) : (
              <p className="mano text-base">
                {sinJugar
                  ? 'No se jugó la tarea del día: la próxima sesión la repite.'
                  : 'Nada todavía: hacen falta 2 sesiones seguidas para decidir.'}
              </p>
            )}
            {sig.tipo === 'sesion' && (
              <p className="mano text-sm mt-2" style={{ opacity: 0.75 }}>
                Próxima sesión: parada {sig.parada.numero}, tarea {sig.tarea.num} ({entradaDe(sig.tarea.actividadId)?.titulo}).
              </p>
            )}
            {sig.tipo === 'bloqueado' && (
              <p className="mano text-sm mt-2">Próxima sesión: la parada {sig.parada.numero} aún no se puede jugar (falta {sig.faltan.join(', ')}).</p>
            )}
          </Tarjeta>
          <div className="flex justify-center gap-3">
            <button onClick={onPanel} className="crayon mano px-5 py-2 text-lg" style={{ background: 'var(--papel-2)' }}>📋 Panel</button>
            <button onClick={onSalir} className="crayon mano px-5 py-2 text-lg text-white" style={{ background: 'var(--cera-azul)' }}>Volver</button>
          </div>
        </main>
      </div>
    )
  }

  // ── Bloques ───────────────────────────────────────────────────────────────
  if (!enBloque) return null
  const bloque = fase
  const spec = specDe(bloque, planSesion)
  const entrada = entradaDe(spec.actividadId)
  const onFinish = (s: Sesion) => terminarBloque(bloque, resumenDeSesion(s, false))
  const onSalirLanzada = () => salirDeLanzada(bloque)
  const pasos: Bloque[] = planSesion.repaso ? ['repaso', 'objetivo', 'cierre'] : ['objetivo', 'cierre']

  if (entrada?.lanzador === 'ruta') {
    return (
      <BloqueRuta
        key={bloque}
        actividadId={spec.actividadId}
        bloque={{
          pacienteId: paciente.id,
          items: spec.items,
          nivelAyuda: spec.nivelAyuda,
          config: spec.config,
          guardar: spec.guardar,
          corte,
          onFin: (r: ResultadoBloque) => terminarBloque(bloque, r),
        }}
        textoSalir="← Salir y guardar"
        onSalir={() => cortar('salir')}
        feedbackItem={`parada ${planSesion.parada.numero} · ${bloque} · ${spec.actividadId}`}
        cabecera={
          <>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {pasos.map((p) => (
                <span key={p} className="mano text-sm px-2 py-0.5 rounded-full"
                  style={{ background: p === bloque ? 'var(--cera-lila)' : 'var(--papel-2)', color: p === bloque ? '#fff' : 'var(--tinta)' }}>
                  {NOMBRE_BLOQUE[p]}
                </span>
              ))}
            </div>
            <span className="mano text-lg tabular-nums" style={{ color: tiempoCumplido ? 'var(--cera-coral)' : 'var(--cera-lila)' }}>
              ⏱ {mmss(transcurrido)} / 10:00
            </span>
          </>
        }
      />
    )
  }

  let lanzada: ReactNode = null
  if (entrada?.lanzador === 'jugar') {
    const actividad = getActividad(spec.actividadId)
    if (actividad) {
      lanzada = <JugarActividad key={bloque} actividad={actividad} pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalirLanzada} cortar={tiempoCumplido} />
    }
  } else if (entrada?.lanzador === 'ordenar-frase') {
    lanzada = (
      <OrdenarFrase key={bloque} pacienteId={paciente.id} fuente={frasesOrdenar(spec.config.juego, spec.nivelAyuda)}
        onFinish={onFinish} onSalir={onSalirLanzada} cortar={tiempoCumplido} />
    )
  } else if (entrada?.lanzador === 'emparejar-oracion') {
    lanzada = <EmparejarOracion key={bloque} pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalirLanzada} cortar={tiempoCumplido} />
  }

  return (
    <>
      {lanzada ?? (
        <div className="papel min-h-full p-6 mano text-lg text-[var(--tinta)]">
          «{spec.actividadId}» no se puede abrir desde la Ruta.
          <button onClick={() => cortar('salir')} className="crayon mano ml-3 px-4 py-1.5" style={{ background: 'var(--papel-2)' }}>Salir</button>
        </div>
      )}
      {/* Sobre la actividad lanzada: sin esto no se sabe que sigue siendo la Ruta ni cuánto queda. */}
      <div className="fixed bottom-4 left-16 z-40 crayon mano px-3 py-1.5 text-sm print:hidden"
        style={{ background: tiempoCumplido ? 'var(--cera-coral)' : 'var(--papel-2)', color: tiempoCumplido ? '#fff' : 'var(--tinta)' }}>
        🧭 Ruta · parada {planSesion.parada.numero} · {NOMBRE_BLOQUE[bloque]} · ⏱ {mmss(transcurrido)}
        {tiempoCumplido && ' · 10 min: se cierra'}
      </div>
    </>
  )
}

function SinSesion({ plan, paciente, onPanel, onJuegos, onSalir }: {
  plan: Exclude<PlanDeHoy, PlanSesion>
  paciente: Paciente
  onPanel: () => void
  onJuegos: () => void
  onSalir: () => void
}) {
  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <NavBar titulo={`Ruta · ${paciente.nombre}`} onVolver={onSalir} feedbackActividad="ruta" feedbackItem={plan.tipo}>
        <BotonesRuta onPanel={onPanel} onJuegos={onJuegos} />
      </NavBar>
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {plan.tipo === 'terminada' ? (
          <div className="text-center">
            <h1 className="mano text-4xl">Ruta de 3 años completada</h1>
            <p className="mano text-base mt-2">Los 8 paradas están dominados. La evaluación final del nivel todavía no está construida.</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Parada {plan.parada.numero} · {plan.parada.nombre}</span>
              <h1 className="mano text-4xl mt-1">La Ruta está parada aquí</h1>
            </div>
            <Tarjeta titulo="Por qué">
              <p className="mano text-base">
                Este parada necesita {plan.faltan.map((id) => `«${entradaDe(id)?.titulo ?? id}»`).join(', ')}, que todavía no
                está construida. La Ruta no se salta paradas ni cambia el orden: cuando exista, seguirá desde aquí.
              </p>
            </Tarjeta>
            <Tarjeta titulo="Mientras tanto, en oral y sin pantalla">
              <ul className="mano text-base flex flex-col gap-1 list-disc pl-5">
                {plan.parada.versionOral.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </Tarjeta>
          </>
        )}
        <div className="flex justify-center gap-3">
          <button onClick={onPanel} className="crayon mano px-5 py-2 text-lg" style={{ background: 'var(--papel-2)' }}>📋 Panel</button>
          <button onClick={onSalir} className="crayon mano px-5 py-2 text-lg text-white" style={{ background: 'var(--cera-azul)' }}>Volver</button>
        </div>
      </main>
    </div>
  )
}
