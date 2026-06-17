import { useRef, useState } from 'react'
import type { Dominio, Sesion } from '../types'
import { emojiDe } from '../data/guia'
import { barajar } from '../data/palabras'
import { MODELOS_BINGO, type ModeloBingo, type TipoBingo } from '../data/bingo'
import { useSesion } from '../lib/useSesion'
import { hablar, setVoz, vozActivada } from '../lib/voz'
import { Refuerzo } from './Personaje'
import FeedbackBtn from './FeedbackBtn'

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

const DOMINIO: Record<TipoBingo, Dominio> = {
  fonema: 'fonologica',
  silaba: 'silabica',
  palabra: 'lexica',
}

const TIPO_LABEL: Record<TipoBingo, string> = {
  fonema: 'Fonemas', silaba: 'Sílabas', palabra: 'Palabras',
}

// Las 8 líneas de un cartón 3×3 (filas, columnas y diagonales).
const LINEAS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export default function Bingo({ pacienteId, onFinish, onSalir }: Props) {
  const [modelo, setModelo] = useState<ModeloBingo | null>(null)
  const [numJug, setNumJug] = useState(2)

  if (!modelo) {
    return <Config numJug={numJug} setNumJug={setNumJug} onElegir={setModelo} onSalir={onSalir} />
  }
  return (
    <Juego
      key={modelo.id + numJug}
      modelo={modelo}
      numJug={numJug}
      pacienteId={pacienteId}
      onFinish={onFinish}
      onSalir={onSalir}
      onCambiar={() => setModelo(null)}
    />
  )
}

// ────────────────────────── Pantalla de configuración ──────────────────────────

function Config({
  numJug, setNumJug, onElegir, onSalir,
}: {
  numJug: number
  setNumJug: (n: number) => void
  onElegir: (m: ModeloBingo) => void
  onSalir: () => void
}) {
  const grupos: TipoBingo[] = ['fonema', 'silaba', 'palabra']
  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="bingo" itemActual="selección de modelo" />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Bingo de logopedia</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="text-center mb-6">
          <span className="text-5xl">🎱</span>
          <h1 className="mano text-4xl tilt-3 mt-1">¡Vamos a jugar al bingo!</h1>
          <p className="mano text-base mt-1" style={{ opacity: 0.7 }}>
            Sale una bola del bombo, suena su nombre y cada jugador la busca en su cartón.
          </p>
        </div>

        {/* Número de jugadores */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="mano text-lg">Jugadores:</span>
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => setNumJug(n)}
              className="crayon mano px-5 py-2 text-lg transition-transform hover:-translate-y-0.5"
              style={{
                background: numJug === n ? 'var(--cera-azul)' : 'var(--papel-2)',
                color: numJug === n ? '#fff' : 'var(--tinta)',
              }}
            >
              {n === 1 ? '👤 1' : '👤👤 2'}
            </button>
          ))}
        </div>

        {/* Modelos prehechos por tipo */}
        {grupos.map((g) => (
          <section key={g} className="mb-7">
            <h2 className="mano text-xl mb-2" style={{ color: 'var(--cera-azul)' }}>{TIPO_LABEL[g]}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {MODELOS_BINGO.filter((m) => m.tipo === g).map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => onElegir(m)}
                  className={`crayon ${i % 2 ? 'crayon-2' : ''} p-3 text-left transition-transform hover:-translate-y-1 active:scale-95`}
                  style={{ background: 'var(--papel-2)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="inline-block w-5 h-5 rounded-full flex-shrink-0" style={{ background: m.color, border: '2px solid var(--tinta)' }} />
                  </div>
                  <h3 className="mano text-lg font-black leading-tight mt-1">{m.titulo}</h3>
                  <p className="mano text-xs mt-0.5" style={{ opacity: 0.65 }}>{m.desc}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

// ────────────────────────── Pantalla de juego ──────────────────────────

interface Carton { nombre: string; items: string[]; marcado: boolean[] }

function crearCartones(modelo: ModeloBingo, n: number): Carton[] {
  const nombres = ['Jugador 1', 'Jugador 2']
  return Array.from({ length: n }, (_, j) => ({
    nombre: nombres[j],
    items: barajar(modelo.items).slice(0, 9),
    marcado: Array(9).fill(false),
  }))
}

function tieneLinea(marcado: boolean[]): boolean {
  return LINEAS.some((l) => l.every((i) => marcado[i]))
}

function Juego({
  modelo, numJug, pacienteId, onFinish, onSalir, onCambiar,
}: {
  modelo: ModeloBingo
  numJug: number
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
  onCambiar: () => void
}) {
  const esPalabra = modelo.tipo !== 'silaba'
  const sesion = useSesion(pacienteId, 'bingo', DOMINIO[modelo.tipo])

  const bombo = useRef<string[]>(barajar(modelo.items))
  const total = bombo.current.length
  const [pos, setPos] = useState(0)                       // bolas ya sacadas
  const [bolaActual, setBolaActual] = useState<string | null>(null)
  const [sacando, setSacando] = useState(false)
  const [cartones, setCartones] = useState<Carton[]>(() => crearCartones(modelo, numJug))
  const [ganador, setGanador] = useState<number | null>(null)
  const [lineas, setLineas] = useState<Set<number>>(new Set())
  const [shake, setShake] = useState<string | null>(null)
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [voz, setV] = useState(vozActivada())

  const tSalida = useRef(Date.now())
  const cantadas = bombo.current.slice(0, pos)

  function locucion(item: string) {
    return modelo.tipo === 'silaba' ? item.toLowerCase() : item
  }

  function sacarBola() {
    if (sacando || ganador !== null || pos >= total) return
    setSacando(true)
    setBolaActual(null)
    setTimeout(() => {
      const item = bombo.current[pos]
      setPos((p) => p + 1)
      setBolaActual(item)
      setSacando(false)
      tSalida.current = Date.now()
      hablar(locucion(item))
    }, 850)
  }

  function tocar(jIdx: number, cIdx: number) {
    if (ganador !== null) return
    const cart = cartones[jIdx]
    if (cart.marcado[cIdx]) return
    const item = cart.items[cIdx]
    const yaCantada = cantadas.includes(item)

    if (!yaCantada) {
      setShake(`${jIdx}-${cIdx}`)
      setTimeout(() => setShake(null), 350)
      sesion.registrar({ acierto: false, intentos: 1, ayudaUsada: false, tiempoMs: 0, dificultad: 2 })
      return
    }

    const nuevo = cartones.map((c, i) =>
      i === jIdx ? { ...c, marcado: c.marcado.map((m, k) => (k === cIdx ? true : m)) } : c,
    )
    setCartones(nuevo)
    hablar(locucion(item))
    sesion.registrar({ acierto: true, intentos: 1, ayudaUsada: false, tiempoMs: Date.now() - tSalida.current, dificultad: 2 })

    const cart2 = nuevo[jIdx]
    const quien: 'pato' | 'rana' = jIdx % 2 ? 'rana' : 'pato'
    if (cart2.marcado.every(Boolean)) {
      setGanador(jIdx)
      setRefuerzo({ msg: `¡BINGO! Gana ${cart2.nombre} 🏆`, quien })
      hablar('¡Bingo!')
      setTimeout(() => onFinish(sesion.finalizar()), 2600)
    } else if (!lineas.has(jIdx) && tieneLinea(cart2.marcado)) {
      setLineas((s) => new Set(s).add(jIdx))
      setRefuerzo({ msg: `¡Línea de ${cart2.nombre}! ⭐`, quien })
      setTimeout(() => setRefuerzo(null), 1500)
    }
  }

  const bolasAgotadas = pos >= total && ganador === null

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="bingo" itemActual={`${modelo.titulo}${bolaActual ? ` · ${bolaActual}` : ''}`} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />

      <header className="flex items-center gap-2 p-4 flex-wrap">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg flex-1 min-w-[120px]">{modelo.emoji} {modelo.titulo}</span>
        <span className="mano text-sm crayon px-3 py-1" style={{ background: 'var(--papel-2)' }}>Bolas {pos}/{total}</span>
        <button onClick={() => { const nv = !voz; setVoz(nv); setV(nv) }}
          className="crayon mano px-2 py-1 text-sm" style={{ background: 'var(--papel-2)' }}>
          {voz ? '🔊' : '🔇'}
        </button>
        <button onClick={onCambiar} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>Cambiar bingo</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-10">
        {/* ── Bombo ── */}
        <section className="flex flex-col items-center text-center mb-8">
          <div className="relative" style={{ width: 200, height: 200 }}>
            <div
              className={`absolute inset-0 rounded-full ${sacando ? 'animate-shake' : ''}`}
              style={{
                border: '5px solid var(--tinta)',
                background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.85), var(--papel-2))',
                boxShadow: 'inset 0 -12px 22px rgba(74,63,53,0.10), 3px 4px 0 rgba(74,63,53,0.18)',
              }}
            >
              {BOLITAS.map((b, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute', left: b.x, top: b.y, width: 26, height: 26,
                    borderRadius: '50%', background: b.c, border: '2px solid var(--tinta)',
                    animation: `bingoFlota ${1.4 + (i % 4) * 0.25}s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bola cantada */}
          <div style={{ minHeight: 168 }} className="mt-3 flex items-center justify-center">
            {bolaActual ? (
              <div
                key={bolaActual}
                className="animate-pop flex flex-col items-center justify-center"
                style={{
                  width: 150, height: 150, borderRadius: '50%', background: modelo.color, color: '#fff',
                  border: '4px solid var(--tinta)', boxShadow: '3px 4px 0 rgba(74,63,53,0.18)',
                }}
              >
                {esPalabra && <span className="text-5xl leading-none">{emojiDe(bolaActual)}</span>}
                <span className={`mano leading-tight ${esPalabra ? 'text-lg mt-1' : 'text-5xl'}`}>{bolaActual}</span>
              </div>
            ) : (
              <p className="mano text-base" style={{ opacity: 0.55 }}>Pulsa el botón para sacar la primera bola 👇</p>
            )}
          </div>

          <button
            onClick={sacarBola}
            disabled={sacando || ganador !== null || pos >= total}
            aria-label="Sacar bola del bombo"
            className="crayon mano text-2xl px-8 py-3 mt-3 transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--cera-mostaza)' }}
          >
            {sacando ? '🎰 …' : '🎲 Sacar bola'}
          </button>
          {bolaActual && (
            <button onClick={() => hablar(locucion(bolaActual))} className="crayon mano text-sm px-3 py-1 mt-2" style={{ background: 'var(--papel-2)' }}>
              🔊 Repetir
            </button>
          )}

          {bolasAgotadas && (
            <p className="mano text-base mt-3" style={{ color: 'var(--cera-coral)' }}>
              ¡Salieron todas las bolas! Marca las que te falten en tu cartón.
            </p>
          )}

          {/* Historial de bolas */}
          {cantadas.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mt-4 max-w-2xl">
              {cantadas.map((it, i) => (
                <span key={it + i} className="mano text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--papel-2)', border: '1.5px solid var(--tinta)' }}>
                  {esPalabra ? `${emojiDe(it)} ${it}` : it}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── Cartones ── */}
        <p className="mano text-center text-base mb-3" style={{ opacity: 0.7 }}>
          🖐️ Toca en tu cartón la bola que ha salido.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: numJug === 2 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
            gap: 20,
            maxWidth: numJug === 1 ? 440 : undefined,
            margin: numJug === 1 ? '0 auto' : undefined,
          }}
        >
          {cartones.map((cart, j) => {
            const marcadas = cart.marcado.filter(Boolean).length
            return (
              <div key={j} className={`crayon ${j % 2 ? 'crayon-2' : ''} p-3`} style={{ background: ganador === j ? 'var(--cera-verde)' : 'var(--papel-2)' }}>
                <h3 className="mano text-xl text-center mb-2" style={{ color: ganador === j ? '#fff' : 'var(--tinta)' }}>
                  {cart.nombre} {lineas.has(j) && ganador !== j ? '⭐' : ''}{ganador === j ? '🏆' : ''}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {cart.items.map((item, i) => {
                    const m = cart.marcado[i]
                    return (
                      <button
                        key={i}
                        onClick={() => tocar(j, i)}
                        disabled={ganador !== null || m}
                        aria-label={item}
                        aria-pressed={m}
                        className={`relative crayon flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5 ${m ? 'animate-pop' : ''} ${shake === `${j}-${i}` ? 'animate-shake' : ''}`}
                        style={{
                          aspectRatio: '1 / 1', padding: 4,
                          background: m ? 'var(--cera-verde)' : 'var(--papel)',
                          color: m ? '#fff' : 'var(--tinta)',
                        }}
                      >
                        {esPalabra && <span className="text-3xl sm:text-4xl leading-none">{emojiDe(item)}</span>}
                        <span className={`mano leading-tight ${esPalabra ? 'text-[11px] sm:text-xs mt-0.5' : 'text-3xl'}`}>{item}</span>
                        {m && (
                          <span className="absolute top-0.5 right-1 text-base" aria-hidden>✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="mano text-sm text-center mt-2" style={{ color: ganador === j ? '#fff' : 'var(--tinta)', opacity: 0.8 }}>
                  {marcadas}/9 marcadas
                </p>
              </div>
            )
          })}
        </div>
      </main>

      <style>{`@keyframes bingoFlota { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }`}</style>
    </div>
  )
}

// Bolitas decorativas dentro del bombo (posición y color fijos).
const BOLITAS = [
  { x: 40, y: 50, c: 'var(--cera-coral)' },
  { x: 120, y: 38, c: 'var(--cera-mostaza)' },
  { x: 85, y: 80, c: 'var(--cera-verde)' },
  { x: 45, y: 120, c: 'var(--cera-azul)' },
  { x: 130, y: 110, c: 'var(--cera-lila)' },
  { x: 95, y: 140, c: 'var(--cera-coral)' },
  { x: 150, y: 70, c: 'var(--cera-verde)' },
]
