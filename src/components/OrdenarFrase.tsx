import FeedbackBtn from './FeedbackBtn'
import { useMemo, useRef, useState } from 'react'
import type { Sesion } from '../types'
import { FRASES_DESORDENADAS } from '../data/guia'
import { barajar } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'

interface FraseConImagen { correcta: string[]; emoji?: string }

interface Props {
  pacienteId: string
  fuente?: FraseConImagen[]   // por defecto Act.5 (sin imagen)
  actividadId?: string
  subtitulo?: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Token {
  id: number
  palabra: string
}

function desordenar(correcta: string[]): Token[] {
  let intento = barajar(correcta)
  // asegurar que el desorden difiera del orden correcto
  for (let i = 0; i < 5 && intento.join(' ') === correcta.join(' '); i++) intento = barajar(correcta)
  return intento.map((p, i) => ({ id: i, palabra: p }))
}

export default function OrdenarFrase({ pacienteId, fuente = FRASES_DESORDENADAS, actividadId = 'ordenar-frase', subtitulo = 'Conciencia léxica · Ordena la frase', onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, actividadId, 'lexica')
  const frases = useRef(barajar(fuente))
  const total = frases.current.length
  const [indice, setIndice] = useState(0)
  const correcta = frases.current[indice].correcta
  const emoji = frases.current[indice].emoji

  const [banco, setBanco] = useState<Token[]>(() => desordenar(correcta))
  const [linea, setLinea] = useState<Token[]>([])
  const errores = useRef(0)
  const inicio = useRef(Date.now())
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shake, setShake] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)

  function aLinea(t: Token) {
    if (bloqueado) return
    setBanco((b) => b.filter((x) => x.id !== t.id))
    setLinea((l) => [...l, t])
  }
  function aBanco(t: Token) {
    if (bloqueado) return
    setLinea((l) => l.filter((x) => x.id !== t.id))
    setBanco((b) => [...b, t])
  }

  function nuevaFrase() {
    if (indice + 1 >= total) {
      onFinish(sesion.finalizar())
      return
    }
    const i = indice + 1
    setIndice(i)
    setBanco(desordenar(frases.current[i].correcta))
    setLinea([])
    errores.current = 0
    inicio.current = Date.now()
    setBloqueado(false)
  }

  function comprobar() {
    if (bloqueado || linea.length !== correcta.length) return
    const ok = linea.map((t) => t.palabra).join(' ') === correcta.join(' ')
    if (ok) {
      setBloqueado(true)
      hablar(correcta.join(' '))
      setRefuerzo({ msg: '¡Frase correcta!', quien: indice % 2 === 0 ? 'pato' : 'rana' })
      sesion.registrar({
        acierto: errores.current === 0,
        intentos: Math.min(errores.current + 1, 3),
        ayudaUsada: false,
        tiempoMs: Date.now() - inicio.current,
        dificultad: Math.min(5, correcta.length),
      })
      setTimeout(() => { setRefuerzo(null); nuevaFrase() }, 1500)
    } else {
      errores.current += 1
      setShake(true)
      setTimeout(() => setShake(false), 350)
    }
  }

  const progreso = useMemo(() => (indice / total) * 100, [indice, total])

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="ordenar-frase" itemActual={String(correcta.join(" "))} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progreso}%`, background: 'var(--cera-verde)' }} />
        </div>
        <span className="mano text-lg tabular-nums">{indice + 1}/{total}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>{subtitulo}</p>
        <h1 className="mano text-3xl mt-1">Coloca las palabras en orden</h1>

        {emoji && (
          <div className="mt-4">
            <span className="text-7xl">{emoji}</span>
          </div>
        )}

        {/* línea de la frase (zona de drop) */}
        <div
          className={`crayon min-h-20 mt-8 flex flex-wrap items-center justify-center gap-3 p-4 ${shake ? 'animate-shake' : ''}`}
          style={{ background: 'var(--papel-2)', borderStyle: 'dashed' }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
          onDrop={(e) => { e.preventDefault(); const id = Number(e.dataTransfer.getData('tokenId')); const t = banco.find((x) => x.id === id); if (t) aLinea(t) }}
        >
          {linea.length === 0 && <span className="mano text-base" style={{ opacity: 0.55 }}>Arrastra o toca las palabras aquí…</span>}
          {linea.map((t, i) => (
            <button
              key={t.id}
              onClick={() => aBanco(t)}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('lineaId', String(t.id))}
              disabled={bloqueado}
              className={`crayon mano ${i % 2 ? 'crayon-2' : ''} px-4 py-2 text-xl text-white active:scale-95 cursor-grab`}
              style={{ background: 'var(--cera-verde)' }}
            >
              {t.palabra}
            </button>
          ))}
        </div>

        {/* banco */}
        <div
          className="flex flex-wrap justify-center gap-4 mt-8"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
          onDrop={(e) => { e.preventDefault(); const id = Number(e.dataTransfer.getData('lineaId')); const t = linea.find((x) => x.id === id); if (t) aBanco(t) }}
        >
          {banco.map((t, i) => (
            <button
              key={t.id}
              onClick={() => aLinea(t)}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('tokenId', String(t.id))}
              disabled={bloqueado}
              className={`crayon mano ${i % 2 ? 'crayon-2' : ''} ${['tilt-1', 'tilt-2', 'tilt-3'][i % 3]} px-4 py-2 text-xl text-white hover:-translate-y-1 transition-transform active:scale-95 cursor-grab`}
              style={{ background: 'var(--cera-azul)' }}
            >
              {t.palabra}
            </button>
          ))}
        </div>

        <button
          onClick={comprobar}
          disabled={bloqueado || linea.length !== correcta.length}
          className="crayon mano mt-10 px-6 py-2.5 text-xl text-white disabled:opacity-40"
          style={{ background: 'var(--cera-coral)' }}
        >
          Comprobar
        </button>
      </main>
    </div>
  )
}
