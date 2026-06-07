import { useState } from 'react'
import type { Paciente } from '../types'
import { crearPaciente, getPacientes, setPacienteActivo } from '../lib/storage'

interface Props {
  onEntrar: (p: Paciente) => void
  onJugarRapido: () => void
  onVolver: () => void
  onLogopeda: () => void
  onAdmin: () => void
  onComunidad: () => void
}

export default function Home({ onEntrar, onJugarRapido, onVolver, onLogopeda, onAdmin, onComunidad }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>(getPacientes())
  const [popupRGPD, setPopupRGPD] = useState(false)

  function crearNuevo() {
    // Auto-numeración: Paciente 1, 2, 3... (pseudonimización RGPD)
    const n = getPacientes().length + 1
    const p = crearPaciente({ nombre: `Paciente ${n}` })
    setPacientes(getPacientes())
    seleccionar(p)
  }

  function seleccionar(p: Paciente) {
    setPacienteActivo(p.id)
    onEntrar(p)
  }

  // Acceso admin oculto: clic 5 veces en el logo
  const [logoClicks, setLogoClicks] = useState(0)
  function clickLogo() {
    const n = logoClicks + 1
    setLogoClicks(n)
    if (n >= 5) { setLogoClicks(0); onAdmin() }
    setTimeout(() => setLogoClicks(0), 2000)
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 print:hidden"
        style={{ background: 'var(--papel)', borderBottom: '1px solid var(--papel-2)' }}>
        <button onClick={onVolver} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
          ← Portada
        </button>
        <span className="mano text-sm opacity-70">Perfiles</span>
      </div>

      {/* Popup RGPD */}
      {popupRGPD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,63,53,0.6)' }}>
          <div className="crayon w-full max-w-md p-5 text-[var(--tinta)]" style={{ background: 'var(--papel)' }}>
            <h2 className="mano text-xl mb-2">🔒 Protección de datos (RGPD)</h2>
            <p className="mano text-base mb-3">
              FonoMundos trabaja con datos de salud de menores.
              Para cumplir con la <b>LOPDGDD y el RGPD</b>, los perfiles
              se identifican con un <b>código numérico</b> (Paciente 1, 2, 3…).
            </p>
            <p className="mano text-sm mb-3" style={{ opacity: 0.7 }}>
              La relación entre el código y la identidad real del menor
              reside <b>exclusivamente en tus archivos privados</b>.
              FonoMundos no almacena nombres ni datos identificativos.
            </p>
            <p className="mano text-sm mb-4" style={{ color: 'var(--cera-coral)' }}>
              Al usar esta herramienta confirmas que cuentas con el
              consentimiento informado de los tutores legales del menor.
            </p>
            <button onClick={() => setPopupRGPD(false)}
              className="crayon mano w-full py-3 text-lg text-white"
              style={{ background: 'var(--cera-verde)' }}>
              Entendido — usar con responsabilidad
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
        {/* Logo con acceso admin oculto (5 clics) */}
        <div className="text-center mb-4 sm:mb-8">
          <button onClick={clickLogo} className="mb-1 bg-transparent text-5xl border-0 cursor-pointer select-none sm:mb-2 sm:text-6xl">🦉</button>
          <h1 className="mano text-4xl tilt-3 sm:text-5xl" style={{ color: 'var(--tinta)' }}>FonoMundos</h1>
          <p className="mano mt-1 text-base sm:text-lg" style={{ color: 'var(--cera-lila)' }}>
            Herramienta de cribado orientativo de conciencia fonológica
          </p>
          {/* Banner disclaimer */}
          <div className="crayon inline-block mt-2 px-3 py-1 mano text-xs" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            ⚠️ Uso orientativo — no diagnóstico clínico
          </div>
        </div>

        <button
          onClick={onJugarRapido}
          className="crayon mano mb-4 w-full px-5 py-4 text-center text-2xl font-black text-white transition-transform active:scale-[0.98]"
          style={{ background: 'var(--cera-verde)' }}
        >
          🎮 Jugar ahora sin perfiles
        </button>

        {/* Perfiles */}
        <div className="crayon mb-4 p-4 sm:p-5" style={{ background: 'var(--papel-2)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mano text-xl sm:text-2xl">¿Quién va a jugar?</h2>
            <button onClick={() => setPopupRGPD(true)} className="mano text-xs opacity-50 hover:opacity-100">🔒 RGPD</button>
          </div>
          {pacientes.length === 0 && (
            <p className="mano text-base mb-3" style={{ opacity: 0.6 }}>Aún no hay perfiles. Crea el primero.</p>
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
          <button onClick={crearNuevo}
            aria-label={`Nuevo perfil Paciente ${pacientes.length + 1}`}
            className="crayon mano w-full py-2.5 text-lg text-white"
            style={{ background: 'var(--cera-verde)' }}>
            + Nuevo perfil
          </button>
          <p className="mano text-xs text-center mt-2" style={{ opacity: 0.5 }}>
            Los perfiles se identifican con número por protección de datos
          </p>
        </div>

        {/* Modo logopeda */}
        <button
          onClick={onLogopeda}
          className="crayon tilt-2 w-full px-4 py-4 text-left flex items-center gap-3 hover:-translate-y-0.5 transition-transform mb-4"
          style={{ background: 'var(--cera-azul)' }}
        >
          <span className="text-3xl">🩺</span>
          <span>
            <span className="mano block text-xl text-white">Modo Logopeda</span>
            <span className="mano block text-sm text-white/85">Fichas, índices clínicos, patrones e informes</span>
          </span>
        </button>

        {/* Comunidad */}
        <button
          onClick={onComunidad}
          className="crayon tilt-1 w-full px-4 py-3 flex items-center gap-3 hover:-translate-y-0.5 transition-transform"
          style={{ background: 'var(--papel-2)' }}
        >
          <span className="text-2xl">🤝</span>
          <span>
            <span className="mano block text-base">Construcción Colaborativa</span>
            <span className="mano block text-xs" style={{ opacity: 0.6 }}>Reportar · Proponer · Roadmap · @LOGOPED_IA</span>
          </span>
        </button>
      </div>
    </div>
  )
}
