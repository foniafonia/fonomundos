/**
 * Mapa de calor de abandono — en qué ronda se deja cada actividad.
 *
 * El dato que había era "27 iniciadas, 1 completada", que no permite decidir
 * nada: no dice si se abandona en la ronda 2 (la actividad no se entiende) o en
 * la 9 (son demasiadas rondas). Esto lo desglosa.
 *
 * Se alimenta de los eventos actividad_abandonada / actividad_terminada, que
 * empezaron a registrarse en agosto de 2026.
 */
import { useEffect, useMemo, useState } from 'react'

interface EventoAnalytics {
  event: string
  ts: number
  details?: {
    actividadId?: string
    rondasHechas?: number
    rondasTotales?: number
    rondas?: number
    [k: string]: unknown
  }
}

interface Props {
  pin: string
}

interface FilaActividad {
  actividadId: string
  porRonda: number[]     // abandonos por índice de ronda
  completadas: number
  abandonos: number
  maxRondas: number
}

function construirFilas(eventos: EventoAnalytics[]): FilaActividad[] {
  const mapa = new Map<string, FilaActividad>()
  const fila = (id: string) => {
    const f = mapa.get(id) ?? { actividadId: id, porRonda: [], completadas: 0, abandonos: 0, maxRondas: 10 }
    mapa.set(id, f)
    return f
  }

  for (const e of eventos) {
    const id = e.details?.actividadId
    if (!id) continue
    if (e.event === 'actividad_abandonada') {
      const f = fila(id)
      const hechas = Number(e.details?.rondasHechas ?? 0)
      const totales = Number(e.details?.rondasTotales ?? 0)
      if (totales > 0) f.maxRondas = Math.max(f.maxRondas, totales)
      f.porRonda[hechas] = (f.porRonda[hechas] ?? 0) + 1
      f.abandonos += 1
    } else if (e.event === 'actividad_terminada') {
      fila(id).completadas += 1
    }
  }

  return [...mapa.values()]
    .filter((f) => f.abandonos + f.completadas > 0)
    .sort((a, b) => b.abandonos - a.abandonos)
}

function color(n: number, max: number) {
  if (!n) return { fondo: 'var(--papel)', texto: 'var(--tinta)' }
  const t = n / Math.max(max, 1)
  if (t >= 0.8) return { fondo: '#b71c1c', texto: '#fff' }
  if (t >= 0.6) return { fondo: '#e53935', texto: '#fff' }
  if (t >= 0.4) return { fondo: '#fb8c00', texto: '#fff' }
  if (t >= 0.2) return { fondo: '#fdd835', texto: '#4a3b00' }
  return { fondo: '#fff59d', texto: '#4a3b00' }
}

export default function MapaCalorAbandono({ pin }: Props) {
  const [eventos, setEventos] = useState<EventoAnalytics[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetch(`/api/analytics?pin=${encodeURIComponent(pin)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 401 ? 'PIN rechazado' : `Error ${r.status}`))))
      .then((d) => { if (vivo) setEventos(Array.isArray(d) ? d : []) })
      .catch((e) => { if (vivo) setError(String(e.message ?? e)) })
    return () => { vivo = false }
  }, [pin])

  const filas = useMemo(() => construirFilas(eventos ?? []), [eventos])
  const maxCelda = useMemo(
    () => Math.max(1, ...filas.flatMap((f) => f.porRonda.map((n) => n || 0))),
    [filas],
  )

  if (error) return <p className="mano text-base" style={{ color: 'var(--cera-coral)' }}>No se pudo leer analytics: {error}</p>
  if (!eventos) return <p className="mano text-base">Cargando eventos…</p>

  if (!filas.length) {
    return (
      <div className="crayon p-4 mano text-center" style={{ background: 'var(--papel-2)', opacity: 0.75 }}>
        <div className="text-xl mb-1">🌡️ Dónde se abandona</div>
        <p className="text-base">Sin eventos de abandono todavía. Se registran desde agosto de 2026.</p>
      </div>
    )
  }

  const columnas = Math.max(...filas.map((f) => f.maxRondas))

  return (
    <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
      <h3 className="mano text-xl mb-1">🌡️ Dónde se abandona</h3>
      <p className="mano text-sm mb-3" style={{ opacity: 0.7 }}>
        Cada celda: cuántas veces se salió tras esa ronda. Columna 0 = entró y se fue sin jugar nada.
      </p>

      <div className="overflow-x-auto">
        <table className="mano text-sm" style={{ borderCollapse: 'separate', borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left pr-2 whitespace-nowrap">Actividad</th>
              {Array.from({ length: columnas }, (_, i) => (
                <th key={i} className="text-center" style={{ minWidth: 30, opacity: 0.6 }}>{i}</th>
              ))}
              <th className="text-center pl-2 whitespace-nowrap" style={{ opacity: 0.6 }}>✅</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.actividadId}>
                <td className="pr-2 whitespace-nowrap font-bold">{f.actividadId}</td>
                {Array.from({ length: columnas }, (_, i) => {
                  const n = f.porRonda[i] ?? 0
                  const c = color(n, maxCelda)
                  return (
                    <td key={i} className="text-center" style={{ background: c.fondo, color: c.texto, minWidth: 30, borderRadius: 3 }}
                      title={`${f.actividadId} · salieron tras ${i} ${i === 1 ? 'ronda' : 'rondas'}: ${n}`}>
                      {n || ''}
                    </td>
                  )
                })}
                <td className="text-center pl-2 font-bold" style={{ color: '#2e7d32' }}>{f.completadas || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mano text-xs mt-3" style={{ opacity: 0.7 }}>
        Si el calor se concentra a la izquierda, la actividad expulsa pronto: mira la mecánica.
        Si se concentra cerca del final, sobran rondas.
      </p>
    </div>
  )
}
