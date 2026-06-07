/**
 * Comunidad — pilar central del proyecto.
 * Reportar errores / proponer actividades / votar ideas / ver roadmap.
 */
import { useState } from 'react'
import QRCode from '../components/QRCode'
import { enviarFeedback, TIPOS_FEEDBACK, type TipoFeedback } from '../lib/feedback'
import { ESTADO_MEJORA_LABEL, MEJORAS_COMUNIDAD, type EstadoMejora } from '../data/mejorasComunidad'

interface Props {
  onSalir: () => void
  initialTab?: TabCom
}

type TabCom = 'mejoras' | 'telegram' | 'reportar' | 'proponer' | 'roadmap'

const ROADMAP = [
  { estado: '✅', item: 'Mundo 1 · Conciencia Fonológica (27 actividades)' },
  { estado: '✅', item: 'Mundo 2 · Rimas (puente fonémica)' },
  { estado: '✅', item: 'RAN, Pseudopalabras, Manipulación Medial' },
  { estado: '✅', item: 'Sistema de cribado con normas por edad' },
  { estado: '✅', item: 'Panel profesional multi-tenant' },
  { estado: '🔄', item: 'Mundo 3 · Velocidad lectora' },
  { estado: '🔄', item: 'Mundo 4 · Vocabulario' },
  { estado: '🔄', item: 'Estudio de validación (100 niños/grupo)' },
  { estado: '📋', item: 'Mundo 5 · Morfosintaxis' },
  { estado: '📋', item: 'Actividades para TEA / TDAH / Dislexia' },
  { estado: '📋', item: 'App móvil nativa' },
  { estado: '📋', item: 'Reconocimiento de voz' },
]

const ESTILO_ESTADO: Record<EstadoMejora, { bg: string; color: string }> = {
  implementado: { bg: 'var(--cera-verde)', color: '#fff' },
  en_progreso: { bg: 'var(--cera-mostaza)', color: 'var(--tinta)' },
  priorizado: { bg: 'var(--cera-coral)', color: '#fff' },
  planificado: { bg: 'var(--papel-2)', color: 'var(--tinta)' },
}

export default function Comunidad({ onSalir, initialTab = 'mejoras' }: Props) {
  const [tab, setTab] = useState<TabCom>(initialTab)
  const [tipo, setTipo] = useState<TipoFeedback>('se_repite')
  const [mensaje, setMensaje] = useState('')
  const [propuesta, setPropuesta] = useState('')
  const [estado, setEstado] = useState<'idle' | 'ok'>('idle')

  async function enviarReporte() {
    if (!mensaje.trim()) return
    await enviarFeedback('comunidad', 'reporte', tipo, mensaje)
    setEstado('ok')
    setTimeout(() => { setEstado('idle'); setMensaje('') }, 2000)
  }

  async function enviarPropuesta() {
    if (!propuesta.trim()) return
    await enviarFeedback('comunidad', 'propuesta', 'otro', propuesta)
    setEstado('ok')
    setTimeout(() => { setEstado('idle'); setPropuesta('') }, 2000)
  }

  const TABS: { id: TabCom; emoji: string; label: string }[] = [
    { id: 'mejoras', emoji: '✅', label: 'Mejoras' },
    { id: 'telegram', emoji: '✈️', label: 'Únete' },
    { id: 'reportar', emoji: '🔨', label: 'Reportar' },
    { id: 'proponer', emoji: '💡', label: 'Proponer' },
    { id: 'roadmap', emoji: '🗺️', label: 'Ruta' },
  ]
  const implementadas = MEJORAS_COMUNIDAD.filter((m) => m.estado === 'implementado').length

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <header className="grid grid-cols-[auto_1fr] items-center gap-3 p-4 sm:grid-cols-[auto_1fr_auto]" style={{ borderBottom: '1px solid var(--papel-2)' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Volver</button>
        <h1 className="mano min-w-0 text-center text-lg leading-tight sm:text-xl">🤝 Construcción Colaborativa</h1>
        <div className="hidden sm:block" />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="mano text-base text-center mb-4" style={{ opacity: 0.7 }}>
          FonoMundos se construye con la comunidad. Cada crítica deja huella en el juego.
        </p>
        <div className="crayon mb-6 p-4 text-center" style={{ background: 'var(--papel-2)' }}>
          <p className="mano text-sm" style={{ color: 'var(--cera-lila)' }}>Enlace público de seguimiento</p>
          <p className="break-all text-sm">fonomundos.vercel.app/#mejoras</p>
          <p className="mano mt-2 text-base font-bold">
            {implementadas}/{MEJORAS_COMUNIDAD.length} mejoras implementadas · Beta comunidad
          </p>
          <p className="mano text-xs mt-1" style={{ opacity: 0.65 }}>
            Primera tanda publicada el 08/06/2026 con feedback del 07/06/2026.
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6 sm:grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="crayon mano py-3 text-center"
              style={{ background: tab === t.id ? 'var(--cera-lila)' : 'var(--papel-2)', color: tab === t.id ? '#fff' : 'var(--tinta)' }}>
              <div className="text-2xl">{t.emoji}</div>
              <div className="text-xs">{t.label}</div>
            </button>
          ))}
        </div>

        {/* Mejoras */}
        {tab === 'mejoras' && (
          <div className="space-y-3">
            <h2 className="mano text-2xl">✅ Lo que la comunidad está cambiando</h2>
            <p className="mano text-sm" style={{ opacity: 0.7 }}>
              Este checklist muestra qué feedback ya se ha convertido en mejora, qué está en marcha y qué queda priorizado.
            </p>
            <div className="grid gap-3">
              {MEJORAS_COMUNIDAD.map((m) => {
                const estilo = ESTILO_ESTADO[m.estado]
                return (
                  <article key={m.id} className="crayon p-4" style={{ background: 'var(--papel)' }}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="mano text-lg font-black">{m.titulo}</h3>
                      <span className="crayon mano px-2 py-1 text-xs font-black" style={{ background: estilo.bg, color: estilo.color }}>
                        {ESTADO_MEJORA_LABEL[m.estado]}
                      </span>
                    </div>
                    <p className="mano mt-2 text-sm" style={{ opacity: 0.7 }}>
                      <strong>Feedback:</strong> {m.feedback}
                    </p>
                    <p className="mano mt-1 text-sm">
                      <strong>Mejora:</strong> {m.mejora}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="crayon mano px-2 py-1" style={{ background: 'var(--papel-2)' }}>Prioridad {m.prioridad}</span>
                      <span className="crayon mano px-2 py-1" style={{ background: 'var(--papel-2)' }}>Pedido {m.fechaFeedback}</span>
                      <span className="crayon mano px-2 py-1" style={{ background: 'var(--papel-2)' }}>Actualizado {m.fechaEstado}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {/* Telegram */}
        {tab === 'telegram' && (
          <div className="text-center space-y-4">
            <h2 className="mano text-2xl">Comunidad Logoped-IA</h2>
            <p className="mano text-base" style={{ opacity: 0.7 }}>
              Logopedas, PT, maestros y familias que usan IA para mejorar la práctica clínica.
            </p>
            <div className="flex justify-center">
              <QRCode url="https://t.me/logoped_ia" size={180} />
            </div>
            <p className="mano text-sm" style={{ opacity: 0.5 }}>Escanea desde el móvil</p>
            <a href="https://t.me/logoped_ia" target="_blank" rel="noopener noreferrer"
              className="crayon mano block py-3 text-xl text-white"
              style={{ background: 'var(--cera-azul)' }}>
              ✈️ Unirse a @LOGOPED_IA
            </a>
          </div>
        )}

        {/* Reportar */}
        {tab === 'reportar' && (
          <div className="space-y-3">
            <h2 className="mano text-2xl">🔨 ¡Triturala a críticas!</h2>
            <p className="mano text-sm" style={{ opacity: 0.7 }}>No te cortes. Cada reporte mejora la herramienta.</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TIPOS_FEEDBACK) as [TipoFeedback, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setTipo(k)}
                  className="crayon mano text-sm px-3 py-2 text-left"
                  style={{ background: tipo === k ? 'var(--cera-mostaza)' : 'var(--papel-2)' }}>
                  {v}
                </button>
              ))}
            </div>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)}
              placeholder="Cuéntamelo todo sin filtro… 🔥"
              rows={4} className="crayon mano w-full px-3 py-2 text-base resize-none"
              style={{ background: 'var(--papel-2)' }} />
            <button onClick={enviarReporte} disabled={!mensaje.trim()}
              className="crayon mano w-full py-3 text-lg text-white disabled:opacity-40"
              style={{ background: estado === 'ok' ? 'var(--cera-verde)' : 'var(--cera-coral)' }}>
              {estado === 'ok' ? '✅ Enviado — ¡gracias!' : '→ Enviar reporte'}
            </button>
          </div>
        )}

        {/* Proponer */}
        {tab === 'proponer' && (
          <div className="space-y-3">
            <h2 className="mano text-2xl">💡 Proponer una mejora</h2>
            <p className="mano text-sm" style={{ opacity: 0.7 }}>
              ¿Qué actividad falta? ¿Qué cambiarías? ¿Qué necesitan tus pacientes?
            </p>
            <textarea value={propuesta} onChange={(e) => setPropuesta(e.target.value)}
              placeholder="Describe tu propuesta con detalle. Cuanto más específica, más útil…"
              rows={5} className="crayon mano w-full px-3 py-2 text-base resize-none"
              style={{ background: 'var(--papel-2)' }} />
            <button onClick={enviarPropuesta} disabled={!propuesta.trim()}
              className="crayon mano w-full py-3 text-lg text-white disabled:opacity-40"
              style={{ background: estado === 'ok' ? 'var(--cera-verde)' : 'var(--cera-lila)' }}>
              {estado === 'ok' ? '✅ Propuesta enviada — ¡gracias!' : '→ Enviar propuesta'}
            </button>
          </div>
        )}

        {/* Roadmap */}
        {tab === 'roadmap' && (
          <div className="space-y-2">
            <h2 className="mano text-2xl mb-3">🗺️ Estado del proyecto</h2>
            {ROADMAP.map((r, i) => (
              <div key={i} className="crayon flex items-center gap-3 p-3" style={{ background: 'var(--papel-2)' }}>
                <span className="text-xl">{r.estado}</span>
                <span className="mano text-base">{r.item}</span>
              </div>
            ))}
            <p className="mano text-xs text-center mt-3" style={{ opacity: 0.5 }}>
              ✅ Completado · 🔄 En desarrollo · 📋 Planificado
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
