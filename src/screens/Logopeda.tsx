import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { Paciente } from '../types'
import { getPacientes, getSesiones, guardarPaciente } from '../lib/storage'
import { calcularIndices, detectarPatrones, indicesDeSesiones } from '../lib/scoring'
import RadarIndices from '../components/RadarIndices'
import {
  obtenerFeedbackRemoto, getFeedbackLocal, generarResumenParaClaude,
  exportarFeedbackCSV, type FeedbackEntry, TIPOS_FEEDBACK,
} from '../lib/feedback'
import {
  grupoEdad, determinarPerfil, clasificarIndice, PROTOCOLO_CRIBADO,
  type NivelIndice,
} from '../lib/normas'

interface Props { onSalir: () => void }

export default function Logopeda({ onSalir }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>(getPacientes())
  const [selId, setSelId] = useState<string | null>(pacientes[0]?.id ?? null)

  // --- Feedback de la comunidad ---
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
  const [cargandoFb, setCargandoFb] = useState(false)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    // merge local + remoto sin duplicados por id
    const local = getFeedbackLocal()
    setFeedbacks(local)
    setCargandoFb(true)
    obtenerFeedbackRemoto().then((remoto) => {
      const ids = new Set(remoto.map((e) => e.id))
      const merged = [...remoto, ...local.filter((e) => !ids.has(e.id))]
      setFeedbacks(merged.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')))
      setCargandoFb(false)
    })
  }, [])

  function copiarParaClaude() {
    const txt = generarResumenParaClaude(feedbacks)
    navigator.clipboard.writeText(txt).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) })
  }
  const sel = pacientes.find((p) => p.id === selId) ?? null

  const sesiones = useMemo(() => (selId ? getSesiones(selId) : []), [selId, pacientes])
  const indicesGlobal = useMemo(() => indicesDeSesiones(sesiones), [sesiones])
  const patrones = useMemo(() => detectarPatrones(sesiones.flatMap((s) => s.resultados)), [sesiones])

  const serieEvolucion = useMemo(
    () =>
      sesiones.map((s, i) => {
        const idx = calcularIndices(s.resultados)
        return {
          sesion: `S${i + 1}`,
          Fonológico: idx.fonologicoGlobal,
          Silábico: idx.silabicoGlobal,
          Velocidad: idx.velocidadProcesamiento,
        }
      }),
    [sesiones],
  )

  const tiempoTotalMin = useMemo(
    () => Math.round(sesiones.reduce((acc, s) => acc + (s.fin - s.inicio), 0) / 60000),
    [sesiones],
  )

  const edadGrupo = useMemo(() => sel ? grupoEdad(sel.edad) : null, [sel])
  const perfilClinico = useMemo(
    () => determinarPerfil(indicesGlobal, edadGrupo),
    [indicesGlobal, edadGrupo],
  )

  function actualizarCampo(campo: keyof Paciente, valor: string) {
    if (!sel) return
    const actualizado = { ...sel, [campo]: valor }
    guardarPaciente(actualizado)
    setPacientes(getPacientes())
  }

  function exportarCSV() {
    if (!sel) return
    const filas = [['sesion', 'fecha', 'actividad', 'dominio', 'acierto', 'intentos', 'ayuda', 'tiempo_ms', 'dificultad']]
    sesiones.forEach((s, i) => {
      s.resultados.forEach((r) => {
        filas.push([
          `S${i + 1}`, new Date(r.ts).toISOString(), r.actividadId, r.dominio,
          r.acierto ? '1' : '0', String(r.intentos), r.ayudaUsada ? '1' : '0',
          String(r.tiempoMs), String(r.dificultad),
        ])
      })
    })
    const csv = filas.map((f) => f.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fonomundos_${sel.nombre.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)] print:bg-white print:text-black">
      <div className="max-w-5xl mx-auto px-5 py-6">
        <header className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Inicio</button>
          <h1 className="mano text-2xl">🩺 Panel del Logopeda</h1>
          <div className="flex gap-2">
            <button onClick={exportarCSV} className="crayon mano px-4 py-1.5 text-base text-white" style={{ background: 'var(--cera-verde)' }}>Exportar CSV/Excel</button>
            <button onClick={() => window.print()} className="crayon mano px-4 py-1.5 text-base text-white" style={{ background: 'var(--cera-azul)' }}>Informe PDF</button>
          </div>
        </header>

        {pacientes.length === 0 && <p className="mano text-[var(--tinta)]/60">No hay pacientes todavía.</p>}

        {/* selector */}
        <div className="flex gap-3 flex-wrap mb-6 print:hidden">
          {pacientes.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelId(p.id)}
              className="crayon mano px-4 py-1.5 text-base"
              style={p.id === selId ? { background: 'var(--cera-coral)', color: '#fff' } : { background: 'var(--papel-2)' }}
            >
              {p.nombre}
            </button>
          ))}
        </div>

        {sel && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* ficha */}
            <section className="crayon bg-[var(--papel-2)] rounded-2xl p-5 print:border print:border-slate-300">
              <h2 className="mano text-2xl mb-3">Ficha del paciente</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {([
                  ['nombre', 'Nombre'], ['edad', 'Edad'], ['curso', 'Curso'], ['diagnostico', 'Diagnóstico'],
                ] as const).map(([campo, label]) => (
                  <label key={campo} className="flex flex-col gap-1">
                    <span className="text-[var(--tinta)]/60">{label}</span>
                    <input
                      value={(sel[campo] as string) || ''}
                      onChange={(e) => actualizarCampo(campo, e.target.value)}
                      className="crayon mano bg-[var(--papel)] px-3 py-2 print:bg-white"
                    />
                  </label>
                ))}
                {([['observaciones', 'Observaciones'], ['objetivos', 'Objetivos terapéuticos']] as const).map(([campo, label]) => (
                  <label key={campo} className="flex flex-col gap-1 col-span-2">
                    <span className="text-[var(--tinta)]/60">{label}</span>
                    <textarea
                      value={(sel[campo] as string) || ''}
                      onChange={(e) => actualizarCampo(campo, e.target.value)}
                      rows={2}
                      className="crayon mano bg-[var(--papel)] px-3 py-2 print:bg-white"
                    />
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                <div className="rounded-xl crayon bg-[var(--papel-2)] py-2"><b>{sesiones.length}</b><div className="text-[var(--tinta)]/60">sesiones</div></div>
                <div className="rounded-xl crayon bg-[var(--papel-2)] py-2"><b>{tiempoTotalMin}</b><div className="text-[var(--tinta)]/60">min total</div></div>
                <div className="rounded-xl crayon bg-[var(--papel-2)] py-2"><b>{sel.xp}</b><div className="text-[var(--tinta)]/60">XP</div></div>
              </div>
            </section>

            {/* radar global */}
            <section className="crayon bg-[var(--papel-2)] rounded-2xl p-5 print:border print:border-slate-300">
              <h2 className="mano text-2xl mb-1">Perfil clínico (índices)</h2>
              <RadarIndices indices={indicesGlobal} />
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <Indice n="Fonológico" v={indicesGlobal.fonologicoGlobal} />
                <Indice n="Silábico" v={indicesGlobal.silabicoGlobal} />
                <Indice n="Léxico" v={indicesGlobal.coherenciaLexica} />
                <Indice n="Rimas" v={indicesGlobal.rimasGlobal} />
                <Indice n="Automatización" v={indicesGlobal.automatizacion} />
                <Indice n="Velocidad proc." v={indicesGlobal.velocidadProcesamiento} />
                <Indice n="Memoria fon." v={indicesGlobal.memoriaFonologica} />
                <Indice n="Precisión aud." v={indicesGlobal.precisionAuditiva} />
                <Indice n="Riesgo lector" v={indicesGlobal.riesgoLector} invertido />
              </div>
              {/* Alerta dislexia */}
              {indicesGlobal.alertaDislexia && (
                <div className="crayon mt-3 p-3 mano text-sm text-white" style={{ background: 'var(--cera-coral)' }}>
                  ⚠️ <b>ALERTA DOBLE DÉFICIT</b> — Velocidad baja + fonológico bajo. Valorar evaluación con PROLEC-R.
                </div>
              )}
              {/* Recomendación de dosis según itinerario */}
              {sel && (
                <div className="crayon mt-3 p-3 mano text-sm" style={{ background: 'var(--papel)' }}>
                  {sel.itinerario === 'prevencion'
                    ? '💊 Dosis recomendada (prevención): 15 min/día integrados en rutina'
                    : '💊 Dosis recomendada (intervención): 30-60 min · 4-5 veces/semana · mínimo 5 meses'}
                </div>
              )}
            </section>

            {/* Perfil clínico + protocolo */}
            <section className="crayon bg-[var(--papel-2)] rounded-2xl p-5 lg:col-span-2 print:border print:border-slate-300">
              <h2 className="mano text-2xl mb-3">🧬 Perfil clínico {edadGrupo ? `(edad: ${edadGrupo} años)` : '— añade la edad para interpretar'}</h2>
              {perfilClinico.perfil !== 'insuficiente' && (
                <div className={`crayon mano p-4 text-sm mb-4 ${perfilClinico.urgencia === 'alta' ? 'text-white' : ''}`}
                  style={{
                    background: perfilClinico.urgencia === 'alta' ? 'var(--cera-coral)' :
                      perfilClinico.urgencia === 'media' ? 'var(--cera-mostaza)' : 'var(--cera-verde)',
                    color: perfilClinico.urgencia === 'alta' || perfilClinico.urgencia === null ? '#fff' : 'var(--tinta)',
                  }}>
                  {perfilClinico.descripcion}
                </div>
              )}
              {!edadGrupo && (
                <p className="mano text-sm text-[var(--tinta)]/60 mb-3">Introduce la edad en la ficha para ver la interpretación normativa.</p>
              )}

              {/* Tabla normativa por índice */}
              {edadGrupo && (
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  {[
                    ['fonologicoGlobal', 'Fonológico', false],
                    ['silabicoGlobal', 'Silábico', false],
                    ['rimasGlobal', 'Rimas', false],
                    ['coherenciaLexica', 'Léxico', false],
                    ['memoriaFonologica', 'Memoria fon.', false],
                    ['velocidadProcesamiento', 'Velocidad RAN', false],
                    ['automatizacion', 'Automatización', false],
                    ['precisionAuditiva', 'Precisión aud.', false],
                    ['riesgoLector', 'Riesgo lector', true],
                  ].map(([key, nombre, inv]) => {
                    const val = indicesGlobal[key as keyof typeof indicesGlobal] as number
                    const nivel: NivelIndice = clasificarIndice(key as string, val, edadGrupo, inv as boolean)
                    const bg = nivel === 'alarma' ? 'var(--cera-coral)' :
                      nivel === 'atencion' ? 'var(--cera-mostaza)' :
                      nivel === 'normal' ? 'var(--cera-verde)' : 'var(--papel)'
                    return (
                      <div key={key as string} className="crayon px-2 py-2 text-center"
                        style={{ background: nivel === 'alarma' || nivel === 'normal' ? bg : 'var(--papel-2)' }}>
                        <div className="text-[var(--tinta)]/70 text-xs">{nombre as string}</div>
                        <div className="mano text-2xl font-bold" style={{ color: nivel === 'alarma' ? '#fff' : 'var(--tinta)' }}>{val}</div>
                        <div className="text-xs" style={{ color: nivel === 'alarma' ? '#fff' : nivel === 'atencion' ? 'var(--tinta)' : nivel === 'nodisponible' ? '#999' : 'var(--tinta)' }}>
                          {nivel === 'alarma' ? '⚠️ Alarma' : nivel === 'atencion' ? '⚡ Atención' : nivel === 'normal' ? '✅ Normal' : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Protocolo de cribado */}
            <section className="crayon bg-[var(--papel-2)] rounded-2xl p-5 lg:col-span-2 print:border print:border-slate-300">
              <h2 className="mano text-2xl mb-3">📋 Protocolo de cribado (20-30 min)</h2>
              <p className="mano text-sm mb-3 text-[var(--tinta)]/70">Orden recomendado por sensibilidad diagnóstica:</p>
              <div className="space-y-2">
                {PROTOCOLO_CRIBADO.map((paso, i) => (
                  <div key={paso.actividadId} className={`crayon flex items-start gap-3 p-3 ${paso.tipo === 'opcional' ? 'opacity-70' : ''}`}
                    style={{ background: 'var(--papel)' }}>
                    <span className="mano text-lg w-6 text-center" style={{ color: 'var(--cera-lila)' }}>{i + 1}</span>
                    <span className="text-2xl">{paso.emoji}</span>
                    <div className="flex-1">
                      <div className="mano text-base font-bold">
                        {paso.nombre}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full mano ${paso.tipo === 'obligatoria' ? 'text-white' : 'text-[var(--tinta)]'}`}
                          style={{ background: paso.tipo === 'obligatoria' ? 'var(--cera-verde)' : 'var(--papel-2)' }}>
                          {paso.tipo}
                        </span>
                      </div>
                      <div className="mano text-xs text-[var(--tinta)]/60 mt-0.5">{paso.justificacion}</div>
                      {paso.condicion && <div className="mano text-xs mt-0.5" style={{ color: 'var(--cera-coral)' }}>{paso.condicion}</div>}
                    </div>
                    <span className="mano text-xs text-[var(--tinta)]/50">{paso.duracionMin}min</span>
                  </div>
                ))}
              </div>
            </section>

            {/* evolución */}
            <section className="crayon bg-[var(--papel-2)] rounded-2xl p-5 lg:col-span-2 print:border print:border-slate-300">
              <h2 className="mano text-2xl mb-3">Evolución temporal</h2>
              {serieEvolucion.length < 2 ? (
                <p className="text-sm text-[var(--tinta)]/60">Se necesitan al menos 2 sesiones para ver evolución.</p>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <LineChart data={serieEvolucion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0cdab" />
                      <XAxis dataKey="sesion" tick={{ fill: '#4a3f35', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#4a3f35', fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Line type="monotone" dataKey="Fonológico" stroke="#34d399" strokeWidth={2} />
                      <Line type="monotone" dataKey="Silábico" stroke="#fbbf24" strokeWidth={2} />
                      <Line type="monotone" dataKey="Velocidad" stroke="#60a5fa" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* patrones */}
            <section className="crayon bg-[var(--papel-2)] rounded-2xl p-5 lg:col-span-2 print:border print:border-slate-300">
              <h2 className="mano text-2xl mb-3">🧠 Análisis automático y recomendaciones</h2>
              {patrones.length === 0 ? (
                <p className="text-sm text-[var(--tinta)]/60">Sin patrones de riesgo detectados (o datos insuficientes).</p>
              ) : (
                <ul className="space-y-2">
                  {patrones.map((h, i) => (
                    <li key={i} className="rounded-xl crayon bg-[var(--papel-2)] p-3 text-sm print:border print:border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`mano text-sm px-2 py-0.5 rounded-full text-white ${h.severidad === 'alta' ? 'bg-rose-500' : h.severidad === 'media' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                          {h.severidad}
                        </span>
                        <b>{h.patron}</b>
                      </div>
                      <p className="text-[var(--tinta)]/60 mt-1">→ {h.recomendacion}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ─── PANEL DE AUDITORÍA ─── */}
        <section className="crayon bg-[var(--papel-2)] p-5 mt-6 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="mano text-2xl">🐛 Feedback de la comunidad</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={copiarParaClaude}
                className="crayon mano px-4 py-2 text-base text-white"
                style={{ background: copiado ? 'var(--cera-verde)' : 'var(--cera-coral)' }}
              >
                {copiado ? '✅ ¡Copiado!' : '📋 Copiar para Claude'}
              </button>
              <button
                onClick={() => exportarFeedbackCSV(feedbacks)}
                className="crayon mano px-4 py-2 text-base text-white"
                style={{ background: 'var(--cera-azul)' }}
              >
                Exportar CSV
              </button>
            </div>
          </div>

          <p className="mano text-sm mb-3" style={{ opacity: 0.65 }}>
            {cargandoFb ? 'Cargando…' : `${feedbacks.length} reportes totales`}
            {' · '}Pulsa «Copiar para Claude» y pégalo en el chat para hacer una auditoría en bloque.
          </p>

          {feedbacks.length === 0 && !cargandoFb && (
            <p className="mano text-base" style={{ opacity: 0.5 }}>Aún no hay reportes de la comunidad.</p>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {feedbacks.slice(0, 50).map((f, i) => (
              <div key={f.id ?? i} className="crayon bg-[var(--papel)] p-2 text-sm flex flex-wrap gap-2 items-start">
                <span className="mano text-base font-semibold" style={{ color: 'var(--cera-coral)' }}>
                  {TIPOS_FEEDBACK[f.tipo as keyof typeof TIPOS_FEEDBACK] ?? f.tipo}
                </span>
                <span className="mano text-sm" style={{ opacity: 0.7 }}>{f.actividad} · <em>{f.item_actual}</em></span>
                {f.mensaje && <span className="mano text-sm w-full" style={{ opacity: 0.85 }}>"{f.mensaje}"</span>}
                <span className="mano text-xs" style={{ opacity: 0.45 }}>{f.created_at ? new Date(f.created_at).toLocaleString('es-ES') : ''}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

function Indice({ n, v, invertido }: { n: string; v: number; invertido?: boolean }) {
  const bueno = invertido ? v < 40 : v >= 70
  const malo = invertido ? v >= 60 : v < 40
  const color = malo ? 'text-rose-600' : bueno ? 'text-emerald-600' : 'text-amber-600'
  return (
    <div className="crayon bg-[var(--papel)] px-2 py-1.5">
      <div className="mano text-[var(--tinta)]/70">{n}</div>
      <div className={`mano text-2xl ${color}`}>{v}</div>
    </div>
  )
}
