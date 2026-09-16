import { useEffect, useRef, useState } from 'react'
import { useSesion } from '../../lib/useSesion'
import { decirPalabra } from '../../lib/pronunciacion'
import { barajar } from '../../data/palabras'
import { CONSIGNAS, duracionEstimadaMs, locutar } from '../locucion'
import { PALABRAS_MEMORIA, imagenDe } from '../vocabulario'
import type { PropsBloque } from '../tipos'

/**
 * ¿Cuál falta? y ¿Cuál se ha añadido?: se ve y se oye un grupo de palabras,
 * se tapa y vuelve con una de menos o una de más.
 *
 * - Falta: el grupo vuelve con un hueco; se elige la que falta entre tres
 *   dibujos (la que falta y dos que no estaban).
 * - Añadida: el grupo vuelve con una palabra nueva colada; se toca esa.
 *
 * Tamaño del grupo: config.n al empezar y config.nFinal en la segunda mitad.
 * Ayuda: nivel 1 → el grupo no crece · nivel 2 → además se nombra dos veces.
 * Tras un fallo no se vuelve a enseñar el grupo (sería regalar la respuesta);
 * el botón «Ver otra vez» lo repite y cuenta como ayuda.
 */

type Modo = 'falta' | 'anadida'
type Fase = 'mira' | 'tapado' | 'responde' | 'error' | 'bien' | 'mal'

const INTENTOS_MAX = 3
const TAPADO_MS = 1200

interface Item {
  grupo: string[]
  /** Falta: índice que se quita. Añadida: índice donde entra la nueva en `final`. */
  posicion: number
  /** Falta: la que se quita. Añadida: la nueva. */
  clave: string
  /** Lo que se ve al responder: el grupo con hueco (null) o con la nueva dentro. */
  final: (string | null)[]
  /** Falta: dibujos entre los que elegir. */
  opciones: string[]
}

function tamanoDe(indice: number, items: number, config: PropsBloque['config'], nivelAyuda: number) {
  const n = config.n ?? 3
  if (!config.nFinal || nivelAyuda > 0) return n
  return indice < Math.ceil(items / 2) ? n : config.nFinal
}

function crearItem(modo: Modo, n: number, anterior: string[]): Item {
  // Evita repetir palabras del ítem anterior: con grupos tan cortos se confunden.
  const disponibles = barajar(PALABRAS_MEMORIA.filter((p) => !anterior.includes(p)))
  const grupo = disponibles.slice(0, n)
  const resto = disponibles.slice(n)
  if (modo === 'falta') {
    const posicion = Math.floor(Math.random() * n)
    const clave = grupo[posicion]
    return {
      grupo, posicion, clave,
      final: grupo.map((p, i) => (i === posicion ? null : p)),
      opciones: barajar([clave, ...resto.slice(0, 2)]),
    }
  }
  const clave = resto[0]
  const posicion = Math.floor(Math.random() * (n + 1))
  const final = [...grupo.slice(0, posicion), clave, ...grupo.slice(posicion)]
  return { grupo, posicion, clave, final, opciones: [] }
}

const FONDO = {
  normal: 'var(--papel-2)',
  bien: 'var(--cera-verde)',
  mal: 'var(--cera-mostaza)',
  elegida: 'var(--cera-coral)',
}

function Carta({ palabra, fondo, onClick, desactivada = false, oculta = false }: {
  palabra: string | null
  fondo: string
  onClick?: () => void
  desactivada?: boolean
  oculta?: boolean
}) {
  const contenido = palabra && !oculta ? (
    <>
      <span className="text-4xl sm:text-5xl leading-none">{imagenDe(palabra)}</span>
      <span className="mano text-sm leading-none">{palabra.toLocaleLowerCase('es-ES')}</span>
    </>
  ) : (
    <span className="mano text-4xl" style={{ opacity: 0.45 }}>?</span>
  )
  const clase = 'crayon w-16 h-20 sm:w-24 sm:h-28 flex flex-col items-center justify-center gap-1'
  if (!onClick) {
    return <div className={clase} style={{ background: fondo, borderStyle: palabra ? 'solid' : 'dashed' }}>{contenido}</div>
  }
  return (
    <button onClick={onClick} disabled={desactivada} aria-label={palabra ? palabra.toLocaleLowerCase('es-ES') : 'hueco'}
      className={`${clase} active:scale-95 transition-transform`} style={{ background: fondo, opacity: desactivada ? 0.6 : 1 }}>
      {contenido}
    </button>
  )
}

export function MemoriaGrupo({ modo, pacienteId, items, nivelAyuda, config, guardar, corte, onFin }: PropsBloque & { modo: Modo }) {
  const actividadId = modo === 'falta' ? 'memoria-quitado' : 'memoria-anadido'
  const sesion = useSesion(pacienteId, actividadId, 'lexica')
  const [indice, setIndice] = useState(0)
  const [item, setItem] = useState<Item>(() => crearItem(modo, tamanoDe(0, items, config, nivelAyuda), []))
  const [fase, setFase] = useState<Fase>('mira')
  const [intentos, setIntentos] = useState(1)
  const [ayudaUsada, setAyudaUsada] = useState(false)
  const [descartadas, setDescartadas] = useState<string[]>([])
  const [temblor, setTemblor] = useState(false)
  const cuenta = useRef({ aciertos: 0, total: 0 })
  const ocupado = useRef(true)
  const terminado = useRef(false)
  const inicioRespuesta = useRef(Date.now())
  const temporizadores = useRef<number[]>([])

  function programar(fn: () => void, ms: number) {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }
  function limpiar() {
    temporizadores.current.forEach((id) => window.clearTimeout(id))
    temporizadores.current = []
  }
  useEffect(() => limpiar, [])

  function presentar(it: Item) {
    limpiar()
    ocupado.current = true
    setFase('mira')
    const partes = [CONSIGNAS.escuchaPalabras, ...it.grupo.map(decirPalabra)]
    locutar(partes)
    let espera = duracionEstimadaMs(partes) + 900
    if (nivelAyuda >= 2) {
      const otraVez = it.grupo.map(decirPalabra)
      programar(() => locutar(otraVez), espera)
      espera += duracionEstimadaMs(otraVez) + 600
    }
    programar(() => setFase('tapado'), espera)
    programar(() => {
      setFase('responde')
      ocupado.current = false
      inicioRespuesta.current = Date.now()
      locutar([modo === 'falta' ? CONSIGNAS.cualFalta : CONSIGNAS.cualNueva])
    }, espera + TAPADO_MS)
  }

  // Enganchado al índice: cada ítem nuevo se presenta una vez.
  useEffect(() => {
    const id = window.setTimeout(() => presentar(item), 500)
    return () => window.clearTimeout(id)
  }, [indice])

  useEffect(() => {
    if (corte) terminar(true)
  }, [corte])

  function terminar(parcial: boolean) {
    if (terminado.current) return
    terminado.current = true
    limpiar()
    const { aciertos, total } = cuenta.current
    let sesionId: string | null = null
    if (guardar) {
      const s = parcial ? sesion.abandonar(items) : total ? sesion.finalizar() : null
      sesionId = s?.id ?? null
    }
    onFin({ aciertos, total, parcial, sesionId })
  }

  function apuntar(acierto: boolean, elegida: string) {
    cuenta.current.total += 1
    if (acierto) cuenta.current.aciertos += 1
    if (!guardar) return
    sesion.registrar({
      acierto,
      intentos,
      ayudaUsada,
      tiempoMs: Date.now() - inicioRespuesta.current,
      dificultad: item.grupo.length,
      ...(acierto ? {} : { itemSeleccionadoId: elegida }),
    })
  }

  function siguiente() {
    if (terminado.current) return
    if (indice + 1 >= items) {
      terminar(false)
      return
    }
    const i = indice + 1
    setIntentos(1)
    setAyudaUsada(false)
    setDescartadas([])
    setItem(crearItem(modo, tamanoDe(i, items, config, nivelAyuda), [...item.grupo, item.clave]))
    setIndice(i)
  }

  function elegir(palabra: string) {
    if (ocupado.current) return
    ocupado.current = true
    if (palabra === item.clave) {
      setFase('bien')
      locutar([CONSIGNAS.muyBien])
      apuntar(true, palabra)
      programar(siguiente, 1400)
      return
    }
    setTemblor(true)
    programar(() => setTemblor(false), 400)
    if (intentos >= INTENTOS_MAX) {
      setFase('mal')
      apuntar(false, palabra)
      locutar([decirPalabra(item.clave)])
      programar(siguiente, 2600)
      return
    }
    setFase('error')
    setIntentos(intentos + 1)
    setDescartadas((d) => [...d, palabra])
    locutar([CONSIGNAS.otraVez])
    programar(() => {
      setFase('responde')
      ocupado.current = false
    }, 1000)
  }

  function verOtraVez() {
    if (fase !== 'responde' && fase !== 'error') return
    setAyudaUsada(true)
    presentar(item)
  }

  const respondiendo = fase === 'responde' || fase === 'error'
  const resuelto = fase === 'bien' || fase === 'mal'
  const titulo = {
    mira: 'Mira y escucha',
    tapado: '¡Se tapan!',
    responde: modo === 'falta' ? '¿Cuál falta?' : '¿Cuál es la nueva?',
    error: 'Inténtalo otra vez',
    bien: '¡Muy bien!',
    mal: modo === 'falta' ? 'Faltaba esta' : 'La nueva era esta',
  }[fase]

  const fondoClave = fase === 'bien' ? FONDO.bien : FONDO.mal
  const fila: { palabra: string | null; fondo: string; oculta: boolean; clicable: boolean }[] =
    fase === 'mira'
      ? item.grupo.map((p) => ({ palabra: p, fondo: FONDO.normal, oculta: false, clicable: false }))
      : fase === 'tapado'
        ? (modo === 'falta' ? item.grupo : item.final).map((p) => ({ palabra: p, fondo: FONDO.normal, oculta: true, clicable: false }))
        : item.final.map((p, i) => {
            const esClave = modo === 'falta' ? i === item.posicion : p === item.clave
            const palabra = modo === 'falta' && esClave && resuelto ? item.clave : p
            return {
              palabra,
              fondo: resuelto && esClave ? fondoClave : p && descartadas.includes(p) ? FONDO.elegida : FONDO.normal,
              oculta: false,
              clicable: modo === 'anadida' && !!p,
            }
          })

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl text-center">
      <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
        {modo === 'falta' ? '🙈 ¿Cuál falta?' : '➕ ¿Cuál se ha añadido?'} · grupo de {item.grupo.length} · {indice + 1}/{items}
      </span>
      <h1 className="mano text-3xl sm:text-4xl min-h-10 sm:min-h-12">{titulo}</h1>

      <div className={`flex flex-wrap justify-center gap-2 sm:gap-3 min-h-24 sm:min-h-32 ${temblor && modo === 'anadida' ? 'animate-shake' : ''}`}>
        {fila.map((c, i) => (
          <Carta key={`${indice}-${fase === 'mira' ? 'g' : 'f'}-${i}`} palabra={c.palabra} fondo={c.fondo} oculta={c.oculta}
            onClick={c.clicable && c.palabra ? () => elegir(c.palabra!) : undefined}
            desactivada={!respondiendo || (c.palabra ? descartadas.includes(c.palabra) : true)} />
        ))}
      </div>

      {modo === 'falta' && (
        <div className={`flex justify-center gap-3 min-h-24 sm:min-h-32 ${temblor ? 'animate-shake' : ''}`}>
          {(respondiendo || resuelto) && item.opciones.map((p) => (
            <Carta key={`${indice}-o-${p}`} palabra={p}
              fondo={resuelto && p === item.clave ? fondoClave : descartadas.includes(p) ? FONDO.elegida : '#fff'}
              onClick={() => elegir(p)} desactivada={!respondiendo || descartadas.includes(p)} />
          ))}
        </div>
      )}

      <button onClick={verOtraVez} disabled={!respondiendo}
        className="crayon mano px-5 py-2 text-lg disabled:opacity-40" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
        👀 Ver otra vez
      </button>
      <p className="mano text-sm" style={{ opacity: 0.6 }}>Intento {intentos}/{INTENTOS_MAX}</p>
    </div>
  )
}

export function MemoriaFalta(props: PropsBloque) {
  return <MemoriaGrupo modo="falta" {...props} />
}

export function MemoriaAnadida(props: PropsBloque) {
  return <MemoriaGrupo modo="anadida" {...props} />
}
