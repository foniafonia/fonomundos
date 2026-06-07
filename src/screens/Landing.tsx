/**
 * Landing — carátula interactiva.
 * En escritorio conserva zonas sobre la imagen; en móvil usa botones reales
 * para evitar hotspots demasiado pequeños o invisibles.
 */
import { useEffect, useRef, useState } from 'react'
import { getPacienteActivoId } from '../lib/storageCloud'

interface Props {
  profesionalId: string | null
  onJugarAhora: () => void
  onIniciarSesion: () => void
  onInvitado: () => void
  onVerInfo: () => void
  onComunidad: () => void
  onUltimoPaciente: () => void
}


// Posiciones en % relativo a la imagen renderizada.
// Ajusta estos valores hasta que encajen perfectamente.
// Posiciones medidas directamente desde el PNG (1536×1024px)
const ZONAS = [
  {
    id: 'sesion',
    top: '31%', left: '63%', width: '35%', height: '10%',
    label: 'INICIAR SESIÓN',
    debugColor: 'rgba(59,125,216,0.5)',
    hoverColor: 'rgba(59,125,216,0.2)',
  },
  {
    id: 'invitado',
    top: '43%', left: '63%', width: '35%', height: '11%',
    label: 'CONTINUAR COMO INVITADO',
    debugColor: 'rgba(90,143,63,0.5)',
    hoverColor: 'rgba(90,143,63,0.2)',
  },
  {
    id: 'info',
    top: '59%', left: '63%', width: '35%', height: '10%',
    label: 'VER QUÉ ES FONOMUNDOS',
    debugColor: 'rgba(180,140,60,0.5)',
    hoverColor: 'rgba(180,140,60,0.2)',
  },
  {
    id: 'ultimo',
    top: '74%', left: '63%', width: '35%', height: '12%',
    label: 'ENTRAR AL ÚLTIMO PACIENTE',
    debugColor: 'rgba(100,80,60,0.5)',
    hoverColor: 'rgba(100,80,60,0.2)',
  },
]

export default function Landing({ profesionalId, onJugarAhora, onIniciarSesion, onInvitado, onVerInfo, onComunidad, onUltimoPaciente }: Props) {
  const [visible, setVisible] = useState(false)
  const [ultimoPaciente, setUltimoPaciente] = useState<string | null>(null)
  const [, setAjuste] = useState({ top: 0, left: 0, scale: 1 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const id = getPacienteActivoId()
    if (id) setUltimoPaciente(id)
  }, [])

  // Recalcula el área real de la imagen cuando cambia el tamaño de ventana
  useEffect(() => {
    function calcular() {
      const img = imgRef.current
      const cont = containerRef.current
      if (!img || !cont) return
      const r = img.getBoundingClientRect()
      setAjuste({
        top: r.top - cont.getBoundingClientRect().top,
        left: r.left - cont.getBoundingClientRect().left,
        scale: 1,
      })
    }
    calcular()
    window.addEventListener('resize', calcular)
    return () => window.removeEventListener('resize', calcular)
  }, [visible])

  function handleClick(id: string) {
    if (id === 'rapido') onJugarAhora()
    else if (id === 'sesion') onIniciarSesion()
    else if (id === 'invitado') onJugarAhora()
    else if (id === 'perfiles') onInvitado()
    else if (id === 'info') onVerInfo()
    else if (id === 'comunidad') onComunidad()
    else if (id === 'ultimo') {
      if (profesionalId || ultimoPaciente) onUltimoPaciente()
    }
  }

  // Si no hay último paciente ni sesión, la zona "ultimo" queda inactiva
  const zonas = ZONAS.filter((z) => {
    if (z.id === 'ultimo') return !!(profesionalId || ultimoPaciente)
    return true
  })

  const acciones = [
    {
      id: 'rapido',
      label: '🎮 Jugar ahora',
      bg: 'var(--cera-verde)',
      fg: '#fff',
    },
    {
      id: 'sesion',
      label: '👤 Soy profesional',
      bg: 'var(--cera-azul)',
      fg: '#fff',
    },
    {
      id: 'perfiles',
      label: '🗂️ Perfiles / códigos',
      bg: 'var(--papel)',
      fg: 'var(--tinta)',
    },
    {
      id: 'info',
      label: '📘 Qué es FonoMundos',
      bg: 'var(--papel-2)',
      fg: 'var(--tinta)',
    },
    {
      id: 'comunidad',
      label: '✅ Mejoras de la comunidad',
      bg: 'var(--papel-2)',
      fg: 'var(--tinta)',
    },
  ]

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-y-auto sm:flex sm:items-center sm:justify-center sm:overflow-hidden"
      style={{
        background: '#1a1208',
        opacity: visible ? 1 : 0,
        transition: 'opacity .5s',
      }}
    >
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 px-4 pb-36 pt-8 sm:h-full sm:min-h-0 sm:p-0">
        {/* Imagen como base */}
        <img
          ref={imgRef}
          src="/landing-cover.png"
          alt="FonoMundos"
          className="w-full max-w-[920px] object-contain sm:max-h-full sm:max-w-full"
          style={{ display: 'block', userSelect: 'none' }}
          onLoad={() => {
            // recalcular posiciones tras cargar imagen
            const img = imgRef.current
            const cont = containerRef.current
            if (!img || !cont) return
            const r = img.getBoundingClientRect()
            setAjuste({
              top: r.top - cont.getBoundingClientRect().top,
              left: r.left - cont.getBoundingClientRect().left,
              scale: 1,
            })
          }}
        />

        <div
          className="w-full max-w-md rounded-none sm:hidden"
          aria-label="Acciones principales"
        >
          {acciones.map((accion) => (
            <button
              key={accion.id}
              onClick={() => handleClick(accion.id)}
              className={`crayon mano mb-3 flex w-full items-center justify-center px-5 py-2 text-center font-black ${accion.id === 'rapido' ? 'min-h-16 text-2xl' : 'min-h-14 text-lg'}`}
              style={{ background: accion.bg, color: accion.fg }}
            >
              {accion.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden justify-center gap-3 px-4 sm:flex">
        <button
          onClick={onJugarAhora}
          className="crayon mano pointer-events-auto min-h-14 px-8 py-3 text-2xl font-black text-white"
          style={{ background: 'var(--cera-verde)' }}
        >
          🎮 Jugar ahora
        </button>
        <button
          onClick={onInvitado}
          className="crayon mano pointer-events-auto min-h-14 px-5 py-3 text-base font-black"
          style={{ background: 'var(--papel)' }}
        >
          Perfiles / códigos
        </button>
      </div>

      {/* Overlay: zonas clickables sobre los botones de la imagen */}
      {visible && imgRef.current && (() => {
        const img = imgRef.current!
        const ir = img.getBoundingClientRect()
        const cr = containerRef.current!.getBoundingClientRect()
        const iTop = ir.top - cr.top
        const iLeft = ir.left - cr.left
        const iW = ir.width
        const iH = ir.height

        return zonas.map((z) => {
          const top = iTop + (parseFloat(z.top) / 100) * iH
          const left = iLeft + (parseFloat(z.left) / 100) * iW
          const width = (parseFloat(z.width) / 100) * iW
          const height = (parseFloat(z.height) / 100) * iH
          return (
            <button
              key={z.id}
              onClick={() => handleClick(z.id)}
              aria-label={z.label}
              className="hidden sm:block"
              style={{
                position: 'absolute',
                top, left, width, height,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          )
        })
      })()}
    </div>
  )
}
