import { useState } from 'react'

/**
 * Botoncito "¿Por qué así?" — explica una decisión de diseño a los profesionales:
 * qué pidió la comunidad, cómo se resolvió y por qué NO se hizo de otra forma.
 * Hace transparente el criterio clínico detrás de cada cambio.
 */
interface Props {
  pedido: string          // qué se pidió / qué problema había
  decision: string        // cómo se hizo y por qué
  alternativa?: string    // por qué NO de otra forma
  etiqueta?: string
}

export default function PorQueAsi({ pedido, decision, alternativa, etiqueta = '¿Por qué así?' }: Props) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="inline-flex flex-col items-center" style={{ maxWidth: '100%' }}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="mano inline-flex items-center gap-1 px-3 py-1 text-xs sm:text-sm"
        style={{
          background: abierto ? 'var(--cera-lila)' : 'transparent',
          color: abierto ? '#fff' : 'var(--cera-lila)',
          border: '2px solid var(--cera-lila)',
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        💡 {etiqueta}
      </button>
      {abierto && (
        <div
          role="note"
          className="crayon mano mt-2 p-4 text-left"
          style={{ background: 'var(--papel-2)', maxWidth: 420, fontSize: '0.9rem', lineHeight: 1.4 }}
        >
          <p style={{ marginBottom: 8 }}>
            <b style={{ color: 'var(--cera-coral)' }}>Se pidió:</b> {pedido}
          </p>
          <p style={{ marginBottom: alternativa ? 8 : 0 }}>
            <b style={{ color: 'var(--cera-verde)' }}>Lo hicimos así:</b> {decision}
          </p>
          {alternativa && (
            <p style={{ marginBottom: 0 }}>
              <b style={{ color: 'var(--cera-mostaza)' }}>Por qué no de otra forma:</b> {alternativa}
            </p>
          )}
          <button
            onClick={() => setAbierto(false)}
            className="mano mt-3 px-3 py-1 text-xs"
            style={{ background: 'var(--papel)', border: '1px solid var(--tinta-2)', borderRadius: 8, cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
