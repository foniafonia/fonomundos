import FeedbackBtn from './FeedbackBtn'
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { CLASIFICACION_SILABICA, emojiDe } from '../data/guia'
import { barajar } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'

// Actividad 4 (silábica): clasifica cada palabra por su número de sílabas (1-4).
interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Reto { palabra: string; silabas: number }

function todosLosRetos(): Reto[] {
  const retos: Reto[] = []
  for (const k of [1, 2, 3, 4]) {
    for (const palabra of CLASIFICACION_SILABICA[k]) retos.push({ palabra, silabas: k })
  }
  return barajar(retos)
}

export default function ClasificarSilabas({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'clasificar-silabas', 'silabica')
  const retos = useRef(todosLosRetos())
  const total = retos.current.length
  const [indice, setIndice] = useState(0)
  const reto = retos.current[indice]
  const errores = useRef(0)
  const inicio = useRef(Date.now())
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shake, setShake] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const [elegida, setElegida] = useState<number | null>(null)

  function elegir(n: number) {
    if (bloqueado) return
    if (n === reto.silabas) {
      setBloqueado(true)
      setElegida(n)
      hablar(reto.palabra)
      sesion.registrar({
        acierto: errores.current === 0,
        intentos: Math.min(errores.current + 1, 3),
        ayudaUsada: false,
        tiempoMs: Date.now() - inicio.current,
        dificultad: reto.silabas,
      })
      setRefuerzo({ msg: '¡Correcto!', quien: indice % 2 ? 'rana' : 'pato' })
      setTimeout(() => {
        setRefuerzo(null)
        if (indice + 1 >= total) { onFinish(sesion.finalizar()); return }
        setIndice(indice + 1)
        errores.current = 0
        inicio.current = Date.now()
        setBloqueado(false)
        setElegida(null)
      }, 1200)
    } else {
      errores.current += 1
      setShake(true)
      setTimeout(() => setShake(false), 350)
    }
  }

  const COLORES = ['var(--cera-coral)', 'var(--cera-mostaza)', 'var(--cera-verde)', 'var(--cera-azul)']

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="clasificar-silabas" itemActual={String(reto.palabra)} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">{indice + 1}/{total}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Clasifica por sílabas</p>
        <h1 className="mano text-3xl mt-1">¿Cuántas sílabas tiene?</h1>

        <div className={`mt-6 inline-flex flex-col items-center ${shake ? 'animate-shake' : ''}`}>
          <span className="text-7xl">{emojiDe(reto.palabra)}</span>
          <button onClick={() => hablar(reto.palabra)} className="crayon mano mt-3 px-4 py-1.5 text-2xl" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            🔊 {reto.palabra}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-8">
          {[1, 2, 3, 4].map((n, i) => (
            <button
              key={n}
              onClick={() => elegir(n)}
              disabled={bloqueado}
              className={`crayon mano ${i % 2 ? 'crayon-2' : ''} py-5 text-3xl text-white transition-transform hover:-translate-y-1`}
              style={{ background: COLORES[i], outline: elegida === n ? '4px solid var(--tinta)' : 'none' }}
            >
              {n}
              <div className="text-sm">{n === 1 ? 'sílaba' : 'sílabas'}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
