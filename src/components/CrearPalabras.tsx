import FeedbackBtn from './FeedbackBtn'
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { SILABAS_CREA_PALABRAS, emojiDe } from '../data/guia'
import { barajar } from '../data/palabras'
import { ajustarDificultad } from '../lib/adaptacion'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'

const RONDAS = 8

// Actividad 5 (silábica): formar palabras con el banco de sílabas de la guía.
// Solo palabras cuyas sílabas pertenecen TODAS al banco.
interface Objetivo { palabra: string; silabas: string[] }
const OBJETIVOS: Objetivo[] = [
  { palabra: 'CAMA', silabas: ['CA', 'MA'] },
  { palabra: 'MESA', silabas: ['ME', 'SA'] },
  { palabra: 'PALA', silabas: ['PA', 'LA'] },
  { palabra: 'PELO', silabas: ['PE', 'LO'] },
  { palabra: 'SOPA', silabas: ['SO', 'PA'] },
  { palabra: 'ROSA', silabas: ['RO', 'SA'] },
  { palabra: 'LUNA', silabas: ['LU', 'NA'] },
  { palabra: 'PINO', silabas: ['PI', 'NO'] },
  { palabra: 'CASA', silabas: ['CA', 'SA'] },
  { palabra: 'MAPA', silabas: ['MA', 'PA'] },
  { palabra: 'RANA', silabas: ['RA', 'NA'] },
  { palabra: 'SAPO', silabas: ['SA', 'PO'] },
  { palabra: 'PALOMA', silabas: ['PA', 'LO', 'MA'] },
]

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Ficha { id: number; silaba: string; usada: boolean }

function bancoDe(obj: Objetivo, dif: number): Ficha[] {
  const extra = barajar(SILABAS_CREA_PALABRAS.filter((s) => !obj.silabas.includes(s))).slice(0, Math.min(1 + dif, 3))
  return barajar([...obj.silabas, ...extra]).map((s, i) => ({ id: i, silaba: s, usada: false }))
}

export default function CrearPalabras({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'crear-palabras', 'silabica')
  const [dificultad, setDificultad] = useState(1)
  const [indice, setIndice] = useState(0)
  const usados = useRef(new Set<string>())
  const [objetivo, setObjetivo] = useState<Objetivo>(() => {
    const o = OBJETIVOS[Math.floor(Math.random() * OBJETIVOS.length)]
    usados.current.add(o.palabra)
    return o
  })
  const [banco, setBanco] = useState<Ficha[]>(() => bancoDe(objetivo, 1))
  const [colocados, setColocados] = useState<string[]>([])
  const errores = useRef(0)
  const inicio = useRef(Date.now())
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shake, setShake] = useState(false)
  const [completa, setCompleta] = useState(false)

  function nueva(dif: number) {
    const cand = OBJETIVOS.filter((o) => !usados.current.has(o.palabra))
    const pool = cand.length ? cand : OBJETIVOS
    const o = pool[Math.floor(Math.random() * pool.length)]
    usados.current.add(o.palabra)
    setObjetivo(o)
    setBanco(bancoDe(o, dif))
    setColocados([])
    errores.current = 0
    inicio.current = Date.now()
    setCompleta(false)
    hablar(o.palabra)
  }

  function tocar(f: Ficha) {
    if (f.usada || completa) return
    const esperada = objetivo.silabas[colocados.length]
    if (f.silaba === esperada) {
      hablar(f.silaba)
      const nuevos = [...colocados, f.silaba]
      setColocados(nuevos)
      setBanco((b) => b.map((x) => (x.id === f.id ? { ...x, usada: true } : x)))
      if (nuevos.length === objetivo.silabas.length) {
        setCompleta(true)
        hablar(objetivo.palabra)
        setRefuerzo({ msg: `¡${objetivo.palabra}!`, quien: indice % 2 ? 'rana' : 'pato' })
        sesion.registrar({
          acierto: errores.current === 0, intentos: Math.min(errores.current + 1, 3),
          ayudaUsada: false, tiempoMs: Date.now() - inicio.current, dificultad,
        })
        const dif = ajustarDificultad(dificultad, sesion.resultados.current)
        setDificultad(dif)
        setTimeout(() => {
          setRefuerzo(null)
          if (indice + 1 >= RONDAS) { onFinish(sesion.finalizar()); return }
          setIndice(indice + 1)
          nueva(dif)
        }, 1500)
      }
    } else {
      errores.current += 1
      setShake(true)
      setTimeout(() => setShake(false), 350)
    }
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="crear-palabras" itemActual={String(objetivo.palabra)} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">{indice + 1}/{RONDAS}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Crea palabras</p>
        <h1 className="mano text-3xl mt-1">Forma la palabra con sílabas</h1>

        <div className={`mt-5 inline-flex flex-col items-center ${shake ? 'animate-shake' : ''}`}>
          <span className="text-7xl">{emojiDe(objetivo.palabra)}</span>
          <button onClick={() => hablar(objetivo.palabra)} className="crayon mano mt-3 px-4 py-1.5 text-xl" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>🔊 escuchar</button>
        </div>

        {/* huecos */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {objetivo.silabas.map((_, i) => (
            <div
              key={i}
              className={`crayon ${i % 2 ? 'crayon-2' : ''} min-w-16 h-16 px-3 flex items-center justify-center text-2xl font-black mano ${i === colocados.length ? 'animate-pulse' : ''}`}
              style={{
                background: i < colocados.length ? 'var(--cera-verde)' : 'var(--papel-2)',
                color: i < colocados.length ? '#fff' : 'var(--tinta)',
                borderStyle: i === colocados.length ? 'dashed' : 'solid',
              }}
            >
              {colocados[i] ?? ''}
            </div>
          ))}
        </div>

        {/* banco */}
        <div className="flex justify-center gap-4 mt-8 flex-wrap">
          {banco.map((f, i) => (
            <button
              key={f.id}
              onClick={() => tocar(f)}
              disabled={f.usada || completa}
              className={`crayon mano ${i % 2 ? 'crayon-2' : ''} ${['tilt-1', 'tilt-2', 'tilt-3'][i % 3]} min-w-16 px-3 py-3 text-2xl text-white transition-transform active:scale-90 hover:-translate-y-1 ${f.usada ? 'opacity-0 pointer-events-none' : ''}`}
              style={{ background: 'var(--cera-azul)' }}
            >
              {f.silaba}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
