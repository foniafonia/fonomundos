import { useEffect, useState } from 'react'
import type { Paciente, Sesion } from './types'
import { getActividad } from './data/actividades'
import Landing from './screens/Landing'
import AuthScreen from './screens/AuthScreen'
import Home from './screens/Home'
import PanelProfesional from './screens/PanelProfesional'
import Comunidad from './screens/Comunidad'
import Mundo1, { type Especial } from './screens/Mundo1'
import Mundo2Rimas from './screens/Mundo2Rimas'
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
import DetectarRima from './components/DetectarRima'
import RAN from './components/RAN'
import Pseudopalabras from './components/Pseudopalabras'
import ManipulacionMedial from './components/ManipulacionMedial'
import ResultadoSesion from './screens/ResultadoSesion'
import Logopeda from './screens/Logopeda'
import Admin from './screens/Admin'
import { onAuthChange, onAuthEvent } from './lib/storageCloud'
import { setModoEvaluacion } from './lib/modoEvaluacion'

type Vista =
  | { v: 'landing' }
  | { v: 'auth' }
  | { v: 'home' }
  | { v: 'panel' }       // panel profesional multi-tenant
  | { v: 'comunidad' }
  | { v: 'admin' }
  | { v: 'mundo'; num?: number }
  | { v: 'jugar'; actividadId: string }
  | { v: 'especial'; especial: Especial }
  | { v: 'resultado'; sesion: Sesion; volver: Vista }
  | { v: 'logopeda' }

export default function App() {
  const [vista, setVista] = useState<Vista>({ v: 'landing' })
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [profesionalId, setProfesionalId] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'registro' | 'recuperar' | 'restablecer'>('login')

  // Contador para forzar recarga de sesiones en el panel tras jugar
  const [sesionKey, setSesionKey] = useState(0)

  useEffect(() => {
    const unsub = onAuthChange((uid) => {
      setProfesionalId(uid)
      if (uid) {
        // Limpiar pacientes locales huérfanos (Pepe, Pepa, etc.)
        localStorage.removeItem('fonomundos.pacientes')
        localStorage.removeItem('fonomundos.sesiones')
        localStorage.removeItem('fonomundos.pacienteActivo')
        // Si está en landing/auth/home → ir al panel
        if (['landing', 'auth', 'home'].includes(vista.v)) setVista({ v: 'panel' })
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setAuthMode('restablecer')
      setVista({ v: 'auth' })
    }

    const unsub = onAuthEvent((event, uid) => {
      if (event === 'PASSWORD_RECOVERY') {
        setProfesionalId(uid)
        setAuthMode('restablecer')
        setVista({ v: 'auth' })
      }
    })
    return unsub
  }, [])

  switch (vista.v) {
    case 'landing':
      return (
        <Landing
          profesionalId={profesionalId}
          onIniciarSesion={() => setVista({ v: 'auth' })}
          onInvitado={() => setVista({ v: 'home' })}
          onVerInfo={() => setVista({ v: 'comunidad' })}
          onUltimoPaciente={() => profesionalId ? setVista({ v: 'panel' }) : setVista({ v: 'home' })}
        />
      )

    case 'auth':
      return (
        <AuthScreen
          initialMode={authMode}
          onAuth={(uid) => { setProfesionalId(uid); setVista({ v: 'panel' }) }}
          onSinCuenta={() => setVista({ v: 'home' })}
        />
      )

    case 'panel':
      return (
        <PanelProfesional
          key={sesionKey}  // fuerza remount y recarga de sesiones tras jugar
          profesionalId={profesionalId ?? 'local'}
          onJugar={(p) => { setPaciente(p); setModoEvaluacion(false); setVista({ v: 'mundo' }) }}
          onEvaluar={(p) => { setPaciente(p); setModoEvaluacion(true); setVista({ v: 'mundo' }) }}
          onSalir={() => setVista({ v: 'home' })}
        />
      )

    case 'home':
      return (
        <Home
          onEntrar={(p) => { setPaciente(p); setVista({ v: 'mundo' }) }}
          onLogopeda={() => {
            setAuthMode('login')
            profesionalId ? setVista({ v: 'panel' }) : setVista({ v: 'auth' })
          }}
          onAdmin={() => setVista({ v: 'admin' })}
          onComunidad={() => setVista({ v: 'comunidad' })}
        />
      )

    case 'comunidad':
      return <Comunidad onSalir={() => setVista({ v: 'landing' })} />

    case 'admin':
      return <Admin onSalir={() => setVista({ v: 'landing' })} />

    case 'mundo':
      if (!paciente) { setVista({ v: 'home' }); return null }
      if (vista.num === 2) return (
        <Mundo2Rimas
          paciente={paciente}
          onEspecial={(especial) => setVista({ v: 'especial', especial })}
          onSalir={() => setVista({ v: 'mundo' })}
        />
      )
      return (
        <Mundo1
          paciente={paciente}
          onJugar={(actividadId) => setVista({ v: 'jugar', actividadId })}
          onEspecial={(especial) => setVista({ v: 'especial', especial })}
          onMundo2={() => setVista({ v: 'mundo', num: 2 })}
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
      if (vista.especial === 'detectar-rima')
        return <DetectarRima pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'ran')
        return <RAN pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'pseudopalabras')
        return <Pseudopalabras pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
      if (vista.especial === 'manipulacion-medial')
        return <ManipulacionMedial pacienteId={paciente.id} onFinish={onFinish} onSalir={onSalir} />
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
          onVolver={() => {
            // Volver al mapa del mundo
            setVista({ v: 'mundo' })
          }}
          onVolverPanel={() => {
            // Volver al panel y forzar recarga de sesiones
            setSesionKey((k) => k + 1)
            setVista({ v: 'panel' })
          }}
        />
      )

    case 'logopeda':
      return <Logopeda onSalir={() => setVista({ v: 'home' })} />
  }
}
