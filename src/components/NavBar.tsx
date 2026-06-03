/**
 * NavBar — Barra de navegación global siempre visible.
 * Resuelve el problema "el usuario nunca debe sentirse atrapado".
 * Muestra: ← Volver | Título | FeedbackBtn
 */
import FeedbackBtn from './FeedbackBtn'

interface Props {
  titulo?: string
  onVolver?: () => void        // si no se pasa, no muestra ←
  volverLabel?: string         // texto del botón volver (default: "← Volver")
  feedbackActividad?: string   // contexto para el feedback
  feedbackItem?: string
  children?: React.ReactNode   // acciones adicionales a la derecha
}

export default function NavBar({
  titulo, onVolver, volverLabel = '← Volver',
  feedbackActividad = 'general', feedbackItem = '',
  children,
}: Props) {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3 print:hidden sticky top-0 z-30"
      style={{ background: 'var(--papel)', borderBottom: '1px solid var(--papel-2)' }}
    >
      {onVolver && (
        <button
          onClick={onVolver}
          className="crayon mano px-3 py-1.5 text-sm flex-shrink-0"
          style={{ background: 'var(--papel-2)' }}
        >
          {volverLabel}
        </button>
      )}
      {titulo && (
        <span className="mano text-base font-bold flex-1 truncate" style={{ opacity: 0.85 }}>
          {titulo}
        </span>
      )}
      {!titulo && <span className="flex-1" />}
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}
        <FeedbackBtn actividad={feedbackActividad} itemActual={feedbackItem} compact />
      </div>
    </header>
  )
}
