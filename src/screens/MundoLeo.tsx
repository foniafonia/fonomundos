/**
 * Mundo LEO — prototipo en pruebas.
 *
 * Corre aislado dentro de un iframe: trae su propio currículo, su motor y su
 * capa de datos. No toca guia.ts, ni scoring.ts, ni Supabase, ni la ficha de
 * ningún paciente.
 *
 * Lo único que aporta FonoMundos es el envoltorio: el botón de salir y el 🐛,
 * que va POR ENCIMA del iframe. Así los reportes caen en el mismo monitor que
 * los del resto de actividades sin tener que tocar nada dentro de LEO.
 */
import { useEffect, useRef, useState } from 'react'
import FeedbackBtn from '../components/FeedbackBtn'

interface Props {
  onSalir: () => void
}

export default function MundoLeo({ onSalir }: Props) {
  const [cargando, setCargando] = useState(true)
  const marco = useRef<HTMLIFrameElement>(null)

  // El fichero pesa 7 MB y en un móvil con poca red tarda. Sin este aviso
  // parece que la pestaña está rota.
  useEffect(() => {
    const id = window.setTimeout(() => setCargando(false), 20000)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0d0a07' }}>
      <FeedbackBtn actividad="mundo-leo" itemActual="prototipo" />

      <header className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: 'var(--papel)', borderBottom: '1px solid var(--papel-2)' }}>
        <button
          onClick={onSalir}
          className="crayon mano px-4 py-1.5 text-base"
          style={{ background: 'var(--papel-2)' }}
        >
          ← Salir
        </button>
        <span className="mano text-base" style={{ color: 'var(--cera-lila)' }}>
          Mundo LEO
        </span>
        <span className="mano text-xs px-2 py-0.5 rounded-full text-white"
          style={{ background: 'var(--cera-coral)' }}>
          en pruebas
        </span>
        <span className="mano text-xs ml-auto hidden sm:block" style={{ opacity: 0.55 }}>
          Prototipo aparte · no guarda en la ficha del paciente
        </span>
      </header>

      <div className="relative flex-1">
        {cargando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <div className="text-5xl animate-pulse">🧱</div>
            <p className="mano text-lg">Cargando el mundo…</p>
            <p className="mano text-sm" style={{ opacity: 0.6 }}>
              Son 7 MB. La primera vez tarda un poco.
            </p>
          </div>
        )}
        <iframe
          ref={marco}
          src="/mundo-leo.html"
          title="Mundo LEO"
          onLoad={() => setCargando(false)}
          allow="autoplay; microphone"
          className="w-full h-full border-0 block"
          style={{ visibility: cargando ? 'hidden' : 'visible' }}
        />
      </div>
    </div>
  )
}
