import FeedbackBtn from './FeedbackBtn'
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { emojiDe } from '../data/guia'
import { barajar } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'

// Actividad 4 (fonémica): busca los dibujos que empiezan por /m/, /s/, /p/, /r/.
const OBJETIVOS = ['M', 'S', 'P', 'R']

// Vocabulario de la guía agrupado por sonido inicial (todas con emoji).
const POR_INICIAL: Record<string, string[]> = {
  M: ['MESA', 'MIEL', 'MAR', 'MAPA', 'MALETA', 'MARTILLO'],
  S: ['SOL', 'SAL', 'SAPO', 'SIRENA', 'SOPA', 'SELLO', 'SANDÍA'],
  P: ['PATO', 'PALA', 'PINO', 'PIÑA', 'PEZ', 'PALOMA', 'POLO', 'PELOTA'],
  R: ['ROSA', 'RANA', 'ROCA', 'RATÓN', 'RELOJ'],
}
const DISTRACTORES = ['LUNA', 'FOCA', 'NUBE', 'TORO', 'OSO', 'UVAS', 'AVIÓN', 'LOBO', 'CASA', 'OREJA', 'LAZO', 'VELA']

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Carta { palabra: string; correcta: boolean; estado: 'libre' | 'ok' | 'mal' }

function tablero(objetivo: string): Carta[] {
  const correctas = barajar(POR_INICIAL[objetivo]).slice(0, 3)
  const otros = Object.entries(POR_INICIAL)
    .filter(([k]) => k !== objetivo)
    .flatMap(([, ws]) => ws)
    .concat(DISTRACTORES)
  const otras = barajar(otros).slice(0, 3)
  return barajar([
    ...correctas.map((palabra) => ({ palabra, correcta: true, estado: 'libre' as const })),
    ...otras.map((palabra) => ({ palabra, correcta: false, estado: 'libre' as const })),
  ])
}

export default function BuscaSonido({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'busca-sonido', 'fonologica')
  const [ronda, setRonda] = useState(0)
  const objetivo = OBJETIVOS[ronda]
  const [cartas, setCartas] = useState<Carta[]>(() => tablero(OBJETIVOS[0]))
  const errores = useRef(0)
  const inicio = useRef(Date.now())
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shake, setShake] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)

  const totalCorrectas = cartas.filter((c) => c.correcta).length
  const encontradas = cartas.filter((c) => c.correcta && c.estado === 'ok').length

  function tocar(idx: number) {
    if (bloqueado) return
    const c = cartas[idx]
    if (c.estado !== 'libre') return
    if (c.correcta) {
      hablar(c.palabra)
      const next = cartas.map((x, i) => (i === idx ? { ...x, estado: 'ok' as const } : x))
      setCartas(next)
      if (next.filter((x) => x.correcta && x.estado === 'ok').length === totalCorrectas) {
        setBloqueado(true)
        sesion.registrar({
          acierto: errores.current === 0,
          intentos: Math.min(errores.current + 1, 3),
          ayudaUsada: false,
          tiempoMs: Date.now() - inicio.current,
          dificultad: 2,
        })
        setRefuerzo({ msg: '¡Todos encontrados!', quien: ronda % 2 ? 'rana' : 'pato' })
        setTimeout(() => {
          setRefuerzo(null)
          if (ronda + 1 >= OBJETIVOS.length) { onFinish(sesion.finalizar()); return }
          const r = ronda + 1
          setRonda(r)
          setCartas(tablero(OBJETIVOS[r]))
          errores.current = 0
          inicio.current = Date.now()
          setBloqueado(false)
        }, 1500)
      }
    } else {
      errores.current += 1
      setCartas(cartas.map((x, i) => (i === idx ? { ...x, estado: 'mal' as const } : x)))
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setCartas((cs) => cs.map((x, i) => (i === idx ? { ...x, estado: 'libre' as const } : x)))
      }, 500)
    }
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="busca-sonido" itemActual={String(objetivo)} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Sonido {ronda + 1}/{OBJETIVOS.length}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Caza del sonido</p>
        <h1 className="mano text-3xl mt-1">
          Busca los que empiezan por «{objetivo}»
          <button onClick={() => hablar(`Busca los que empiezan por ${objetivo}`)} className="crayon ml-2 px-2 py-0.5 text-xl align-middle" style={{ background: 'var(--papel-2)' }}>🔊</button>
        </h1>
        <p className="mano text-base mt-1" style={{ opacity: 0.6 }}>{encontradas}/{totalCorrectas} encontrados</p>

        <div className={`grid grid-cols-3 gap-4 mt-6 ${shake ? 'animate-shake' : ''}`}>
          {cartas.map((c, i) => (
            <button
              key={c.palabra}
              onClick={() => tocar(i)}
              disabled={bloqueado || c.estado === 'ok'}
              className={`crayon ${i % 2 ? 'crayon-2' : ''} ${['tilt-1', 'tilt-2', 'tilt-3'][i % 3]} p-4 flex flex-col items-center transition-transform hover:-translate-y-1`}
              style={{
                background: c.estado === 'ok' ? 'var(--cera-verde)' : c.estado === 'mal' ? 'var(--cera-coral)' : 'var(--papel-2)',
                color: c.estado === 'ok' ? '#fff' : 'var(--tinta)',
              }}
            >
              <span className="text-4xl">{emojiDe(c.palabra)}</span>
              <span className="mano text-base mt-1">{c.palabra}</span>
            </button>
          ))}
        </div>

        <p className="mano text-sm mt-6" style={{ opacity: 0.5 }}>Pista: empiezan por el sonido «{objetivo}» (como {POR_INICIAL[objetivo][0]}).</p>
      </main>
    </div>
  )
}
