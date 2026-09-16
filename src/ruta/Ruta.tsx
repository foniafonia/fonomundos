import { useState } from 'react'
import type { Paciente } from '../types'
import SesionHoy from './SesionHoy'
import PanelRuta from './PanelRuta'
import JuegosRuta from './JuegosRuta'

interface Props {
  paciente: Paciente
  onSalir: () => void
}

type Vista = 'hoy' | 'panel' | 'juegos'

/** Entrada de la Ruta desde App: la sesión de hoy, el panel del profesional y todos los juegos. */
export default function Ruta({ paciente, onSalir }: Props) {
  const [vista, setVista] = useState<Vista>('hoy')
  // Al volver a la sesión se vuelve a montar para que lea el estado recién guardado.
  const [vuelta, setVuelta] = useState(0)

  function volverAHoy() {
    setVuelta((v) => v + 1)
    setVista('hoy')
  }

  if (vista === 'panel') {
    return <PanelRuta paciente={paciente} onVolver={volverAHoy} onJuegos={() => setVista('juegos')} />
  }
  if (vista === 'juegos') {
    return <JuegosRuta onVolver={volverAHoy} />
  }
  return (
    <SesionHoy key={vuelta} paciente={paciente}
      onPanel={() => setVista('panel')} onJuegos={() => setVista('juegos')} onSalir={onSalir} />
  )
}
