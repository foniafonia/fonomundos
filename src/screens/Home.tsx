import { useState } from 'react'
import type { Paciente } from '../types'
import { crearPaciente, getPacientes, setPacienteActivo } from '../lib/storage'

interface Props {
  onEntrar: (p: Paciente) => void
  onLogopeda: () => void
}

export default function Home({ onEntrar, onLogopeda }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>(getPacientes())
  const [nombre, setNombre] = useState('')

  function crear() {
    if (!nombre.trim()) return
    const p = crearPaciente({ nombre: nombre.trim() })
    setPacientes(getPacientes())
    setNombre('')
    seleccionar(p)
  }

  function seleccionar(p: Paciente) {
    setPacienteActivo(p.id)
    onEntrar(p)
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="text-center mb-10">
          <div className="text-6xl mb-2">🦉</div>
          <h1 className="mano text-5xl tilt-3" style={{ color: 'var(--tinta)' }}>FonoMundos</h1>
          <p className="mano text-lg mt-2" style={{ color: 'var(--cera-lila)' }}>
            Plataforma terapéutica de conciencia fonológica y silábica
          </p>
        </div>

        <div className="crayon p-5 mb-6" style={{ background: 'var(--papel-2)' }}>
          <h2 className="mano text-2xl mb-3">¿Quién va a jugar?</h2>
          {pacientes.length === 0 && (
            <p className="mano text-base mb-3" style={{ color: 'var(--tinta)', opacity: 0.6 }}>Aún no hay perfiles. Crea el primero.</p>
          )}
          <div className="grid gap-3 mb-4">
            {pacientes.map((p, i) => (
              <button
                key={p.id}
                onClick={() => seleccionar(p)}
                className={`crayon ${i % 2 ? 'crayon-2 tilt-2' : 'tilt-1'} flex items-center justify-between px-4 py-3 text-left hover:-translate-y-0.5 transition-transform`}
                style={{ background: 'var(--papel)' }}
              >
                <span className="mano text-xl">{p.nombre}</span>
                <span className="mano text-base" style={{ color: 'var(--cera-coral)' }}>⭐ {p.xp} · 🪙 {p.monedas}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && crear()}
              placeholder="Nombre del nuevo perfil"
              className="crayon mano flex-1 px-4 py-3 text-lg outline-none"
              style={{ background: 'var(--papel)', color: 'var(--tinta)' }}
            />
            <button onClick={crear} className="crayon mano px-5 py-3 text-lg text-white" style={{ background: 'var(--cera-verde)' }}>
              Crear
            </button>
          </div>
        </div>

        <button
          onClick={onLogopeda}
          className="crayon tilt-2 w-full px-4 py-4 text-left flex items-center gap-3 hover:-translate-y-0.5 transition-transform"
          style={{ background: 'var(--cera-azul)' }}
        >
          <span className="text-3xl">🩺</span>
          <span>
            <span className="mano block text-xl text-white">Modo Logopeda</span>
            <span className="mano block text-sm text-white/85">Fichas, índices clínicos, patrones e informes</span>
          </span>
        </button>
      </div>
    </div>
  )
}
