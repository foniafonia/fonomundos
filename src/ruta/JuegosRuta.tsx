import { useEffect, useState, type ReactNode } from 'react'
import NavBar from '../components/NavBar'
import { registrarEventoUso } from '../lib/analytics'
import BloqueRuta from './BloqueRuta'
import { CATALOGO_RUTA, type EntradaCatalogo } from './catalogo'
import { NIVEL_AYUDA_MAX, actividadesQueFaltan } from './motor'
import { PARADAS_3_ANOS } from './paradas'
import type { Corte, ResultadoBloque, Tarea } from './tipos'

/**
 * Todos los juegos de la Ruta de un vistazo, para que el profesional sepa qué
 * hay sin tener que recorrerla como si fuera el niño.
 *
 * Los juegos nuevos de la Ruta se pueden probar aquí: se juegan sin guardar
 * nada y sin tocar el avance del niño. Los de siempre no se prueban desde
 * aquí porque guardan su sesión por su cuenta en la ficha; están en Mundo 1.
 */

const ITEMS_PRUEBA = 10

/**
 * Juegos en pruebas que NO están en la Ruta: no entran en las sesiones (su
 * orden no se toca), pero se enseñan aquí para verlos funcionar.
 */
const EN_PRUEBAS: { tarea: Tarea; emoji: string; titulo: string; descripcion: string }[] = [
  {
    emoji: '🧩',
    titulo: 'Monta la sílaba',
    descripcion: 'Se oye una sílaba y se monta con el fonogesto de la consonante y el de la vocal. En «Explora» se juntan fonogestos libremente y se oye lo que sale. Primer paso hacia escribir o decir algo y ver sus fonogestos.',
    tarea: {
      num: 1, actividadId: 'monta-silaba', modo: 'solo', config: {},
      parametros: 'Consonantes m, p, b · vocales a, e, o, u',
      ayuda: 'La sílaba suena dos veces y se ven las letras',
    },
  },
]

interface Prueba {
  /** Dónde está el juego, para la cabecera: «parada 3» o «en pruebas». */
  etiqueta: string
  tarea: Tarea
  nivelAyuda: number
  intento: number
}

function nombreTarea(tarea: Tarea, e?: EntradaCatalogo) {
  const enPruebas = EN_PRUEBAS.find((j) => j.tarea.actividadId === tarea.actividadId)
  if (enPruebas) return `${enPruebas.emoji} ${enPruebas.titulo}`
  const sonido = tarea.config.sonido ? ` /${tarea.config.sonido.toLocaleLowerCase('es-ES')}/` : ''
  return `${e?.emoji ?? ''} ${e?.titulo ?? tarea.actividadId}${sonido}`
}

/** Parada en la que aparece por primera vez cada actividad, para el resumen. */
function primeraAparicion(actividadId: string) {
  return PARADAS_3_ANOS.find((t) => t.tareas.some((ta) => ta.actividadId === actividadId))?.numero
}

function Grupo({ titulo, nota, entradas }: { titulo: string; nota: string; entradas: EntradaCatalogo[] }) {
  return (
    <div>
      <h3 className="mano text-lg">{titulo}</h3>
      <p className="mano text-sm" style={{ opacity: 0.7 }}>{nota}</p>
      <ul className="flex flex-wrap gap-2 mt-2">
        {entradas.map((e) => (
          <li key={e.id} className="crayon mano px-3 py-1 text-sm" style={{ background: 'var(--papel)' }}>
            {e.emoji} {e.titulo} <span style={{ opacity: 0.6 }}>· desde la parada {primeraAparicion(e.id)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
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
  onVolver: () => void
}

export default function JuegosRuta({ onVolver }: Props) {
  const [prueba, setPrueba] = useState<Prueba | null>(null)
  const [corte, setCorte] = useState<Corte>(null)
  const [resultado, setResultado] = useState<ResultadoBloque | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [prueba, resultado])

  function probar(etiqueta: string, tarea: Tarea, nivelAyuda: number) {
    registrarEventoUso('actividad_iniciada', { actividadId: tarea.actividadId, origen: 'ruta-probar', donde: etiqueta, nivelAyuda })
    setCorte(null)
    setResultado(null)
    setPrueba((p) => ({ etiqueta, tarea, nivelAyuda, intento: (p?.intento ?? 0) + 1 }))
  }

  function terminar(r: ResultadoBloque) {
    // Si se ha salido a mano, de vuelta a la lista sin más.
    if (r.parcial) {
      setPrueba(null)
      return
    }
    setResultado(r)
  }

  if (prueba && !resultado) {
    return (
      <BloqueRuta
        key={prueba.intento}
        actividadId={prueba.tarea.actividadId}
        bloque={{
          pacienteId: 'ruta-prueba',
          items: ITEMS_PRUEBA,
          nivelAyuda: prueba.nivelAyuda,
          config: prueba.tarea.config,
          guardar: false,
          corte,
          onFin: terminar,
        }}
        textoSalir="← Volver a los juegos"
        onSalir={() => setCorte('salir')}
        feedbackItem={`probar · ${prueba.etiqueta} · ${prueba.tarea.actividadId}`}
        cabecera={
          <span className="flex-1 mano text-sm">
            <span className="px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--cera-lila)' }}>Prueba</span>
            {' · '}{prueba.etiqueta} · {prueba.nivelAyuda > 0 ? 'con ayuda · ' : ''}no cuenta ni se guarda
          </span>
        }
      />
    )
  }

  if (prueba && resultado) {
    const e = CATALOGO_RUTA[prueba.tarea.actividadId]
    return (
      <div className="papel min-h-full text-[var(--tinta)]">
        <NavBar titulo="Juegos de la Ruta" onVolver={() => setPrueba(null)} volverLabel="← Juegos" feedbackActividad="ruta" feedbackItem="probar · fin" />
        <main className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-4 text-center">
          <h1 className="mano text-3xl">Prueba terminada</h1>
          <p className="mano text-xl">{nombreTarea(prueba.tarea, e)} · {resultado.aciertos}/{resultado.total}</p>
          <p className="mano text-base" style={{ opacity: 0.7 }}>No se ha guardado nada ni ha cambiado la Ruta de ningún niño.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => probar(prueba.etiqueta, prueba.tarea, prueba.nivelAyuda)}
              className="crayon mano px-5 py-2 text-lg" style={{ background: 'var(--papel-2)' }}>▶ Otra vez</button>
            <button onClick={() => setPrueba(null)}
              className="crayon mano px-5 py-2 text-lg text-white" style={{ background: 'var(--cera-azul)' }}>Ver todos los juegos</button>
          </div>
        </main>
      </div>
    )
  }

  const entradas = Object.values(CATALOGO_RUTA)
  const nuevos = entradas.filter((e) => e.construida && e.lanzador === 'ruta')
  const deSiempre = entradas.filter((e) => e.construida && e.lanzador !== 'ruta')
  const porConstruir = entradas.filter((e) => !e.construida)

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <NavBar titulo="Juegos de la Ruta · 3 años" onVolver={onVolver} feedbackActividad="ruta" feedbackItem="juegos" />
      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        <p className="mano text-base text-center" style={{ opacity: 0.8 }}>
          Todo lo que usa la Ruta, para conocerlo sin recorrerla. Lo que pruebes aquí no cuenta para ningún niño ni se
          guarda en su ficha.
        </p>

        <Seccion titulo="Qué hay">
          <div className="flex flex-col gap-4">
            <Grupo titulo="✨ Nuevos de la Ruta" nota="Se pueden probar aquí abajo, en cada parada." entradas={nuevos} />
            <Grupo titulo="🎮 Los de siempre" nota="La Ruta los abre tal cual. Para probarlos, están en Mundo 1." entradas={deSiempre} />
            <Grupo titulo="🚧 Por construir" nota="Mientras falten, la Ruta se para en la parada que los necesita." entradas={porConstruir} />
          </div>
        </Seccion>

        <Seccion titulo="🧪 En pruebas · fuera de la Ruta">
          <p className="mano text-sm" style={{ opacity: 0.75 }}>
            Ideas que aún no forman parte de la Ruta. No entran en las sesiones; están aquí para verlas funcionar.
          </p>
          <ul className="flex flex-col gap-2 mt-3">
            {EN_PRUEBAS.map((j) => (
              <li key={j.tarea.actividadId} className="crayon p-3 flex flex-wrap items-center gap-3" style={{ background: 'var(--papel)' }}>
                <div className="flex-1 min-w-48">
                  <p className="mano text-base"><b>{j.emoji} {j.titulo}</b></p>
                  <p className="mano text-sm" style={{ opacity: 0.7 }}>{j.descripcion}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => probar('fuera de la Ruta', j.tarea, 0)}
                    className="crayon mano px-4 py-1.5 text-base text-white" style={{ background: 'var(--cera-verde)' }}>
                    ▶ Probar
                  </button>
                  <button onClick={() => probar('fuera de la Ruta', j.tarea, NIVEL_AYUDA_MAX)} title={j.tarea.ayuda}
                    className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
                    Con ayuda
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Seccion>

        {PARADAS_3_ANOS.map((parada) => {
          const faltan = actividadesQueFaltan(parada)
          return (
            <Seccion key={parada.id} titulo={`Parada ${parada.numero} · ${parada.nombre}`}>
              <p className="mano text-sm" style={{ opacity: 0.75 }}>{parada.objetivo}</p>
              {faltan.length > 0 && (
                <p className="mano text-sm mt-1" style={{ color: 'var(--cera-coral)' }}>Falta construir: {faltan.map((id) => CATALOGO_RUTA[id]?.titulo ?? id).join(', ')}</p>
              )}
              <ul className="flex flex-col gap-2 mt-3">
                {parada.tareas.map((tarea) => {
                  const e = CATALOGO_RUTA[tarea.actividadId]
                  return (
                    <li key={tarea.num} className="crayon p-3 flex flex-wrap items-center gap-3" style={{ background: 'var(--papel)' }}>
                      <div className="flex-1 min-w-48">
                        <p className="mano text-base">
                          <b>{tarea.num} · {nombreTarea(tarea, e)}</b>
                          <span className="mano text-xs ml-2" style={{ opacity: 0.65 }}>
                            {tarea.modo === 'acompanada' ? 'Acompañada' : 'Solo'}
                          </span>
                        </p>
                        <p className="mano text-sm" style={{ opacity: 0.7 }}>{tarea.parametros}</p>
                      </div>
                      {!e?.construida ? (
                        <span className="mano text-sm" style={{ opacity: 0.6 }}>🚧 Por construir</span>
                      ) : e.lanzador === 'ruta' ? (
                        <div className="flex gap-2">
                          <button onClick={() => probar(`parada ${parada.numero}`, tarea, 0)}
                            className="crayon mano px-4 py-1.5 text-base text-white" style={{ background: 'var(--cera-verde)' }}>
                            ▶ Probar
                          </button>
                          <button onClick={() => probar(`parada ${parada.numero}`, tarea, NIVEL_AYUDA_MAX)}
                            className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}
                            title={tarea.ayuda}>
                            Con ayuda
                          </button>
                        </div>
                      ) : (
                        <span className="mano text-sm" style={{ opacity: 0.6 }}>🎮 En Mundo 1</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Seccion>
          )
        })}
      </main>
    </div>
  )
}
