/**
 * Pseudopalabras — Test de estrés del sistema fonológico
 * Los niños con dislexia usan memoria visual para compensar en palabras reales.
 * Las pseudopalabras eliminan ese apoyo y revelan el déficit real.
 *
 * Actividad: ¿cuántos sonidos tiene esta pseudopalabra?
 * El niño no puede apoyarse en la memoria visual → fonología pura.
 */
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { barajar, ColaNoRepetida } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'
import FeedbackBtn from './FeedbackBtn'

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Pseudo {
  palabra: string
  fonemas: string[]
  silabas: string[]
  emoji: string  // imagen inventada para dar contexto visual neutro
}

// Corpus de pseudopalabras en español (estructura fonológica válida, sin significado)
const PSEUDOPALABRAS: Pseudo[] = [
  { palabra: 'FATO',  fonemas: ['F','A','T','O'],       silabas: ['FA','TO'],     emoji: '🟣' },
  { palabra: 'LIBO',  fonemas: ['L','I','B','O'],       silabas: ['LI','BO'],     emoji: '🟤' },
  { palabra: 'TUMI',  fonemas: ['T','U','M','I'],       silabas: ['TU','MI'],     emoji: '🔶' },
  { palabra: 'GADE',  fonemas: ['G','A','D','E'],       silabas: ['GA','DE'],     emoji: '🔷' },
  { palabra: 'VEMA',  fonemas: ['B','E','M','A'],       silabas: ['VE','MA'],     emoji: '🟥' },
  { palabra: 'NIPO',  fonemas: ['N','I','P','O'],       silabas: ['NI','PO'],     emoji: '🟦' },
  { palabra: 'FUBE',  fonemas: ['F','U','B','E'],       silabas: ['FU','BE'],     emoji: '🟨' },
  { palabra: 'MOGE',  fonemas: ['M','O','G','E'],       silabas: ['MO','GE'],     emoji: '🟩' },
  { palabra: 'SUTO',  fonemas: ['S','U','T','O'],       silabas: ['SU','TO'],     emoji: '🟫' },
  { palabra: 'DIFE',  fonemas: ['D','I','F','E'],       silabas: ['DI','FE'],     emoji: '⬛' },
  { palabra: 'PULO',  fonemas: ['P','U','L','O'],       silabas: ['PU','LO'],     emoji: '⬜' },
  { palabra: 'RIBO',  fonemas: ['R','I','B','O'],       silabas: ['RI','BO'],     emoji: '🔸' },
  { palabra: 'CALITO',fonemas: ['K','A','L','I','T','O'], silabas: ['CA','LI','TO'], emoji: '🔹' },
  { palabra: 'MOPENA',fonemas: ['M','O','P','E','N','A'], silabas: ['MO','PE','NA'], emoji: '🔺' },
  { palabra: 'FETINA',fonemas: ['F','E','T','I','N','A'], silabas: ['FE','TI','NA'], emoji: '🔻' },
]

const MODO: 'fonemas' | 'silabas' = 'fonemas' // extensible

function opcionesNum(correcto: number): { opciones: string[]; correcta: string } {
  const rango = new Set([correcto])
  for (let d = 1; rango.size < 4 && d <= 5; d++) {
    if (correcto - d >= 1) rango.add(correcto - d)
    if (rango.size < 4 && correcto + d <= 8) rango.add(correcto + d)
  }
  return { opciones: barajar([...rango]).map(String), correcta: String(correcto) }
}

const cola = new ColaNoRepetida(PSEUDOPALABRAS)
const RONDAS = 8

export default function Pseudopalabras({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'pseudopalabras', 'fonologica')
  const [indice, setIndice] = useState(0)
  const [pseudo, setPseudo] = useState<Pseudo>(() => cola.siguiente())
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [elegida, setElegida] = useState<string | null>(null)
  const errores = useRef(0)
  const inicio = useRef(Date.now())

  const correcto = MODO === 'fonemas' ? pseudo.fonemas.length : pseudo.silabas.length
  const { opciones, correcta } = opcionesNum(correcto)

  function elegir(op: string) {
    if (bloqueado) return
    setBloqueado(true)
    setElegida(op)
    const acierto = op === correcta
    if (!acierto) errores.current++
    hablar(acierto ? `¡Correcto! ${pseudo.palabra} tiene ${correcto} sonidos: ${pseudo.fonemas.join(', ')}` : `Tiene ${correcto} sonidos`)
    sesion.registrar({
      acierto, intentos: errores.current + (acierto ? 0 : 0) + 1,
      ayudaUsada: false, tiempoMs: Date.now() - inicio.current, dificultad: 3,
    })
    setRefuerzo({ msg: acierto ? '¡Correcto!' : `Son ${correcto} sonidos: ${pseudo.fonemas.join('-')}`, quien: indice % 2 === 0 ? 'pato' : 'rana' })
    setTimeout(() => {
      setRefuerzo(null)
      if (indice + 1 >= RONDAS) { onFinish(sesion.finalizar()); return }
      setIndice(indice + 1)
      setPseudo(cola.siguiente())
      errores.current = 0
      inicio.current = Date.now()
      setBloqueado(false)
      setElegida(null)
    }, 1600)
  }

  const progreso = (indice / RONDAS) * 100

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="pseudopalabras" itemActual={pseudo.palabra} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }}>
          <div className="h-full transition-all" style={{ width: `${progreso}%`, background: 'var(--cera-lila)' }} />
        </div>
        <span className="mano text-lg">{indice + 1}/{RONDAS}</span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Pseudopalabras · Fonología pura</p>
        <h1 className="mano text-3xl mt-1">¿Cuántos sonidos tiene?</h1>
        <p className="mano text-sm mt-1" style={{ opacity: 0.6 }}>Esta palabra es inventada — ¡no existe en español!</p>

        <div className="mt-6 inline-flex flex-col items-center">
          <span className="text-7xl">{pseudo.emoji}</span>
          <button onClick={() => hablar(pseudo.palabra)}
            className="crayon mano mt-3 px-6 py-2 text-3xl tracking-widest"
            style={{ background: 'var(--cera-lila)', color: '#fff' }}>
            🔊 {pseudo.palabra}
          </button>
          <span className="mano text-sm mt-2" style={{ opacity: 0.5 }}>(palabra inventada)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm mx-auto">
          {opciones.map((op, i) => (
            <button key={op} onClick={() => elegir(op)} disabled={bloqueado}
              className={`crayon mano ${i % 2 ? 'crayon-2' : ''} py-5 text-4xl text-white`}
              style={{
                background: !bloqueado ? 'var(--cera-azul)' :
                  op === correcta ? 'var(--cera-verde)' :
                  op === elegida ? 'var(--cera-coral)' : 'var(--papel-2)',
                color: bloqueado && op !== correcta && op !== elegida ? 'var(--tinta)' : '#fff',
              }}>
              {op}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
