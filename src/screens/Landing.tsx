/**
 * Landing — Carátula de FonoMundos
 * Layout dos paneles: izquierda = carátula física, derecha = panel de acción.
 * Inspirado en la portada de videojuego educativo.
 */
import { useEffect, useState } from 'react'
import { getPacienteActivoId } from '../lib/storageCloud'

interface Props {
  profesionalId: string | null
  onIniciarSesion: () => void
  onInvitado: () => void
  onVerInfo: () => void
  onUltimoPaciente: () => void
}

const FEATURES = [
  { titulo: 'FONÉMICO', img: '🧩', desc: 'Segmenta sonidos.' },
  { titulo: 'SILÁBICO', img: '👏', desc: 'Cuenta y clasifica sílabas.' },
  { titulo: 'LÉXICO', img: '📖', desc: 'Palabras y significado.' },
  { titulo: 'CADENAS', img: '🔗', desc: 'Conecta sonidos y palabras.' },
  { titulo: 'JUEGOS', img: '⭐', desc: 'Aprende jugando.' },
  { titulo: 'ADAPTATIVO', img: '📈', desc: 'La dificultad se ajusta.' },
  { titulo: 'MEDICIÓN', img: '📊', desc: 'Índices automáticos.' },
  { titulo: 'EVOLUCIÓN', img: '🚀', desc: 'Visualiza avances y decide mejor.' },
]

export default function Landing({ profesionalId, onIniciarSesion, onInvitado, onVerInfo, onUltimoPaciente }: Props) {
  const [visible, setVisible] = useState(false)
  const [ultimoPaciente, setUltimoPaciente] = useState<string | null>(null)
  const [recordar, setRecordar] = useState(true)

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    // Comprobar si hay un último paciente guardado
    const id = getPacienteActivoId()
    if (id) setUltimoPaciente(id)
  }, [])

  return (
    <div className="papel min-h-screen flex items-stretch text-[var(--tinta)]">

      {/* ══════════════════════════════════════════
          PANEL IZQUIERDO — Carátula física
          ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex flex-col"
        style={{
          width: '60%',
          minHeight: '100vh',
          background: 'var(--papel-2)',
          transition: 'opacity .6s',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Lomo del libro */}
        <div className="flex h-full">
          <div className="flex flex-col items-center justify-center px-2 py-4"
            style={{ background: '#2d2418', color: '#e8d5b0', width: 52, minHeight: '100%' }}>
            <span className="mano text-xs font-black" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: 3, transform: 'rotate(180deg)' }}>
              FONOMUNDOS
            </span>
            <div className="my-4 text-lg">🌍</div>
            <span className="mano text-[9px] text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', opacity: 0.7 }}>
              CONCIENCIA FONOLÓGICA INTERACTIVA
            </span>
          </div>

          {/* Contenido de la carátula */}
          <div className="flex-1 p-4 flex flex-col" style={{ background: 'var(--papel)' }}>
            {/* Cabecera: personajes + badge mundo */}
            <div className="flex justify-between items-start mb-3">
              <div className="crayon flex items-center gap-2 px-2 py-1.5" style={{ background: 'var(--cera-mostaza)' }}>
                <span className="text-2xl">🦆</span>
                <div>
                  <div className="mano text-xs font-black">PATO</div>
                  <div className="mano text-[10px]">TE ACOMPAÑA</div>
                </div>
              </div>

              <div className="crayon px-4 py-1 text-center" style={{ background: '#8B7355' }}>
                <span className="mano text-base font-black text-white">MUNDO 1</span>
              </div>

              <div className="crayon flex items-center gap-2 px-2 py-1.5" style={{ background: 'var(--cera-verde)' }}>
                <span className="text-2xl">🐸</span>
                <div>
                  <div className="mano text-xs font-black text-white">RANA GUSTAVO</div>
                  <div className="mano text-[10px] text-white">TE ANIMA</div>
                </div>
              </div>
            </div>

            {/* Título */}
            <div className="text-center mb-3">
              <h1 className="mano font-black" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1, color: 'var(--tinta)' }}>
                FONOMUNDOS 🌍
              </h1>
              <p className="mano text-base mt-1" style={{ fontStyle: 'italic', opacity: 0.85 }}>
                Conciencia fonológica que se entrena,<br />
                se mide y <span style={{ textDecoration: 'underline', color: 'var(--cera-coral)' }}>evoluciona contigo</span>.
              </p>
            </div>

            {/* Grid de features estilo cuaderno espiral */}
            <div className="flex-1">
              <div className="crayon p-3 h-full" style={{ background: 'var(--papel-2)', borderRadius: '4px' }}>
                {/* Espiral simulada */}
                <div className="flex gap-1 justify-center mb-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-full" style={{ width: 8, height: 8, background: '#666', opacity: 0.4 }} />
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {FEATURES.map((f) => (
                    <div key={f.titulo} className="text-center p-1.5 rounded" style={{ background: 'var(--papel)' }}>
                      <div className="text-2xl mb-0.5">{f.img}</div>
                      <div className="mano text-[11px] font-black">{f.titulo}</div>
                      <div className="mano text-[10px] mt-0.5" style={{ opacity: 0.65 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Parte inferior: lista + mensaje + post-it */}
            <div className="flex gap-2 mt-3">
              {/* Checklist */}
              <div className="crayon tilt-1 px-3 py-2 flex-shrink-0" style={{ background: 'var(--papel-2)' }}>
                {['EVALÚA', 'ENTRENA', 'MIDE', 'INTERVIENE', 'EVOLUCIONA'].map((item) => (
                  <div key={item} className="mano text-xs flex items-center gap-1">
                    <span style={{ color: 'var(--cera-verde)' }}>✓</span> {item}
                  </div>
                ))}
              </div>

              {/* Mensaje central */}
              <div className="flex-1 crayon crayon-2 tilt-2 p-2" style={{ background: '#fef9ee' }}>
                <p className="mano text-xs font-black" style={{ textDecoration: 'underline' }}>NO ESTÁ TERMINADO.</p>
                <p className="mano text-[11px] mt-0.5" style={{ opacity: 0.8 }}>
                  Y por eso lo abrimos a la comunidad. Encuentra fallos, propone mejoras y construyamos{' '}
                  <span style={{ textDecoration: 'underline', color: 'var(--cera-coral)' }}>juntos</span> la mejor herramienta posible. ♥
                </p>
              </div>

              {/* Post-it */}
              <div className="crayon tilt-3 p-2 flex-shrink-0 text-center" style={{ background: '#d4e8a0' }}>
                <p className="mano text-xs font-black leading-tight">TU MIRADA<br />CONSTRUYE<br />FONOMUNDOS</p>
                <p className="text-base">🙂</p>
              </div>
            </div>

            {/* Footer iconos */}
            <div className="flex justify-around mt-3 pt-2" style={{ borderTop: '1px solid var(--papel-2)' }}>
              {[['📊', 'ÍNDICES\nCLÍNICOS'], ['📈', 'EVOLUCIÓN\nTEMPORAL'], ['📄', 'INFORMES\nPDF/CSV'], ['💬', 'FEEDBACK\nCOMUNITARIO'], ['⚙️', 'EN MEJORA\nCONTINUA']].map(([icon, label]) => (
                <div key={label} className="text-center">
                  <div className="text-lg">{icon}</div>
                  <div className="mano whitespace-pre-line" style={{ fontSize: 8, opacity: 0.6 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badge "Apto para logopedas" */}
          <div className="flex flex-col items-center justify-end pb-4 px-1"
            style={{ background: '#2d2418', width: 48 }}>
            <div className="crayon text-center px-1 py-1" style={{ background: '#4a8c3f' }}>
              <span className="mano text-white text-lg font-black">A</span>
            </div>
            <span className="mano text-[8px] text-center mt-1" style={{ color: '#e8d5b0', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              APTO PARA LOGOPEDAS
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL DERECHO — Acción
          ══════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col justify-center px-6 py-8"
        style={{
          background: 'var(--papel)',
          transition: 'opacity .6s .3s',
          opacity: visible ? 1 : 0,
          minHeight: '100vh',
        }}
      >
        {/* Título bienvenida */}
        <div className="mb-6">
          <h2 className="mano text-3xl font-black mb-1">Bienvenido a FonoMundos</h2>
          <p className="mano text-base" style={{ opacity: 0.75 }}>
            Tu espacio de trabajo para evaluar, entrenar y hacer crecer la conciencia fonológica de forma{' '}
            <span style={{ textDecoration: 'underline' }}>divertida</span>,{' '}
            <span style={{ textDecoration: 'underline' }}>medible</span> y{' '}
            <span style={{ textDecoration: 'underline', color: 'var(--cera-coral)' }}>significativa</span>.
          </p>
        </div>

        {/* Botones principales */}
        <div className="space-y-3 mb-5">

          {/* INICIAR SESIÓN */}
          <button onClick={onIniciarSesion}
            className="w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-98"
            style={{ background: '#3b7dd8', color: '#fff', boxShadow: '0 3px 0 #2a5fa8' }}>
            <span className="text-3xl">👤</span>
            <div>
              <div className="mano text-xl font-black">INICIAR SESIÓN</div>
              <div className="mano text-sm opacity-85">Accede a tu cuenta profesional</div>
            </div>
          </button>

          {/* CONTINUAR COMO INVITADO */}
          <button onClick={onInvitado}
            className="w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-98"
            style={{ background: '#5a8f3f', color: '#fff', boxShadow: '0 3px 0 #3d6b29' }}>
            <span className="text-3xl">👥</span>
            <div>
              <div className="mano text-xl font-black">CONTINUAR COMO INVITADO</div>
              <div className="mano text-sm opacity-85">Explora FonoMundos sin registrarte</div>
            </div>
          </button>

          {/* VER QUÉ ES FONOMUNDOS */}
          <button onClick={onVerInfo}
            className="w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-98"
            style={{ background: 'var(--papel-2)', color: 'var(--tinta)', boxShadow: '0 3px 0 rgba(74,63,53,0.2)' }}>
            <span className="text-3xl">📋</span>
            <div>
              <div className="mano text-xl font-black">VER QUÉ ES FONOMUNDOS</div>
              <div className="mano text-sm" style={{ opacity: 0.7 }}>Conoce el proyecto, sus objetivos y cómo funciona</div>
            </div>
          </button>

          {/* ENTRAR AL ÚLTIMO PACIENTE — solo si hay sesión activa */}
          {(profesionalId || ultimoPaciente) && (
            <button onClick={onUltimoPaciente}
              className="w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-98"
              style={{ background: 'var(--papel-2)', color: 'var(--tinta)', boxShadow: '0 3px 0 rgba(74,63,53,0.2)' }}>
              <span className="text-3xl">🕐</span>
              <div className="flex-1">
                <div className="mano text-xl font-black">ENTRAR AL ÚLTIMO PACIENTE</div>
                <div className="mano text-sm" style={{ opacity: 0.7 }}>Continuar donde lo dejaste</div>
              </div>
              <span className="text-2xl opacity-50">›</span>
            </button>
          )}
        </div>

        {/* Recordarme */}
        <label className="flex items-center gap-2 cursor-pointer mb-6">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)}
            className="w-4 h-4" />
          <span className="mano text-sm" style={{ opacity: 0.7 }}>Recordarme en este dispositivo</span>
        </label>

        {/* Separador */}
        <div className="border-t mb-4" style={{ borderColor: 'var(--papel-2)' }} />

        {/* Texto comunidad */}
        <p className="mano text-sm text-center" style={{ opacity: 0.6 }}>
          FonoMundos está creciendo gracias a profesionales como tú.<br />
          Comparte tu experiencia, tus ideas y tus sugerencias.<br />
          Juntos, construimos la mejor herramienta posible. ♥
        </p>

        {/* Link Telegram */}
        <a href="https://t.me/logoped_ia" target="_blank" rel="noopener noreferrer"
          className="mano text-sm text-center mt-2 block" style={{ color: 'var(--cera-azul)' }}>
          ✈️ @LOGOPED_IA
        </a>
      </div>

      {/* Versión móvil: solo el panel de acción */}
      <div className="md:hidden fixed inset-0 flex flex-col justify-center px-5 py-8 overflow-y-auto"
        style={{ background: 'var(--papel)', opacity: visible ? 1 : 0, transition: 'opacity .5s' }}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-1">🌍</div>
          <h1 className="mano text-4xl font-black">FONOMUNDOS</h1>
          <p className="mano text-base mt-1" style={{ opacity: 0.7 }}>
            Conciencia fonológica interactiva
          </p>
        </div>
        <div className="space-y-3">
          <button onClick={onIniciarSesion} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-white" style={{ background: '#3b7dd8' }}>
            <span className="text-2xl">👤</span>
            <div><div className="mano text-lg font-black">INICIAR SESIÓN</div><div className="mano text-xs opacity-80">Cuenta profesional</div></div>
          </button>
          <button onClick={onInvitado} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-white" style={{ background: '#5a8f3f' }}>
            <span className="text-2xl">👥</span>
            <div><div className="mano text-lg font-black">COMO INVITADO</div><div className="mano text-xs opacity-80">Sin registrarte</div></div>
          </button>
          <button onClick={onVerInfo} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ background: 'var(--papel-2)' }}>
            <span className="text-2xl">📋</span>
            <div className="mano text-lg font-black">VER QUÉ ES FONOMUNDOS</div>
          </button>
          {(profesionalId || ultimoPaciente) && (
            <button onClick={onUltimoPaciente} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ background: 'var(--papel-2)' }}>
              <span className="text-2xl">🕐</span>
              <div><div className="mano text-lg font-black">ÚLTIMO PACIENTE</div><div className="mano text-xs opacity-70">Continuar donde lo dejaste</div></div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
