import { useState } from 'react'
import { enviarFeedback, TIPOS_FEEDBACK, type TipoFeedback } from '../lib/feedback'
import { registrarEventoUso } from '../lib/analytics'

interface Props {
  actividad: string
  itemActual: string
  compact?: boolean   // modo compacto para navbar (solo icono)
}

export default function FeedbackBtn({ actividad, itemActual, compact = false }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoFeedback>('se_repite')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')

  function abrirFeedback() {
    setAbierto(true)
    registrarEventoUso('feedback_abierto', { actividad, itemActual, compact })
  }

  async function enviar() {
    if (estado === 'enviando') return
    setEstado('enviando')
    const r = await enviarFeedback(actividad, itemActual, tipo, mensaje)
    setEstado(r.supabase ? 'ok' : 'ok') // local siempre funciona
    setTimeout(() => { setAbierto(false); setEstado('idle'); setMensaje('') }, 1800)
  }

  return (
    <>
      {/* Botón: compacto (navbar) o flotante (actividades) */}
      {compact ? (
        <button
          onClick={abrirFeedback}
          aria-label="Reportar / sugerir mejora"
          title="¡Triturala a críticas! Reporta o sugiere"
          className="feedback-trigger-compact crayon mano px-2 py-1 text-sm"
          style={{ background: 'var(--cera-coral)', color: '#fff' }}
        >
          💬
        </button>
      ) : (
        <button
          onClick={abrirFeedback}
          aria-label="Decir qué mejorar"
          title="Decir qué mejorar"
          className="feedback-trigger fixed bottom-4 right-4 z-40 crayon mano"
        >
          <span className="feedback-trigger__bug" aria-hidden="true">💬</span>
          <span className="feedback-trigger__text">
            <strong>Decir qué mejorar</strong>
            <small>Tu opinión cambia el juego</small>
          </span>
        </button>
      )}

      {/* modal */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,63,53,0.5)' }}>
          <div className="crayon w-full max-w-md p-5 text-[var(--tinta)]" style={{ background: 'var(--papel)' }}>
            <h2 className="mano text-2xl mb-0.5">💬 ¿Qué mejorarías?</h2>
            <p className="mano text-sm mb-1" style={{ color: 'var(--cera-lila)' }}>Dinos qué cambiarías, qué no se entiende o qué haría más útil esta actividad.</p>
            <p className="text-xs mb-3" style={{ opacity: 0.5 }}>
              {actividad}{itemActual && ` · ${itemActual}`}
            </p>
            <p className="mano text-base mb-2">Elige una opción rápida</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.entries(TIPOS_FEEDBACK) as [TipoFeedback, string][]).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setTipo(k)}
                  className="crayon mano text-sm px-3 py-2 text-left"
                  style={{ background: tipo === k ? 'var(--cera-mostaza)' : 'var(--papel-2)' }}
                >
                  {v}
                </button>
              ))}
            </div>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ejemplo: la voz va rápida, no se entiende la consigna, falta un botón volver..."
              rows={3}
              className="crayon mano w-full px-3 py-2 text-base resize-none mb-4"
              style={{ background: 'var(--papel-2)' }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setAbierto(false); setEstado('idle') }}
                className="crayon mano flex-1 py-2 text-base"
                style={{ background: 'var(--papel-2)' }}
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={estado === 'enviando'}
                className="crayon mano flex-1 py-2 text-base text-white disabled:opacity-50"
                style={{ background: estado === 'ok' ? 'var(--cera-verde)' : 'var(--cera-coral)' }}
              >
                {estado === 'enviando' ? '…' : estado === 'ok' ? '✅ ¡Gracias!' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
