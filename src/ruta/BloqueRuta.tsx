import type { ComponentType, ReactNode } from 'react'
import FeedbackBtn from '../components/FeedbackBtn'
import MemoriaSeries from './actividades/MemoriaSeries'
import Articulacion from './actividades/Articulacion'
import MontaSilaba from './actividades/MontaSilaba'
import { MemoriaAnadida, MemoriaFalta } from './actividades/MemoriaGrupo'
import type { PropsBloque } from './tipos'

/**
 * Marco de pantalla para las actividades propias de la Ruta: botón de salir,
 * cabecera libre y la actividad. Lo comparten la sesión de hoy y la pantalla
 * de probar juegos, para que se vean igual en los dos sitios.
 */

const ACTIVIDADES: Record<string, ComponentType<PropsBloque>> = {
  'memoria-series': MemoriaSeries,
  articulacion: Articulacion,
  'monta-silaba': MontaSilaba,
  'memoria-quitado': MemoriaFalta,
  'memoria-anadido': MemoriaAnadida,
}

interface Props {
  actividadId: string
  bloque: PropsBloque
  textoSalir: string
  onSalir: () => void
  cabecera: ReactNode
  feedbackItem: string
}

export default function BloqueRuta({ actividadId, bloque, textoSalir, onSalir, cabecera, feedbackItem }: Props) {
  return (
    <div className="papel min-h-full flex flex-col text-[var(--tinta)]">
      <FeedbackBtn actividad="ruta" itemActual={feedbackItem} />
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 p-4 pr-36 sm:pr-4"
        style={{ background: 'var(--papel)', borderBottom: '1px solid var(--papel-2)' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>
          {textoSalir}
        </button>
        {cabecera}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 pb-32 pt-4 sm:pb-6">
        {(() => {
          const Actividad = ACTIVIDADES[actividadId]
          return Actividad ? <Actividad {...bloque} /> : <p className="mano text-lg">«{actividadId}» no está disponible.</p>
        })()}
      </main>
    </div>
  )
}
