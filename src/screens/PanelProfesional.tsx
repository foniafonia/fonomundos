/**
 * Panel Profesional — 4 modos claramente separados:
 * 1. Jugar — actividades libres
 * 2. Evaluar — sesión de exploración estructurado
 * 3. Progreso — gráficas e índices
 * 4. Informes — PDF / exportación
 */
import { useEffect, useState } from 'react'
import type { Paciente } from '../types'
import {
  getPacientes, crearPacienteCloud, actualizarPacienteCloud,
  getSesionesCloud, setPacienteActivo, signOut,
} from '../lib/storageCloud'
import { indicesDeSesiones, detectarPatrones } from '../lib/scoring'
import { determinarPerfil, PROTOCOLO_CRIBADO, grupoEdad, clasificarIndice, type NivelIndice } from '../lib/normas'
import RadarIndices from '../components/RadarIndices'
import FeedbackLogopeda from '../components/FeedbackLogopeda'
import type { Sesion } from '../types'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { calcularIndices } from '../lib/scoring'
import {
  obtenerFeedbackRemoto, getFeedbackLocal, generarResumenParaClaude,
  exportarFeedbackCSV, type FeedbackEntry, TIPOS_FEEDBACK,
} from '../lib/feedback'

type ModoPanel = 'jugar' | 'evaluar' | 'progreso' | 'informes'

interface Props {
  profesionalId: string
  onJugar: (p: Paciente) => void
  onEvaluar: (p: Paciente) => void
  onAdmin: () => void
  onSalir: () => void
}

export default function PanelProfesional({ profesionalId, onJugar, onEvaluar, onAdmin, onSalir }: Props) {
  const [modo, setModo] = useState<ModoPanel>('jugar')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [cargando, setCargando] = useState(true)
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
  const [cargandoFb, setCargandoFb] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const sel = pacientes.find((p) => p.id === selId) ?? null

  useEffect(() => {
    cargarPacientes()
  }, [])

  useEffect(() => {
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

  useEffect(() => {
    if (selId) cargarSesiones(selId)
  }, [selId])

  async function cargarPacientes() {
    setCargando(true)
    const lista = await getPacientes(profesionalId)
    setPacientes(lista)
    if (lista.length && !selId) setSelId(lista[0].id)
    setCargando(false)
  }

  async function cargarSesiones(pacienteId: string) {
    const s = await getSesionesCloud(pacienteId, profesionalId)
    setSesiones(s)
  }

  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false)
  const [iniciales, setIniciales] = useState('')

  async function nuevoPaciente() {
    const codigo = iniciales.trim().toUpperCase() || `P${pacientes.length + 1}`
    setModalNuevoPaciente(false)
    setIniciales('')
    const p = await crearPacienteCloud({ nombre: codigo }, profesionalId)
    setPacientes((prev) => [...prev, p])
    setSelId(p.id)
    setPacienteActivo(p.id)
  }

  async function actualizarCampo(campo: keyof Paciente, valor: unknown) {
    if (!sel) return
    const act = { ...sel, [campo]: valor }
    await actualizarPacienteCloud(act, profesionalId)
    setPacientes((prev) => prev.map((p) => p.id === act.id ? act : p))
  }

  function exportarCSV() {
    if (!sel) return
    const filas = [['sesion', 'fecha', 'actividad', 'dominio', 'acierto', 'intentos', 'ayuda', 'tiempo_ms', 'dificultad', 'item_seleccionado']]
    sesiones.forEach((s, i) => {
      s.resultados.forEach((r) => {
        filas.push([
          `S${i + 1}`, new Date(r.ts).toISOString(), r.actividadId, r.dominio,
          r.acierto ? '1' : '0', String(r.intentos), r.ayudaUsada ? '1' : '0',
          String(r.tiempoMs), String(r.dificultad), r.itemSeleccionadoId ?? '',
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

  function copiarParaClaude() {
    const txt = generarResumenParaClaude(feedbacks)
    navigator.clipboard.writeText(txt).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) })
  }

  const indicesGlobal = indicesDeSesiones(sesiones)
  const patrones = detectarPatrones(sesiones.flatMap((s) => s.resultados))
  const edadGrupo = sel ? grupoEdad(sel.edad) : null
  const perfil = determinarPerfil(indicesGlobal, edadGrupo)
  const tiempoTotal = Math.round(sesiones.reduce((a, s) => a + (s.fin - s.inicio), 0) / 60000)

  const serieEvo = sesiones.slice(-10).map((s, i) => {
    const idx = calcularIndices(s.resultados)
    return { s: `S${i + 1}`, F: idx.fonologicoGlobal, Si: idx.silabicoGlobal, V: idx.velocidadProcesamiento }
  })

  const MODOS: { id: ModoPanel; emoji: string; label: string }[] = [
    { id: 'jugar', emoji: '🎮', label: 'Jugar' },
    { id: 'evaluar', emoji: '🩺', label: 'Evaluar' },
    { id: 'progreso', emoji: '📈', label: 'Progreso' },
    { id: 'informes', emoji: '📄', label: 'Informes' },
  ]

  function handleJugar() {
    if (!sel) return
    setPacienteActivo(sel.id)
    onJugar(sel)
  }

  function handleEvaluar() {
    if (!sel) return
    setPacienteActivo(sel.id)
    onEvaluar(sel)
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      {/* Cabecero PDF */}
      <div className="hidden print:block text-center py-2 mb-3 border-b text-xs text-slate-500">
        <b>DOCUMENTO CONFIDENCIAL — Uso exclusivo profesional. Contiene datos de salud protegidos (LOPDGDD/RGPD).</b>
        IMPORTANTE: Este informe es resultado de un exploración orientativa y NO constituye diagnóstico clínico.
        FonoMundos · fonomundos.vercel.app
      </div>

      <header className="flex items-center justify-between p-4 print:hidden" style={{ borderBottom: '1px solid var(--papel-2)' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Panel Profesional</span>
        <div className="flex gap-2 items-center">
          <FeedbackLogopeda />
          <button type="button" onClick={onAdmin}
            className="crayon mano px-3 py-1.5 text-xs" style={{ background: 'var(--papel-2)' }}
            title="Panel Admin — ver reportes de la comunidad">
            🔐 Admin
          </button>
          <button onClick={async () => { await signOut(); onSalir() }} className="mano text-sm opacity-50 hover:opacity-80">Salir</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Pacientes */}
        <div className="flex gap-2 flex-wrap items-center mb-4 print:hidden">
          {cargando
            ? <span className="mano text-sm opacity-50">Cargando pacientes…</span>
            : pacientes.map((p) => (
              <button key={p.id} onClick={() => { setSelId(p.id); setPacienteActivo(p.id) }}
                className="crayon mano px-3 py-1.5 text-base"
                style={{ background: p.id === selId ? 'var(--cera-coral)' : 'var(--papel-2)', color: p.id === selId ? '#fff' : 'var(--tinta)' }}>
                {p.nombre}
              </button>
            ))
          }
          <button onClick={() => setModalNuevoPaciente(true)} className="crayon mano px-3 py-1.5 text-base" style={{ background: 'var(--cera-verde)', color: '#fff' }}>
            + Nuevo
          </button>
        </div>

        {/* Modal nuevo paciente con iniciales */}
        {modalNuevoPaciente && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,63,53,0.6)' }}>
            <div className="crayon w-full max-w-sm p-5 text-[var(--tinta)]" style={{ background: 'var(--papel)' }}>
              <h2 className="mano text-2xl mb-1">Nuevo paciente</h2>
              <p className="mano text-sm mb-3" style={{ opacity: 0.7 }}>
                🔒 Solo iniciales por protección de datos (ej: M.G., ALR)
              </p>
              <input
                autoFocus
                maxLength={4}
                value={iniciales}
                onChange={(e) => setIniciales(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && nuevoPaciente()}
                placeholder="Iniciales (máx 4 letras)"
                className="crayon mano w-full px-4 py-3 text-2xl text-center tracking-widest mb-4"
                style={{ background: 'var(--papel-2)' }}
              />
              <div className="flex gap-3">
                <button onClick={() => { setModalNuevoPaciente(false); setIniciales('') }}
                  className="crayon mano flex-1 py-2 text-base" style={{ background: 'var(--papel-2)' }}>
                  Cancelar
                </button>
                <button onClick={nuevoPaciente}
                  className="crayon mano flex-1 py-2 text-base text-white" style={{ background: 'var(--cera-verde)' }}>
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de modo */}
        <div className="grid grid-cols-4 gap-2 mb-6 print:hidden">
          {MODOS.map((m) => (
            <button key={m.id} onClick={() => setModo(m.id)}
              className="crayon mano py-3 text-center"
              style={{ background: modo === m.id ? 'var(--cera-azul)' : 'var(--papel-2)', color: modo === m.id ? '#fff' : 'var(--tinta)' }}>
              <div className="text-2xl">{m.emoji}</div>
              <div className="text-sm">{m.label}</div>
            </button>
          ))}
        </div>

        {!sel && <p className="mano text-center opacity-50 mt-10">Selecciona o crea un paciente</p>}

        {sel && (
          <>
            {/* ===== MODO JUGAR ===== */}
            {modo === 'jugar' && (
              <div className="text-center py-8">
                <div className="text-7xl mb-4">🎮</div>
                <h2 className="mano text-3xl mb-2">{sel.nombre}</h2>
                <p className="mano text-base mb-6" style={{ opacity: 0.7 }}>
                  El niño juega libremente. El sistema registra todo automáticamente.
                </p>
                <button onClick={handleJugar}
                  className="crayon mano px-10 py-4 text-2xl text-white"
                  style={{ background: 'var(--cera-verde)' }}>
                  ▶ Jugar ahora
                </button>
                <p className="mano text-sm mt-4" style={{ opacity: 0.5 }}>
                  ⭐ {sel.xp} XP · 🪙 {sel.monedas} monedas · {sesiones.length} sesiones
                </p>
              </div>
            )}

            {/* ===== MODO EVALUAR ===== */}
            {modo === 'evaluar' && (
              <div>
                <div className="crayon p-5 mb-4" style={{ background: 'var(--papel-2)' }}>
                  <h2 className="mano text-2xl mb-2">🩺 Sesión de exploración (20-30 min)</h2>
                  <p className="mano text-sm mb-4" style={{ opacity: 0.7 }}>
                    Orden basado en sensibilidad diagnóstica. Desactiva gamificación.
                  </p>
                  <div className="space-y-2 mb-4">
                    {PROTOCOLO_CRIBADO.map((paso, i) => (
                      <div key={paso.actividadId}
                        className={`crayon flex items-start gap-3 p-3 ${paso.tipo === 'opcional' ? 'opacity-70' : ''}`}
                        style={{ background: 'var(--papel)' }}>
                        <span className="mano text-lg w-6 text-center" style={{ color: 'var(--cera-lila)' }}>{i + 1}</span>
                        <span className="text-2xl">{paso.emoji}</span>
                        <div className="flex-1">
                          <div className="mano text-base font-bold">
                            {paso.nombre}
                            <span className={`ml-2 mano text-xs px-2 py-0.5 rounded-full ${paso.tipo === 'obligatoria' ? 'text-white' : ''}`}
                              style={{ background: paso.tipo === 'obligatoria' ? 'var(--cera-verde)' : 'var(--papel-2)' }}>
                              {paso.tipo}
                            </span>
                          </div>
                          <div className="mano text-xs mt-0.5" style={{ opacity: 0.6 }}>{paso.justificacion}</div>
                          {paso.condicion && <div className="mano text-xs mt-0.5" style={{ color: 'var(--cera-coral)' }}>{paso.condicion}</div>}
                        </div>
                        <span className="mano text-xs opacity-50">{paso.duracionMin}min</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleEvaluar}
                    className="crayon mano w-full py-3 text-xl text-white"
                    style={{ background: 'var(--cera-azul)' }}>
                    ▶ Iniciar sesión de exploración
                  </button>
                </div>

                {/* Ficha del paciente */}
                <div className="crayon p-5" style={{ background: 'var(--papel-2)' }}>
                  <h3 className="mano text-xl mb-3">Ficha del paciente</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {([
                      ['nombre', 'Nombre'], ['edad', 'Edad'], ['curso', 'Curso'], ['diagnostico', 'Diagnóstico'],
                    ] as const).map(([campo, label]) => (
                      <label key={campo} className="flex flex-col gap-1">
                        <span className="mano text-xs opacity-60">{label}</span>
                        <input value={(sel[campo] as string) || ''} onChange={(e) => actualizarCampo(campo, e.target.value)}
                          className="crayon mano px-3 py-2" style={{ background: 'var(--papel)' }} />
                      </label>
                    ))}
                    {([
                      ['observaciones', 'Observaciones'],
                      ['objetivos', 'Objetivos terapéuticos'],
                      ['lenguaMaterna', 'Lengua materna'],
                    ] as const).map(([campo, label]) => (
                      <label key={campo} className="flex flex-col gap-1 col-span-2">
                        <span className="mano text-xs opacity-60">{label}</span>
                        <textarea
                          value={(sel[campo] as string) || ''}
                          onChange={(e) => actualizarCampo(campo, e.target.value)}
                          rows={campo === 'lenguaMaterna' ? 1 : 2}
                          className="crayon mano px-3 py-2"
                          style={{ background: 'var(--papel)' }}
                        />
                      </label>
                    ))}
                  </div>
                  {/* Factores de riesgo */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <label className="crayon flex items-center gap-2 px-3 py-2 cursor-pointer mano text-sm"
                      style={{ background: sel.antecFamiliares ? 'var(--cera-coral)' : 'var(--papel)', color: sel.antecFamiliares ? '#fff' : 'var(--tinta)' }}>
                      <input type="checkbox" checked={!!sel.antecFamiliares}
                        onChange={(e) => actualizarCampo('antecFamiliares', e.target.checked)}
                        className="w-4 h-4" />
                      🧬 Antec. familiares dislexia
                      <span className="text-xs">(+50-68% riesgo)</span>
                    </label>
                    <label className="crayon flex items-center gap-2 px-3 py-2 cursor-pointer mano text-sm"
                      style={{ background: sel.deficitSensorial ? 'var(--cera-azul)' : 'var(--papel)', color: sel.deficitSensorial ? '#fff' : 'var(--tinta)' }}>
                      <input type="checkbox" checked={!!sel.deficitSensorial}
                        onChange={(e) => actualizarCampo('deficitSensorial', e.target.checked)}
                        className="w-4 h-4" />
                      👁️ Déficit sensorial
                      <span className="text-xs">(requiere valoración)</span>
                    </label>
                  </div>
                  {sel.deficitSensorial && (
                    <p className="crayon mano text-sm p-2 mt-2 text-white" style={{ background: 'var(--cera-azul)' }}>
                      🚫 Déficit sensorial registrado: los resultados del sesión orientativa no aplica para interpretación diagnóstica.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
                    <div className="crayon py-2" style={{ background: 'var(--papel)' }}><b>{sesiones.length}</b><div className="opacity-60">sesiones</div></div>
                    <div className="crayon py-2" style={{ background: 'var(--papel)' }}><b>{tiempoTotal}</b><div className="opacity-60">min total</div></div>
                    <div className="crayon py-2" style={{ background: 'var(--papel)' }}><b>{sel.xp}</b><div className="opacity-60">XP</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== MODO PROGRESO ===== */}
            {modo === 'progreso' && (
              <div className="space-y-4">

                {/* ── Resumen numérico ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                  {[
                    { icon: '📅', valor: sesiones.length, label: 'sesiones' },
                    { icon: '⏱️', valor: `${tiempoTotal}min`, label: 'tiempo total' },
                    { icon: '⭐', valor: sel?.xp ?? 0, label: 'XP' },
                    { icon: '🪙', valor: sel?.monedas ?? 0, label: 'monedas' },
                    { icon: '✅', valor: sesiones.length
                        ? Math.round(sesiones.flatMap(s => s.resultados).filter(r => r.acierto).length /
                          Math.max(sesiones.flatMap(s => s.resultados).length, 1) * 100) + '%'
                        : '—',
                      label: 'éxito global' },
                    { icon: '🔥', valor: sesiones.length > 0
                        ? (() => {
                            const hoy = new Date(); let racha = 0; const dias = new Set(sesiones.map(s => new Date(s.fin).toDateString()))
                            for (let i = 0; i < 30; i++) { const d = new Date(hoy); d.setDate(hoy.getDate() - i); if (dias.has(d.toDateString())) racha++; else if (i > 0) break }
                            return racha
                          })()
                        : 0,
                      label: 'racha días' },
                    { icon: '📆', valor: sesiones.length
                        ? new Date(sesiones[0].fin).toLocaleDateString('es-ES', { day:'numeric', month:'short' })
                        : '—',
                      label: 'última sesión' },
                    { icon: '🎯', valor: sesiones.flatMap(s => s.resultados).length, label: 'rondas jugadas' },
                  ].map(({ icon, valor, label }) => (
                    <div key={label} className="crayon p-3 text-center" style={{ background: 'var(--papel-2)' }}>
                      <div className="text-2xl">{icon}</div>
                      <div className="mano text-xl font-black">{valor}</div>
                      <div className="mano text-xs" style={{ opacity: 0.65 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Perfil clínico */}
                <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
                  <h3 className="mano text-xl mb-2">🧬 Perfil clínico</h3>
                  {perfil.perfil !== 'insuficiente' && (
                    <div className="crayon mano p-3 text-sm mb-3"
                      style={{ background: perfil.urgencia === 'alta' ? 'var(--cera-coral)' : perfil.urgencia === 'media' ? 'var(--cera-mostaza)' : 'var(--cera-verde)', color: '#fff' }}>
                      {perfil.descripcion}
                    </div>
                  )}
                  <RadarIndices indices={indicesGlobal} />

                  {/* Alerta doble déficit */}
                  {indicesGlobal.alertaDislexia && (
                    <div className="crayon mt-3 p-3 mano text-sm text-white" style={{ background: 'var(--cera-coral)' }}>
                      ⚠️ <b>Perfil de doble déficit detectado</b> — Velocidad de denominación y conciencia fonémica bajas simultáneamente.
                      Priorizar RAN y actividades de fonemas en las próximas sesiones mientras se completa la evaluación formal.
                    </div>
                  )}

                  {/* Tabla normativa por índice */}
                  {!edadGrupo && (
                    <p className="mano text-sm mt-3" style={{ opacity: 0.5 }}>
                      Introduce la edad del paciente para ver clasificación normativa por índice.
                    </p>
                  )}
                  {edadGrupo && (
                    <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                      {([
                        ['fonologicoGlobal', 'Fonológico', false],
                        ['silabicoGlobal', 'Silábico', false],
                        ['rimasGlobal', 'Rimas', false],
                        ['coherenciaLexica', 'Léxico', false],
                        ['memoriaFonologica', 'Memoria fon.', false],
                        ['velocidadProcesamiento', 'Velocidad RAN', false],
                        ['automatizacion', 'Automatización', false],
                        ['precisionAuditiva', 'Precisión aud.', false],
                        ['riesgoLector', 'Necesidad de refuerzo', true],
                      ] as [string, string, boolean][]).map(([key, nombre, inv]) => {
                        const val = indicesGlobal[key as keyof typeof indicesGlobal] as number
                        const nivel: NivelIndice = clasificarIndice(key, val, edadGrupo, inv)
                        const bgAlarma = nivel === 'alarma' ? 'var(--cera-coral)' : 'var(--papel)'
                        return (
                          <div key={key} className="crayon px-2 py-2 text-center"
                            style={{ background: bgAlarma }}>
                            <div style={{ opacity: 0.7 }}>{nombre}</div>
                            <div className="mano text-2xl font-bold"
                              style={{ color: nivel === 'alarma' ? '#fff' : 'var(--tinta)' }}>
                              {val}
                            </div>
                            <div className="text-xs"
                              style={{ color: nivel === 'alarma' ? '#fff' : 'var(--tinta)' }}>
                              {nivel === 'alarma' ? '⚠️ Alarma'
                                : nivel === 'atencion' ? '⚡ Atención'
                                : nivel === 'normal' ? '✅ Normal'
                                : '—'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Dosis recomendada */}
                  <div className="crayon mt-3 p-3 mano text-sm"
                    style={{ background: 'var(--papel)' }}>
                    {sel.itinerario === 'prevencion'
                      ? '💊 Dosis recomendada (prevención): 15 min/día integrados en rutina'
                      : sel.itinerario === 'intervencion'
                        ? '💊 Dosis recomendada (intervención): 30-60 min · 4-5 veces/semana · mínimo 5 meses'
                        : '📋 Sin itinerario asignado — edita la ficha del paciente para ver recomendación de dosis'}
                  </div>
                </div>
                {/* Evolución */}
                {sesiones.length === 0 && (
                  <div className="crayon p-4 mano text-center" style={{ background: 'var(--papel-2)', opacity: 0.6 }}>
                    Sin sesiones todavía. Juega una actividad para ver la evolución.
                  </div>
                )}
                {sesiones.length === 1 && (
                  <div className="crayon p-4 mano text-center" style={{ background: 'var(--papel-2)', opacity: 0.6 }}>
                    1 sesión registrada. Juega una más para ver la gráfica de evolución.
                  </div>
                )}
                {serieEvo.length >= 2 && (
                  <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
                    <h3 className="mano text-xl mb-3">📈 Evolución</h3>
                    <div className="h-56">
                      <ResponsiveContainer>
                        <LineChart data={serieEvo}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0cdab" />
                          <XAxis dataKey="s" tick={{ fill: '#4a3f35', fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#4a3f35', fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="F" name="Fonológico" stroke="#8bbf6a" strokeWidth={2} />
                          <Line type="monotone" dataKey="Si" name="Silábico" stroke="#f2c14e" strokeWidth={2} />
                          <Line type="monotone" dataKey="V" name="Velocidad" stroke="#6cb6d9" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {/* Patrones */}
                {patrones.length > 0 && (
                  <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
                    <h3 className="mano text-xl mb-3">🧠 Alertas y recomendaciones</h3>
                    {patrones.map((h, i) => (
                      <div key={i} className="crayon p-3 mb-2 text-sm" style={{ background: 'var(--papel)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`mano text-sm px-2 py-0.5 rounded-full text-white ${
                            h.severidad === 'alta' ? 'bg-rose-500'
                            : h.severidad === 'media' ? 'bg-amber-500'
                            : 'bg-slate-400'
                          }`}>
                            {h.severidad}
                          </span>
                          <b>{h.patron}</b>
                        </div>
                        <p style={{ opacity: 0.7 }}>{h.recomendacion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== MODO INFORMES ===== */}
            {modo === 'informes' && (
              <div className="space-y-4">
                <div className="crayon p-5 text-center" style={{ background: 'var(--papel-2)' }}>
                  <h2 className="mano text-2xl mb-4">📄 Generar informe</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => window.print()}
                      className="crayon mano py-4 text-lg text-white"
                      style={{ background: 'var(--cera-azul)' }}>
                      🖨️ Informe PDF<br /><span className="text-xs opacity-80">Completo con índices</span>
                    </button>
                    <button onClick={exportarCSV}
                      className="crayon mano py-4 text-lg text-white"
                      style={{ background: 'var(--cera-verde)' }}>
                      📊 Exportar CSV<br /><span className="text-xs opacity-80">Datos de sesiones</span>
                    </button>
                  </div>
                  <div className="crayon mt-4 p-3 mano text-xs" style={{ background: 'var(--cera-mostaza)' }}>
                    ⚠️ Documento Confidencial — Uso exclusivo profesional.<br />
                    Este informe es orientativo y NO constituye diagnóstico clínico.
                  </div>
                </div>
                {/* Resumen para el informe */}
                <div className="crayon p-5" style={{ background: 'var(--papel-2)' }}>
                  <h3 className="mano text-xl mb-3">{sel.nombre} · {tiempoTotal} min · {sesiones.length} sesiones</h3>
                  <RadarIndices indices={indicesGlobal} />
                  <p className="mano text-sm mt-3" style={{ color: perfil.urgencia === 'alta' ? 'var(--cera-coral)' : 'var(--cera-verde)' }}>
                    {perfil.descripcion}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── PANEL FEEDBACK COMUNIDAD ─── */}
        <section className="crayon p-5 mt-6 print:hidden" style={{ background: 'var(--papel-2)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="mano text-2xl">🐛 Feedback de la comunidad</h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={copiarParaClaude}
                className="crayon mano px-4 py-2 text-base text-white"
                style={{ background: copiado ? 'var(--cera-verde)' : 'var(--cera-coral)' }}>
                {copiado ? '✅ ¡Copiado!' : '📋 Copiar para Claude'}
              </button>
              <button onClick={() => exportarFeedbackCSV(feedbacks)}
                className="crayon mano px-4 py-2 text-base text-white"
                style={{ background: 'var(--cera-azul)' }}>
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
              <div key={f.id ?? i} className="crayon p-2 text-sm flex flex-wrap gap-2 items-start" style={{ background: 'var(--papel)' }}>
                <span className="mano text-base font-semibold" style={{ color: 'var(--cera-coral)' }}>
                  {TIPOS_FEEDBACK[f.tipo as keyof typeof TIPOS_FEEDBACK] ?? f.tipo}
                </span>
                <span className="mano text-sm" style={{ opacity: 0.7 }}>{f.actividad} · <em>{f.item_actual}</em></span>
                {f.mensaje && <span className="mano text-sm w-full" style={{ opacity: 0.85 }}>"{f.mensaje}"</span>}
                <span className="mano text-xs" style={{ opacity: 0.45 }}>
                  {f.created_at ? new Date(f.created_at).toLocaleString('es-ES') : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
