/**
 * Panel Admin — acceso oculto para Jose.
 * PIN de acceso. Muestra todos los reportes de la comunidad
 * con filtros y botón "Copiar para Claude".
 */
import { useState } from 'react'
import { obtenerFeedbackRemoto, getFeedbackLocal, generarResumenParaClaude, exportarFeedbackCSV, type FeedbackEntry, TIPOS_FEEDBACK } from '../lib/feedback'

const PIN_CORRECTO = import.meta.env.VITE_ADMIN_PIN || 'logoped49'
const PINES_FALLBACK = ['logoped49', '1949', 'jose49']

interface Props { onSalir: () => void }

export default function Admin({ onSalir }: Props) {
  const [pin, setPin] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [error, setError] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [cargando, setCargando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [copiado, setCopiado] = useState(false)

  function intentarPin() {
    const normalizado = pin.trim().toLowerCase()
    const pinPrincipal = PIN_CORRECTO.trim().toLowerCase()
    if (normalizado === pinPrincipal || PINES_FALLBACK.includes(normalizado)) {
      setAutenticado(true)
      cargar()
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }

  async function cargar() {
    setCargando(true)
    const remoto = await obtenerFeedbackRemoto()
    const local = getFeedbackLocal()
    // merge deduplicando por id
    const ids = new Set(remoto.map((f) => f.id))
    const todos = [...remoto, ...local.filter((f) => f.id && !ids.has(f.id))]
    todos.sort((a, b) => {
      const ta = (a as any).ts || new Date((a as any).created_at || 0).getTime()
      const tb = (b as any).ts || new Date((b as any).created_at || 0).getTime()
      return tb - ta
    })
    setFeedback(todos)
    setCargando(false)
  }

  function copiarParaClaude() {
    const texto = generarResumenParaClaude(feedback)
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  const filtrado = filtroTipo === 'todos' ? feedback : feedback.filter((f) => f.tipo === filtroTipo)

  // Estadísticas
  const stats = Object.keys(TIPOS_FEEDBACK).map((k) => ({
    tipo: k,
    label: TIPOS_FEEDBACK[k as keyof typeof TIPOS_FEEDBACK],
    count: feedback.filter((f) => f.tipo === k).length,
  })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count)

  if (!autenticado) return (
    <div className="papel min-h-full flex items-center justify-center text-[var(--tinta)]">
      <div className="crayon p-8 w-full max-w-sm text-center" style={{ background: 'var(--papel-2)' }}>
        <div className="text-5xl mb-3">🔐</div>
        <h1 className="mano text-2xl mb-4">Panel Admin</h1>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && intentarPin()}
          placeholder="PIN de acceso"
          className="crayon mano w-full px-4 py-3 text-xl text-center mb-3"
          style={{ background: 'var(--papel)', borderColor: error ? '#ef4444' : undefined }}
          autoFocus
        />
        {error && <p className="mano text-sm text-red-500 mb-2">PIN incorrecto</p>}
        <button onClick={intentarPin} className="crayon mano w-full py-3 text-lg text-white" style={{ background: 'var(--cera-verde)' }}>
          Entrar
        </button>
        <button onClick={onSalir} className="mano text-sm mt-3 opacity-50 hover:opacity-100">← Volver</button>
      </div>
    </div>
  )

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <header className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--papel-2)' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <h1 className="mano text-xl">🔐 Panel Admin · FonoMundos</h1>
        <button onClick={cargar} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>🔄 Actualizar</button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {cargando && <p className="mano text-center text-lg">Cargando reportes…</p>}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="crayon p-3 text-center" style={{ background: 'var(--papel-2)' }}>
            <div className="mano text-3xl font-black">{feedback.length}</div>
            <div className="mano text-sm" style={{ opacity: 0.7 }}>reportes totales</div>
          </div>
          {stats.slice(0, 3).map((s) => (
            <div key={s.tipo} className="crayon p-3 text-center" style={{ background: 'var(--papel-2)' }}>
              <div className="mano text-3xl font-black">{s.count}</div>
              <div className="mano text-xs" style={{ opacity: 0.7 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <button onClick={copiarParaClaude} className="crayon mano px-4 py-2 text-base text-white" style={{ background: copiado ? 'var(--cera-verde)' : 'var(--cera-azul)' }}>
            {copiado ? '✅ Copiado!' : '📋 Copiar para Claude'}
          </button>
          <button onClick={() => exportarFeedbackCSV(feedback)} className="crayon mano px-4 py-2 text-base" style={{ background: 'var(--papel-2)' }}>
            📥 Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-4">
          {['todos', ...Object.keys(TIPOS_FEEDBACK)].map((t) => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className="crayon mano px-3 py-1 text-sm"
              style={{ background: filtroTipo === t ? 'var(--cera-lila)' : 'var(--papel-2)', color: filtroTipo === t ? '#fff' : 'var(--tinta)' }}>
              {t === 'todos' ? `Todos (${feedback.length})` : `${TIPOS_FEEDBACK[t as keyof typeof TIPOS_FEEDBACK]} (${feedback.filter(f=>f.tipo===t).length})`}
            </button>
          ))}
        </div>

        {/* Lista de reportes */}
        <div className="space-y-3">
          {filtrado.length === 0 && <p className="mano text-center opacity-50">No hay reportes todavía.</p>}
          {filtrado.map((f) => (
            <div key={f.id} className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="mano text-sm font-bold">{TIPOS_FEEDBACK[f.tipo as keyof typeof TIPOS_FEEDBACK] || f.tipo}</span>
                  <span className="mano text-xs ml-2 opacity-50">{f.actividad} · {f.item_actual}</span>
                </div>
                <span className="mano text-xs opacity-40">{new Date((f as any).ts || (f as any).created_at || Date.now()).toLocaleString('es-ES')}</span>
              </div>
              {f.mensaje && <p className="mano text-base mt-1">"{f.mensaje}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
