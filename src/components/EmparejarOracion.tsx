import FeedbackBtn from './FeedbackBtn'
import { useRef, useState } from 'react'
import type { Sesion } from '../types'
import { LEXICO_ORACION_IMAGEN, type OracionImagen } from '../data/guia'
import { barajar } from '../data/palabras'
import { useSesion } from '../lib/useSesion'
import { hablar } from '../lib/voz'
import { Refuerzo } from './Personaje'

// Actividad 4 (léxica): empareja cada oración con su imagen.
const POR_RONDA = 4

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

export default function EmparejarOracion({ pacienteId, onFinish, onSalir }: Props) {
  const sesion = useSesion(pacienteId, 'emparejar-oracion', 'lexica')
  const grupos = useRef<OracionImagen[][]>(
    (() => {
      const mezcla = barajar(LEXICO_ORACION_IMAGEN)
      const out: OracionImagen[][] = []
      for (let i = 0; i < mezcla.length; i += POR_RONDA) out.push(mezcla.slice(i, i + POR_RONDA))
      return out.filter((g) => g.length >= 2)
    })(),
  )
  const [ronda, setRonda] = useState(0)
  const grupo = grupos.current[ronda]
  const [imagenes] = useState(() => grupos.current.map((g) => barajar(g)))
  const [selOracion, setSelOracion] = useState<string | null>(null)
  const [hechas, setHechas] = useState<Set<string>>(new Set())
  const errores = useRef(0)
  const inicio = useRef(Date.now())
  const [refuerzo, setRefuerzo] = useState<{ msg: string; quien: 'pato' | 'rana' } | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [bloqueado, setBloqueado] = useState(false)

  function intentar(imagen: OracionImagen) {
    if (bloqueado || !selOracion || hechas.has(imagen.oracion)) return
    if (imagen.oracion === selOracion) {
      hablar(imagen.oracion)
      const nuevas = new Set(hechas).add(imagen.oracion)
      setHechas(nuevas)
      setSelOracion(null)
      sesion.registrar({
        acierto: true, intentos: 1, ayudaUsada: false,
        tiempoMs: Date.now() - inicio.current, dificultad: 2,
      })
      inicio.current = Date.now()
      if (nuevas.size === grupo.length) {
        setBloqueado(true)
        setRefuerzo({ msg: '¡Bien emparejado!', quien: ronda % 2 ? 'rana' : 'pato' })
        setTimeout(() => {
          setRefuerzo(null)
          if (ronda + 1 >= grupos.current.length) { onFinish(sesion.finalizar()); return }
          setRonda(ronda + 1)
          setHechas(new Set())
          setBloqueado(false)
        }, 1500)
      }
    } else {
      errores.current += 1
      setShakeId(imagen.oracion)
      setTimeout(() => setShakeId(null), 350)
    }
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="emparejar-oracion" itemActual={String("")} />
      <Refuerzo visible={!!refuerzo} mensaje={refuerzo?.msg ?? ''} personaje={refuerzo?.quien} />
      <header className="flex items-center gap-3 p-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Grupo {ronda + 1}/{grupos.current.length}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Conciencia léxica · Une frase y dibujo</p>
        <h1 className="mano text-2xl mt-1">Toca una frase y luego su dibujo</h1>

        <div className="grid grid-cols-2 gap-6 mt-8 text-left">
          {/* oraciones */}
          <div className="flex flex-col gap-3">
            {grupo.map((o) => {
              const hecho = hechas.has(o.oracion)
              const sel = selOracion === o.oracion
              return (
                <button
                  key={o.oracion}
                  onClick={() => !hecho && setSelOracion(o.oracion)}
                  disabled={hecho || bloqueado}
                  className="crayon mano px-3 py-3 text-base text-left transition-transform"
                  style={{
                    background: hecho ? 'var(--cera-verde)' : sel ? 'var(--cera-mostaza)' : 'var(--papel-2)',
                    color: hecho ? '#fff' : 'var(--tinta)',
                  }}
                >
                  {hecho ? '✅ ' : ''}{o.oracion}
                </button>
              )
            })}
          </div>
          {/* imágenes */}
          <div className="grid grid-cols-2 gap-3">
            {imagenes[ronda].map((o) => {
              const hecho = hechas.has(o.oracion)
              return (
                <button
                  key={o.oracion}
                  onClick={() => intentar(o)}
                  disabled={hecho || bloqueado}
                  className={`crayon flex items-center justify-center py-4 text-5xl transition-transform hover:-translate-y-1 ${shakeId === o.oracion ? 'animate-shake' : ''}`}
                  style={{ background: hecho ? 'var(--cera-verde)' : 'var(--papel-2)', opacity: hecho ? 0.5 : 1 }}
                >
                  {o.emoji}
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
