/**
 * Disclaimers de uso profesional — basados en buenas prácticas clínicas
 * (NotebookLM / literatura de cribado de dislexia)
 */
import { useState } from 'react'

export function DisclaimerBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className="crayon mano text-sm px-4 py-3 flex items-start gap-3"
      style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
      <span className="text-xl flex-shrink-0">⚠️</span>
      <span className="flex-1">
        <b>Herramienta de exploración orientativa — NO diagnóstico clínico.</b>{' '}
        Los resultados identifican señales de alerta de riesgo lector y deben ser interpretados
        por un logopeda o psicopedagogo. Una puntuación de riesgo requiere evaluación completa
        (PROLEC-R u otras pruebas validadas).
      </span>
      <button onClick={() => setVisible(false)} className="text-lg flex-shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}

export function DisclaimerModal({ onAceptar }: { onAceptar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(74,63,53,0.6)' }}>
      <div className="crayon w-full max-w-lg p-6 text-[var(--tinta)]" style={{ background: 'var(--papel)' }}>
        <h2 className="mano text-2xl mb-4">⚠️ Aviso de uso profesional</h2>
        <div className="space-y-3 mano text-base">
          <p><b>Esta herramienta identifica "señales de alerta de riesgo lector",
          no diagnostica dislexia.</b> El diagnóstico es clínico y multifactorial.</p>

          <p>📌 <b>Punto en el tiempo:</b> Los resultados reflejan la ejecución del niño
          en esta sesión y pueden verse afectados por sueño, motivación o entorno ruidoso.</p>

          <p>🚫 <b>Exclusiones:</b> Los resultados no son válidos si el niño tiene déficits
          sensoriales (auditivos/visuales) no corregidos o discapacidad intelectual previa.
          Estos deben descartarse antes de interpretar los resultados.</p>

          <p>📋 <b>Acción recomendada:</b> Una puntuación de riesgo debe derivar siempre
          en consulta con logopeda o psicopedagogo para diagnóstico diferencial
          (PROLEC-R, WISC-V u otras pruebas validadas).</p>

          <p className="text-sm" style={{ opacity: 0.6 }}>
            FonoMundos es un prototipo interactivo de estimulación fonológica en fase de investigación.
            Su arquitectura interna sigue criterios neuropsicológicos de alta precisión,
            pero sus resultados son de carácter exclusivamente orientativo para el profesional.
            Esta herramienta no sustituye, en ningún caso, a las baterías de evaluación
            validadas ni al juicio clínico del logopeda.
          </p>
        </div>
        <button onClick={onAceptar}
          className="crayon mano w-full mt-5 py-3 text-lg text-white"
          style={{ background: 'var(--cera-verde)' }}>
          Entendido — usar con criterio profesional
        </button>
      </div>
    </div>
  )
}

export function DisclaimerResultado({ deficitSensorial }: { deficitSensorial?: boolean }) {
  return (
    <div className="crayon mano text-sm p-3 mt-3" style={{ background: 'var(--papel-2)' }}>
      {deficitSensorial
        ? '🚫 Nota: Este paciente tiene déficit sensorial registrado. Los resultados del cribado no son válidos para interpretación diagnóstica.'
        : '⚠️ Resultados orientativos. No substituyen evaluación clínica completa.'}
    </div>
  )
}
