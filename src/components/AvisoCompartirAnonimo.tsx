import { useEffect, useState } from 'react'
import { getUser } from '../lib/storageCloud'
import { compartirActivo, setCompartirActivo } from '../lib/compartirAnonimo'

/**
 * Aviso visible para quien juega sin cuenta: se envían resultados anónimos y se
 * puede dejar de enviar. Los menores son lo más delicado que tocamos, así que
 * esto no se esconde ni va en un texto legal aparte.
 */
export default function AvisoCompartirAnonimo() {
  const [invitado, setInvitado] = useState(false)
  const [activo, setActivo] = useState(compartirActivo)

  useEffect(() => {
    let vivo = true
    getUser().then((u) => { if (vivo) setInvitado(!u) }).catch(() => { /* ante la duda, no enseñar */ })
    return () => { vivo = false }
  }, [])

  if (!invitado) return null

  function cambiar() {
    const nuevo = !activo
    setCompartirActivo(nuevo)
    setActivo(nuevo)
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-1.5 mano text-xs print:hidden"
      style={{ background: 'var(--papel-2)', color: 'var(--tinta)' }}>
      <span>
        {activo
          ? '📊 Se envían resultados anónimos (solo números y el sonido trabajado, sin nombre ni datos del niño) para mejorar FonoMundos.'
          : '📊 Has dejado de enviar resultados anónimos.'}
      </span>
      <button onClick={cambiar} className="crayon mano px-2 py-0.5 text-xs flex-shrink-0"
        style={{ background: 'var(--papel)' }}>
        {activo ? 'Dejar de enviar' : 'Volver a enviar'}
      </button>
    </div>
  )
}
