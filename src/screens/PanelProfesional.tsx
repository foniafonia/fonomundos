/**
 * Panel Profesional — 4 modos claramente separados:
 * 1. Jugar — actividades libres
 * 2. Evaluar — protocolo de cribado estructurado
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
import { determinarPerfil, PROTOCOLO_CRIBADO, grupoEdad } from '../lib/normas'
import RadarIndices from '../components/RadarIndices'
import FeedbackLogopeda from '../components/FeedbackLogopeda'
import type { Sesion } from '../types'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { calcularIndices } from '../lib/scoring'

type ModoPanel = 'jugar' | 'evaluar' | 'progreso' | 'informes'

interface Props {
  profesionalId: string
  onJugar: (p: Paciente) => void
  onEvaluar: (p: Paciente) => void
  onSalir: () => void
}

export default function PanelProfesional({ profesionalId, onJugar, onEvaluar, onSalir }: Props) {
  const [modo, setModo] = useState<ModoPanel>('jugar')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [cargando, setCargando] = useState(true)

  const sel = pacientes.find((p) => p.id === selId) ?? null

  useEffect(() => {
    cargarPacientes()
  }, [])

  useEffect(() => {
    if (selId) cargarSesiones(selId)
  }, [selId])

  async function cargarPacientes() {
    setCargando(true)
    const lista = await getPacientes()
    setPacientes(lista)
    if (lista.length && !selId) setSelId(lista[0].id)
    setCargando(false)
  }

  async function cargarSesiones(pacienteId: string) {
    const s = await getSesionesCloud(pacienteId)
    setSesiones(s)
  }

  async function nuevoPaciente() {
    const n = pacientes.length + 1
    const p = await crearPacienteCloud({ nombre: `Paciente ${n}` }, profesionalId)
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
        IMPORTANTE: Este informe es resultado de un cribado orientativo y NO constituye diagnóstico clínico.
        FonoMundos · fonomundos.vercel.app
      </div>

      <header className="flex items-center justify-between p-4 print:hidden" style={{ borderBottom: '1px solid var(--papel-2)' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Panel Profesional</span>
        <div className="flex gap-2">
          <FeedbackLogopeda />
          <button onClick={async () => { await signOut(); onSalir() }} className="mano text-sm opacity-50 hover:opacity-80">Cerrar sesión</button>
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
          <button onClick={nuevoPaciente} className="crayon mano px-3 py-1.5 text-base" style={{ background: 'var(--cera-verde)', color: '#fff' }}>
            + Nuevo paciente
          </button>
        </div>

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
                  <h2 className="mano text-2xl mb-2">🩺 Protocolo de cribado (20-30 min)</h2>
                  <p className="mano text-sm mb-4" style={{ opacity: 0.7 }}>
                    Orden basado en sensibilidad diagnóstica. Desactiva gamificación.
                  </p>
                  <div className="space-y-2 mb-4">
                    {PROTOCOLO_CRIBADO.map((paso, i) => (
                      <div key={paso.actividadId} className="crayon flex items-center gap-3 p-3" style={{ background: 'var(--papel)' }}>
                        <span className="mano text-lg w-6" style={{ color: 'var(--cera-lila)' }}>{i + 1}</span>
                        <span className="text-2xl">{paso.emoji}</span>
                        <div className="flex-1">
                          <span className="mano text-base font-bold">{paso.nombre}</span>
                          <span className={`ml-2 mano text-xs px-2 py-0.5 rounded-full ${paso.tipo === 'obligatoria' ? 'text-white' : ''}`}
                            style={{ background: paso.tipo === 'obligatoria' ? 'var(--cera-verde)' : 'var(--papel-2)' }}>
                            {paso.tipo}
                          </span>
                        </div>
                        <span className="mano text-xs opacity-50">{paso.duracionMin}min</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleEvaluar}
                    className="crayon mano w-full py-3 text-xl text-white"
                    style={{ background: 'var(--cera-azul)' }}>
                    ▶ Iniciar evaluación estructurada
                  </button>
                </div>

                {/* Ficha del paciente */}
                <div className="crayon p-5" style={{ background: 'var(--papel-2)' }}>
                  <h3 className="mano text-xl mb-3">Ficha · {sel.nombre}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['edad', 'curso', 'diagnostico'] as const).map((campo) => (
                      <label key={campo} className="flex flex-col gap-1">
                        <span className="mano text-xs opacity-60">{campo}</span>
                        <input value={(sel[campo] as string) || ''} onChange={(e) => actualizarCampo(campo, e.target.value)}
                          className="crayon mano px-3 py-2 text-base" style={{ background: 'var(--papel)' }} />
                      </label>
                    ))}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!sel.antecFamiliares} onChange={(e) => actualizarCampo('antecFamiliares', e.target.checked)} />
                      <span className="mano text-sm">🧬 Antec. familiares dislexia (+50-68%)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!sel.deficitSensorial} onChange={(e) => actualizarCampo('deficitSensorial', e.target.checked)} />
                      <span className="mano text-sm">👁️ Déficit sensorial (invalida cribado)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ===== MODO PROGRESO ===== */}
            {modo === 'progreso' && (
              <div className="space-y-4">
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
                </div>
                {/* Evolución */}
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
                        <b>{h.patron}</b>
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
                    <button
                      className="crayon mano py-4 text-lg"
                      style={{ background: 'var(--papel)' }}>
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
      </div>
    </div>
  )
}
