import FeedbackBtn from './FeedbackBtn'
import { useMemo, useRef, useState } from 'react'
import type { Sesion } from '../types'
import { SEGMENTACION_FONEMICA, SEGMENTACION_SILABICA, emojiDe } from '../data/guia'
import { ajustarDificultad } from '../lib/adaptacion'
import { useSesion } from '../lib/useSesion'
import { hablarLento, hablarPartes, hablarSecuencia } from '../lib/voz'
import { Refuerzo } from './Personaje'
import CommunityBadge from './CommunityBadge'

const RONDAS = 8
type Modo = 'fonema' | 'silaba'

interface Props {
  pacienteId: string
  modo?: Modo
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Item { palabra: string; piezas: string[] }

function vozPalabra(palabra: string) {
  return palabra.toLocaleLowerCase('es-ES')
}

function vozPieza(pieza: string) {
  return pieza.toLocaleLowerCase('es-ES')
}

function itemsDe(modo: Modo): Item[] {
  return modo === 'fonema'
    ? SEGMENTACION_FONEMICA.map((p) => ({ palabra: p.palabra, piezas: p.fonemas }))
    : SEGMENTACION_SILABICA.map((p) => ({ palabra: p.palabra, piezas: p.silabas }))
}

export default function Policubos({ pacienteId, modo = 'fonema', onFinish, onSalir }: Props) {
  const ITEMS = useMemo(() => itemsDe(modo), [modo])
  const unidad = modo === 'fonema' ? 'sonido' : 'sílaba'
  const unidadPl = modo === 'fonema' ? 'sonidos' : 'sílabas'
  const sesion = useSesion(pacienteId, modo === 'fonema' ? 'policubos' : 'policubos-silabico', modo === 'fonema' ? 'fonologica' : 'silabica')
  const [dificultad, setDificultad] = useState(1)
  const [indice, setIndice] = useState(0)

  function elegirPalabra(dif: number, usados: Set<string>): Item {
    const cand = ITEMS.filter((p) => !usados.has(p.palabra))
    const pool = cand.length ? cand : ITEMS
    const max = modo === 'silaba' ? (dif <= 2 ? 2 : 3) : (dif <= 1 ? 4 : 5)
    const min = modo === 'silaba' ? 1 : (dif <= 2 ? 3 : 4)
    const f = pool.filter((p) => p.piezas.length >= min && p.piezas.length <= max)
    const base = f.length ? f : pool
    return base[Math.floor(Math.random() * base.length)]
  }

  const [palabra, setPalabra] = useState<Item>(() => itemsDe(modo).find((p) => p.palabra === 'PATO')!)
  const [cubos, setCubos] = useState(0)            // cubos colocados (cuenta)
  const [revelado, setRevelado] = useState(false)  // tras comprobar OK, muestra las piezas
  const errores = useRef(0)
  const ayudaUsada = useRef(false)
  const inicioRonda = useRef(Date.now())
  const usados = useRef(new Set<string>(['PATO']))
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shake, setShake] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // ---- arrastrar/tocar para colocar cubos ----
  const lineaRef = useRef<HTMLDivElement>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const arrastrando = useRef(false)
  const movido = useRef(false)
  const pointerActivo = useRef(false)

  function addCubo() {
    if (bloqueado || revelado) return
    if (cubos >= 9) return
    setCubos((c) => c + 1)
    setMensaje('')
  }
  function quitarCubo() {
    if (bloqueado || revelado || cubos === 0) return
    setCubos((c) => c - 1)
  }

  function onPilaDown(e: React.PointerEvent) {
    if (bloqueado || revelado) return
    arrastrando.current = true
    movido.current = false
    pointerActivo.current = true
    setGhost({ x: e.clientX, y: e.clientY })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function onPilaMove(e: React.PointerEvent) {
    if (!arrastrando.current) return
    movido.current = true
    setGhost({ x: e.clientX, y: e.clientY })
  }
  function onPilaUp(e: React.PointerEvent) {
    if (!arrastrando.current) return
    arrastrando.current = false
    setGhost(null)
    const linea = lineaRef.current?.getBoundingClientRect()
    const soltadoEnLinea = linea && e.clientX >= linea.left && e.clientX <= linea.right && e.clientY >= linea.top && e.clientY <= linea.bottom
    // tap (sin mover) o soltar sobre la línea => añade cubo
    if (!movido.current || soltadoEnLinea) addCubo()
    window.setTimeout(() => { pointerActivo.current = false }, 0)
  }

  function nuevaPalabra(dif: number) {
    const p = elegirPalabra(dif, usados.current)
    usados.current.add(p.palabra)
    setPalabra(p)
    setCubos(0)
    setRevelado(false)
    errores.current = 0
    ayudaUsada.current = false
    inicioRonda.current = Date.now()
    setBloqueado(false)
    setMensaje('')
    hablarSecuencia([`Pon un cubo por cada ${unidad}`, vozPalabra(p.palabra)], 900)
  }

  function comprobar() {
    if (bloqueado || revelado) return
    const correcto = palabra.piezas.length
    if (cubos === correcto) {
      setRevelado(true)
      setBloqueado(true)
      hablarPartes(palabra.piezas.map(vozPieza))
      const quien = palabra.palabra === 'PATO' ? 'pato' : 'rana'
      setRefuerzo({ msg: errores.current === 0 && !ayudaUsada.current ? '¡Perfecto!' : '¡Muy bien!', quien })
      sesion.registrar({
        acierto: errores.current === 0 && !ayudaUsada.current,
        intentos: Math.min(errores.current + 1, 3),
        ayudaUsada: ayudaUsada.current,
        tiempoMs: Date.now() - inicioRonda.current,
        dificultad,
      })
      const dif = ajustarDificultad(dificultad, sesion.resultados.current)
      setDificultad(dif)
      setTimeout(() => {
        setRefuerzo(null)
        if (indice + 1 >= RONDAS) { onFinish(sesion.finalizar()); return }
        setIndice(indice + 1)
        nuevaPalabra(dif)
      }, 1700)
    } else {
      errores.current += 1
      setShake(true)
      setTimeout(() => setShake(false), 350)
      setMensaje(`Inténtalo otra vez. Cuenta ${unidadPl === 'sílabas' ? 'las sílabas' : `los ${unidadPl}`}.`)
      hablarSecuencia(['Inténtalo otra vez', `Escucha y cuenta ${unidadPl === 'sílabas' ? 'las sílabas' : `los ${unidadPl}`}`, vozPalabra(palabra.palabra)], 800)
    }
  }

  function pista() {
    ayudaUsada.current = true
    setMensaje(`Escucha por partes: ${palabra.piezas.join(' · ')}`)
    hablarPartes(palabra.piezas.map(vozPieza))
  }

  const progreso = useMemo(() => (indice / RONDAS) * 100, [indice])

  return (
    <div className="papel min-h-full text-[var(--tinta)]" style={{ touchAction: 'none' }}>
      <FeedbackBtn actividad="policubos" itemActual={String(palabra.palabra)} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      {ghost && (
        <div className="fixed z-50 pointer-events-none crayon" style={{ left: ghost.x - 28, top: ghost.y - 28, width: 56, height: 56, background: 'var(--cera-azul)' }} />
      )}
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progreso}%`, background: 'var(--cera-verde)' }} />
        </div>
        <span className="mano text-lg tabular-nums">{indice + 1}/{RONDAS}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Policubos · Cuenta los {unidadPl}</p>
        <div className="mt-2">
          <CommunityBadge>Policubos revisado por la comunidad</CommunityBadge>
        </div>
        <h1 className="mano text-2xl mt-1">Pon un cubo por cada {unidad}</h1>
        <p className="mano mt-2 text-base" style={{ opacity: 0.72 }}>
          Primero escucha la palabra. Después toca el cubo azul tantas veces como {unidadPl === 'sílabas' ? 'sílabas' : 'sonidos'} escuches.
        </p>

        {/* estímulo */}
        <div className="mt-4 inline-flex flex-col items-center">
          <span className="text-7xl">{emojiDe(palabra.palabra) || '🔊'}</span>
          <button onClick={() => hablarLento(vozPalabra(palabra.palabra))} className="crayon mano mt-2 px-4 py-1.5 text-2xl" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            🔊 {palabra.palabra}
          </button>
        </div>

        {/* línea de cubos colocados */}
        <div
          ref={lineaRef}
          className={`crayon mt-6 min-h-24 flex flex-wrap items-center justify-center gap-3 p-4 ${shake ? 'animate-shake' : ''}`}
          style={{ background: 'var(--papel-2)', borderStyle: 'dashed' }}
        >
          {cubos === 0 && <span className="mano text-base" style={{ opacity: 0.5 }}>Toca el cubo 🧊 para añadir · o pulsa +</span>}
          {Array.from({ length: cubos }).map((_, i) => (
            <button
              key={i}
              onClick={quitarCubo}
              disabled={bloqueado}
              className={`crayon ${i % 2 ? 'crayon-2' : ''} w-14 h-14 flex items-center justify-center text-2xl font-black mano`}
              style={{ background: 'var(--cera-verde)', color: '#fff' }}
              title="Tocar para quitar"
            >
              {revelado ? palabra.piezas[i] ?? '' : ''}
            </button>
          ))}
        </div>

        {/* pila de cubos (origen) + acciones */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={quitarCubo} disabled={bloqueado || cubos === 0} className="crayon mano w-14 h-14 text-3xl" style={{ background: 'var(--papel-2)' }}>−</button>
          {/* Tap directo para añadir cubo — más fácil que arrastrar */}
          <button
            onClick={() => { if (!pointerActivo.current) addCubo() }}
            disabled={bloqueado}
            onPointerDown={onPilaDown}
            onPointerMove={onPilaMove}
            onPointerUp={onPilaUp}
            className="crayon mano select-none flex flex-col items-center justify-center text-5xl active:scale-95 transition-transform"
            style={{ background: 'var(--cera-azul)', color: '#fff', touchAction: 'none', width: 100, height: 100 }}
            title="Toca para añadir un cubo"
          >
            🧊
            <span className="text-xs mt-0.5">toca para añadir</span>
          </button>
          <button onClick={addCubo} disabled={bloqueado} className="crayon mano w-14 h-14 text-3xl" style={{ background: 'var(--cera-verde)', color: '#fff' }}>+</button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={pista} disabled={bloqueado} className="crayon mano px-4 py-2 text-base" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>💡 Escuchar por partes</button>
          <button onClick={comprobar} disabled={bloqueado || cubos === 0} className="crayon mano px-5 py-2 text-lg text-white disabled:opacity-40" style={{ background: 'var(--cera-coral)' }}>Comprobar</button>
        </div>
        {mensaje && (
          <p className="crayon mano inline-block mt-4 px-4 py-2 text-base" style={{ background: 'var(--papel-2)' }}>
            {mensaje}
          </p>
        )}
      </main>
    </div>
  )
}
