import { useState } from 'react'
import { enviarFeedback, TIPOS_FEEDBACK, type TipoFeedback } from '../lib/feedback'

interface Props {
  actividad: string
  itemActual: string
}

export default function FeedbackBtn({ actividad, itemActual }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoFeedback>('se_repite')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')

  async function enviar() {
    setEstado('enviando')
    const r = await enviarFeedback(actividad, itemActual, tipo, mensaje)
    setEstado(r.supabase ? 'ok' : 'ok') // local siempre funciona
    setTimeout(() => { setAbierto(false); setEstado('idle'); setMensaje('') }, 1800)
  }

  return (
    <>
      {/* botón flotante */}
      <button
        onClick={() => setAbierto(true)}
        aria-label="Reportar problema"
        title="Reportar un problema"
        className="fixed bottom-4 right-4 z-40 crayon w-11 h-11 text-xl flex items-center justify-center"
        style={{ background: 'var(--cera-coral)', color: '#fff', opacity: 0.85 }}
      >
        🐛
      </button>

      {/* modal */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(74,63,53,0.5)' }}>
          <div className="crayon w-full max-w-md p-5 text-[var(--tinta)]" style={{ background: 'var(--papel)' }}>
            <h2 className="mano text-2xl mb-1">🐛 Reportar problema</h2>
            <p className="text-sm mb-3" style={{ opacity: 0.6 }}>
              Actividad: <strong>{actividad}</strong>
              {itemActual && <> · Ítem: <strong>{itemActual}</strong></>}
            </p>

            <p className="mano text-base mb-2">¿Qué pasa?</p>
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
              placeholder="Cuéntame más (opcional)…"
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
