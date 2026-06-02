import { useEffect, useMemo, useRef, useState } from 'react'
import type { DefinicionActividad, ResultadoRonda, Ronda, Sesion } from '../types'
import { ajustarDificultad } from '../lib/adaptacion'
import { hablar } from '../lib/voz'
import { guardarSesion, getPacientes, guardarPaciente } from '../lib/storage'
import { uid } from '../lib/id'
import FeedbackBtn from './FeedbackBtn'

const RONDAS_POR_SESION = 10

interface Props {
  actividad: DefinicionActividad
  pacienteId: string
  onFinish: (sesion: Sesion) => void
  onSalir: () => void
}

export default function JugarActividad({ actividad, pacienteId, onFinish, onSalir }: Props) {
  const [dificultad, setDificultad] = useState(1)
  const [indice, setIndice] = useState(0)
  const [ronda, setRonda] = useState<Ronda>(() => actividad.generar(1))
  const [intentos, setIntentos] = useState(1)
  const [ayudaUsada, setAyudaUsada] = useState(false)
  const [mostrarAyuda, setMostrarAyuda] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'mal' | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [erroneas, setErroneas] = useState<Set<string>>(new Set())
  const resultados = useRef<ResultadoRonda[]>([])
  const inicioRonda = useRef<number>(Date.now())
  const inicioSesion = useRef<number>(Date.now())

  useEffect(() => {
    inicioRonda.current = Date.now()
    hablar(ronda.locucion)
  }, [ronda])

  const aciertos = resultados.current.filter((r) => r.acierto).length

  function siguienteRonda(nuevosResultados: ResultadoRonda[]) {
    const dif = ajustarDificultad(dificultad, nuevosResultados)
    setDificultad(dif)
    if (indice + 1 >= RONDAS_POR_SESION) {
      finalizar(nuevosResultados)
      return
    }
    setIndice((i) => i + 1)
    setIntentos(1)
    setAyudaUsada(false)
    setMostrarAyuda(false)
    setFeedback(null)
    setErroneas(new Set())
    setBloqueado(false)
    setRonda(actividad.generar(dif))
  }

  function finalizar(res: ResultadoRonda[]) {
    const sesion: Sesion = {
      id: uid(),
      pacienteId,
      inicio: inicioSesion.current,
      fin: Date.now(),
      resultados: res,
    }
    guardarSesion(sesion)
    // gamificación
    const pacientes = getPacientes()
    const p = pacientes.find((x) => x.id === pacienteId)
    if (p) {
      const ok = res.filter((r) => r.acierto).length
      p.monedas += ok * 5
      p.xp += ok * 10
      guardarPaciente(p)
    }
    onFinish(sesion)
  }

  function elegir(id: string) {
    if (bloqueado) return
    const acierto = id === ronda.correctaId
    if (acierto) {
      setBloqueado(true)
      setFeedback('ok')
      hablar('¡Muy bien!')
      const r: ResultadoRonda = {
        actividadId: actividad.id,
        dominio: actividad.dominio,
        acierto: true,
        intentos,
        ayudaUsada,
        tiempoMs: Date.now() - inicioRonda.current,
        dificultad: ronda.dificultad,
        ts: Date.now(),
      }
      const acc = [...resultados.current, r]
      resultados.current = acc
      setTimeout(() => siguienteRonda(acc), 850)
    } else {
      setFeedback('mal')
      setErroneas((s) => new Set(s).add(id))
      const nuevosIntentos = intentos + 1
      // 3 intentos máximo → cuenta como fallo y avanza
      if (nuevosIntentos > 3) {
        setBloqueado(true)
        const r: ResultadoRonda = {
          actividadId: actividad.id,
          dominio: actividad.dominio,
          acierto: false,
          intentos: 3,
          ayudaUsada,
          tiempoMs: Date.now() - inicioRonda.current,
          dificultad: ronda.dificultad,
          ts: Date.now(),
        }
        const acc = [...resultados.current, r]
        resultados.current = acc
        setMostrarAyuda(true)
        setTimeout(() => siguienteRonda(acc), 1600)
      } else {
        setIntentos(nuevosIntentos)
        setTimeout(() => setFeedback(null), 350)
      }
    }
  }

  function pedirAyuda() {
    setAyudaUsada(true)
    setMostrarAyuda(true)
    hablar(ronda.ayuda)
  }

  const progreso = useMemo(() => ((indice) / RONDAS_POR_SESION) * 100, [indice])

  return (
    <div className="papel min-h-full flex flex-col text-[var(--tinta)]">
      <FeedbackBtn actividad={actividad.id} itemActual={ronda.estimuloTexto || ronda.enunciado} />
      {/* barra superior */}
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={onSalir}
          className="crayon mano px-4 py-1.5 text-base"
          style={{ background: 'var(--papel-2)' }}
          aria-label="Salir de la actividad"
        >
          ← Salir
        </button>
        <div className="flex-1 h-4 crayon overflow-hidden" style={{ background: 'var(--papel-2)', padding: 0 }} role="progressbar" aria-valuenow={indice} aria-valuemax={RONDAS_POR_SESION}>
          <div className="h-full transition-all duration-500" style={{ width: `${progreso}%`, background: 'var(--cera-verde)' }} />
        </div>
        <span className="mano text-lg tabular-nums">{indice + 1}/{RONDAS_POR_SESION}</span>
        <span className="mano text-lg" title="Aciertos" style={{ color: 'var(--cera-coral)' }}>⭐ {aciertos}</span>
        <button
          onClick={() => hablar(ronda.locucion)}
          className="crayon mano px-3 py-1.5 text-base"
          style={{ background: 'var(--papel-2)' }}
          aria-label="Repetir locución"
        >
          🔊
        </button>
      </header>

      {/* estímulo + enunciado */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6">
        <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
          {actividad.emoji} {actividad.titulo} · Nivel {ronda.dificultad}
        </span>
        <h1 className="mano text-3xl sm:text-4xl">{ronda.enunciado}</h1>

        {ronda.estimuloEmoji && (
          <div
            key={indice}
            className={`animate-pop flex flex-col items-center gap-2 ${feedback === 'mal' ? 'animate-shake' : ''}`}
          >
            <span className="text-7xl sm:text-8xl drop-shadow">{ronda.estimuloEmoji}</span>
            {ronda.estimuloTexto && (
              <span className="mano text-3xl tracking-wide">{ronda.estimuloTexto}</span>
            )}
          </div>
        )}

        {/* opciones */}
        <div className={`grid gap-4 w-full max-w-xl ${ronda.opciones.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {ronda.opciones.map((o, i) => {
            const esError = erroneas.has(o.id)
            const esCorrecta = bloqueado && o.id === ronda.correctaId
            const bg = esCorrecta ? 'var(--cera-verde)' : esError ? 'var(--cera-coral)' : 'var(--papel-2)'
            return (
              <button
                key={o.id}
                onClick={() => elegir(o.id)}
                disabled={bloqueado || esError}
                className={[
                  'crayon mano min-h-20 px-4 py-4 text-3xl', i % 2 ? 'crayon-2' : '',
                  'flex flex-col items-center justify-center gap-1 select-none active:scale-95 transition-transform hover:-translate-y-1',
                  esError ? 'opacity-60' : '',
                  esCorrecta ? 'text-white' : '',
                ].join(' ')}
                style={{ background: bg }}
              >
                {o.emoji && <span className="text-4xl">{o.emoji}</span>}
                <span>{o.etiqueta}</span>
              </button>
            )
          })}
        </div>

        {/* ayuda */}
        <div className="h-16 flex items-center justify-center">
          {mostrarAyuda ? (
            <p className="crayon mano max-w-md text-base px-4 py-2" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
              💡 {ronda.ayuda}
            </p>
          ) : (
            <button
              onClick={pedirAyuda}
              className="crayon mano px-5 py-2 text-base"
              style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}
            >
              💡 Pista
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
