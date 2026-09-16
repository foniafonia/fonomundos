import { useEffect, useState, type ReactNode } from 'react'
import type { Paciente } from '../types'
import NavBar from '../components/NavBar'
import { DUDAS_GENERALES, PARADAS_3_ANOS } from './paradas'
import { entradaDe } from './catalogo'
import {
  MINIMO_FIABLE, NIVEL_AYUDA_MAX, SESIONES_SEGUIDAS, actividadesQueFaltan, cargarEstado, estadoDeTarea,
  planDeHoy, porcentaje, paradaPorId,
} from './motor'

/**
 * Panel de la Ruta para el profesional: en qué parada va, qué tiene dominado,
 * qué le cuesta y qué se ha hecho cada día. Solo lee; no cambia nada.
 */


function fecha(ms: number) {
  return new Date(ms).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function minutos(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

function pct(aciertos: number, total: number) {
  return total ? `${Math.round(porcentaje(aciertos, total) * 100)} %` : '—'
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
      <h2 className="mano text-xl mb-3" style={{ color: 'var(--cera-azul)' }}>{titulo}</h2>
      {children}
    </section>
  )
}

interface Props {
  paciente: Paciente
  onVolver: () => void
  onJuegos: () => void
}

export default function PanelRuta({ paciente, onVolver, onJuegos }: Props) {
  const [estado] = useState(() => cargarEstado(paciente.id))
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const plan = planDeHoy(estado)
  const parada = paradaPorId(estado.paradaId)
  const indiceActual = parada ? PARADAS_3_ANOS.findIndex((t) => t.id === parada.id) : PARADAS_3_ANOS.length
  const historial = [...estado.historial].reverse()
  const sesionesParada = parada ? estado.historial.filter((h) => h.paradaId === parada.id).length : 0
  const dudas = PARADAS_3_ANOS.flatMap((t) => t.tareas.filter((ta) => ta.duda).map((ta) => `Parada ${t.numero} · tarea ${ta.num}: ${ta.duda}`))

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <NavBar titulo={`Panel de la Ruta · ${paciente.nombre}`} onVolver={onVolver} volverLabel="← Sesión de hoy"
        feedbackActividad="ruta" feedbackItem="panel">
        <button onClick={onJuegos} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
          🔍 Juegos
        </button>
      </NavBar>
      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">

        <div className="crayon p-3 mano text-sm" style={{ background: 'var(--cera-mostaza)' }}>
          <b>Borrador sin revisar clínicamente.</b> Sigue el orden fijado para 3 años, pero las series de memoria y
          las palabras de cada sonido son provisionales. El progreso de la Ruta se
          guarda solo en este dispositivo; las sesiones jugadas sí van a la ficha del paciente.
        </div>

        <Seccion titulo={parada ? `Parada actual · ${parada.numero} · ${parada.nombre}` : 'Ruta de 3 años completada'}>
          {parada && (
            <>
              <p className="mano text-base">{parada.objetivo}</p>
              <p className="mano text-sm mt-1" style={{ opacity: 0.75 }}>
                Sesiones en esta parada: {sesionesParada} · mínimo: {parada.sesionesMinimas}
              </p>
              {plan.tipo === 'bloqueado' && (
                <p className="mano text-base mt-2 crayon px-3 py-2" style={{ background: 'var(--cera-coral)', color: '#fff' }}>
                  Parada detenida: necesita {plan.faltan.map((id) => entradaDe(id)?.titulo ?? id).join(', ')}, que no está construida. No se salta.
                </p>
              )}

              <div className="overflow-x-auto mt-3">
                <table className="w-full mano text-sm text-left border-collapse">
                  <thead>
                    <tr style={{ opacity: 0.7 }}>
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1 pr-2">Tarea</th>
                      <th className="py-1 pr-2">Modo</th>
                      <th className="py-1 pr-2">Estado</th>
                      <th className="py-1 pr-2">Últimas sesiones</th>
                      <th className="py-1">Ayuda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parada.tareas.map((ta, i) => {
                      const et = estadoDeTarea(estado, parada.id, ta.num)
                      const e = entradaDe(ta.actividadId)
                      const hoy = plan.tipo === 'sesion' && plan.indice === i
                      const estadoTexto = et.dominada ? '✓ dominada' : et.pasadas.length ? 'en curso' : 'sin empezar'
                      return (
                        <tr key={ta.num} className="align-top" style={{ borderTop: '1px solid var(--papel)', background: hoy ? 'var(--papel)' : undefined }}>
                          <td className="py-2 pr-2">{ta.num}</td>
                          <td className="py-2 pr-2">
                            <b>{e?.emoji} {e?.titulo ?? ta.actividadId}</b>{hoy && ' · toca hoy'}
                            <div style={{ opacity: 0.7 }}>{ta.parametros}</div>
                            {!e?.fonologica && <div style={{ opacity: 0.7 }}>No frena el paso de parada.</div>}
                            {!e?.construida && <div style={{ color: 'var(--cera-coral)' }}>Sin construir.</div>}
                            {ta.duda && <div style={{ color: 'var(--cera-lila)' }}>Duda: {ta.duda}</div>}
                          </td>
                          <td className="py-2 pr-2">{ta.modo === 'acompanada' ? 'Acompañada' : 'Solo'}</td>
                          <td className="py-2 pr-2">{estadoTexto}</td>
                          <td className="py-2 pr-2 tabular-nums">
                            {et.pasadas.slice(-4).map((p, k) => (
                              <span key={k} className="mr-2" style={{ opacity: p.total < MINIMO_FIABLE ? 0.45 : 1 }}
                                title={p.parcial ? 'Sesión parcial' : undefined}>
                                {p.aciertos}/{p.total}{p.parcial ? '*' : ''}
                              </span>
                            ))}
                            {!et.pasadas.length && '—'}
                          </td>
                          <td className="py-2">
                            {et.nivelAyuda > 0 ? `Nivel ${et.nivelAyuda}/${NIVEL_AYUDA_MAX}: ${ta.ayuda}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mano text-xs mt-2" style={{ opacity: 0.6 }}>
                * sesión parcial · en gris, menos de {MINIMO_FIABLE} ítems: se guarda pero no cuenta para decidir.
              </p>
            </>
          )}
        </Seccion>

        <Seccion titulo="La Ruta de 3 años">
          <ol className="flex flex-col gap-1">
            {PARADAS_3_ANOS.map((t, i) => {
              const faltan = actividadesQueFaltan(t)
              const marca = i < indiceActual ? '✓' : i === indiceActual ? '▶' : '·'
              return (
                <li key={t.id} className="mano text-base" style={{ opacity: i > indiceActual ? 0.7 : 1 }}>
                  {marca} <b>Parada {t.numero}</b> · {t.nombre} · {t.tareas.length} tareas
                  {faltan.length > 0 && <span style={{ color: 'var(--cera-coral)' }}> · falta construir: {faltan.map((id) => entradaDe(id)?.titulo ?? id).join(', ')}</span>}
                </li>
              )
            })}
          </ol>
          <button onClick={onJuegos} className="crayon mano mt-3 px-4 py-1.5 text-base" style={{ background: 'var(--papel)' }}>
            🔍 Ver y probar todos los juegos
          </button>
        </Seccion>

        <Seccion titulo="Historial">
          {historial.length === 0 ? (
            <p className="mano text-base">Todavía no hay sesiones de la Ruta.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full mano text-sm text-left border-collapse">
                <thead>
                  <tr style={{ opacity: 0.7 }}>
                    <th className="py-1 pr-2">Fecha</th>
                    <th className="py-1 pr-2">Tarea</th>
                    <th className="py-1 pr-2">Resultado</th>
                    <th className="py-1 pr-2">Repaso</th>
                    <th className="py-1 pr-2">Duración</th>
                    <th className="py-1">Qué cambió</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => {
                    const e = entradaDe(h.actividadId)
                    return (
                      <tr key={h.id} className="align-top" style={{ borderTop: '1px solid var(--papel)' }}>
                        <td className="py-2 pr-2 whitespace-nowrap">{fecha(h.fecha)}</td>
                        <td className="py-2 pr-2">Parada {paradaPorId(h.paradaId)?.numero ?? '?'} · tarea {h.tareaNum} · {e?.emoji} {e?.titulo ?? h.actividadId}</td>
                        <td className="py-2 pr-2 tabular-nums whitespace-nowrap">
                          {h.aciertos}/{h.total} ({pct(h.aciertos, h.total)})
                          {h.nivelAyuda > 0 && ` · ayuda ${h.nivelAyuda}`}
                          {h.parcial && ' · parcial'}
                        </td>
                        <td className="py-2 pr-2 tabular-nums">{h.repaso ? `${h.repaso.aciertos}/${h.repaso.total}` : '—'}</td>
                        <td className="py-2 pr-2 tabular-nums">{minutos(h.duracionMs)}</td>
                        <td className="py-2">{h.cambios.length ? h.cambios.join(' ') : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

        <Seccion titulo="Cómo decide la Ruta">
          <ul className="mano text-sm flex flex-col gap-1 list-disc pl-5">
            <li>Cada sesión: repaso de algo ya dominado, una sola tarea de la parada y un cierre fácil. Se corta a los 10 minutos.</li>
            <li>Las tareas se turnan en su orden; las dominadas salen del turno.</li>
            <li>Tarea dominada: ≥ 80 % en {SESIONES_SEGUIDAS} sesiones seguidas con al menos {MINIMO_FIABLE} ítems.</li>
            <li>Si cuesta (&lt; 50 % dos veces seguidas): la misma tarea con más ayuda. Nunca se salta ni se reordena una parada.</li>
            <li>Parada superada: todas las tareas fonológicas dominadas y cada tarea vista al menos {SESIONES_SEGUIDAS} sesiones. La articulación se practica pero no frena el paso.</li>
            <li>La articulación la valora el adulto y no entra en los índices de conciencia fonológica de la ficha.</li>
          </ul>
        </Seccion>

        {parada && (
          <details className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
            <summary className="mano text-lg cursor-pointer">Versión oral y juegos aparte de la parada {parada.numero}</summary>
            <h3 className="mano text-base mt-3">Sin pantalla</h3>
            <ul className="mano text-sm list-disc pl-5">
              {parada.versionOral.map((v) => <li key={v}>{v}</li>)}
            </ul>
            <h3 className="mano text-base mt-3">Aparte (no entra en la sesión)</h3>
            <ul className="mano text-sm list-disc pl-5">
              {parada.aparte.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </details>
        )}

        <details className="crayon p-4" style={{ background: 'var(--papel-2)' }}>
          <summary className="mano text-lg cursor-pointer">Dudas abiertas del diseño (3 años)</summary>
          <ul className="mano text-sm list-disc pl-5 mt-2 flex flex-col gap-1">
            {[...dudas, ...DUDAS_GENERALES].map((d) => <li key={d}>{d}</li>)}
          </ul>
        </details>
      </main>
    </div>
  )
}
