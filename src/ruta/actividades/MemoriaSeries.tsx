import { useEffect, useRef, useState } from 'react'
import { useSesion } from '../../lib/useSesion'
import { decirPalabra } from '../../lib/pronunciacion'
import { ColaNoRepetida, barajar } from '../../data/palabras'
import { CONSIGNAS, duracionEstimadaMs, locutar } from '../locucion'
import { PALABRAS_MEMORIA, imagenDe } from '../vocabulario'
import type { PropsBloque } from '../tipos'

/**
 * Recuerda la serie: oír N palabras y tocarlas en el mismo orden.
 *
 * Los dibujos no se enseñan mientras suena la serie: si estuvieran a la vista
 * sería emparejar imágenes, no recordar lo oído.
 *
 * Niveles 1 → 4: cada nivel añade dibujos entre los que elegir. Es una
 * propuesta para validar.
 *
 * Ayuda: nivel de ayuda 1 → la serie suena dos veces · nivel de ayuda 2 →
 * además, todo en el nivel 1.
 */

const INTENTOS_MAX = 3
/** Dibujos que se añaden a las N palabras en cada nivel (índice = nivel 1..4). */
const EXTRA_POR_SERIE = [0, 0, 1, 2, 3]

interface Item {
  serie: number
  palabras: string[]
  opciones: string[]
}

type Fase = 'escucha' | 'responde' | 'error' | 'bien' | 'mal'

const cola = new ColaNoRepetida(PALABRAS_MEMORIA)

function serieDe(indice: number, items: number, nivelAyuda: number) {
  if (nivelAyuda >= 2) return 1
  return Math.min(4, 1 + Math.floor((indice * 4) / Math.max(items, 1)))
}

function crearItem(serie: number, n: number): Item {
  const palabras: string[] = []
  while (palabras.length < n) {
    const p = cola.siguiente()
    if (!palabras.includes(p)) palabras.push(p)
  }
  const extra = barajar(PALABRAS_MEMORIA.filter((p) => !palabras.includes(p))).slice(0, EXTRA_POR_SERIE[serie])
  return { serie, palabras, opciones: barajar([...palabras, ...extra]) }
}

export default function MemoriaSeries({ pacienteId, items, nivelAyuda, config, guardar, corte, onFin }: PropsBloque) {
  const n = config.n ?? 2
  const sesion = useSesion(pacienteId, 'memoria-series', 'lexica')
  const [indice, setIndice] = useState(0)
  const [item, setItem] = useState<Item>(() => crearItem(serieDe(0, items, nivelAyuda), n))
  const [fase, setFase] = useState<Fase>('escucha')
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [intentos, setIntentos] = useState(1)
  const [ayudaUsada, setAyudaUsada] = useState(false)
  const [temblor, setTemblor] = useState(false)
  const cuenta = useRef({ aciertos: 0, total: 0 })
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

  function escuchar(it: Item) {
    limpiar()
    setFase('escucha')
    setSeleccion([])
    const partes = [CONSIGNAS.escuchaPalabras, ...it.palabras.map(decirPalabra)]
    const dura = duracionEstimadaMs(partes)
    locutar(partes)
    let espera = dura + 400
    if (nivelAyuda >= 1) {
      const otraVez = it.palabras.map(decirPalabra)
      programar(() => locutar(otraVez), dura + 700)
      espera = dura + 700 + duracionEstimadaMs(otraVez) + 400
    }
    programar(() => {
      setFase('responde')
      inicioRespuesta.current = Date.now()
      locutar([CONSIGNAS.tocaEnOrden])
    }, Math.max(espera, 1500))
  }

  useEffect(() => {
    const id = window.setTimeout(() => escuchar(item), 500)
    return () => window.clearTimeout(id)
  }, [item])

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

  function apuntar(acierto: boolean, orden: string[]) {
    cuenta.current.total += 1
    if (acierto) cuenta.current.aciertos += 1
    if (!guardar) return
    sesion.registrar({
      acierto,
      intentos,
      ayudaUsada,
      tiempoMs: Date.now() - inicioRespuesta.current,
      dificultad: item.serie,
      ...(acierto ? {} : { itemSeleccionadoId: orden.join('-') }),
    })
  }

  function siguiente() {
    if (terminado.current) return
    if (indice + 1 >= items) {
      terminar(false)
      return
    }
    const i = indice + 1
    setIndice(i)
    setFase('escucha')
    setSeleccion([])
    setIntentos(1)
    setAyudaUsada(false)
    setItem(crearItem(serieDe(i, items, nivelAyuda), n))
  }

  function comprobar(orden: string[]) {
    if (orden.every((p, i) => p === item.palabras[i])) {
      setFase('bien')
      locutar([CONSIGNAS.muyBien])
      apuntar(true, orden)
      programar(siguiente, 1100)
      return
    }
    setTemblor(true)
    programar(() => setTemblor(false), 400)
    if (intentos >= INTENTOS_MAX) {
      setFase('mal')
      apuntar(false, orden)
      programar(siguiente, 2400)
      return
    }
    // Tras un fallo la serie se vuelve a oír: sin eso el segundo intento es adivinar.
    setFase('error')
    setIntentos(intentos + 1)
    locutar([CONSIGNAS.otraVez])
    programar(() => escuchar(item), 1400)
  }

  function tocar(p: string) {
    if (fase !== 'responde') return
    const pos = seleccion.indexOf(p)
    const nueva = pos >= 0 ? seleccion.slice(0, pos) : [...seleccion, p]
    setSeleccion(nueva)
    if (nueva.length === n) comprobar(nueva)
  }

  function repetirAudio() {
    if (fase === 'bien' || fase === 'mal') return
    setAyudaUsada(true)
    escuchar(item)
  }

  const titulo = fase === 'escucha' ? 'Escucha…' : fase === 'bien' ? '¡Muy bien!' : fase === 'mal' ? 'Era así' : fase === 'error' ? 'Inténtalo otra vez' : 'Toca los dibujos en el mismo orden'
  const fondoHueco = fase === 'bien' ? 'var(--cera-verde)' : fase === 'mal' ? 'var(--cera-mostaza)' : 'var(--papel-2)'

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full">
      <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
        👂 Recuerda la serie · nivel {item.serie} · {indice + 1}/{items}
      </span>
      <h1 className="mano text-3xl sm:text-4xl">{titulo}</h1>

      <div className="flex gap-3" aria-label="Orden elegido">
        {Array.from({ length: n }, (_, i) => {
          const p = fase === 'mal' ? item.palabras[i] : seleccion[i]
          return (
            <div key={i} className="crayon w-20 h-20 flex items-center justify-center text-5xl"
              style={{ background: fondoHueco, borderStyle: p ? 'solid' : 'dashed' }}>
              {p ? imagenDe(p) : <span className="mano text-2xl" style={{ opacity: 0.4 }}>{i + 1}</span>}
            </div>
          )
        })}
      </div>

      {fase === 'escucha' ? (
        <div className="text-8xl animate-pulse py-10" aria-hidden>👂</div>
      ) : (
        <div className={`grid gap-4 w-full max-w-xl ${item.opciones.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} ${temblor ? 'animate-shake' : ''}`}>
          {item.opciones.map((p, i) => {
            const pos = seleccion.indexOf(p)
            return (
              <button
                key={p}
                onClick={() => tocar(p)}
                disabled={fase !== 'responde'}
                aria-label={p.toLocaleLowerCase('es-ES')}
                className={`crayon ${i % 2 ? 'crayon-2' : ''} relative min-h-28 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform`}
                style={{ background: pos >= 0 ? 'var(--cera-azul)' : 'var(--papel-2)' }}
              >
                <span className="text-6xl leading-none">{imagenDe(p)}</span>
                <span className="mano text-base" style={{ opacity: 0.7 }}>{p.toLocaleLowerCase('es-ES')}</span>
                {pos >= 0 && <span className="mano absolute top-1 left-2 text-2xl text-white">{pos + 1}</span>}
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={repetirAudio}
        disabled={fase === 'bien' || fase === 'mal'}
        className="crayon mano px-5 py-2 text-lg disabled:opacity-40"
        style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}
      >
        🔊 Escuchar otra vez
      </button>
      <p className="mano text-sm" style={{ opacity: 0.6 }}>Intento {intentos}/{INTENTOS_MAX}</p>
    </div>
  )
}
