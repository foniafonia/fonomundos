import type { Sesion } from '../types'
import { calcularIndices } from '../lib/scoring'
import RadarIndices from '../components/RadarIndices'

interface Props {
  sesion: Sesion
  onRepetir: () => void
  onVolver: () => void
  onVolverPanel?: () => void  // si existe → muestra botón "Ver progreso" que recarga el panel
}

export default function ResultadoSesion({ sesion, onRepetir, onVolver, onVolverPanel }: Props) {
  const idx = calcularIndices(sesion.resultados)
  const aciertos = sesion.resultados.filter((r) => r.acierto).length
  const total = sesion.resultados.length
  const pct = total ? Math.round((aciertos / total) * 100) : 0
  const monedas = aciertos * 5
  const xp = aciertos * 10

  const cara = pct >= 80 ? '🏆' : pct >= 50 ? '😃' : '💪'

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <div className="max-w-xl mx-auto px-5 py-10 text-center">
        <div className="text-7xl mb-2 animate-pop">{cara}</div>
        <h1 className="mano text-4xl tilt-3">¡Sesión terminada!</h1>
        <p className="mano text-xl mt-1" style={{ color: 'var(--cera-verde)' }}>{aciertos} de {total} aciertos ({pct}%)</p>

        <div className="flex justify-center gap-4 my-6">
          <div className="crayon mano tilt-1 px-5 py-3 text-xl" style={{ background: 'var(--cera-mostaza)' }}>🪙 +{monedas}<div className="text-sm" style={{ opacity: 0.7 }}>monedas</div></div>
          <div className="crayon mano tilt-2 px-5 py-3 text-xl" style={{ background: 'var(--cera-azul)', color: '#fff' }}>⭐ +{xp}<div className="text-sm text-white/80">XP</div></div>
        </div>

        <div className="crayon p-4 mt-4" style={{ background: 'var(--papel-2)' }}>
          <h2 className="mano text-lg mb-1">Índices de esta sesión</h2>
          <RadarIndices indices={idx} />
        </div>

        <div className="flex gap-3 mt-6 flex-wrap">
          <button onClick={onVolver} className="crayon mano tilt-1 flex-1 px-4 py-3 text-lg" style={{ background: 'var(--papel-2)' }}>
            🗺️ Mapa
          </button>
          <button onClick={onRepetir} className="crayon mano tilt-2 flex-1 px-4 py-3 text-lg text-white" style={{ background: 'var(--cera-verde)' }}>
            🔄 Repetir
          </button>
          {onVolverPanel && (
            <button onClick={onVolverPanel} className="crayon mano flex-1 px-4 py-3 text-lg text-white" style={{ background: 'var(--cera-azul)' }}>
              📈 Ver progreso
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
