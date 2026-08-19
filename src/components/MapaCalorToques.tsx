/**
 * Visor del mapa de toques. Pinta la rejilla agregada que envía lib/mapaToques.
 *
 * Sirve para ver si los dedos van donde se espera: si nadie toca el 🔊 de
 * repetir, o si tocan fuera de las tarjetas, el problema es de interfaz y no
 * del niño. No hay coordenadas individuales, solo recuentos por celda.
 */
import { useEffect, useMemo, useState } from 'react'

interface EventoToques {
  event: string
  details?: {
    vista?: string
    columnas?: number
    filas?: number
    total?: number
    celdas?: Record<string, number>
  }
}

interface Props { pin: string }

const LADO = 9   // px por celda en pantalla

export default function MapaCalorToques({ pin }: Props) {
  const [eventos, setEventos] = useState<EventoToques[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<string>('')

  useEffect(() => {
    let vivo = true
    fetch(`/api/analytics?pin=${encodeURIComponent(pin)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 401 ? 'PIN rechazado' : `Error ${r.status}`))))
      .then((d) => { if (vivo) setEventos((Array.isArray(d) ? d : []).filter((e: EventoToques) => e.event === 'toques')) })
      .catch((e) => { if (vivo) setError(String(e.message ?? e)) })
    return () => { vivo = false }
  }, [pin])

  const vistas = useMemo(
    () => [...new Set((eventos ?? []).map((e) => e.details?.vista).filter(Boolean) as string[])].sort(),
    [eventos],
  )

  const activa = vista || vistas[0] || ''

  const { rejilla, columnas, filas, total } = useMemo(() => {
    const relevantes = (eventos ?? []).filter((e) => e.details?.vista === activa)
    const columnas = relevantes[0]?.details?.columnas ?? 40
    const filas = relevantes[0]?.details?.filas ?? 40
    const rejilla = new Map<string, number>()
    let total = 0
    for (const e of relevantes) {
      for (const [k, n] of Object.entries(e.details?.celdas ?? {})) {
        rejilla.set(k, (rejilla.get(k) ?? 0) + n)
        total += n
      }
    }
    return { rejilla, columnas, filas, total }
  }, [eventos, activa])

  const max = useMemo(() => Math.max(1, ...rejilla.values()), [rejilla])

  if (error) return <p className="mano text-base" style={{ color: 'var(--cera-coral)' }}>No se pudo leer analytics: {error}</p>
  if (!eventos) return <p className="mano text-base">Cargando toques…</p>

  if (!vistas.length) {
    return (
      <div className="crayon p-4 mano text-center" style={{ background: 'var(--papel-2)', opacity: 0.75 }}>
        <div className="text-xl mb-1">👆 Mapa de toques</div>
        <p className="text-base">Sin datos todavía. Se recogen dentro de las actividades, agregados por celda.</p>
      </div>
    )
  }

  return (
    <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
      <h3 className="mano text-xl mb-1">👆 Mapa de toques</h3>
      <p className="mano text-sm mb-3" style={{ opacity: 0.7 }}>
        Rejilla {columnas}×{filas} sobre la pantalla · {total.toLocaleString('es-ES')} toques.
        Sin coordenadas individuales: solo recuentos.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {vistas.map((v) => (
          <button key={v} onClick={() => setVista(v)}
            className="crayon mano px-3 py-1 text-sm"
            style={{ background: v === activa ? 'var(--cera-azul)' : 'var(--papel)', color: v === activa ? '#fff' : 'var(--tinta)' }}>
            {v}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columnas}, ${LADO}px)`,
            gap: 1,
            width: columnas * (LADO + 1),
            background: 'var(--papel)',
            padding: 4,
            borderRadius: 4,
          }}
        >
          {Array.from({ length: columnas * filas }, (_, i) => {
            const col = i % columnas
            const fil = Math.floor(i / columnas)
            const n = rejilla.get(`${col},${fil}`) ?? 0
            const t = n / max
            return (
              <div
                key={i}
                title={n ? `${n} toques` : undefined}
                style={{
                  width: LADO, height: LADO, borderRadius: 1,
                  background: n ? `rgba(229, 57, 53, ${0.12 + t * 0.88})` : 'transparent',
                }}
              />
            )
          })}
        </div>
      </div>

      <p className="mano text-xs mt-3" style={{ opacity: 0.7 }}>
        La rejilla es proporcional a la pantalla de cada usuario, así que mezcla móviles y tablets:
        sirve para ver zonas frías y calientes, no para medir píxeles.
      </p>
    </div>
  )
}
