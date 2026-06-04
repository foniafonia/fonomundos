import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
} from 'recharts'
import type { Indices } from '../lib/scoring'

export default function RadarIndices({ indices }: { indices: Indices }) {
  const data = [
    { eje: 'Fonológico', valor: indices.fonologicoGlobal },
    { eje: 'Silábico', valor: indices.silabicoGlobal },
    { eje: 'Léxico', valor: indices.coherenciaLexica },
    { eje: 'Automatización', valor: indices.automatizacion },
    { eje: 'Velocidad', valor: indices.velocidadProcesamiento },
    { eje: 'Precisión aud.', valor: indices.precisionAuditiva },
    // riesgo lector invertido para que "más área = mejor"
    { eje: 'Menor necesidad', valor: 100 - indices.riesgoLector },
  ]
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e0cdab" />
          <PolarAngleAxis dataKey="eje" tick={{ fill: '#4a3f35', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#a08b6a', fontSize: 10 }} />
          <Radar dataKey="valor" stroke="#8bbf6a" fill="#8bbf6a" fillOpacity={0.45} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
