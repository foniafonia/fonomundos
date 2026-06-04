import FeedbackBtn from './FeedbackBtn'
/**
 * Une parejas (Actividad 2 fonémica y silábica).
 * Gesto real: arrastrar desde la columna izquierda y soltar sobre la pareja derecha.
 * También funciona con tap (selecciona izquierda → tap derecha).
 */
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { PAREJAS_SONIDO_INICIAL, PAREJAS_SILABA_INICIAL, emojiDe } from '../data/guia'
import { barajar } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'

const POR_RONDA = 4

interface Props {
  pacienteId: string
  tipo: 'sonido' | 'silaba'
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

interface Par { pid: number; izq: string; der: string }

export default function UnirParejas({ pacienteId, tipo, onFinish, onSalir }: Props) {
  const sesion = useSesion(
    pacienteId,
    tipo === 'sonido' ? 'unir-sonido' : 'unir-silaba',
    tipo === 'sonido' ? 'fonologica' : 'silabica',
  )

  const grupos = useRef<Par[][]>(
    (() => {
      const base = tipo === 'sonido' ? PAREJAS_SONIDO_INICIAL : PAREJAS_SILABA_INICIAL
      // Filtrar pares donde izq === der (placeholders pendientes de emoji)
      const pares = barajar(base.filter(([izq, der]) => izq !== der)).map(([izq, der], pid) => ({ pid, izq, der }))
      const out: Par[][] = []
      for (let i = 0; i < pares.length; i += POR_RONDA) out.push(pares.slice(i, i + POR_RONDA))
      return out.filter((g) => g.length >= 2)
    })(),
  )

  const [ronda, setRonda] = useState(0)
  const grupo = grupos.current[ronda]
  // columna derecha barajada por ronda
  const derechas = useRef(grupos.current.map((g) => barajar(g)))

  const [hechas, setHechas] = useState<Set<number>>(new Set())
  const [sel, setSel] = useState<number | null>(null)          // pid seleccionado (tap mode)
  const [bloqueado, setBloqueado] = useState(false)
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shakePid, setShakePid] = useState<number | null>(null)
  const errores = useRef(0)
  const inicio = useRef(Date.now())

  // drag & drop
  const [dragging, setDragging] = useState<Par | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const derRefs = useRef<Map<number, HTMLElement>>(new Map())
  const movido = useRef(false)

  function conectar(par: Par) {
    if (bloqueado || hechas.has(par.pid)) return
    hablar(par.der)
    const nuevas = new Set(hechas).add(par.pid)
    setHechas(nuevas)
    setSel(null)
    sesion.registrar({ acierto: true, intentos: 1, ayudaUsada: false, tiempoMs: Date.now() - inicio.current, dificultad: 2 })
    inicio.current = Date.now()
    if (nuevas.size === grupo.length) {
      setBloqueado(true)
      setRefuerzo({ msg: '¡Bien unido!', quien: ronda % 2 ? 'rana' : 'pato' })
      setTimeout(() => {
        setRefuerzo(null)
        if (ronda + 1 >= grupos.current.length) { onFinish(sesion.finalizar()); return }
        setRonda(ronda + 1)
        setHechas(new Set())
        setBloqueado(false)
        errores.current = 0
      }, 1500)
    }
  }

  function fallo(pid: number) {
    errores.current += 1
    setShakePid(pid)
    setTimeout(() => setShakePid(null), 350)
  }

  // tap handler derecha
  function tapDer(par: Par) {
    if (bloqueado || hechas.has(par.pid)) return
    if (sel === null) return          // no hay izquierda seleccionada
    if (sel === par.pid) conectar(par)
    else fallo(par.pid)
  }

  // pointer down en izquierda
  function onIzqDown(e: React.PointerEvent, par: Par) {
    if (bloqueado || hechas.has(par.pid)) return
    e.preventDefault()
    movido.current = false
    setDragging(par)
    setGhost({ x: e.clientX, y: e.clientY })
    setSel(par.pid)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  function onGlobalMove(e: React.PointerEvent) {
    if (!dragging) return
    movido.current = true
    setGhost({ x: e.clientX, y: e.clientY })
  }

  function onGlobalUp(e: React.PointerEvent) {
    if (!dragging) return
    const d = dragging
    setDragging(null)
    setGhost(null)
    if (!movido.current) return   // tap → handled by tapDer (o queda sel)
    // comprobar sobre qué elemento soltó
    let matched: Par | null = null
    for (const [pid, el] of derRefs.current) {
      const r = el.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        matched = grupo.find((p) => p.pid === pid) ?? null
        break
      }
    }
    if (!matched) { setSel(null); return }
    if (matched.pid === d.pid) conectar(matched)
    else fallo(matched.pid)
    setSel(null)
  }

  function Carta({ palabra, estado }: { palabra: string; estado: 'idle' | 'sel' | 'done' | 'shake' }) {
    const bg = estado === 'done' ? 'var(--cera-verde)' : estado === 'sel' ? 'var(--cera-mostaza)' : 'var(--papel-2)'
    return (
      <div className={`crayon flex flex-col items-center py-3 px-3 min-w-24 ${estado === 'shake' ? 'animate-shake' : ''}`}
        style={{ background: bg, color: estado === 'done' ? '#fff' : 'var(--tinta)' }}>
        <span className="text-4xl">{emojiDe(palabra) || '🔊'}</span>
        <span className="mano text-sm font-bold mt-1">{palabra}</span>
        {estado === 'done' && <span className="text-base mt-0.5">✅</span>}
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
      <FeedbackBtn actividad="unir-parejas" itemActual={String("")} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />

      {ghost && dragging && (
        <div className="fixed z-50 pointer-events-none opacity-75 crayon flex flex-col items-center px-3 py-2"
          style={{ left: ghost.x - 40, top: ghost.y - 40, background: 'var(--cera-azul)', color: '#fff' }}>
          <span className="text-3xl">{emojiDe(dragging.izq)}</span>
          <span className="mano text-xs">{dragging.izq}</span>
        </div>
      )}

      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Grupo {ronda + 1}/{grupos.current.length}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
          Une por la {tipo === 'sonido' ? 'misma letra inicial' : 'misma sílaba inicial'}
        </p>
        <h1 className="mano text-2xl mt-1">
          {dragging ? `Suelta sobre la pareja de "${dragging.izq}"` : 'Arrastra o toca para unir las parejas'}
        </h1>

        <div className="grid grid-cols-2 gap-6 mt-8">
          {/* columna izquierda */}
          <div className="flex flex-col gap-3">
            {grupo.map((p) => {
              const estado = hechas.has(p.pid) ? 'done' : dragging?.pid === p.pid ? 'sel' : sel === p.pid ? 'sel' : 'idle'
              return (
                <div key={p.pid}
                  onPointerDown={(e) => onIzqDown(e, p)}
                  className={`cursor-grab active:cursor-grabbing select-none transition-transform hover:-translate-y-0.5 ${estado === 'done' ? 'cursor-default opacity-70' : ''}`}
                  style={{ touchAction: 'none' }}>
                  <Carta palabra={p.izq} estado={estado} />
                </div>
              )
            })}
          </div>

          {/* columna derecha */}
          <div className="flex flex-col gap-3">
            {derechas.current[ronda].map((p) => {
              const estado = hechas.has(p.pid) ? 'done' : shakePid === p.pid ? 'shake' : 'idle'
              return (
                <div key={p.pid}
                  ref={(el) => { if (el) derRefs.current.set(p.pid, el); else derRefs.current.delete(p.pid) }}
                  onClick={() => tapDer(p)}
                  className={`cursor-pointer select-none transition-transform hover:-translate-y-0.5 ${estado === 'done' ? 'cursor-default opacity-70' : ''} ${dragging && !hechas.has(p.pid) ? 'ring-2 ring-[var(--cera-azul)]' : ''}`}>
                  <Carta palabra={p.der} estado={estado} />
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
