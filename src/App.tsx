import { useEffect, useState } from 'react'
import BotonesGlobales from './components/BotonesGlobales'
import type { Paciente, Sesion } from './types'
import { getActividad } from './data/actividades'
import Landing from './screens/Landing'
import AuthScreen from './screens/AuthScreen'
import Home from './screens/Home'
import PanelProfesional from './screens/PanelProfesional'
import Comunidad from './screens/Comunidad'
import QueesFonomundos from './screens/QueesFonomundos'
import PruebaRapida from './screens/PruebaRapida'
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
import { onAuthChange, onAuthEvent, migrarDatosLocalesASupabase } from './lib/storageCloud'
import { crearPaciente, getPacientes, setPacienteActivo } from './lib/storage'
import { setModoEvaluacion } from './lib/modoEvaluacion'
import { registrarEventoUso, resumenSesionAnalytics } from './lib/analytics'

type Vista =
  | { v: 'landing' }
  | { v: 'auth' }
  | { v: 'home' }
  | { v: 'panel' }       // panel profesional multi-tenant
  | { v: 'comunidad' }
  | { v: 'que-es' }
  | { v: 'admin' }
  | { v: 'prueba' }
  | { v: 'mundo'; num?: number }
  | { v: 'jugar'; actividadId: string; salirA?: Vista }
  | { v: 'especial'; especial: Especial }
  | { v: 'resultado'; sesion: Sesion; volver: Vista }
  | { v: 'logopeda' }

const PACIENTE_DEMO_NOMBRE = 'Visitante demo'

export default function App() {
  const [vista, setVista] = useState<Vista>({ v: 'landing' })
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [profesionalId, setProfesionalId] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'registro' | 'recuperar' | 'restablecer'>('login')

  // Contador para forzar recarga de sesiones en el panel tras jugar
  const [sesionKey, setSesionKey] = useState(0)

  function tocarRedDeSeguridad() {
    window.dispatchEvent(new CustomEvent('fonomundos:safety-touch'))
  }

  function cambiarContextoRedDeSeguridad(activo: boolean) {
    window.dispatchEvent(new CustomEvent('fonomundos:safety-context', { detail: { activo } }))
  }

  function volverContextual() {
    switch (vista.v) {
      case 'landing':
        return
      case 'auth':
      case 'home':
      case 'comunidad':
      case 'que-es':
      case 'admin':
      case 'prueba':
        setVista({ v: 'landing' })
        return
      case 'panel':
        setVista({ v: 'home' })
        return
      case 'mundo':
        setVista(vista.num === 2 ? { v: 'mundo' } : { v: 'home' })
        return
      case 'jugar':
        setVista(vista.salirA ?? { v: 'mundo' })
        return
      case 'especial':
        setVista({ v: 'mundo' })
        return
      case 'resultado':
        setVista(vista.volver)
        return
      case 'logopeda':
        setVista({ v: 'home' })
        return
      default:
        setVista({ v: 'landing' })
    }
  }

  useEffect(() => {
    window.history.replaceState({ fonomundos: true }, '')
    const onPopState = () => {
      volverContextual()
      window.history.pushState({ fonomundos: true }, '')
    }
    window.history.pushState({ fonomundos: true }, '')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [vista])

  useEffect(() => {
    const unsub = onAuthChange((uid) => {
      setProfesionalId(uid)
      if (uid) {
        // Migrar datos de invitado → Supabase ANTES de limpiar localStorage
        migrarDatosLocalesASupabase(uid).then(({ pacientes, sesiones }) => {
          if (pacientes > 0) {
            console.info(`[FM] Migrados ${pacientes} pacientes y ${sesiones} sesiones de invitado`)
          } else {
            // Sin datos que migrar → limpiar huérfanos
            localStorage.removeItem('fonomundos.pacientes')
            localStorage.removeItem('fonomundos.sesiones')
            localStorage.removeItem('fonomundos.pacienteActivo')
          }
        })
        // Solo redirigir al panel si viene del login
        if (vista.v === 'auth') setVista({ v: 'panel' })
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const contextoActivo = ['mundo', 'jugar', 'especial', 'resultado'].includes(vista.v)
    cambiarContextoRedDeSeguridad(contextoActivo)
    if (contextoActivo) {
      tocarRedDeSeguridad()
    }
  }, [vista.v])

  useEffect(() => {
    if (window.location.hash === '#mejoras') {
      setVista({ v: 'comunidad' })
    } else if (window.location.hash.includes('type=recovery')) {
      setAuthMode('restablecer')
      setVista({ v: 'auth' })
    }

    const onHashChange = () => {
      if (window.location.hash === '#mejoras') setVista({ v: 'comunidad' })
    }
    window.addEventListener('hashchange', onHashChange)

    const unsub = onAuthEvent((event, uid) => {
      if (event === 'PASSWORD_RECOVERY') {
        setProfesionalId(uid)
        setAuthMode('restablecer')
        setVista({ v: 'auth' })
      }
    })
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      unsub()
    }
  }, [])

  const controlesArriba = vista.v === 'auth' || vista.v === 'jugar' || vista.v === 'especial'

  function contextoAnalytics(p: Paciente | null = paciente) {
    return { professionalId: profesionalId, patientId: p?.id ?? null }
  }

  function abrirLogin(origen: string) {
    registrarEventoUso('login_abierto', { origen }, contextoAnalytics())
    setAuthMode('login')
    setVista({ v: 'auth' })
  }

  function entrarInvitado(origen: string) {
    registrarEventoUso('modo_invitado', { origen }, contextoAnalytics())
    setVista({ v: 'home' })
  }

  function obtenerPacienteDemo() {
    const existentes = getPacientes()
    const anterior = existentes.find((p) => p.nombre === PACIENTE_DEMO_NOMBRE)
    const p = anterior ?? crearPaciente({ nombre: PACIENTE_DEMO_NOMBRE })
    setPacienteActivo(p.id)
    return p
  }

  function abrirPruebaRapida(origen: string) {
    const p = obtenerPacienteDemo()
    setModoEvaluacion(false)
    setPaciente(p)
    registrarEventoUso('modo_invitado', { origen, flujo: 'prueba-rapida' }, { professionalId: profesionalId, patientId: p.id })
    registrarEventoUso(
      'paciente_seleccionado',
      { origen: 'prueba-rapida', modo: 'jugar', automatico: true },
      { professionalId: profesionalId, patientId: p.id },
    )
    setVista({ v: 'prueba' })
  }

  function seleccionarPaciente(p: Paciente, origen: string, modo: 'jugar' | 'evaluar' = 'jugar') {
    registrarEventoUso('paciente_seleccionado', { origen, modo }, { professionalId: profesionalId, patientId: p.id })
    setPaciente(p)
  }

  function iniciarActividad(actividadId: string, origen: string, salirA?: Vista) {
    registrarEventoUso('actividad_iniciada', { actividadId, origen }, contextoAnalytics())
    setVista({ v: 'jugar', actividadId, salirA })
  }

  function iniciarEspecial(especial: Especial, origen: string) {
    registrarEventoUso('actividad_iniciada', { actividadId: especial, especial, origen }, contextoAnalytics())
    setVista({ v: 'especial', especial })
  }

  function registrarFinSesion(sesion: Sesion, volver: Vista, actividadFallback?: string) {
    registrarEventoUso(
      'actividad_terminada',
      resumenSesionAnalytics(sesion, actividadFallback),
      { professionalId: profesionalId, patientId: sesion.pacienteId },
    )
    setVista({ v: 'resultado', sesion, volver })
  }

  useEffect(() => {
    registrarEventoUso('app_abierta', { url: window.location.href }, contextoAnalytics())
  }, [])

  useEffect(() => {
    if (profesionalId) registrarEventoUso('cuenta_detectada', {}, { professionalId: profesionalId, patientId: paciente?.id ?? null })
  }, [profesionalId])

  useEffect(() => {
    registrarEventoUso('vista_cambiada', {
      vista: vista.v,
      actividadId: vista.v === 'jugar' ? vista.actividadId : undefined,
      especial: vista.v === 'especial' ? vista.especial : undefined,
      mundo: vista.v === 'mundo' ? vista.num ?? 1 : undefined,
    }, contextoAnalytics())
  }, [vista, profesionalId, paciente?.id])

  return (
    <>
      {vista.v !== 'comunidad' && (
        <BotonesGlobales
          profesionalId={profesionalId}
          onIrAInicio={() => setVista({ v: 'landing' })}
          onIniciarSesion={() => abrirLogin('boton_global')}
          onVolver={volverContextual}
          mostrarVolver={false}
          posicionMovil={controlesArriba ? 'top' : 'bottom'}
        />
      )}
      {(() => { switch (vista.v) {
    case 'landing':
      return (
        <Landing
          profesionalId={profesionalId}
          onJugarAhora={() => abrirPruebaRapida('landing')}
          onIniciarSesion={() => abrirLogin('landing')}
          onInvitado={() => entrarInvitado('landing')}
          onVerInfo={() => setVista({ v: 'que-es' })}
          onComunidad={() => { window.history.replaceState(null, '', '#mejoras'); setVista({ v: 'comunidad' }) }}
          onUltimoPaciente={() => profesionalId ? setVista({ v: 'panel' }) : setVista({ v: 'home' })}
        />
      )

    case 'auth':
      return (
        <AuthScreen
          initialMode={authMode}
          onAuth={(uid) => {
            registrarEventoUso('login_ok', {}, { professionalId: uid, patientId: paciente?.id ?? null })
            setProfesionalId(uid)
            setVista({ v: 'panel' })
          }}
          onSinCuenta={() => entrarInvitado('auth')}
          onVolver={() => setVista({ v: 'landing' })}
        />
      )

    case 'panel':
      return (
        <PanelProfesional
          key={sesionKey}  // fuerza remount y recarga de sesiones tras jugar
          profesionalId={profesionalId ?? 'local'}
          onJugar={(p) => { seleccionarPaciente(p, 'panel', 'jugar'); setModoEvaluacion(false); setVista({ v: 'mundo' }) }}
          onEvaluar={(p) => { seleccionarPaciente(p, 'panel', 'evaluar'); setModoEvaluacion(true); setVista({ v: 'mundo' }) }}
          onAdmin={() => setVista({ v: 'admin' })}
          onSalir={() => setVista({ v: 'home' })}
        />
      )

    case 'home':
      return (
        <Home
          onEntrar={(p) => { seleccionarPaciente(p, 'home', 'jugar'); setVista({ v: 'mundo' }) }}
          onJugarRapido={() => abrirPruebaRapida('home')}
          onVolver={() => setVista({ v: 'landing' })}
          onLogopeda={() => {
            profesionalId ? setVista({ v: 'panel' }) : abrirLogin('home_logopeda')
          }}
          onAdmin={() => setVista({ v: 'admin' })}
          onComunidad={() => setVista({ v: 'comunidad' })}
        />
      )

    case 'comunidad':
      return <Comunidad initialTab="mejoras" onSalir={() => { window.history.replaceState(null, '', window.location.pathname); setVista({ v: 'landing' }) }} />

    case 'que-es':
      return <QueesFonomundos onVolver={() => setVista({ v: 'landing' })} />

    case 'admin':
      return <Admin onSalir={() => setVista({ v: 'landing' })} />

    case 'prueba':
      if (!paciente) {
        abrirPruebaRapida('prueba-sin-paciente')
        return null
      }
      return (
        <PruebaRapida
          onJugar={(actividadId) => iniciarActividad(actividadId, 'prueba-rapida', { v: 'prueba' })}
          onVerTodos={() => setVista({ v: 'mundo' })}
          onCuenta={() => abrirLogin('prueba-rapida')}
          onSalir={() => setVista({ v: 'landing' })}
        />
      )

    case 'mundo':
      if (!paciente) { setVista({ v: 'home' }); return null }
      if (vista.num === 2) return (
        <Mundo2Rimas
          paciente={paciente}
          onEspecial={(especial) => iniciarEspecial(especial, 'mundo2')}
          onSalir={() => setVista({ v: 'mundo' })}
        />
      )
      return (
        <Mundo1
          paciente={paciente}
          onJugar={(actividadId) => iniciarActividad(actividadId, 'mundo1')}
          onEspecial={(especial) => iniciarEspecial(especial, 'mundo1')}
          onMundo2={() => setVista({ v: 'mundo', num: 2 })}
          onCrearCuenta={() => abrirLogin('mundo1')}
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
          onSalir={() => setVista(vista.salirA ?? { v: 'mundo' })}
          onFinish={(sesion) => registrarFinSesion(sesion, vista, actividad.id)}
        />
      )
    }

    case 'especial': {
      if (!paciente) { setVista({ v: 'mundo' }); return null }
      const onFinish = (sesion: Sesion) => registrarFinSesion(sesion, vista, vista.especial)
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
            const volver: Vista = vista.volver.v === 'jugar' ? vista.volver.salirA ?? { v: 'mundo' } : { v: 'mundo' }
            setVista(volver)
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
    default:
      return null
    } })()}
    </>
  )
}
