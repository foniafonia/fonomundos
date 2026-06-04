/**
 * Panel de accesibilidad — botón flotante ♿ con opciones:
 * - Tipografía para dislexia (OpenDyslexic)
 * - Alto contraste
 * - Texto más grande
 */
import { useState } from 'react'
import { getAccesibilidad, setAccesibilidad } from '../lib/accesibilidad'

export default function PanelAccesibilidad() {
  const [abierto, setAbierto] = useState(false)
  const [prefs, setPrefs] = useState(getAccesibilidad)

  function toggle(key: keyof typeof prefs) {
    const nuevo = { ...prefs, [key]: !prefs[key] }
    setPrefs(nuevo)
    setAccesibilidad(nuevo)
  }

  return (
    <>
      {/* Botón flotante — esquina superior izquierda para no chocar con 🐛 */}
      <button
        onClick={() => setAbierto(!abierto)}
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad"
        className="fixed top-4 left-4 z-40 crayon w-10 h-10 text-lg flex items-center justify-center"
        style={{ background: prefs.dislexia || prefs.altoContraste || prefs.textoGrande
          ? 'var(--cera-azul)' : 'var(--papel-2)', color: prefs.dislexia ? '#fff' : 'var(--tinta)' }}
      >
        ♿
      </button>

      {abierto && (
        <div className="fixed top-16 left-4 z-50 crayon p-4 w-64 text-[var(--tinta)]"
          style={{ background: 'var(--papel)' }}>
          <h3 className="mano text-lg font-black mb-3">Accesibilidad</h3>

          {/* Dislexia */}
          <label className="flex items-start gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={prefs.dislexia}
              onChange={() => toggle('dislexia')} className="mt-1 w-5 h-5 flex-shrink-0" />
            <div>
              <div className="mano text-base font-bold">Tipografía dislexia</div>
              <div className="mano text-xs" style={{ opacity: 0.65 }}>
                Activa OpenDyslexic con mayor interletraje
              </div>
            </div>
          </label>

          {/* Alto contraste */}
          <label className="flex items-start gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={prefs.altoContraste}
              onChange={() => toggle('altoContraste')} className="mt-1 w-5 h-5 flex-shrink-0" />
            <div>
              <div className="mano text-base font-bold">Alto contraste</div>
              <div className="mano text-xs" style={{ opacity: 0.65 }}>
                Negro sobre blanco, sin tonos cálidos
              </div>
            </div>
          </label>

          {/* Texto grande */}
          <label className="flex items-start gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={prefs.textoGrande}
              onChange={() => toggle('textoGrande')} className="mt-1 w-5 h-5 flex-shrink-0" />
            <div>
              <div className="mano text-base font-bold">Texto más grande</div>
              <div className="mano text-xs" style={{ opacity: 0.65 }}>
                Aumenta el tamaño base de letra
              </div>
            </div>
          </label>

          <button onClick={() => setAbierto(false)}
            className="crayon mano w-full py-1.5 text-sm mt-1" style={{ background: 'var(--papel-2)' }}>
            Cerrar
          </button>
        </div>
      )}
    </>
  )
}
