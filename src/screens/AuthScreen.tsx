import { useEffect, useState } from 'react'
import {
  requestPasswordReset,
  signIn,
  signUp,
  supabaseActivo,
  updatePassword,
} from '../lib/storageCloud'

interface Props {
  onAuth: (uid: string) => void
  onSinCuenta: () => void // modo demo sin cuenta
  onVolver: () => void
  initialMode?: Modo
}

type Modo = 'login' | 'registro' | 'recuperar' | 'restablecer'

export default function AuthScreen({ onAuth, onSinCuenta, onVolver, initialMode = 'login' }: Props) {
  const [modo, setModo] = useState<Modo>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [aceptaRGPD, setAceptaRGPD] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'err' } | null>(null)

  useEffect(() => {
    setModo(initialMode)
    setMensaje(null)
  }, [initialMode])

  async function handleLogin() {
    if (!email || !password) { setMensaje({ texto: 'Rellena email y contraseña', tipo: 'err' }); return }
    setCargando(true)
    const res = await signIn(email, password)
    setCargando(false)
    if ('error' in res && res.error) { setMensaje({ texto: (res.error as {message: string}).message, tipo: 'err' }); return }
    if ('data' in res && res.data && (res.data as {user?: {id:string}}).user) onAuth((res.data as {user: {id:string}}).user.id)
  }

  async function handleRegistro() {
    if (!email || !password) { setMensaje({ texto: 'Rellena email y contraseña', tipo: 'err' }); return }
    if (password.length < 8) { setMensaje({ texto: 'La contraseña debe tener al menos 8 caracteres', tipo: 'err' }); return }
    if (!aceptaRGPD) { setMensaje({ texto: 'Debes aceptar el tratamiento de datos', tipo: 'err' }); return }
    setCargando(true)
    const res = await signUp(email, password)
    setCargando(false)
    if ('error' in res && res.error) { setMensaje({ texto: (res.error as {message:string}).message, tipo: 'err' }); return }
    setMensaje({ texto: '✅ Cuenta creada. Ya puedes entrar con tu email y contraseña.', tipo: 'ok' })
    setTimeout(() => setModo('login'), 2500)
  }

  async function handleRecuperar() {
    if (!email) { setMensaje({ texto: 'Escribe tu email profesional', tipo: 'err' }); return }
    setCargando(true)
    const res = await requestPasswordReset(email)
    setCargando(false)
    if ('error' in res && res.error) { setMensaje({ texto: (res.error as {message: string}).message, tipo: 'err' }); return }
    setMensaje({ texto: '✅ Te hemos enviado un enlace para restablecer la contraseña.', tipo: 'ok' })
  }

  async function handleRestablecer() {
    if (!password) { setMensaje({ texto: 'Escribe la nueva contraseña', tipo: 'err' }); return }
    if (password.length < 8) { setMensaje({ texto: 'La nueva contraseña debe tener al menos 8 caracteres', tipo: 'err' }); return }
    setCargando(true)
    const res = await updatePassword(password)
    setCargando(false)
    if ('error' in res && res.error) { setMensaje({ texto: (res.error as {message: string}).message, tipo: 'err' }); return }
    setMensaje({ texto: '✅ Contraseña actualizada. Ya puedes acceder.', tipo: 'ok' })
    window.history.replaceState({}, document.title, window.location.pathname)
    setTimeout(() => setModo('login'), 2000)
  }

  const mostrarPassword = modo === 'login' || modo === 'registro' || modo === 'restablecer'
  const tituloAccion = modo === 'login'
    ? '→ Acceder'
    : modo === 'registro'
      ? '→ Crear cuenta'
      : modo === 'recuperar'
        ? '→ Enviar enlace'
        : '→ Guardar nueva contraseña'

  return (
    <div className="papel min-h-full px-4 text-[var(--tinta)]">
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between px-4 py-3 print:hidden"
        style={{ background: 'var(--papel)', borderBottom: '1px solid var(--papel-2)' }}>
        <button onClick={onVolver} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
          ← Portada
        </button>
        <span className="mano text-sm opacity-70">Acceso</span>
      </div>
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🦉</div>
          <h1 className="mano text-4xl">FonoMundos</h1>
          <p className="mano text-base mt-1" style={{ color: 'var(--cera-lila)' }}>
            Plataforma profesional de cribado fonológico
          </p>
        </div>

        <div className="crayon p-6" style={{ background: 'var(--papel-2)' }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {(['login', 'registro'] as Modo[]).map((m) => (
              <button key={m} onClick={() => { setModo(m); setMensaje(null) }}
                className="crayon mano flex-1 py-2 text-base"
                style={{ background: modo === m ? 'var(--cera-azul)' : 'var(--papel)', color: modo === m ? '#fff' : 'var(--tinta)' }}>
                {m === 'login' ? '🔑 Acceder' : '✨ Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Formulario */}
          <div className="space-y-3">
            {modo !== 'restablecer' && (
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email profesional"
                className="crayon mano w-full px-4 py-3 text-base outline-none"
                style={{ background: 'var(--papel)' }} />
            )}
            {mostrarPassword && (
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  if (modo === 'login') handleLogin()
                  else if (modo === 'registro') handleRegistro()
                  else if (modo === 'restablecer') handleRestablecer()
                }}
                placeholder={
                  modo === 'login'
                    ? 'Contraseña'
                    : modo === 'registro'
                      ? 'Contraseña (mín. 8 caracteres)'
                      : 'Nueva contraseña (mín. 8 caracteres)'
                }
                className="crayon mano w-full px-4 py-3 text-base outline-none"
                style={{ background: 'var(--papel)' }} />
            )}

            {modo === 'registro' && (
              <>
                <input type="text" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}
                  placeholder="Especialidad (logopeda, PT, maestro...)"
                  className="crayon mano w-full px-4 py-3 text-base outline-none"
                  style={{ background: 'var(--papel)' }} />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={aceptaRGPD} onChange={(e) => setAceptaRGPD(e.target.checked)}
                    className="mt-1 w-4 h-4 flex-shrink-0" />
                  <span className="mano text-sm" style={{ opacity: 0.8 }}>
                    Confirmo que soy profesional sanitario o educativo y que cuento con el
                    consentimiento informado de los tutores legales de los menores evaluados.
                    Acepto la <button onClick={() => {}} className="underline">Política de Privacidad</button> y el
                    tratamiento de datos según LOPDGDD/RGPD.
                  </span>
                </label>
              </>
            )}

            {modo === 'recuperar' && (
              <p className="mano text-sm" style={{ opacity: 0.75 }}>
                Te enviaremos un enlace para restablecer la contraseña de tu cuenta profesional.
              </p>
            )}

            {modo === 'restablecer' && (
              <p className="mano text-sm" style={{ opacity: 0.75 }}>
                Estás en modo recuperación. Escribe una nueva contraseña para tu cuenta.
              </p>
            )}
          </div>

          {mensaje && (
            <div className="crayon mano text-sm p-3 mt-3"
              style={{ background: mensaje.tipo === 'ok' ? 'var(--cera-verde)' : 'var(--cera-coral)', color: '#fff' }}>
              {mensaje.texto}
            </div>
          )}

          <button
            onClick={
              modo === 'login'
                ? handleLogin
                : modo === 'registro'
                  ? handleRegistro
                  : modo === 'recuperar'
                    ? handleRecuperar
                    : handleRestablecer
            }
            disabled={cargando}
            className="crayon mano w-full py-3 text-xl text-white mt-4 disabled:opacity-50"
            style={{ background: 'var(--cera-verde)' }}>
            {cargando ? '…' : tituloAccion}
          </button>

          {modo === 'login' && (
            <button onClick={() => setModo('recuperar')} className="mano text-sm w-full mt-2 opacity-50 hover:opacity-80">
              ¿Olvidaste la contraseña?
            </button>
          )}

          {(modo === 'recuperar' || modo === 'restablecer') && (
            <button onClick={() => { setModo('login'); setMensaje(null) }} className="mano text-sm w-full mt-2 opacity-50 hover:opacity-80">
              Volver a acceso
            </button>
          )}
        </div>

        {/* Demo sin cuenta */}
        {!supabaseActivo() && (
          <div className="crayon mt-4 p-4 text-center" style={{ background: 'var(--cera-mostaza)' }}>
            <p className="mano text-sm mb-2">
              ⚠️ Supabase no configurado — los datos se guardarán solo en este dispositivo.
            </p>
            <button onClick={onSinCuenta} className="crayon mano px-4 py-2 text-base" style={{ background: 'var(--papel)' }}>
              Continuar en modo demo (local)
            </button>
          </div>
        )}

        {/* Link Telegram */}
        <a href="https://t.me/logoped_ia" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-4 mano text-sm"
          style={{ color: 'var(--cera-lila)', opacity: 0.8 }}>
          ✈️ Comunidad @LOGOPED_IA
        </a>
      </div>
      </div>
    </div>
  )
}
