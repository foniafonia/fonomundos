import FeedbackBtn from './FeedbackBtn'
/**
 * Cadena-dominó (Actividad 3 fonémica y silábica).
 * Gesto real: arrastrar una ficha del banco y soltarla sobre la zona de cadena.
 * También funciona con tap (accesibilidad táctil sencilla).
 */
import { useEffect, useRef, useState } from 'react'
import type { Sesion } from '../types'
import { CADENAS_FONEMICAS, CADENAS_SILABICAS, emojiDe, type Cadena } from '../data/guia'
import { useSesion } from '../lib/useSesion'
import { bordeDe, validarEnlaceCadena } from '../lib/cadenaValidacion'
import { hablarLento, hablarSecuencia } from '../lib/voz'
import { Refuerzo } from './Personaje'
import CommunityBadge from './CommunityBadge'

const MAX_CADENAS = 5

interface Props {
  pacienteId: string
  tipo: 'fonemica' | 'silabica'
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Ficha { id: number; palabra: string; usada: boolean }

function vozPalabra(palabra: string) {
  return palabra.toLocaleLowerCase('es-ES')
}

function vozParte(parte: string) {
  return parte.toLocaleLowerCase('es-ES')
}

function fichaDe(cadena: Cadena): Ficha[] {
  // el primero ya está colocado; el resto forma el banco
  return cadena.secuencia.slice(1).map((p, i) => ({ id: i, palabra: p, usada: false }))
}

export default function CadenaDomino({ pacienteId, tipo, onFinish, onSalir }: Props) {
  const sesion = useSesion(
    pacienteId,
    tipo === 'fonemica' ? 'cadena-sonidos' : 'cadena-silabas',
    tipo === 'fonemica' ? 'fonologica' : 'silabica',
  )

  const cadenas = useRef<Cadena[]>(
    [...(tipo === 'fonemica' ? CADENAS_FONEMICAS : CADENAS_SILABICAS)]
      .sort((a, b) => a.secuencia.length - b.secuencia.length)
      .slice(0, MAX_CADENAS),
  )

  const [cadIdx, setCadIdx] = useState(0)
  const cadena = cadenas.current[cadIdx]
  const [colocados, setColocados] = useState<string[]>([cadena.secuencia[0]])
  const [banco, setBanco] = useState<Ficha[]>(() => fichaDe(cadena))
  const erroresLink = useRef(0)
  const ayudaLink = useRef(false)
  const inicioLink = useRef(Date.now())
  const [shake, setShake] = useState(false)
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [pista, setPista] = useState<string | null>(null)

  // --- drag & drop con pointer events ---
  const [dragging, setDragging] = useState<{ id: number; palabra: string } | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const movido = useRef(false)

  const tituloRegla = tipo === 'fonemica'
    ? 'El último sonido es el primero de la siguiente'
    : 'La última sílaba es la primera de la siguiente'

  useEffect(() => {
    const id = window.setTimeout(() => {
      hablarSecuencia([
        `Cadena de ${tipo === 'fonemica' ? 'sonidos' : 'sílabas'}`,
        tituloRegla,
        `Empieza por ${vozPalabra(cadena.secuencia[0])}`,
        `Ahora busca una ficha que empiece por ${vozParte(bordeDe(cadena.secuencia[0])?.fin ?? '')}`,
      ], 850)
    }, 500)
    return () => window.clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadIdx, tipo])

  function cargarCadena(idx: number) {
    const c = cadenas.current[idx]
    setColocados([c.secuencia[0]])
    setBanco(fichaDe(c))
    erroresLink.current = 0
    ayudaLink.current = false
    inicioLink.current = Date.now()
    setBloqueado(false)
    setPista(null)
    hablarSecuencia([
      `Empieza por ${vozPalabra(c.secuencia[0])}`,
      `Ahora busca una ficha que empiece por ${vozParte(bordeDe(c.secuencia[0])?.fin ?? '')}`,
    ], 850)
  }

  function guiar(esperado: string | null) {
    if (!esperado) return
    const ini = bordeDe(esperado)?.ini
    if (ini) { setPista(ini); hablarSecuencia(['Inténtalo otra vez', `Busca la palabra que empieza por ${vozParte(ini)}`], 750) }
  }

  function mostrarPista() {
    ayudaLink.current = true
    guiar(cadena.secuencia[colocados.length])
  }

  function intentarColocar(ficha: Ficha) {
    if (ficha.usada || bloqueado) return
    const desde = colocados[colocados.length - 1]
    const v = validarEnlaceCadena(cadena, desde, ficha.palabra)
    if (v.correcto) {
      hablarLento(vozPalabra(ficha.palabra))
      sesion.registrar({
        acierto: erroresLink.current === 0 && !ayudaLink.current,
        intentos: Math.min(erroresLink.current + 1, 3),
        ayudaUsada: ayudaLink.current,
        tiempoMs: Date.now() - inicioLink.current,
        dificultad: Math.min(5, cadena.secuencia.length - 2),
      })
      const nuevos = [...colocados, ficha.palabra]
      setColocados(nuevos)
      setBanco((b) => b.map((x) => (x.id === ficha.id ? { ...x, usada: true } : x)))
      erroresLink.current = 0
      ayudaLink.current = false
      inicioLink.current = Date.now()
      setPista(null)
      if (nuevos.length === cadena.secuencia.length) {
        setBloqueado(true)
        setRefuerzo({ msg: '¡Cadena completa!', quien: cadIdx % 2 === 0 ? 'pato' : 'rana' })
        setTimeout(() => {
          setRefuerzo(null)
          if (cadIdx + 1 >= cadenas.current.length) { onFinish(sesion.finalizar()); return }
          const idx = cadIdx + 1
          setCadIdx(idx)
          cargarCadena(idx)
        }, 1600)
      }
    } else {
      erroresLink.current += 1
      ayudaLink.current = true
      setShake(true)
      setTimeout(() => setShake(false), 350)
      guiar(v.esperado)
    }
  }

  // pointer events en cada ficha del banco
  function onFichaDown(e: React.PointerEvent, ficha: Ficha) {
    if (ficha.usada || bloqueado) return
    e.preventDefault()
    movido.current = false
    setDragging({ id: ficha.id, palabra: ficha.palabra })
    setGhost({ x: e.clientX, y: e.clientY })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  function onGlobalMove(e: React.PointerEvent) {
    if (!dragging) return
    movido.current = true
    setGhost({ x: e.clientX, y: e.clientY })
  }

  function onGlobalUp(e: React.PointerEvent) {
    if (!dragging) return
    const ficha = banco.find((f) => f.id === dragging.id)
    setDragging(null)
    setGhost(null)
    if (!ficha) return
    // si no se movió → tap; si se movió → comprobar si soltó sobre la zona
    if (!movido.current) {
      intentarColocar(ficha)
      return
    }
    const zone = dropZoneRef.current?.getBoundingClientRect()
    if (zone && e.clientX >= zone.left && e.clientX <= zone.right && e.clientY >= zone.top && e.clientY <= zone.bottom) {
      intentarColocar(ficha)
    }
  }

  function CardFicha({ ficha, puesta }: { ficha: { palabra: string }; puesta?: boolean }) {
    const borde = tipo === 'fonemica' ? bordeDe(ficha.palabra) : undefined
    return (
      <div className={`relative crayon ${puesta ? '' : 'crayon-2'} px-4 py-3 flex flex-col items-center min-w-24`}
        style={{ background: puesta ? 'var(--cera-verde)' : 'var(--papel-2)', color: puesta ? '#fff' : 'var(--tinta)' }}>
        <span className="text-5xl">{emojiDe(ficha.palabra) || '🔊'}</span>
        <span className="mano text-base font-bold mt-1">{ficha.palabra}</span>
        {puesta && borde && (
          <span className="crayon absolute -bottom-3 text-[11px] px-1.5 py-0.5 font-bold mano"
            style={{ background: 'var(--papel)', color: 'var(--tinta)' }}>
            {borde.ini}·{borde.fin}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className="papel min-h-full text-[var(--tinta)]"
      style={{ touchAction: 'none' }}
      onPointerMove={onGlobalMove}
      onPointerUp={onGlobalUp}
    >
      <FeedbackBtn actividad="cadena-dominó" itemActual={String(colocados[colocados.length-1])} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />

      {/* ghost de arrastre */}
      {ghost && dragging && (
        <div className="fixed z-50 pointer-events-none opacity-80 crayon px-3 py-2 flex flex-col items-center"
          style={{ left: ghost.x - 40, top: ghost.y - 40, background: 'var(--cera-azul)', color: '#fff' }}>
          <span className="text-3xl">{emojiDe(dragging.palabra)}</span>
          <span className="mano text-xs">{dragging.palabra}</span>
        </div>
      )}

      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Cadena {cadIdx + 1}/{cadenas.current.length}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
          Cadena de {tipo === 'fonemica' ? 'sonidos' : 'sílabas'} · arrastra cada pieza
        </p>
        <div className="mt-2">
          <CommunityBadge>Cadena más clara por la comunidad</CommunityBadge>
        </div>
        <h1 className="mano text-2xl mt-1">{tituloRegla}</h1>
        <p className="mano mt-2 text-base" style={{ opacity: 0.72 }}>
          Modelo: mira la última parte de la ficha verde y busca una ficha que empiece igual.
        </p>

        {/* cadena colocada (drop zone) */}
        <div
          ref={dropZoneRef}
          className={`flex items-center justify-center flex-wrap gap-3 mt-6 min-h-24 rounded-2xl p-3 transition-colors ${shake ? 'animate-shake' : ''} ${dragging ? 'ring-4 ring-[var(--cera-azul)] ring-dashed bg-[var(--cera-azul)]/10' : ''}`}
          style={{ background: dragging ? undefined : 'transparent' }}
        >
          {colocados.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <CardFicha ficha={{ palabra: p }} puesta />
              {i < cadena.secuencia.length - 1 && (
                <span className="text-3xl" style={{ color: 'var(--cera-coral)' }}>↝</span>
              )}
            </div>
          ))}
          {colocados.length < cadena.secuencia.length && (
            <div className="crayon w-20 h-20 flex items-center justify-center text-3xl font-black mano animate-pulse"
              style={{ background: 'var(--papel)', color: 'var(--cera-verde)', borderStyle: 'dashed' }}>
              {pista ?? '?'}
            </div>
          )}
        </div>

        {colocados.length < cadena.secuencia.length && (
          <div className="crayon mano inline-flex flex-col sm:flex-row items-center gap-2 mt-4 px-4 py-2 text-base" style={{ background: 'var(--papel-2)' }}>
            <span>Ahora toca una ficha que empiece por</span>
            <strong className="text-xl" style={{ color: 'var(--cera-coral)' }}>{bordeDe(colocados[colocados.length - 1])?.fin ?? '?'}</strong>
          </div>
        )}

        {pista && (
          <p className="crayon mano inline-block mt-4 text-base px-4 py-1.5"
            style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            💡 Busca la que empieza por «{pista}»
          </p>
        )}

        {/* banco de fichas */}
        <p className="mano text-lg mt-8" style={{ opacity: 0.7 }}>
          {dragging ? 'Suelta sobre la cadena ↑' : 'Arrastra o toca la que sigue:'}
        </p>
        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          {banco.map((f) => (
            f.usada ? null : (
              <div
                key={f.id}
                onPointerDown={(e) => onFichaDown(e, f)}
                className={`cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-1 select-none ${dragging?.id === f.id ? 'opacity-30' : ''}`}
                style={{ touchAction: 'none' }}
              >
                <CardFicha ficha={f} />
              </div>
            )
          ))}
        </div>

        {tipo === 'fonemica' && !bloqueado && (
          <button onClick={mostrarPista} className="crayon mano mt-8 px-5 py-2 text-base"
            style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            💡 Pista
          </button>
        )}
      </main>
    </div>
  )
}
