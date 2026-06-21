/**
 * StoryModePage — contenedor del Modo Historia.
 * Gestiona el estado: mapa ↔ actividad ↔ resultado.
 * No modifica ningún componente existente.
 */
import { useState } from 'react'
import type { Sesion } from '../../types'
import type { StoryZone } from './storyModeTypes'
import { loadProgress } from './storyModeStorage'
import StoryGame from './StoryGame'
import type { Especial } from '../../screens/Mundo1'

// Actividades especiales (usan componentes propios)
import Policubos from '../../components/Policubos'
import CadenaDomino from '../../components/CadenaDomino'
import OrdenarFrase from '../../components/OrdenarFrase'
import BuscaSonido from '../../components/BuscaSonido'
import ClasificarSilabas from '../../components/ClasificarSilabas'
import DetectarRima from '../../components/DetectarRima'
import Bingo from '../../components/Bingo'

const PACIENTE_STORY = 'story-mode-guest'

interface Props {
  pacienteId?: string
  onSalir: () => void
}

type StoryVista = 'mapa' | 'actividad'

export default function StoryModePage({ pacienteId = PACIENTE_STORY, onSalir }: Props) {
  const [vista, setVista] = useState<StoryVista>('mapa')
  const [zonaActiva, setZonaActiva] = useState<StoryZone | null>(null)
  const [visitedZones, setVisitedZones] = useState<string[]>(
    () => loadProgress().visitedZones
  )

  function entrarZona(zone: StoryZone) {
    setZonaActiva(zone)
    setVista('actividad')
  }

  function volverAlMapa() {
    const newVisited = (zonaActiva && !visitedZones.includes(zonaActiva.id))
      ? [...visitedZones, zonaActiva.id]
      : visitedZones
    if (zonaActiva && !visitedZones.includes(zonaActiva.id)) {
      setVisitedZones(newVisited)
    }
    const iframe = document.querySelector('iframe[title="FonoMundo — Bosque de los Sonidos"]') as HTMLIFrameElement
    iframe?.contentWindow?.postMessage({
      type: 'fonomundos:zone-exit',
      zoneId: zonaActiva?.id,
      visitedZones: newVisited
    }, '*')
    setVista('mapa')
  }

  function onFinish(_sesion: Sesion) {
    volverAlMapa()
  }

  if (vista === 'mapa' || !zonaActiva) {
    return (
      <StoryGame
        visitedZones={visitedZones}
        onEnterZone={entrarZona}
        onSalir={onSalir}
      />
    )
  }

  // Renderizar la actividad correspondiente
  const activity = zonaActiva.activity
  if (activity.type === 'especial') {
    return renderEspecial(activity.especial, pacienteId, onFinish, volverAlMapa)
  }

  // fallback
  return <div className="papel min-h-full flex items-center justify-center">
    <button onClick={volverAlMapa} className="crayon mano px-6 py-3">← Volver al mapa</button>
  </div>
}

function renderEspecial(
  especial: Especial,
  pacienteId: string,
  onFinish: (s: Sesion) => void,
  onSalir: () => void,
) {
  const props = { pacienteId, onFinish, onSalir }

  switch (especial) {
    case 'busca-sonido':
      return <BuscaSonido {...props} />
    case 'clasificar-silabas':
      return <ClasificarSilabas {...props} />
    case 'policubos':
      return <Policubos {...props} />
    case 'policubos-silabico':
      return <Policubos {...props} modo="silaba" />
    case 'cadena-fonemica':
      return <CadenaDomino {...props} tipo="fonemica" />
    case 'cadena-silabica':
      return <CadenaDomino {...props} tipo="silabica" />
    case 'ordenar-frase':
      return <OrdenarFrase {...props} />
    case 'detectar-rima':
      return <DetectarRima {...props} />
    case 'bingo':
      return <Bingo {...props} />
    default:
      return (
        <div className="papel min-h-full flex flex-col items-center justify-center gap-6">
          <span className="text-6xl">🚧</span>
          <p className="mano text-xl">Actividad próximamente</p>
          <button onClick={onSalir} className="crayon mano px-6 py-3">← Volver al mapa</button>
        </div>
      )
  }
}
