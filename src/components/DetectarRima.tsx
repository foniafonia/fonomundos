/**
 * Mundo 2 — Detecta la Rima
 * ¿Estas dos palabras riman? Tarea de clasificación: nivel de dificultad baja.
 * Basado en evidencia: la detección de rima es prerequisito para la fonémica.
 */
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { barajar } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'
import FeedbackBtn from './FeedbackBtn'

// Corpus de pares de rima fiel al vocabulario de la guía
const PARES_RIMAN: [string, string, string, string][] = [
  // [palabra1, emoji1, palabra2, emoji2]
  ['PATO', '🦆', 'GATO', '🐱'],
  ['ROSA', '🌹', 'MARIPOSA', '🦋'],
  ['SOL', '☀️', 'COL', '🥬'],
  ['LUNA', '🌙', 'CUNA', '🛏️'],
  ['MESA', '🍽️', 'PESA', '⚖️'],
  ['TORO', '🐂', 'PORO', '🧄'],
  ['PINO', '🌲', 'VINO', '🍷'],
  ['FOCA', '🦭', 'BOCA', '👄'],
  ['VELA', '🕯️', 'TELA', '🧵'],
  ['NUBE', '☁️', 'TUBE', '🧴'],
  ['PEZ', '🐟', 'VEZ', '🔢'],
  ['MAR', '🌊', 'BAR', '🍺'],
]

const PARES_NO_RIMAN: [string, string, string, string][] = [
  ['PATO', '🦆', 'ROSA', '🌹'],
  ['LUNA', '🌙', 'FOCA', '🦭'],
  ['MESA', '🍽️', 'PINO', '🌲'],
  ['TORO', '🐂', 'VELA', '🕯️'],
  ['SOL', '☀️', 'CUNA', '🛏️'],
  ['PEZ', '🐟', 'NUBE', '☁️'],
  ['MAR', '🌊', 'MESA', '🍽️'],
  ['PINO', '🌲', 'PATO', '🦆'],
]

const RONDAS = 10

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

export default function DetectarRima({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'detectar-rima', 'silabica')
  const [indice, setIndice] = useState(0)
  const rimas = useRef(barajar(PARES_RIMAN))
  const noRimas = useRef(barajar(PARES_NO_RIMAN))
  const rimIdx = useRef(0)
  const noRimIdx = useRef(0)

  function siguiente() {
    // alterna rima y no-rima para equilibrar
    const esRima = indice % 2 === 0
    return esRima
      ? { par: rimas.current[rimIdx.current % rimas.current.length], rima: true }
      : { par: noRimas.current[noRimIdx.current % noRimas.current.length], rima: false }
  }

  const { par, rima: esRima } = siguiente()
  const inicio = useRef(Date.now())
  const [respondido, setRespondido] = useState<boolean | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)

  function responder(diceSiRima: boolean) {
    if (bloqueado) return
    setBloqueado(true)
    const acierto = diceSiRima === esRima
    setRespondido(acierto)
    hablar(acierto ? '¡Correcto!' : `${par[0]} y ${par[2]} ${esRima ? 'sí riman' : 'no riman'}`)
    sesion.registrar({ acierto, intentos: 1, ayudaUsada: false, tiempoMs: Date.now() - inicio.current, dificultad: 1 })
    setRefuerzo({ msg: acierto ? '¡Muy bien!' : esRima ? `¡Sí riman! ${par[0]} - ${par[2]}` : `¡No riman!`, quien: indice % 2 === 0 ? 'pato' : 'rana' })
    setTimeout(() => {
      setRefuerzo(null)
      if (indice + 1 >= RONDAS) { onFinish(sesion.finalizar()); return }
      if (indice % 2 === 0) rimIdx.current++; else noRimIdx.current++
      setIndice(indice + 1)
      setRespondido(null)
      setBloqueado(false)
      inicio.current = Date.now()
    }, 1400)
  }

  const progreso = (indice / RONDAS) * 100

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="detectar-rima" itemActual={`${par[0]}-${par[2]}`} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progreso}%`, background: 'var(--cera-lila)' }} />
        </div>
        <span className="mano text-lg">{indice + 1}/{RONDAS}</span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Detecta la rima</p>
        <h1 className="mano text-3xl mt-1">¿Estas palabras riman?</h1>

        <div className="flex justify-center items-center gap-6 mt-8">
          {/* Palabra 1 */}
          <button onClick={() => hablar(par[0])}
            className="crayon tilt-1 flex flex-col items-center px-5 py-4"
            style={{ background: 'var(--papel-2)' }}>
            <span className="text-6xl">{par[1]}</span>
            <span className="mano text-2xl mt-2">{par[0]}</span>
          </button>

          <span className="mano text-4xl" style={{ color: 'var(--cera-lila)' }}>¿?</span>

          {/* Palabra 2 */}
          <button onClick={() => hablar(par[2])}
            className="crayon crayon-2 tilt-2 flex flex-col items-center px-5 py-4"
            style={{ background: 'var(--papel-2)' }}>
            <span className="text-6xl">{par[3]}</span>
            <span className="mano text-2xl mt-2">{par[2]}</span>
          </button>
        </div>

        <p className="mano text-base mt-4" style={{ opacity: 0.6 }}>
          Toca las imágenes para escucharlas 🔊
        </p>

        <div className="flex gap-5 justify-center mt-8">
          <button onClick={() => responder(true)} disabled={bloqueado}
            className="crayon mano tilt-1 px-8 py-4 text-2xl text-white"
            style={{ background: respondido === true ? 'var(--cera-verde)' : 'var(--cera-verde)', opacity: bloqueado && respondido !== true ? 0.4 : 1 }}>
            ✅ Sí riman
          </button>
          <button onClick={() => responder(false)} disabled={bloqueado}
            className="crayon mano crayon-2 tilt-2 px-8 py-4 text-2xl text-white"
            style={{ background: 'var(--cera-coral)', opacity: bloqueado && respondido !== false ? 0.4 : 1 }}>
            ❌ No riman
          </button>
        </div>
      </main>
    </div>
  )
}
