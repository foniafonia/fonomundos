/**
 * Mundo 2 — Conciencia de Rima
 * Puente crítico entre silábica y fonémica según la evidencia neuropsicológica.
 * Un déficit en rimas es señal clínica temprana de dislexia.
 */
import type { Paciente } from '../types'
import { setVoz, vozActivada } from '../lib/voz'
import { useState } from 'react'
import type { Especial } from './Mundo1'

// Actividades de rima disponibles
const ACTIVIDADES_RIMAS = [
  {
    id: 'detectar-rima',
    emoji: '🎵',
    titulo: 'Detecta la rima',
    desc: '¿Estas dos palabras riman? La sensibilidad a la rima predice el éxito lector.',
    dom: 'rimas' as const,
  },
  {
    id: 'intruso-rima',
    emoji: '🔍',
    titulo: 'El intruso rima',
    desc: '¿Cuál de estas palabras no rima con las demás?',
    dom: 'rimas' as const,
  },
]

interface Props {
  paciente: Paciente
  onEspecial: (e: Especial) => void
  onSalir: () => void
}

const TILTS = ['tilt-1', 'tilt-2', 'tilt-3']

export default function Mundo2Rimas({ paciente, onEspecial, onSalir }: Props) {
  const [voz, setV] = useState(vozActivada())

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <header className="flex items-center justify-between mb-6">
          <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>
            ← Perfiles
          </button>
          <div className="mano text-lg" style={{ color: 'var(--cera-coral)' }}>
            {paciente.nombre} · ⭐ {paciente.xp} · 🪙 {paciente.monedas}
          </div>
          <button
            onClick={() => { const nv = !voz; setVoz(nv); setV(nv) }}
            className="crayon mano px-4 py-1.5 text-base"
            style={{ background: 'var(--papel-2)' }}
          >
            {voz ? '🔊 Voz' : '🔇 Voz'}
          </button>
        </header>

        <div className="text-center mb-8">
          <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>Mundo 2</span>
          <h1 className="mano text-4xl tilt-3">Conciencia de Rima</h1>
          <p className="mano text-base mt-2" style={{ opacity: 0.7 }}>
            El puente entre las sílabas y los sonidos. Fundamental para la lectura.
          </p>
          <div className="crayon inline-block mt-3 px-4 py-1.5 mano text-sm"
            style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            💡 Un déficit en rimas es señal temprana de dislexia
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {ACTIVIDADES_RIMAS.map((a, i) => (
            <button
              key={a.id}
              onClick={() => onEspecial(a.id as Especial)}
              className={`crayon ${i % 2 ? 'crayon-2' : ''} ${TILTS[i % 3]} p-5 text-left transition-transform hover:-translate-y-1`}
              style={{ background: 'var(--papel-2)' }}
            >
              <div className="text-4xl mb-2">{a.emoji}</div>
              <h2 className="mano text-2xl">{a.titulo}</h2>
              <p className="mano text-base mt-1" style={{ opacity: 0.7 }}>{a.desc}</p>
              <span className="crayon mano inline-block mt-3 text-sm px-3 py-0.5 text-white"
                style={{ background: 'var(--cera-lila)' }}>
                Rimas
              </span>
            </button>
          ))}
        </div>

        {/* Próximamente en Mundo 2 */}
        <div className="mt-8 grid grid-cols-2 gap-4 opacity-60">
          {['Genera una rima', 'Completa la rima', 'Cadena de rimas', 'Rima o no rima'].map((m, i) => (
            <div key={m} className={`crayon mano ${TILTS[i % 3]} px-4 py-3 text-base`}
              style={{ background: 'var(--papel)', borderStyle: 'dashed' }}>
              🔒 {m}
              <span className="block text-sm" style={{ opacity: 0.6 }}>Próximamente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
