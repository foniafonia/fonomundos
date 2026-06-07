/**
 * BotonesGlobales — cluster de botones flotantes siempre visibles:
 * 👤 Cuenta (ir a carátula / logout)
 * 🔡 Letra (accesibilidad)
 * 🐛 ya está en cada actividad via FeedbackBtn
 */
import { useEffect, useState } from 'react'
import { getAccesibilidad, setAccesibilidad } from '../lib/accesibilidad'
import { signOut } from '../lib/storageCloud'
import { getVozPreferida, listarVoces, probarVoz, setVozPreferida } from '../lib/voz'

interface Props {
  profesionalId: string | null
  onIrAInicio: () => void   // va a la landing
  onIniciarSesion: () => void
  onVolver?: () => void
  mostrarVolver?: boolean
  posicionMovil?: 'bottom' | 'top'
}

export default function BotonesGlobales({
  profesionalId,
  onIrAInicio,
  onIniciarSesion,
  onVolver,
  mostrarVolver = false,
  posicionMovil = 'bottom',
}: Props) {
  const [abiertoCuenta, setAbiertoCuenta] = useState(false)
  const [abiertoLetra, setAbiertoLetra] = useState(false)
  const [prefs, setPrefs] = useState(getAccesibilidad)
  const [voces, setVoces] = useState(() => listarVoces())
  const [vozPreferida, setVozPref] = useState(getVozPreferida)

  useEffect(() => {
    if (!abiertoLetra || !('speechSynthesis' in window)) return
    const cargar = () => setVoces(listarVoces())
    cargar()
    const id = window.setTimeout(cargar, 600)
    window.speechSynthesis.addEventListener?.('voiceschanged', cargar)
    return () => {
      window.clearTimeout(id)
      window.speechSynthesis.removeEventListener?.('voiceschanged', cargar)
    }
  }, [abiertoLetra])

  function togglePref(key: keyof typeof prefs) {
    const nuevo = { ...prefs, [key]: !prefs[key] }
    setPrefs(nuevo)
    setAccesibilidad(nuevo)
  }

  async function cerrarSesion() {
    await signOut()
    setAbiertoCuenta(false)
    onIrAInicio()
  }

  const hayPrefs = !prefs.dislexia || prefs.altoContraste || prefs.textoGrande
  const panelPos = posicionMovil === 'top'
    ? 'fixed right-4 top-36 z-[55] max-h-[calc(100dvh-10rem)] overflow-y-auto sm:bottom-48 sm:top-auto'
    : 'fixed bottom-48 right-4 z-[55] max-h-[calc(100dvh-10rem)] overflow-y-auto'
  const botonesPos = posicionMovil === 'top'
    ? 'fixed right-4 top-20 z-40 flex flex-col items-end gap-2 print:hidden sm:bottom-20 sm:top-auto'
    : 'fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 print:hidden'
  const volverPos = posicionMovil === 'top'
    ? 'fixed left-4 top-20 z-40 crayon mano px-3 py-2 text-sm print:hidden sm:bottom-20 sm:top-auto'
    : 'fixed bottom-20 left-4 z-40 crayon mano px-3 py-2 text-sm print:hidden'

  return (
    <>
      {/* ── Paneles ── */}

      {/* Panel Cuenta */}
      {abiertoCuenta && (
        <div className={`${panelPos} w-56 crayon p-4 text-[var(--tinta)]`}
          style={{ background: 'var(--papel)' }}>
          <p className="mano text-sm mb-3" style={{ opacity: 0.6 }}>
            {profesionalId ? '✅ Sesión activa' : '🔓 Modo invitado'}
          </p>
          <button onClick={onIrAInicio}
            className="crayon mano w-full py-2 text-base mb-2" style={{ background: 'var(--papel-2)' }}>
            🏠 Ir a la carátula
          </button>
          {profesionalId && (
            <button onClick={cerrarSesion}
              className="crayon mano w-full py-2 text-base" style={{ background: 'var(--cera-coral)', color: '#fff' }}>
              🚪 Cerrar sesión
            </button>
          )}
          {!profesionalId && (
            <button onClick={() => { setAbiertoCuenta(false); onIniciarSesion() }}
              className="crayon mano w-full py-2 text-base text-white" style={{ background: 'var(--cera-verde)' }}>
              🔑 Iniciar sesión
            </button>
          )}
          <button onClick={() => setAbiertoCuenta(false)}
            className="mano text-xs w-full mt-2 opacity-40 hover:opacity-70">cerrar</button>
        </div>
      )}

      {/* Panel Letra */}
      {abiertoLetra && (
        <div className={`${panelPos} w-64 crayon p-4 text-[var(--tinta)]`}
          style={{ background: 'var(--papel)' }}>
          <h3 className="mano text-lg font-black mb-3">Accesibilidad</h3>
          {[
            { key: 'dislexia' as const, icon: '🔡', label: 'OpenDyslexic', desc: prefs.dislexia ? 'Fuente base activa' : 'Actívala de nuevo' },
            { key: 'altoContraste' as const, icon: '🌓', label: 'Alto contraste', desc: 'Negro sobre blanco' },
            { key: 'textoGrande' as const, icon: '🔠', label: 'Texto más grande', desc: 'Aumenta el tamaño base' },
          ].map(({ key, icon, label, desc }) => (
            <label key={key} className="flex items-start gap-3 mb-3 cursor-pointer">
              <input type="checkbox" checked={prefs[key]}
                onChange={() => togglePref(key)} className="mt-1 w-5 h-5 flex-shrink-0" />
              <div>
                <div className="mano text-base font-bold">{icon} {label}</div>
                <div className="mano text-xs" style={{ opacity: 0.65 }}>{desc}</div>
              </div>
            </label>
          ))}
          <button onClick={() => { const nuevo = { ...prefs, dislexia: false }; setPrefs(nuevo); setAccesibilidad(nuevo) }}
            className="crayon mano w-full py-2 text-sm mb-2" style={{ background: 'var(--papel-2)' }}>
            Usar fuente normal
          </button>
          <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--papel-2)' }}>
            <div className="mano text-base font-bold mb-1">🔊 Voz</div>
            <select
              value={vozPreferida}
              onChange={(e) => {
                setVozPref(e.target.value)
                setVozPreferida(e.target.value)
              }}
              className="crayon mano w-full px-2 py-2 text-sm"
              style={{ background: 'var(--papel-2)' }}
            >
              <option value="">Automática</option>
              {voces.map((voz) => (
                <option key={`${voz.name}-${voz.lang}`} value={voz.name}>
                  {voz.masculina ? '♂ ' : voz.femenina ? '♀ ' : ''}{voz.name} ({voz.lang}){voz.score >= 250 ? ' · recomendada' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => probarVoz(vozPreferida)}
              className="crayon mano w-full py-2 text-sm mt-2"
              style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}
            >
              Probar voz
            </button>
            {voces.length === 0 && (
              <p className="mano text-xs mt-2" style={{ opacity: 0.65 }}>
                Si no aparecen voces, toca Probar voz o recarga la página.
              </p>
            )}
          </div>
          <button onClick={() => setAbiertoLetra(false)}
            className="crayon mano w-full py-1.5 text-sm mt-1" style={{ background: 'var(--papel-2)' }}>
            Cerrar
          </button>
        </div>
      )}

      {/* ── Botones flotantes ── */}
      <div className={botonesPos}>

        {/* 👤 Cuenta */}
        <button
          onClick={() => {
            if (!profesionalId) {
              setAbiertoCuenta(false)
              setAbiertoLetra(false)
              onIniciarSesion()
              return
            }
            setAbiertoCuenta(!abiertoCuenta)
            setAbiertoLetra(false)
          }}
          className="crayon mano flex items-center gap-1.5 px-3 py-2 text-sm"
          style={{
            background: profesionalId ? 'var(--cera-verde)' : 'var(--papel-2)',
            color: profesionalId ? '#fff' : 'var(--tinta)',
          }}
          title={profesionalId ? 'Cuenta activa' : 'Modo invitado'}
        >
          <span>👤</span>
          <span>Cuenta</span>
        </button>

        {/* 🔡 Letra */}
        <button
          onClick={() => { setAbiertoLetra(!abiertoLetra); setAbiertoCuenta(false) }}
          className="crayon mano flex items-center gap-1.5 px-3 py-2 text-sm"
          style={{
            background: hayPrefs ? 'var(--cera-azul)' : 'var(--papel-2)',
            color: hayPrefs ? '#fff' : 'var(--tinta)',
          }}
        >
          <span>🔡</span>
          <span>Letra</span>
          {hayPrefs && <span className="text-xs">●</span>}
        </button>

      </div>

      {mostrarVolver && onVolver && (
        <button
          onClick={onVolver}
          className={volverPos}
          style={{ background: 'var(--papel-2)', color: 'var(--tinta)' }}
        >
          ← Volver
        </button>
      )}
    </>
  )
}
