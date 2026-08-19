/**
 * Mapa de calor clínico — qué unidades falla el paciente, no cuántas.
 *
 * El panel ya decía "72% de aciertos". Eso no cambia el lunes por la mañana:
 * el profesional sigue sin saber por dónde entrar. Esto sí: rojo = /r/ y /s/
 * atascados, verde = dominados. Se lee de un vistazo y se convierte en plan.
 *
 * Se alimenta de ResultadoRonda.foco, que empezó a registrarse en agosto 2026.
 * Las sesiones anteriores no lo tienen y quedan fuera del recuento: se avisa en
 * pantalla en vez de mostrar un mapa incompleto como si fuera completo.
 */
import { useMemo, useState } from 'react'
import type { FocoTipo, ResultadoRonda, Sesion } from '../types'
import { decirFonema } from '../lib/pronunciacion'
import { hablar } from '../lib/voz'

interface Props {
  sesiones: Sesion[]
}

interface Celda {
  foco: string
  tipo: FocoTipo
  total: number
  aciertos: number
  ayudas: number
  intentos: number
  tiempoMedioMs: number
}

/** Mínimo de intentos para que el color signifique algo y no sea ruido. */
const MINIMO_FIABLE = 3

const ETIQUETA_TIPO: Record<FocoTipo, string> = {
  fonema: 'Fonemas',
  silaba: 'Sílabas',
  palabra: 'Palabras',
  rima: 'Rimas',
  frase: 'Frases',
}

function agrupar(resultados: ResultadoRonda[]): Map<FocoTipo, Celda[]> {
  const acc = new Map<string, Celda>()
  for (const r of resultados) {
    if (!r.foco || !r.focoTipo) continue
    const clave = `${r.focoTipo}|${r.foco}`
    const c = acc.get(clave) ?? {
      foco: r.foco, tipo: r.focoTipo,
      total: 0, aciertos: 0, ayudas: 0, intentos: 0, tiempoMedioMs: 0,
    }
    c.total += 1
    if (r.acierto) c.aciertos += 1
    if (r.ayudaUsada) c.ayudas += 1
    c.intentos += r.intentos || 1
    c.tiempoMedioMs += r.tiempoMs || 0
    acc.set(clave, c)
  }

  const porTipo = new Map<FocoTipo, Celda[]>()
  for (const c of acc.values()) {
    c.tiempoMedioMs = Math.round(c.tiempoMedioMs / Math.max(c.total, 1))
    const lista = porTipo.get(c.tipo) ?? []
    lista.push(c)
    porTipo.set(c.tipo, lista)
  }
  // Peor primero: es lo que el profesional busca al abrir esto.
  for (const lista of porTipo.values()) {
    lista.sort((a, b) => (a.aciertos / a.total) - (b.aciertos / b.total) || b.total - a.total)
  }
  return porTipo
}

function colorDe(c: Celda) {
  if (c.total < MINIMO_FIABLE) return { fondo: 'var(--papel-2)', texto: 'var(--tinta)', borde: 'dashed' as const }
  const tasa = c.aciertos / c.total
  if (tasa >= 0.85) return { fondo: '#2e7d32', texto: '#fff', borde: 'solid' as const }
  if (tasa >= 0.65) return { fondo: '#7cb342', texto: '#1b3d1b', borde: 'solid' as const }
  if (tasa >= 0.45) return { fondo: '#fdd835', texto: '#4a3b00', borde: 'solid' as const }
  if (tasa >= 0.25) return { fondo: '#fb8c00', texto: '#fff', borde: 'solid' as const }
  return { fondo: '#e53935', texto: '#fff', borde: 'solid' as const }
}

export default function MapaCalorFonemas({ sesiones }: Props) {
  const [detalle, setDetalle] = useState<Celda | null>(null)

  const { porTipo, conFoco, sinFoco } = useMemo(() => {
    const todos = sesiones.flatMap((s) => s.resultados ?? [])
    const conFoco = todos.filter((r) => r.foco && r.focoTipo)
    return { porTipo: agrupar(conFoco), conFoco: conFoco.length, sinFoco: todos.length - conFoco.length }
  }, [sesiones])

  if (!conFoco) {
    return (
      <div className="crayon p-4 mano text-center" style={{ background: 'var(--papel-2)', opacity: 0.75 }}>
        <div className="text-xl mb-1">🌡️ Mapa de calor</div>
        <p className="text-base">
          Todavía no hay rondas con el detalle de qué se trabajaba.
          {sinFoco > 0 && <> Las {sinFoco} rondas anteriores se registraron antes de que se guardara ese dato.</>}
        </p>
        <p className="text-sm mt-1" style={{ opacity: 0.7 }}>Juega una actividad y aparecerá aquí.</p>
      </div>
    )
  }

  const tipos = [...porTipo.keys()]

  return (
    <div className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
      <h3 className="mano text-xl mb-1">🌡️ Mapa de calor · qué falla</h3>
      <p className="mano text-sm mb-3" style={{ opacity: 0.7 }}>
        Ordenado de peor a mejor. Toca una casilla para el detalle.
        {sinFoco > 0 && <> · {sinFoco} rondas antiguas sin este dato quedan fuera.</>}
      </p>

      {tipos.map((tipo) => (
        <div key={tipo} className="mb-4">
          <div className="mano text-base font-bold mb-2">{ETIQUETA_TIPO[tipo]}</div>
          <div className="flex flex-wrap gap-2">
            {porTipo.get(tipo)!.map((c) => {
              const col = colorDe(c)
              const pct = Math.round((c.aciertos / c.total) * 100)
              const flojo = c.total < MINIMO_FIABLE
              return (
                <button
                  key={`${c.tipo}-${c.foco}`}
                  onClick={() => setDetalle(detalle?.foco === c.foco && detalle.tipo === c.tipo ? null : c)}
                  className="crayon mano flex flex-col items-center justify-center min-w-16 px-3 py-2 transition-transform hover:-translate-y-0.5"
                  style={{ background: col.fondo, color: col.texto, borderStyle: col.borde }}
                  title={flojo
                    ? `${c.foco}: solo ${c.total} ${c.total === 1 ? 'intento' : 'intentos'}, aún sin datos suficientes`
                    : `${c.foco}: ${pct}% de acierto en ${c.total} intentos`}
                >
                  <span className="text-xl font-black leading-none">{c.foco}</span>
                  <span className="text-xs mt-0.5">{flojo ? `${c.total}·?` : `${pct}%`}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {detalle && (
        <div className="crayon p-3 mt-1" style={{ background: 'var(--papel)' }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="mano text-lg font-black">{detalle.foco}</span>
            {detalle.tipo === 'fonema' && (
              <button
                onClick={() => hablar(decirFonema(detalle.foco), { dedupe: false })}
                className="crayon mano px-2 py-0.5 text-sm"
                style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}
              >🔊 sonido</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mano text-sm">
            <div>Acierto: <b>{Math.round((detalle.aciertos / detalle.total) * 100)}%</b> ({detalle.aciertos}/{detalle.total})</div>
            <div>Intentos por ronda: <b>{(detalle.intentos / detalle.total).toFixed(1)}</b></div>
            <div>Pistas pedidas: <b>{detalle.ayudas}</b></div>
            <div>Tiempo medio: <b>{(detalle.tiempoMedioMs / 1000).toFixed(1)} s</b></div>
          </div>
          {detalle.total < MINIMO_FIABLE && (
            <p className="mano text-xs mt-2" style={{ opacity: 0.7 }}>
              Con menos de {MINIMO_FIABLE} intentos el porcentaje no es interpretable. Sigue trabajándolo.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3 mano text-xs" style={{ opacity: 0.75 }}>
        <span>Peor</span>
        {['#e53935', '#fb8c00', '#fdd835', '#7cb342', '#2e7d32'].map((c) => (
          <span key={c} style={{ background: c, width: 22, height: 12, display: 'inline-block', borderRadius: 2 }} />
        ))}
        <span>Mejor</span>
        <span className="ml-2" style={{ borderStyle: 'dashed', borderWidth: 1, padding: '0 4px' }}>
          punteado = pocos intentos
        </span>
      </div>
    </div>
  )
}
