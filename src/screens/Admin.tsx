/**
 * Panel Admin — acceso oculto para Jose.
 * PIN de acceso. Muestra todos los reportes de la comunidad
 * con filtros y botón "Copiar para Claude".
 */
import { useEffect, useState } from 'react'
import { obtenerFeedbackRemoto, getFeedbackLocal, generarResumenParaClaude, exportarFeedbackCSV, type FeedbackEntry, TIPOS_FEEDBACK } from '../lib/feedback'
import { supabase, supabaseActivo } from '../lib/supabase'

const PIN_CORRECTO = import.meta.env.VITE_ADMIN_PIN || 'logoped49'

interface SesionRow { id: string; paciente_id: string; profesional_id: string; inicio: number; fin: number; resultados: { acierto: boolean; dominio: string }[]; creado_at: string }
interface PacienteRow { id: string; codigo: string }

interface Props { onSalir: () => void }

export default function Admin({ onSalir }: Props) {
  const [pin, setPin] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [error, setError] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [cargando, setCargando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [copiado, setCopiado] = useState(false)
  const [tab, setTab] = useState<'feedback' | 'sesiones'>('sesiones')
  const [sesiones, setSesiones] = useState<SesionRow[]>([])
  const [pacientes, setPacientes] = useState<PacienteRow[]>([])
  const [cargandoSesiones, setCargandoSesiones] = useState(false)

  function intentarPin() {
    if (pin === PIN_CORRECTO) {
      setAutenticado(true)
      cargar()
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }

  async function cargarSesiones() {
    if (!supabaseActivo()) return
    setCargandoSesiones(true)
    const [{ data: sesData }, { data: pacData }] = await Promise.all([
      supabase!.from('sesiones').select('*').order('creado_at', { ascending: false }).limit(200),
      supabase!.from('pacientes').select('id, codigo'),
    ])
    setSesiones((sesData ?? []) as SesionRow[])
    setPacientes((pacData ?? []) as PacienteRow[])
    setCargandoSesiones(false)
  }

  useEffect(() => { if (autenticado) cargarSesiones() }, [autenticado])

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

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {[{ id: 'sesiones', label: '📊 Sesiones' }, { id: 'feedback', label: '🐛 Feedback' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="crayon mano px-4 py-2 text-base"
            style={{ background: tab === t.id ? 'var(--cera-azul)' : 'var(--papel-2)', color: tab === t.id ? '#fff' : 'var(--tinta)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {cargando && tab === 'feedback' && <p className="mano text-center text-lg">Cargando reportes…</p>}

        {/* ===== TAB SESIONES ===== */}
        {tab === 'sesiones' && (() => {
          const nombreDe = (pid: string) => pacientes.find(p => p.id === pid)?.codigo ?? pid.slice(0, 8)
          const porPaciente: Record<string, SesionRow[]> = {}
          sesiones.forEach(s => { if (!porPaciente[s.paciente_id]) porPaciente[s.paciente_id] = []; porPaciente[s.paciente_id].push(s) })
          const hoy = new Date().toDateString()
          const sesionesHoy = sesiones.filter(s => new Date(s.creado_at || s.inicio).toDateString() === hoy)
          return (
            <div>
              {cargandoSesiones && <p className="mano text-center opacity-50">Cargando sesiones de Supabase…</p>}
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="crayon p-3 text-center" style={{ background: 'var(--papel-2)' }}>
                  <div className="mano text-3xl font-black">{sesiones.length}</div>
                  <div className="mano text-sm" style={{ opacity: 0.7 }}>sesiones totales</div>
                </div>
                <div className="crayon p-3 text-center" style={{ background: 'var(--papel-2)' }}>
                  <div className="mano text-3xl font-black">{sesionesHoy.length}</div>
                  <div className="mano text-sm" style={{ opacity: 0.7 }}>hoy</div>
                </div>
                <div className="crayon p-3 text-center" style={{ background: 'var(--papel-2)' }}>
                  <div className="mano text-3xl font-black">{Object.keys(porPaciente).length}</div>
                  <div className="mano text-sm" style={{ opacity: 0.7 }}>pacientes activos</div>
                </div>
              </div>
              {/* Sesiones de hoy */}
              {sesionesHoy.length > 0 && (
                <div className="mb-6">
                  <h3 className="mano text-lg font-black mb-2">🕐 Hoy</h3>
                  <div className="space-y-2">
                    {sesionesHoy.map(s => {
                      const oks = s.resultados.filter(r => r.acierto).length
                      const dom = s.resultados[0]?.dominio ?? '—'
                      const hora = new Date(s.fin || s.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <div key={s.id} className="crayon flex items-center gap-3 p-3" style={{ background: 'var(--papel-2)' }}>
                          <span className="mano font-black text-base w-24">{nombreDe(s.paciente_id)}</span>
                          <span className="mano text-sm opacity-60">{hora}</span>
                          <span className="mano text-sm">{dom}</span>
                          <span className="mano text-sm">{s.resultados.length} rondas</span>
                          <span className="mano text-sm font-black" style={{ color: oks >= s.resultados.length * 0.7 ? 'var(--cera-verde)' : 'var(--cera-coral)' }}>
                            {oks}/{s.resultados.length} ✅
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {/* Resumen por paciente */}
              <h3 className="mano text-lg font-black mb-2">📊 Por paciente</h3>
              <div className="space-y-2">
                {Object.entries(porPaciente).sort((a, b) => b[1].length - a[1].length).map(([pid, ss]) => {
                  const total = ss.flatMap(s => s.resultados).length
                  const oks = ss.flatMap(s => s.resultados).filter(r => r.acierto).length
                  const pct = total ? Math.round(oks / total * 100) : 0
                  const ultima = new Date(ss[0].creado_at || ss[0].fin).toLocaleDateString('es-ES')
                  return (
                    <div key={pid} className="crayon flex items-center gap-3 p-3" style={{ background: 'var(--papel-2)' }}>
                      <span className="mano font-black text-base w-24">{nombreDe(pid)}</span>
                      <span className="mano text-sm">{ss.length} sesiones</span>
                      <span className="mano text-sm">{total} rondas</span>
                      <span className="mano text-sm font-black" style={{ color: pct >= 70 ? 'var(--cera-verde)' : 'var(--cera-coral)' }}>{pct}% ✅</span>
                      <span className="mano text-xs opacity-50">última: {ultima}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={cargarSesiones} className="crayon mano mt-4 px-4 py-2 text-sm" style={{ background: 'var(--papel-2)' }}>🔄 Actualizar sesiones</button>
            </div>
          )
        })()}

        {/* ===== TAB FEEDBACK ===== */}
        {tab === 'feedback' && <div>
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
        </div>}  {/* fin tab feedback */}
      </div>
    </div>
  )
}
