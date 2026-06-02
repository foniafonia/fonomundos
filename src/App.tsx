import { useState } from 'react'
import type { Paciente, Sesion } from './types'
import { getActividad } from './data/actividades'
import Home from './screens/Home'
import Mundo1, { type Especial } from './screens/Mundo1'
import JugarActividad from './components/JugarActividad'
import Policubos from './components/Policubos'
import CadenaDomino from './components/CadenaDomino'
import OrdenarFrase from './components/OrdenarFrase'
import { LEXICO_ACT2 } from './data/guia'
import BuscaSonido from './components/BuscaSonido'
import ClasificarSilabas from './components/ClasificarSilabas'
import EmparejarOracion from './components/EmparejarOracion'
import CrearPalabras from './components/CrearPalabras'
import UnirParejas from './components/UnirParejas'
import ResultadoSesion from './screens/ResultadoSesion'
import Logopeda from './screens/Logopeda'

type Vista =
  | { v: 'home' }
  | { v: 'mundo' }
  | { v: 'jugar'; actividadId: string }
  | { v: 'especial'; especial: Especial }
  | { v: 'resultado'; sesion: Sesion; volver: Vista }
  | { v: 'logopeda' }

export default function App() {
  const [vista, setVista] = useState<Vista>({ v: 'home' })
  const [paciente, setPaciente] = useState<Paciente | null>(null)

  switch (vista.v) {
    case 'home':
      return (
        <Home
          onEntrar={(p) => { setPaciente(p); setVista({ v: 'mundo' }) }}
          onLogopeda={() => setVista({ v: 'logopeda' })}
        />
      )

    case 'mundo':
      if (!paciente) { setVista({ v: 'home' }); return null }
      return (
        <Mundo1
          paciente={paciente}
          onJugar={(actividadId) => setVista({ v: 'jugar', actividadId })}
          onEspecial={(especial) => setVista({ v: 'especial', especial })}
          onSalir={() => setVista({ v: 'home' })}
        />
      )

    case 'jugar': {
      const actividad = getActividad(vista.actividadId)
      if (!actividad || !paciente) { setVista({ v: 'mundo' }); return null }
      return (
        <JugarActividad
          actividad={actividad}
          pacienteId={paciente.id}
          onSalir={() => setVista({ v: 'mundo' })}
          onFinish={(sesion) => setVista({ v: 'resultado', sesion, volver: vista })}
        />
      )
    }

    case 'especial': {
      if (!paciente) { setVista({ v: 'mundo' }); return null }
      const onFinish = (sesion: Sesion) => setVista({ v: 'resultado', sesion, volver: vista })
      const onSalir = () => setVista({ v: 'mundo' })
      if (vista.especial === 'policubos')
        return <Policubos pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'policubos-silabico')
        return <Policubos pacienteId={paciente.id} modo="silaba" onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'ordenar-frase')
        return <OrdenarFrase pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'ordenar-imagen')
        return <OrdenarFrase pacienteId={paciente.id} fuente={LEXICO_ACT2} actividadId="ordenar-imagen" subtitulo="Conciencia léxica · Ordena la frase del dibujo" onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'busca-sonido')
        return <BuscaSonido pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'clasificar-silabas')
        return <ClasificarSilabas pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'emparejar-oracion')
        return <EmparejarOracion pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'crear-palabras')
        return <CrearPalabras pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'unir-sonido')
        return <UnirParejas pacienteId={paciente.id} tipo="sonido" onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'unir-silaba')
        return <UnirParejas pacienteId={paciente.id} tipo="silaba" onFinish={onFinish} onSalir={onSalir} />
      return (
        <CadenaDomino
          pacienteId={paciente.id}
          tipo={vista.especial === 'cadena-fonemica' ? 'fonemica' : 'silabica'}
          onFinish={onFinish}
          onSalir={onSalir}
        />
      )
    }

    case 'resultado':
      return (
        <ResultadoSesion
          sesion={vista.sesion}
          onRepetir={() => setVista(vista.volver)}
          onVolver={() => setVista({ v: 'mundo' })}
        />
      )

    case 'logopeda':
      return <Logopeda onSalir={() => setVista({ v: 'home' })} />
  }
}
