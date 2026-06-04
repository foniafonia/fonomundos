/**
 * ¿Qué es FonoMundos?
 * Página informativa visual. Sin muros de texto. Bloques, iconos, tarjetas.
 * Accesible desde el menú principal y el botón "Ver qué es" de la landing.
 */
import NavBar from '../components/NavBar'

interface Props { onVolver: () => void }

const PARA_QUIEN = [
  { emoji: '🩺', label: 'Logopedas' },
  { emoji: '📚', label: 'Maestros' },
  { emoji: '🧩', label: 'AL / PT' },
  { emoji: '🧭', label: 'Orientadores' },
  { emoji: '👨‍👩‍👧', label: 'Familias' },
]

const QUE_TRABAJA = [
  { emoji: '🔤', label: 'Conciencia fonémica', disponible: true },
  { emoji: '👏', label: 'Conciencia silábica', disponible: true },
  { emoji: '📖', label: 'Conciencia léxica', disponible: true },
  { emoji: '✂️', label: 'Segmentación', disponible: true },
  { emoji: '👂', label: 'Discriminación auditiva', disponible: true },
  { emoji: '🔗', label: 'Cadenas fonológicas', disponible: true },
  { emoji: '🎵', label: 'Rimas', disponible: true },
  { emoji: '⚡', label: 'Velocidad lectora', disponible: false },
  { emoji: '📝', label: 'Ortografía', disponible: false },
  { emoji: '🧠', label: 'Morfosintaxis', disponible: false },
]

const QUE_PUEDE = [
  '27+ actividades interactivas',
  'Registro automático de resultados',
  'Adaptación dinámica de dificultad',
  'Panel profesional multi-paciente',
  'Índices clínicos automáticos (6)',
  'Normas por edad (4-7 años)',
  'Detección de riesgo lector',
  'Sesión de exploración 20-30 min',
  'Exportación CSV / Informes PDF',
  'Gamificación (XP, monedas, racha)',
  'Modo evaluación profesional',
  'Feedback de comunidad integrado',
]

const QUE_REGISTRA = [
  { emoji: '✅', label: 'Aciertos y errores', desc: 'Por actividad y sesión' },
  { emoji: '⏱️', label: 'Tiempo de respuesta', desc: 'Milisegundos por ronda' },
  { emoji: '🔁', label: 'Intentos', desc: 'Cuántos intentos por ítem' },
  { emoji: '💡', label: 'Ayudas utilizadas', desc: 'Si pidió pista o no' },
  { emoji: '📈', label: 'Progreso temporal', desc: 'Evolución entre sesiones' },
  { emoji: '⚡', label: 'Velocidad (RAN)', desc: 'Mejor predictor en español' },
]

const EJEMPLOS_FEEDBACK = [
  { tipo: '🐛 Bug', ejemplo: '"Esta actividad se queda bloqueada en el tercer intento"' },
  { tipo: '💡 Mejora', ejemplo: '"Necesito poder ajustar el tiempo de exposición"' },
  { tipo: '➕ Actividad', ejemplo: '"Falta una actividad de pares mínimos P/B"' },
  { tipo: '🧬 Clínica', ejemplo: '"El índice RAN debería tener percentiles por edad"' },
]

export default function QueesFonomundos({ onVolver }: Props) {
  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <NavBar titulo="¿Qué es FonoMundos?" onVolver={onVolver} feedbackActividad="que-es-fonomundos" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* Hero */}
        <section className="text-center">
          <div className="text-6xl mb-3">🦉</div>
          <h1 className="mano text-4xl font-black mb-2">¿Qué es FonoMundos?</h1>
          <p className="mano text-xl" style={{ opacity: 0.85 }}>
            Plataforma digital para el desarrollo de la{' '}
            <span style={{ color: 'var(--cera-verde)', textDecoration: 'underline' }}>conciencia fonológica</span> y las
            habilidades precursoras de la lectura.
          </p>
          <div className="crayon inline-block mt-4 px-4 py-2 mano text-base" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            🔬 Prototipo vivo · En mejora continua · Construido con la comunidad
          </div>
        </section>

        {/* Para quién */}
        <section>
          <h2 className="mano text-2xl font-black mb-4">👥 Para quién es</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {PARA_QUIEN.map((p) => (
              <div key={p.label} className="crayon p-4 text-center" style={{ background: 'var(--papel-2)' }}>
                <div className="text-4xl mb-1">{p.emoji}</div>
                <div className="mano text-base font-bold">{p.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Qué trabaja */}
        <section>
          <h2 className="mano text-2xl font-black mb-4">🧩 Qué trabaja</h2>
          <div className="flex flex-wrap gap-2">
            {QUE_TRABAJA.map((t) => (
              <div key={t.label}
                className="crayon mano flex items-center gap-1.5 px-3 py-1.5 text-sm"
                style={{
                  background: t.disponible ? 'var(--papel-2)' : 'var(--papel)',
                  opacity: t.disponible ? 1 : 0.55,
                  borderStyle: t.disponible ? 'solid' : 'dashed',
                }}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                {!t.disponible && <span className="text-xs ml-1" style={{ opacity: 0.6 }}>· próximo</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Qué puede hacer */}
        <section>
          <h2 className="mano text-2xl font-black mb-4">⚡ Qué puede hacer ahora mismo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {QUE_PUEDE.map((item) => (
              <div key={item} className="crayon mano flex items-center gap-2 px-3 py-2 text-sm" style={{ background: 'var(--papel-2)' }}>
                <span style={{ color: 'var(--cera-verde)' }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Qué registra */}
        <section>
          <h2 className="mano text-2xl font-black mb-2">📊 Qué registra FonoMundos</h2>
          <p className="mano text-base mb-4" style={{ opacity: 0.75 }}>
            Cada ronda genera datos que alimentan los índices clínicos y permiten detectar patrones de aprendizaje.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {QUE_REGISTRA.map((r) => (
              <div key={r.label} className="crayon p-3" style={{ background: 'var(--papel-2)' }}>
                <div className="text-2xl mb-1">{r.emoji}</div>
                <div className="mano text-base font-black">{r.label}</div>
                <div className="mano text-sm" style={{ opacity: 0.65 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div className="crayon p-4 mt-4 mano text-sm" style={{ background: 'var(--cera-azul)', color: '#fff' }}>
            📈 Estos datos calculan automáticamente 6 índices clínicos: Fonológico, Silábico, Léxico, Automatización, Velocidad de procesamiento (RAN) y Necesidad de refuerzo.
          </div>
        </section>

        {/* Prototipo vivo */}
        <section>
          <h2 className="mano text-2xl font-black mb-4">🚧 Un prototipo vivo</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: '✅', titulo: 'Funciona', desc: 'Puedes usarlo hoy con alumnos y pacientes reales.' },
              { emoji: '🔄', titulo: 'Evoluciona', desc: 'Cada semana hay mejoras basadas en el feedback de la comunidad.' },
              { emoji: '🤝', titulo: 'Es tuyo', desc: 'Tu opinión define qué se construye a continuación.' },
            ].map((c) => (
              <div key={c.titulo} className="crayon p-4 text-center" style={{ background: 'var(--papel-2)' }}>
                <div className="text-4xl mb-2">{c.emoji}</div>
                <div className="mano text-xl font-black mb-1">{c.titulo}</div>
                <div className="mano text-sm" style={{ opacity: 0.75 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="crayon mt-4 p-4 mano text-base text-center" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            <b>No escondemos que seguimos construyendo.</b><br />
            Esa transparencia es nuestra fortaleza.
          </div>
        </section>

        {/* Cómo colaborar */}
        <section>
          <h2 className="mano text-2xl font-black mb-2">💬 Cómo colaborar</h2>
          <p className="mano text-base mb-4" style={{ opacity: 0.75 }}>
            Pulsa el botón 🐛 en cualquier pantalla. Puedes:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {EJEMPLOS_FEEDBACK.map((e) => (
              <div key={e.tipo} className="crayon p-3" style={{ background: 'var(--papel-2)' }}>
                <div className="mano text-base font-black mb-1">{e.tipo}</div>
                <div className="mano text-sm" style={{ opacity: 0.75, fontStyle: 'italic' }}>{e.ejemplo}</div>
              </div>
            ))}
          </div>
          <div className="crayon mt-4 p-4 text-center" style={{ background: 'var(--papel-2)' }}>
            <p className="mano text-base">
              "FonoMundos está construido por un logopeda y mejorado por la comunidad."
            </p>
            <a href="https://t.me/logoped_ia" target="_blank" rel="noopener noreferrer"
              className="mano text-sm mt-2 block" style={{ color: 'var(--cera-azul)' }}>
              ✈️ Únete a @LOGOPED_IA en Telegram
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}
