/**
 * Manipulación Medial — El indicador de maestría fonémica
 * Significativamente más difícil que inicial/final.
 * Diferencia "en proceso" de "automatización absoluta".
 *
 * Mecánica: "En MESA, cambia la /E/ por /A/. ¿Qué palabra suena?"
 * → Opciones múltiples → MASA ✅
 */
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { barajar, ColaNoRepetida } from '../data/palabras'
import { emojiDe } from '../data/guia'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'
import FeedbackBtn from './FeedbackBtn'

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Reto {
  palabra: string
  posicion: number       // índice del fonema a cambiar (medial)
  fonemaViejo: string
  fonemaNuevo: string
  resultado: string      // la nueva palabra resultante
  distractores: string[] // palabras incorrectas plausibles
  emoji: string
  emojiResultado: string
}

// Corpus de manipulación medial. Fonema medial (posición 1 en palabras de 4 letras)
const RETOS: Reto[] = [
  { palabra: 'MESA', posicion: 1, fonemaViejo: 'E', fonemaNuevo: 'A', resultado: 'MASA', distractores: ['MOSA', 'MUSA', 'MISA'], emoji: '🍽️', emojiResultado: '⚖️' },
  { palabra: 'PINO', posicion: 1, fonemaViejo: 'I', fonemaNuevo: 'A', resultado: 'PANO', distractores: ['PUNO', 'PENO', 'PONO'], emoji: '🌲', emojiResultado: '🟫' },
  { palabra: 'LUNA', posicion: 1, fonemaViejo: 'U', fonemaNuevo: 'I', resultado: 'LINA', distractores: ['LONA', 'LANA', 'LENA'], emoji: '🌙', emojiResultado: '👩' },
  { palabra: 'FOCA', posicion: 1, fonemaViejo: 'O', fonemaNuevo: 'I', resultado: 'FICA', distractores: ['FUCA', 'FECA', 'FACA'], emoji: '🦭', emojiResultado: '🟪' },
  { palabra: 'PALO', posicion: 1, fonemaViejo: 'A', fonemaNuevo: 'E', resultado: 'PELO', distractores: ['PILO', 'POLO', 'PULO'], emoji: '🪏', emojiResultado: '💇' },
  { palabra: 'VELA', posicion: 1, fonemaViejo: 'E', fonemaNuevo: 'I', resultado: 'VILA', distractores: ['VOLA', 'VALA', 'VULA'], emoji: '🕯️', emojiResultado: '🏘️' },
  { palabra: 'TORO', posicion: 1, fonemaViejo: 'O', fonemaNuevo: 'U', resultado: 'TURO', distractores: ['TARO', 'TERO', 'TIRO'], emoji: '🐂', emojiResultado: '🟫' },
  { palabra: 'NUBE', posicion: 1, fonemaViejo: 'U', fonemaNuevo: 'O', resultado: 'NOBE', distractores: ['NABE', 'NIBE', 'NEBE'], emoji: '☁️', emojiResultado: '🟩' },
  { palabra: 'CUNA', posicion: 1, fonemaViejo: 'U', fonemaNuevo: 'A', resultado: 'CANA', distractores: ['CONA', 'CENA', 'CINA'], emoji: '🛏️', emojiResultado: '🎋' },
  { palabra: 'LAZO', posicion: 1, fonemaViejo: 'A', fonemaNuevo: 'U', resultado: 'LUZO', distractores: ['LIZO', 'LOZO', 'LEZO'], emoji: '🎀', emojiResultado: '💡' },
]

const cola = new ColaNoRepetida(RETOS)
const RONDAS = 8

export default function ManipulacionMedial({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'manipulacion-medial', 'fonologica')
  const [indice, setIndice] = useState(0)
  const [reto, setReto] = useState<Reto>(() => cola.siguiente())
  const [opciones] = useState<string[]>(() => barajar([reto.resultado, ...reto.distractores.slice(0, 3)]))
  const [opcionesActuales, setOpcionesActuales] = useState(() => barajar([reto.resultado, ...reto.distractores.slice(0, 3)]))
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [elegida, setElegida] = useState<string | null>(null)
  const errores = useRef(0)
  const inicio = useRef(Date.now())

  function elegir(op: string) {
    if (bloqueado) return
    setBloqueado(true)
    setElegida(op)
    const acierto = op === reto.resultado
    if (!acierto) errores.current++
    hablar(acierto ? reto.resultado : `La respuesta es ${reto.resultado}`)
    sesion.registrar({ acierto, intentos: 1, ayudaUsada: false, tiempoMs: Date.now() - inicio.current, dificultad: 5 })
    setRefuerzo({ msg: acierto ? `¡Perfecto! ${reto.palabra} → ${reto.resultado}` : `Era ${reto.resultado}`, quien: indice % 2 === 0 ? 'pato' : 'rana' })
    setTimeout(() => {
      setRefuerzo(null)
      if (indice + 1 >= RONDAS) { onFinish(sesion.finalizar()); return }
      const siguiente = cola.siguiente()
      setReto(siguiente)
      setOpcionesActuales(barajar([siguiente.resultado, ...siguiente.distractores.slice(0, 3)]))
      errores.current = 0
      inicio.current = Date.now()
      setBloqueado(false)
      setElegida(null)
      setIndice(indice + 1)
    }, 1600)
  }

  void opciones
  const progreso = (indice / RONDAS) * 100

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="manipulacion-medial" itemActual={reto.palabra} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }}>
          <div className="h-full transition-all" style={{ width: `${progreso}%`, background: 'var(--cera-azul)' }} />
        </div>
        <span className="mano text-lg">{indice + 1}/{RONDAS}</span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Manipulación medial · Nivel experto</p>
        <h1 className="mano text-2xl mt-1">Cambia el sonido del medio</h1>

        {/* Estímulo */}
        <div className="crayon mt-6 p-5 mx-auto max-w-sm" style={{ background: 'var(--papel-2)' }}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-5xl">{reto.emoji}</span>
            <button onClick={() => hablar(reto.palabra)}
              className="mano text-3xl font-black" style={{ color: 'var(--tinta)' }}>
              🔊 {reto.palabra}
            </button>
          </div>
          {/* Visualización de fonemas con el medial resaltado */}
          <div className="flex justify-center gap-2 mt-2">
            {reto.palabra.split('').map((letra, i) => (
              <div key={i}
                className={`crayon w-12 h-12 flex items-center justify-center mano text-xl font-black ${i === reto.posicion ? 'tilt-1' : ''}`}
                style={{
                  background: i === reto.posicion ? 'var(--cera-coral)' : 'var(--papel)',
                  color: i === reto.posicion ? '#fff' : 'var(--tinta)',
                }}>
                {letra}
              </div>
            ))}
          </div>
          <p className="mano text-base mt-3" style={{ color: 'var(--cera-coral)' }}>
            Cambia /{reto.fonemaViejo}/ por /{reto.fonemaNuevo}/
          </p>
        </div>

        <p className="mano text-lg mt-6">¿Qué nueva palabra suena?</p>

        <div className="grid grid-cols-2 gap-3 mt-3 max-w-sm mx-auto">
          {opcionesActuales.map((op, i) => (
            <button key={op} onClick={() => elegir(op)} disabled={bloqueado}
              className={`crayon mano ${i % 2 ? 'crayon-2' : ''} py-4 text-2xl`}
              style={{
                background: !bloqueado ? 'var(--papel-2)' :
                  op === reto.resultado ? 'var(--cera-verde)' :
                  op === elegida ? 'var(--cera-coral)' : 'var(--papel-2)',
                color: bloqueado && op === reto.resultado ? '#fff' :
                  bloqueado && op === elegida ? '#fff' : 'var(--tinta)',
              }}>
              {emojiDe(op) || '🔊'} {op}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
