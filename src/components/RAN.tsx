/**
 * RAN — Velocidad de Denominación Rápida
 * El mejor predictor temprano del desarrollo lector en español.
 * Identifica el 63% de niños con riesgo de problemas de fluidez.
 *
 * Mecánica: muestra estímulos uno a uno. El niño los nombra en voz alta
 * y toca "siguiente". Medimos el tiempo entre toques = velocidad de denominación.
 */
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'
import FeedbackBtn from './FeedbackBtn'

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

// Series RAN: letras, números y colores (más frecuentes en español)
type TipoRAN = 'letras' | 'numeros' | 'colores'

const SERIES: Record<TipoRAN, { estímulo: string; emoji: string; nombre: string }[]> = {
  letras: [
    { estímulo: 'A', emoji: '🔤', nombre: 'A' },
    { estímulo: 'O', emoji: '🔤', nombre: 'O' },
    { estímulo: 'S', emoji: '🔤', nombre: 'S' },
    { estímulo: 'P', emoji: '🔤', nombre: 'P' },
    { estímulo: 'M', emoji: '🔤', nombre: 'M' },
  ],
  numeros: [
    { estímulo: '2', emoji: '🔢', nombre: 'dos' },
    { estímulo: '5', emoji: '🔢', nombre: 'cinco' },
    { estímulo: '8', emoji: '🔢', nombre: 'ocho' },
    { estímulo: '3', emoji: '🔢', nombre: 'tres' },
    { estímulo: '7', emoji: '🔢', nombre: 'siete' },
  ],
  colores: [
    { estímulo: '🔴', emoji: '🔴', nombre: 'rojo' },
    { estímulo: '🔵', emoji: '🔵', nombre: 'azul' },
    { estímulo: '🟡', emoji: '🟡', nombre: 'amarillo' },
    { estímulo: '🟢', emoji: '🟢', nombre: 'verde' },
    { estímulo: '🟠', emoji: '🟠', nombre: 'naranja' },
  ],
}

// Genera una tira de 25 ítems (5 repeticiones de 5 ítems, barajada)
function generarTira(tipo: TipoRAN): typeof SERIES.letras {
  const base = SERIES[tipo]
  const tira = []
  for (let i = 0; i < 5; i++) tira.push(...base)
  // barajar manteniendo variedad (no repetir el mismo consecutivamente)
  type Item = typeof SERIES.letras[0]
  const resultado: Item[] = []
  const copia: Item[] = [...tira]
  while (copia.length) {
    const ultimo: Item | undefined = resultado[resultado.length - 1]
    const candidatos: Item[] = copia.filter((x) => x.estímulo !== ultimo?.estímulo)
    const pool: Item[] = candidatos.length ? candidatos : copia
    const idx = Math.floor(Math.random() * pool.length)
    const item: Item = pool[idx]
    resultado.push(item)
    copia.splice(copia.indexOf(item), 1)
  }
  return resultado
}

const TIPOS_RAN: TipoRAN[] = ['letras', 'numeros', 'colores']

export default function RAN({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'ran', 'fonologica')
  const [fase, setFase] = useState<'instruccion' | 'corriendo' | 'fin'>('instruccion')
  const [tipoIdx, setTipoIdx] = useState(0)
  const tipo = TIPOS_RAN[tipoIdx]
  const tira = useRef(generarTira('letras'))
  const [itemIdx, setItemIdx] = useState(0)
  const tiempos = useRef<number[]>([])
  const tInicio = useRef(0)
  const tUltimo = useRef(0)
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)

  function iniciar() {
    tira.current = generarTira(tipo)
    setItemIdx(0)
    tiempos.current = []
    tInicio.current = Date.now()
    tUltimo.current = Date.now()
    setFase('corriendo')
    hablar(`Di el nombre de cada ${tipo === 'letras' ? 'letra' : tipo === 'numeros' ? 'número' : 'color'} lo más rápido que puedas`)
  }

  function siguiente() {
    const ahora = Date.now()
    const dt = ahora - tUltimo.current
    tiempos.current.push(dt)
    tUltimo.current = ahora

    if (itemIdx + 1 >= tira.current.length) {
      // fin de la serie
      const totalMs = ahora - tInicio.current
      const mediaMs = tiempos.current.reduce((a, b) => a + b, 0) / tiempos.current.length
      // RAN score: 100 = muy rápido (<800ms/ítem), 0 = muy lento (>3000ms/ítem)
      const score = Math.max(0, Math.min(100, Math.round((1 - (mediaMs - 800) / 2200) * 100)))

      sesion.registrar({
        acierto: score >= 50,
        intentos: 1,
        ayudaUsada: false,
        tiempoMs: totalMs,
        dificultad: 3,
      })

      if (tipoIdx + 1 < TIPOS_RAN.length) {
        // siguiente tipo de RAN
        setRefuerzo({ msg: `Serie de ${tipo} completada`, quien: tipoIdx % 2 === 0 ? 'pato' : 'rana' })
        setTimeout(() => {
          setRefuerzo(null)
          setTipoIdx(tipoIdx + 1)
          tira.current = generarTira(TIPOS_RAN[tipoIdx + 1])
          setItemIdx(0)
          tiempos.current = []
          tInicio.current = Date.now()
          tUltimo.current = Date.now()
        }, 1200)
      } else {
        setFase('fin')
        setRefuerzo({ msg: '¡Completado!', quien: 'pato' })
        setTimeout(() => { setRefuerzo(null); onFinish(sesion.finalizar()) }, 1500)
      }
    } else {
      setItemIdx(itemIdx + 1)
    }
  }

  const item = tira.current[itemIdx]
  const progreso = fase === 'corriendo' ? ((itemIdx) / tira.current.length) * 100 : 0

  if (fase === 'instruccion') return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Velocidad de denominación (RAN)</p>
        <h1 className="mano text-3xl mt-1">Di el nombre lo más rápido que puedas</h1>
        <div className="crayon mt-8 p-5" style={{ background: 'var(--papel-2)' }}>
          <p className="mano text-xl mb-4">Verás letras, números y colores uno a uno.</p>
          <p className="mano text-lg">1. Dilo en voz alta 🗣️</p>
          <p className="mano text-lg">2. Toca el botón para continuar ⏩</p>
          <p className="mano text-base mt-3" style={{ color: 'var(--cera-coral)' }}>¡Cuanto más rápido, mejor!</p>
        </div>
        <button onClick={iniciar} className="crayon mano mt-8 px-8 py-4 text-2xl text-white" style={{ background: 'var(--cera-verde)' }}>
          ¡Empezar!
        </button>
      </main>
    </div>
  )

  return (
    <div className="papel min-h-full text-[var(--tinta)]" style={{ touchAction: 'none' }}>
      <FeedbackBtn actividad="ran" itemActual={`${tipo}-${item?.estímulo}`} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }}>
          <div className="h-full transition-all duration-100" style={{ width: `${progreso}%`, background: 'var(--cera-coral)' }} />
        </div>
        <span className="mano text-sm" style={{ color: 'var(--cera-lila)' }}>
          {tipo === 'letras' ? 'Letras' : tipo === 'numeros' ? 'Números' : 'Colores'} · {tipoIdx + 1}/3
        </span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 text-center">
        <p className="mano text-lg mb-4" style={{ color: 'var(--cera-lila)' }}>
          Di el nombre en voz alta, luego toca "Siguiente"
        </p>

        {/* Estímulo grande */}
        <div className="crayon mx-auto flex items-center justify-center mt-4"
          style={{ background: 'var(--papel-2)', width: 200, height: 200 }}>
          <span className={tipo === 'letras' || tipo === 'numeros' ? 'text-9xl font-black mano' : 'text-9xl'}>
            {item?.estímulo}
          </span>
        </div>

        <button
          onClick={siguiente}
          className="crayon mano mt-10 px-12 py-5 text-2xl text-white"
          style={{ background: 'var(--cera-coral)' }}
        >
          ⏩ Siguiente
        </button>
      </main>
    </div>
  )
}
