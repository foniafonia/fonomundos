/**
 * Panel de accesibilidad — botón flotante ♿ con opciones:
 * - Tipografía para dislexia (OpenDyslexic)
 * - Alto contraste
 * - Texto más grande
 */
import { useState } from 'react'
import { getAccesibilidad, setAccesibilidad } from '../lib/accesibilidad'
import { getRitmoVoz, probarVoz, setRitmoVoz } from '../lib/voz'

export default function PanelAccesibilidad() {
  const [abierto, setAbierto] = useState(false)
  const [prefs, setPrefs] = useState(getAccesibilidad)
  const [ritmo, setRitmo] = useState(getRitmoVoz)

  function cambiarRitmo(valor: number) {
    setRitmo(valor)
    setRitmoVoz(valor)
  }

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
        className="fixed bottom-20 right-4 z-40 crayon mano flex items-center gap-1.5 px-3 py-2 text-sm"
        style={{
          background: !prefs.dislexia || prefs.altoContraste || prefs.textoGrande || prefs.ocultarTexto
            ? 'var(--cera-azul)' : 'var(--papel-2)',
          color: !prefs.dislexia || prefs.altoContraste || prefs.textoGrande || prefs.ocultarTexto ? '#fff' : 'var(--tinta)',
        }}
      >
        <span>🔡</span>
        <span>Letra</span>
        {(!prefs.dislexia || prefs.altoContraste || prefs.textoGrande || prefs.ocultarTexto) && (
          <span className="text-xs opacity-80">●</span>
        )}
      </button>

      {abierto && (
        <div className="fixed bottom-36 right-4 z-50 crayon p-4 w-64 text-[var(--tinta)]"
          style={{ background: 'var(--papel)' }}>
          <h3 className="mano text-lg font-black mb-3">Accesibilidad</h3>

          {/* Dislexia */}
          <label className="flex items-start gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={prefs.dislexia}
              onChange={() => toggle('dislexia')} className="mt-1 w-5 h-5 flex-shrink-0" />
            <div>
              <div className="mano text-base font-bold">OpenDyslexic</div>
              <div className="mano text-xs" style={{ opacity: 0.65 }}>
                {prefs.dislexia ? 'Fuente base activa' : 'Actívala de nuevo'}
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

          {/* Solo sonido — ocultar la palabra escrita */}
          <label className="flex items-start gap-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={prefs.ocultarTexto}
              onChange={() => toggle('ocultarTexto')} className="mt-1 w-5 h-5 flex-shrink-0" />
            <div>
              <div className="mano text-base font-bold">Solo sonido</div>
              <div className="mano text-xs" style={{ opacity: 0.65 }}>
                Oculta la palabra escrita; se revela con la pista o al fallar
              </div>
            </div>
          </label>

          {/* Velocidad de la voz */}
          <div className="mb-3 pt-2" style={{ borderTop: '1px solid var(--papel-2)' }}>
            <div className="mano text-base font-bold">Velocidad de la voz</div>
            <div className="mano text-xs mb-1" style={{ opacity: 0.65 }}>
              Más lenta para quien necesita tiempo de procesamiento
            </div>
            <div className="flex items-center gap-2">
              <span className="mano text-xs">🐢</span>
              <input
                type="range" min={0.6} max={1.3} step={0.05} value={ritmo}
                onChange={(e) => cambiarRitmo(Number(e.target.value))}
                aria-label="Velocidad de la voz"
                className="flex-1"
              />
              <span className="mano text-xs">🐇</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="mano text-xs tabular-nums" style={{ opacity: 0.65 }}>×{ritmo.toFixed(2)}</span>
              <button onClick={() => probarVoz()}
                className="crayon mano px-2 py-0.5 text-xs" style={{ background: 'var(--papel-2)' }}>
                🔊 Probar
              </button>
            </div>
          </div>

          <button onClick={() => setAbierto(false)}
            className="crayon mano w-full py-1.5 text-sm mt-1" style={{ background: 'var(--papel-2)' }}>
            Cerrar
          </button>
        </div>
      )}
    </>
  )
}
