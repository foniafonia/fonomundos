/**
 * Feedback profesional — para logopedas en el panel clínico.
 * Más rico que el botón del niño: permite sugerir funciones, reportar
 * errores en mediciones, pedir nuevas actividades, etc.
 */
import { useState } from 'react'
import { enviarFeedback } from '../lib/feedback'

type TipoPro = 'medicion_erronea' | 'actividad_nueva' | 'error_clinico' | 'mejora_panel' | 'otro'

const TIPOS_PRO: Record<TipoPro, string> = {
  medicion_erronea: '📊 Índice o medición incorrecta',
  actividad_nueva:  '➕ Necesito esta actividad',
  error_clinico:    '🧬 Error en criterio clínico',
  mejora_panel:     '🩺 Mejora del panel logopeda',
  otro:             '💬 Otra sugerencia',
}

export default function FeedbackLogopeda() {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoPro>('medicion_erronea')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok'>('idle')

  async function enviar() {
    if (!mensaje.trim()) return
    setEstado('enviando')
    await enviarFeedback('panel-logopeda', 'profesional', 'otro', `[${tipo}] ${mensaje}`)
    setEstado('ok')
    setTimeout(() => { setAbierto(false); setEstado('idle'); setMensaje('') }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="crayon mano px-4 py-2 text-base text-white print:hidden"
        style={{ background: 'var(--cera-lila)' }}
      >
        💡 Sugerir mejora clínica
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,63,53,0.6)' }}>
          <div className="crayon w-full max-w-lg p-5 text-[var(--tinta)]" style={{ background: 'var(--papel)' }}>
            <h2 className="mano text-2xl mb-1">💡 Feedback profesional</h2>
            <p className="mano text-sm mb-3" style={{ opacity: 0.7 }}>
              Tu opinión como logopeda es la que más importa para mejorar FonoMundos.
              Reporta errores en mediciones, actividades que faltan o problemas clínicos.
            </p>

            <div className="grid grid-cols-1 gap-2 mb-3">
              {(Object.entries(TIPOS_PRO) as [TipoPro, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setTipo(k)}
                  className="crayon mano text-sm px-3 py-2 text-left"
                  style={{ background: tipo === k ? 'var(--cera-lila)' : 'var(--papel-2)', color: tipo === k ? '#fff' : 'var(--tinta)' }}>
                  {v}
                </button>
              ))}
            </div>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe con detalle: qué esperabas ver, qué viste, y cómo debería funcionar según tu criterio clínico…"
              rows={4}
              className="crayon mano w-full px-3 py-2 text-base resize-none mb-4"
              style={{ background: 'var(--papel-2)' }}
            />

            <div className="flex gap-3">
              <button onClick={() => setAbierto(false)} className="crayon mano flex-1 py-2 text-base" style={{ background: 'var(--papel-2)' }}>
                Cancelar
              </button>
              <button onClick={enviar} disabled={!mensaje.trim() || estado === 'enviando'}
                className="crayon mano flex-1 py-2 text-base text-white disabled:opacity-40"
                style={{ background: estado === 'ok' ? 'var(--cera-verde)' : 'var(--cera-lila)' }}>
                {estado === 'enviando' ? '…' : estado === 'ok' ? '✅ ¡Recibido!' : 'Enviar feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
