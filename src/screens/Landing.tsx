/**
 * Landing — Carátula de FonoMundos
 * Pantalla de entrada. Funciona como la portada de un videojuego educativo.
 * Se muestra SIEMPRE antes de cualquier login, selección de paciente o actividad.
 */
import { useEffect, useState } from 'react'

interface Props {
  profesionalId: string | null
  onIniciarSesion: () => void
  onInvitado: () => void
  onContinuar: () => void   // si ya está autenticado
}

const FEATURES = [
  { emoji: '🧩', titulo: 'Fonémico', desc: 'Segmenta cada sonido', color: 'var(--cera-verde)' },
  { emoji: '👏', titulo: 'Silábico', desc: 'Cuenta y clasifica', color: 'var(--cera-azul)' },
  { emoji: '📖', titulo: 'Léxico', desc: 'Palabras y significado', color: 'var(--cera-lila)' },
  { emoji: '🔗', titulo: 'Cadenas', desc: 'Conecta sonidos', color: 'var(--cera-coral)' },
  { emoji: '🎮', titulo: 'Juegos', desc: 'Aprender jugando', color: 'var(--cera-mostaza)' },
  { emoji: '📈', titulo: 'Adaptativo', desc: 'Se ajusta a cada niño', color: 'var(--cera-verde)' },
  { emoji: '📊', titulo: 'Mide', desc: 'Índices automáticos', color: 'var(--cera-azul)' },
  { emoji: '🚀', titulo: 'Evoluciona', desc: 'Visualiza el progreso', color: 'var(--cera-lila)' },
]

export default function Landing({ profesionalId, onIniciarSesion, onInvitado, onContinuar }: Props) {
  const [visible, setVisible] = useState(false)
  const [featuresVisible, setFeaturesVisible] = useState(false)
  const [ctasVisible, setCtasVisible] = useState(false)

  // Animación de entrada escalonada
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100)
    const t2 = setTimeout(() => setFeaturesVisible(true), 600)
    const t3 = setTimeout(() => setCtasVisible(true), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="papel min-h-full text-[var(--tinta)] overflow-x-hidden">
      {/* Textura de fondo sutil */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(74,63,53,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        zIndex: 0,
      }} />

      <div className="relative z-10 max-w-3xl mx-auto px-5 py-8">

        {/* ── CABECERA ── */}
        <div className={`text-center mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
          {/* Personajes */}
          <div className="flex justify-between items-start mb-2 px-4">
            <div className="crayon px-3 py-1.5 text-center" style={{ background: 'var(--cera-mostaza)' }}>
              <span className="text-3xl">🦆</span>
              <p className="mano text-xs">Pato<br/>te acompaña</p>
            </div>
            <div className="text-center">
              <span className="mano text-xs" style={{ color: 'var(--cera-lila)' }}>MUNDO 1</span>
            </div>
            <div className="crayon px-3 py-1.5 text-center" style={{ background: 'var(--cera-verde)' }}>
              <span className="text-3xl">🐸</span>
              <p className="mano text-xs text-white">Rana Gustavo<br/>te anima</p>
            </div>
          </div>

          {/* Título principal */}
          <div className="crayon inline-block px-8 py-3 mb-3" style={{ background: 'var(--papel-2)' }}>
            <h1 className="mano font-black" style={{
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              color: 'var(--tinta)',
              letterSpacing: '-1px',
              lineHeight: 1,
            }}>
              FONOMUNDOS
            </h1>
          </div>

          {/* Subtítulo */}
          <p className="mano text-xl mt-2 px-4" style={{ color: 'var(--tinta)', opacity: 0.85 }}>
            Conciencia fonológica que se <span style={{ color: 'var(--cera-coral)', textDecoration: 'underline' }}>entrena</span>,
            se <span style={{ color: 'var(--cera-azul)', textDecoration: 'underline' }}>mide</span> y
            que <span style={{ color: 'var(--cera-verde)', textDecoration: 'underline' }}>mejoramos juntos</span>.
          </p>
        </div>

        {/* ── GRID DE FEATURES ── */}
        <div className={`mb-6 transition-all duration-700 delay-300 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
            <div className="grid grid-cols-4 gap-3">
              {FEATURES.map((f, i) => (
                <div
                  key={f.titulo}
                  className={`crayon ${i % 2 ? 'crayon-2' : ''} p-2 text-center transition-all`}
                  style={{
                    background: 'var(--papel)',
                    transitionDelay: `${i * 60}ms`,
                    opacity: featuresVisible ? 1 : 0,
                    transform: featuresVisible ? 'scale(1)' : 'scale(0.8)',
                  }}
                >
                  <div className="text-2xl mb-0.5">{f.emoji}</div>
                  <div className="mano text-sm font-black" style={{ color: 'var(--tinta)' }}>{f.titulo}</div>
                  <div className="mano text-xs mt-0.5" style={{ opacity: 0.65 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MENSAJE COMUNIDAD ── */}
        <div className={`grid grid-cols-2 gap-3 mb-6 transition-all duration-700 ${featuresVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Lista de acciones */}
          <div className="crayon tilt-1 p-3" style={{ background: 'var(--papel-2)' }}>
            {['Evalúa', 'Entrena', 'Mide', 'Interviene', 'Evoluciona'].map((item) => (
              <div key={item} className="mano text-base flex items-center gap-1">
                <span style={{ color: 'var(--cera-verde)' }}>✓</span> {item}
              </div>
            ))}
          </div>

          {/* Mensaje central */}
          <div className="crayon crayon-2 tilt-2 p-3 text-center" style={{ background: 'var(--papel)' }}>
            <p className="mano text-base font-black mb-1" style={{ textDecoration: 'underline' }}>
              NO ESTÁ TERMINADO.
            </p>
            <p className="mano text-sm" style={{ opacity: 0.8 }}>
              Lo abrimos a la comunidad. Encuentra fallos, propone mejoras y construyamos{' '}
              <span style={{ textDecoration: 'underline', color: 'var(--cera-coral)' }}>juntos</span> la mejor herramienta posible.
            </p>
          </div>

          {/* Post-it comunidad */}
          <div className="col-span-2 crayon text-center py-2 tilt-3" style={{ background: 'var(--cera-mostaza)' }}>
            <p className="mano text-lg font-black">TU MIRADA CONSTRUYE FONOMUNDOS 🙂</p>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className={`space-y-3 transition-all duration-700 ${ctasVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {profesionalId ? (
            /* Ya autenticado */
            <button onClick={onContinuar}
              className="crayon mano w-full py-4 text-2xl text-white"
              style={{ background: 'var(--cera-verde)' }}>
              → Continuar como profesional
            </button>
          ) : (
            /* No autenticado */
            <button onClick={onIniciarSesion}
              className="crayon mano w-full py-4 text-2xl text-white"
              style={{ background: 'var(--cera-verde)' }}>
              → Iniciar sesión
            </button>
          )}

          <button onClick={onInvitado}
            className="crayon mano w-full py-3 text-xl"
            style={{ background: 'var(--papel-2)', color: 'var(--tinta)' }}>
            Continuar como invitado
          </button>

          <a href="https://t.me/logoped_ia" target="_blank" rel="noopener noreferrer"
            className="crayon mano flex items-center justify-center gap-2 w-full py-2 text-base"
            style={{ background: 'var(--papel)', color: 'var(--cera-lila)' }}>
            ✈️ Ver qué es FonoMundos · @LOGOPED_IA
          </a>
        </div>

        {/* ── FOOTER ICONOS ── */}
        <div className={`mt-6 flex justify-around text-center border-t pt-4 transition-all duration-700 ${ctasVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ borderColor: 'var(--papel-2)' }}>
          {[
            { icon: '📊', label: 'Índices\nclínicos' },
            { icon: '📈', label: 'Evolución\ntemporal' },
            { icon: '📄', label: 'Informes\nPDF/CSV' },
            { icon: '💬', label: 'Feedback\ncomunidad' },
            { icon: '⚙️', label: 'En mejora\ncontinua' },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <div className="text-2xl">{f.icon}</div>
              <div className="mano text-xs whitespace-pre-line" style={{ opacity: 0.6 }}>{f.label}</div>
            </div>
          ))}
        </div>

        {/* Etiqueta "Apto para logopedas" */}
        <div className="text-center mt-3">
          <span className="crayon mano text-xs px-3 py-1" style={{ background: 'var(--cera-azul)', color: '#fff' }}>
            A · Apto para logopedas
          </span>
        </div>
      </div>
    </div>
  )
}
