/**
 * Ruletas fonológicas.
 *
 * Toman el modelo de las ruletas de morfosintaxis (varias ruedas que giran a la
 * vez y un panel para el profesional) y lo llevan a la conciencia fonológica:
 * sílabas, sonido inicial y posición del sonido.
 *
 * La voz es la de siempre: todo lo que se locuta pasa por pronunciacion.ts y
 * tiene su clip pregenerado. Un sonido nunca va metido dentro de una frase: se
 * encadena como parte aparte, o Piper lo leería como nombre de letra.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Sesion } from '../types'
import FeedbackBtn from './FeedbackBtn'
import { Refuerzo } from './Personaje'
import { useSesion } from '../lib/useSesion'
import { hablarLento, hablarSecuencia } from '../lib/voz'
import { decirPalabra, decirSilaba } from '../lib/pronunciacion'
import {
  COMBINACIONES_POSICION, POSICIONES, SONIDOS_INICIO, TEXTO_POSICION, VOCABULARIO,
  barajar, etiquetaIzquierda, silabasDe, sinSonido, tieneEn, vozSonido,
  type Fonema, type PalabraRuleta, type Posicion, type TipoSilaba,
} from '../data/ruletas'

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

type Juego = 'silabas' | 'sonido' | 'posicion'
type ModoSilaba = 'oir' | 'leer' | 'mixto'

interface Ajustes {
  duracion: number
  vueltas: number
  tipoSilaba: TipoSilaba
  modoSilaba: ModoSilaba
}

/** Cinco a diez minutos: ocho giros caben de sobra. */
const RONDAS = 8
const CLAVE_AJUSTES = 'fonomundos.ruletas.ajustes'
const AJUSTES_INICIALES: Ajustes = { duracion: 3, vueltas: 4, tipoSilaba: 'directa', modoSilaba: 'mixto' }
const COLORES = ['var(--cera-coral)', 'var(--cera-mostaza)', 'var(--cera-verde)', 'var(--cera-azul)', 'var(--cera-lila)']

function leerAjustes(): Ajustes {
  try {
    return { ...AJUSTES_INICIALES, ...JSON.parse(localStorage.getItem(CLAVE_AJUSTES) || '{}') }
  } catch {
    return AJUSTES_INICIALES
  }
}

function sinMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Cómo se escribe el sonido en la rueda: la /k/ puede ser C, QU o K. */
const LETRA_SONIDO: Partial<Record<Fonema, string>> = {
  K: 'C·K', Z: 'Z·C', J: 'J·G', RR: 'R', B: 'B·V', G: 'G',
}
const letraDe = (f: Fonema) => LETRA_SONIDO[f] ?? f

/** Solo hay articulemas validados para algunos sonidos; el resto va sin imagen. */
const ARTICULEMA: Partial<Record<Fonema, string>> = {
  A: 'A', E: 'E', O: 'O', U: 'U', M: 'M', P: 'P', B: 'B-V',
}

// ─── La rueda ───────────────────────────────────────────────────────────────

interface RuedaProps {
  segmentos: string[]
  /** Índice donde debe parar, o null si todavía no se ha girado. */
  destino: number | null
  /** Cambia en cada giro para que la rueda vuelva a girar aunque repita destino. */
  giro: number
  duracion: number
  vueltas: number
  ocultarEtiquetas?: boolean
  titulo: string
}

function Rueda({ segmentos, destino, giro, duracion, vueltas, ocultarEtiquetas, titulo }: RuedaProps) {
  const n = segmentos.length
  const paso = 360 / n
  const [angulo, setAngulo] = useState(0)
  const acumulado = useRef(0)

  useEffect(() => {
    if (destino === null) return
    // El centro del segmento destino tiene que quedar arriba, bajo la flecha.
    const objetivo = 360 - (destino * paso + paso / 2)
    const base = acumulado.current - (acumulado.current % 360)
    const siguiente = base + (sinMovimiento() ? 0 : vueltas * 360) + objetivo
    acumulado.current = siguiente <= acumulado.current ? siguiente + 360 : siguiente
    setAngulo(acumulado.current)
  }, [giro, destino, paso, vueltas])

  const r = 100
  const trozo = (i: number) => {
    const a0 = ((i * paso - 90) * Math.PI) / 180
    const a1 = (((i + 1) * paso - 90) * Math.PI) / 180
    const grande = paso > 180 ? 1 : 0
    return `M0,0 L${r * Math.cos(a0)},${r * Math.sin(a0)} A${r},${r} 0 ${grande} 1 ${r * Math.cos(a1)},${r * Math.sin(a1)} Z`
  }
  const tamLetra = n > 14 ? 13 : n > 8 ? 17 : 22

  return (
    <div className="flex flex-col items-center">
      <p className="mano text-base mb-1" style={{ opacity: 0.75 }}>{titulo}</p>
      <div className="relative" style={{ width: 'min(42vw, 230px)', aspectRatio: '1' }}>
        <div aria-hidden className="absolute left-1/2 -top-1 z-10 -translate-x-1/2 text-3xl leading-none"
          style={{ color: 'var(--tinta)' }}>▼</div>
        <svg viewBox="-104 -104 208 208" className="w-full h-full" role="img"
          aria-label={destino === null ? titulo : `${titulo}: ${segmentos[destino]}`}>
          <g style={{
            transform: `rotate(${angulo}deg)`,
            transition: sinMovimiento() ? 'none' : `transform ${duracion}s cubic-bezier(0.15, 0.85, 0.2, 1)`,
          }}>
            {segmentos.map((s, i) => (
              <g key={`${s}-${i}`}>
                <path d={trozo(i)} fill={COLORES[i % COLORES.length]} stroke="var(--tinta)" strokeWidth="1.2" />
                {!ocultarEtiquetas && (
                  <text
                    transform={`rotate(${i * paso + paso / 2}) translate(0,-68)`}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={tamLetra} fontWeight={800} fill="var(--tinta)"
                    style={{ fontFamily: 'inherit' }}
                  >{s}</text>
                )}
              </g>
            ))}
          </g>
          <circle r="16" fill="var(--papel)" stroke="var(--tinta)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

// ─── Pieza común de cada juego ──────────────────────────────────────────────

function Cabecera({ titulo, ronda, onSalir }: { titulo: string; ronda: number; onSalir: () => void }) {
  return (
    <header className="flex items-center gap-3 p-4 pr-36 sm:pr-4">
      <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>
        ← Salir{ronda > 0 ? ' y guardar' : ''}
      </button>
      <span className="mano text-lg">{titulo}</span>
      <span className="mano text-base ml-auto" style={{ opacity: 0.7 }}>{Math.min(ronda + 1, RONDAS)}/{RONDAS}</span>
    </header>
  )
}

function BotonGirar({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="crayon mano mt-6 px-8 py-3 text-2xl font-black text-white disabled:opacity-40"
      style={{ background: 'var(--cera-verde)' }}>
      🎯 ¡Gira!
    </button>
  )
}

// ─── 1. Ruleta de sílabas (acompañada) ──────────────────────────────────────

function RuletaSilabas({ pacienteId, ajustes, onFinish, onSalir }: { pacienteId: string; ajustes: Ajustes; onFinish: Props['onFinish']; onSalir: () => void }) {
  const sesion = useSesion(pacienteId, 'ruleta-silabas', 'silabica')
  const { izquierda, derecha, forma } = useMemo(() => silabasDe(ajustes.tipoSilaba), [ajustes.tipoSilaba])
  const [ronda, setRonda] = useState(0)
  const [giro, setGiro] = useState(0)
  const [destinos, setDestinos] = useState<[number, number] | null>(null)
  const [estado, setEstado] = useState<'listo' | 'girando' | 'valorar'>('listo')
  const repeticiones = useRef(0)
  const inicio = useRef(Date.now())
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const silaba = destinos ? forma(izquierda[destinos[0]], derecha[destinos[1]]) : ''
  const verLetras = ajustes.modoSilaba !== 'oir'
  const oirModelo = ajustes.modoSilaba !== 'leer'

  function girar() {
    const d: [number, number] = [Math.floor(Math.random() * izquierda.length), Math.floor(Math.random() * derecha.length)]
    setDestinos(d)
    setGiro((g) => g + 1)
    setEstado('girando')
    repeticiones.current = 0
    timer.current = window.setTimeout(() => {
      setEstado('valorar')
      inicio.current = Date.now()
      if (oirModelo) hablarLento(decirSilaba(forma(izquierda[d[0]], derecha[d[1]])), { dedupe: false })
    }, sinMovimiento() ? 200 : ajustes.duracion * 1000 + 150)
  }

  function escuchar() {
    repeticiones.current += 1
    hablarLento(decirSilaba(silaba), { dedupe: false })
  }

  function valorar(bien: boolean) {
    sesion.registrar({
      acierto: bien,
      intentos: 1,
      ayudaUsada: repeticiones.current > 0,
      tiempoMs: Date.now() - inicio.current,
      dificultad: ajustes.tipoSilaba === 'directa' ? 1 : ajustes.tipoSilaba === 'inversa' ? 2 : 3,
      itemSeleccionadoId: silaba,
    })
    // En modo leer, el modelo llega después: primero lo intenta el niño solo.
    if (!oirModelo) hablarLento(decirSilaba(silaba), { dedupe: false })
    const siguiente = ronda + 1
    if (siguiente >= RONDAS) { onFinish(sesion.finalizar()); return }
    setRonda(siguiente)
    setEstado('listo')
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="ruleta-silabas" itemActual={silaba || ajustes.tipoSilaba} />
      <Cabecera titulo="Ruleta de sílabas" ronda={ronda} onSalir={() => { sesion.abandonar(RONDAS); onSalir() }} />
      <main className="max-w-3xl mx-auto px-4 pb-10 text-center">
        <p className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>
          {ajustes.tipoSilaba === 'directa' ? 'Sílabas directas' : ajustes.tipoSilaba === 'inversa' ? 'Sílabas inversas' : 'Sílabas trabadas'}
          {' · '}{ajustes.modoSilaba === 'oir' ? 'escuchar y repetir' : ajustes.modoSilaba === 'leer' ? 'leer en voz alta' : 'ver, oír y repetir'}
        </p>
        <div className="mt-4 flex justify-center gap-4 sm:gap-10">
          <Rueda titulo={ajustes.tipoSilaba === 'inversa' ? 'Vocal' : ajustes.tipoSilaba === 'trabada' ? 'Grupo' : 'Consonante'}
            segmentos={izquierda.map((x) => etiquetaIzquierda(ajustes.tipoSilaba, x))}
            destino={destinos?.[0] ?? null} giro={giro} duracion={ajustes.duracion} vueltas={ajustes.vueltas}
            ocultarEtiquetas={!verLetras} />
          <Rueda titulo={ajustes.tipoSilaba === 'inversa' ? 'Final' : 'Vocal'}
            segmentos={derecha} destino={destinos?.[1] ?? null} giro={giro}
            duracion={ajustes.duracion} vueltas={ajustes.vueltas + 1} ocultarEtiquetas={!verLetras} />
        </div>

        {estado === 'valorar' && (
          <div className="mt-6">
            {verLetras
              ? <div className="mano text-7xl font-black tracking-wide">{silaba}</div>
              : <div className="mano text-2xl" style={{ opacity: 0.75 }}>Escucha y repite</div>}
            <button onClick={escuchar} className="crayon mano mt-3 px-4 py-2 text-xl" style={{ background: 'var(--papel-2)' }}>
              🔊 Otra vez
            </button>
            <p className="mano mt-5 text-base" style={{ opacity: 0.75 }}>
              Para el adulto: ¿la ha dicho bien?
            </p>
            <div className="mt-2 flex justify-center gap-4">
              <button onClick={() => valorar(true)} className="crayon mano px-6 py-3 text-xl text-white" style={{ background: 'var(--cera-verde)' }}>✓ Bien</button>
              <button onClick={() => valorar(false)} className="crayon mano px-6 py-3 text-xl" style={{ background: 'var(--papel-2)' }}>✗ Todavía no</button>
            </div>
          </div>
        )}
        {estado !== 'valorar' && <BotonGirar onClick={girar} disabled={estado === 'girando'} />}
      </main>
    </div>
  )
}

// ─── Tablero de dibujos, común a sonido y posición ─────────────────────────

interface Carta { palabra: PalabraRuleta; correcta: boolean; estado: 'libre' | 'ok' | 'mal' }

function useTablero() {
  const [cartas, setCartas] = useState<Carta[]>([])
  const errores = useRef(0)
  const ayudas = useRef(0)
  const inicio = useRef(Date.now())
  function preparar(correctas: PalabraRuleta[], distractores: PalabraRuleta[]) {
    setCartas(barajar([
      ...correctas.map((palabra) => ({ palabra, correcta: true, estado: 'libre' as const })),
      ...distractores.map((palabra) => ({ palabra, correcta: false, estado: 'libre' as const })),
    ]))
    errores.current = 0
    ayudas.current = 0
    inicio.current = Date.now()
  }
  return { cartas, setCartas, errores, ayudas, inicio, preparar }
}

function Tablero({ cartas, onTocar }: { cartas: Carta[]; onTocar: (i: number) => void }) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
      {cartas.map((c, i) => (
        <button key={`${c.palabra.texto}-${i}`} onClick={() => onTocar(i)}
          disabled={c.estado === 'ok'}
          className={`crayon min-h-28 flex flex-col items-center justify-center p-2 transition-transform ${c.estado === 'mal' ? 'animate-shake' : 'hover:-translate-y-1'}`}
          style={{ background: c.estado === 'ok' ? 'var(--cera-verde)' : c.estado === 'mal' ? 'var(--cera-coral)' : 'var(--papel-2)' }}>
          <span className="text-5xl">{c.palabra.emoji}</span>
          <span className="mano text-sm mt-1">{c.palabra.texto}</span>
        </button>
      ))}
    </div>
  )
}

// ─── 2. Ruleta del sonido ───────────────────────────────────────────────────

function RuletaSonido({ pacienteId, ajustes, onFinish, onSalir }: { pacienteId: string; ajustes: Ajustes; onFinish: Props['onFinish']; onSalir: () => void }) {
  const sesion = useSesion(pacienteId, 'ruleta-sonido', 'fonologica')
  const [ronda, setRonda] = useState(0)
  const [giro, setGiro] = useState(0)
  const [destino, setDestino] = useState<number | null>(null)
  const [estado, setEstado] = useState<'listo' | 'girando' | 'jugando'>('listo')
  const [refuerzo, setRefuerzo] = useState(false)
  const tablero = useTablero()
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const sonido = destino !== null ? SONIDOS_INICIO[destino] : null
  const consigna = (f: Fonema) => hablarSecuencia(['Busca los que empiezan por', vozSonido(f)], 800)

  function girar() {
    const d = Math.floor(Math.random() * SONIDOS_INICIO.length)
    const f = SONIDOS_INICIO[d]
    setDestino(d)
    setGiro((g) => g + 1)
    setEstado('girando')
    const correctas = barajar(VOCABULARIO.filter((p) => tieneEn(p, f, 'principio'))).slice(0, 3)
    tablero.preparar(correctas, barajar(sinSonido(f)).slice(0, 9 - correctas.length))
    timer.current = window.setTimeout(() => { setEstado('jugando'); consigna(f) }, sinMovimiento() ? 200 : ajustes.duracion * 1000 + 150)
  }

  function tocar(i: number) {
    const c = tablero.cartas[i]
    if (!c || c.estado === 'ok' || !sonido) return
    hablarLento(decirPalabra(c.palabra.texto), { dedupe: false })
    if (!c.correcta) {
      tablero.errores.current += 1
      tablero.setCartas((cs) => cs.map((x, j) => (j === i ? { ...x, estado: 'mal' } : x)))
      window.setTimeout(() => tablero.setCartas((cs) => cs.map((x, j) => (j === i && x.estado === 'mal' ? { ...x, estado: 'libre' } : x))), 500)
      return
    }
    const nuevas = tablero.cartas.map((x, j) => (j === i ? { ...x, estado: 'ok' as const } : x))
    tablero.setCartas(nuevas)
    if (nuevas.every((x) => !x.correcta || x.estado === 'ok')) terminarRonda()
  }

  function terminarRonda() {
    sesion.registrar({
      acierto: tablero.errores.current === 0,
      intentos: Math.min(tablero.errores.current + 1, 3),
      ayudaUsada: tablero.ayudas.current > 0,
      tiempoMs: Date.now() - tablero.inicio.current,
      dificultad: 1,
      itemSeleccionadoId: sonido ?? undefined,
    })
    setRefuerzo(true)
    timer.current = window.setTimeout(() => {
      setRefuerzo(false)
      const siguiente = ronda + 1
      if (siguiente >= RONDAS) { onFinish(sesion.finalizar()); return }
      setRonda(siguiente)
      setEstado('listo')
    }, 1300)
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="ruleta-sonido" itemActual={sonido ?? 'sin girar'} />
      <Refuerzo visible={refuerzo} mensaje="¡Los has encontrado!" personaje={ronda % 2 ? 'rana' : 'pato'} />
      <Cabecera titulo="Ruleta del sonido" ronda={ronda} onSalir={() => { sesion.abandonar(RONDAS); onSalir() }} />
      <main className="max-w-3xl mx-auto px-4 pb-10 text-center">
        <div className="flex justify-center items-center gap-6">
          <Rueda titulo="Sonido" segmentos={SONIDOS_INICIO.map(letraDe)} destino={destino} giro={giro}
            duracion={ajustes.duracion} vueltas={ajustes.vueltas} />
          {estado === 'jugando' && sonido && ARTICULEMA[sonido] && (
            <img src={`/articulemas/articulema-${ARTICULEMA[sonido]}.png`} alt="" width={140} height={140}
              className="crayon" style={{ background: 'var(--papel)' }}
              // Los articulemas se están dibujando: si aún no está el de este sonido, no se enseña roto.
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          )}
        </div>
        {estado === 'jugando' && sonido && (
          <>
            <p className="mano mt-4 text-2xl">
              Busca los que empiezan por <b>{letraDe(sonido)}</b>
              <button onClick={() => { tablero.ayudas.current += 1; consigna(sonido) }}
                className="crayon ml-2 px-2 py-0.5 text-xl align-middle" style={{ background: 'var(--papel-2)' }}>🔊</button>
            </p>
            <Tablero cartas={tablero.cartas} onTocar={tocar} />
          </>
        )}
        {estado !== 'jugando' && <BotonGirar onClick={girar} disabled={estado === 'girando'} />}
      </main>
    </div>
  )
}

// ─── 3. ¿Dónde suena? ───────────────────────────────────────────────────────

function RuletaPosicion({ pacienteId, ajustes, onFinish, onSalir }: { pacienteId: string; ajustes: Ajustes; onFinish: Props['onFinish']; onSalir: () => void }) {
  const sesion = useSesion(pacienteId, 'ruleta-posicion', 'fonologica')
  const sonidos = useMemo(() => [...new Set(COMBINACIONES_POSICION.map((c) => c.fonema))], [])
  const [ronda, setRonda] = useState(0)
  const [giro, setGiro] = useState(0)
  const [destinos, setDestinos] = useState<[number, number] | null>(null)
  const [estado, setEstado] = useState<'listo' | 'girando' | 'jugando'>('listo')
  const [refuerzo, setRefuerzo] = useState(false)
  const tablero = useTablero()
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const sonido = destinos ? sonidos[destinos[0]] : null
  const posicion: Posicion | null = destinos ? POSICIONES[destinos[1]] : null
  const consigna = (f: Fonema, p: Posicion) => hablarSecuencia(['Busca palabras con', vozSonido(f), TEXTO_POSICION[p]], 800)

  function girar() {
    // Solo se para en combinaciones que tienen palabras de verdad en el vocabulario.
    const combo = COMBINACIONES_POSICION[Math.floor(Math.random() * COMBINACIONES_POSICION.length)]
    const d: [number, number] = [sonidos.indexOf(combo.fonema), POSICIONES.indexOf(combo.posicion)]
    setDestinos(d)
    setGiro((g) => g + 1)
    setEstado('girando')
    const correctas = barajar(VOCABULARIO.filter((p) => tieneEn(p, combo.fonema, combo.posicion))).slice(0, 3)
    tablero.preparar(correctas, barajar(sinSonido(combo.fonema)).slice(0, 6 - correctas.length))
    timer.current = window.setTimeout(() => { setEstado('jugando'); consigna(combo.fonema, combo.posicion) }, sinMovimiento() ? 200 : ajustes.duracion * 1000 + 150)
  }

  function tocar(i: number) {
    const c = tablero.cartas[i]
    if (!c || c.estado === 'ok' || !sonido) return
    hablarLento(decirPalabra(c.palabra.texto), { dedupe: false })
    if (!c.correcta) {
      tablero.errores.current += 1
      tablero.setCartas((cs) => cs.map((x, j) => (j === i ? { ...x, estado: 'mal' } : x)))
      window.setTimeout(() => tablero.setCartas((cs) => cs.map((x, j) => (j === i && x.estado === 'mal' ? { ...x, estado: 'libre' } : x))), 500)
      return
    }
    const nuevas = tablero.cartas.map((x, j) => (j === i ? { ...x, estado: 'ok' as const } : x))
    tablero.setCartas(nuevas)
    if (nuevas.every((x) => !x.correcta || x.estado === 'ok')) {
      sesion.registrar({
        acierto: tablero.errores.current === 0,
        intentos: Math.min(tablero.errores.current + 1, 3),
        ayudaUsada: tablero.ayudas.current > 0,
        tiempoMs: Date.now() - tablero.inicio.current,
        // En medio es lo más difícil de oír: el sonido queda escondido entre otros.
        dificultad: posicion === 'principio' ? 1 : posicion === 'final' ? 2 : 3,
        itemSeleccionadoId: `${sonido}-${posicion}`,
      })
      setRefuerzo(true)
      timer.current = window.setTimeout(() => {
        setRefuerzo(false)
        const siguiente = ronda + 1
        if (siguiente >= RONDAS) { onFinish(sesion.finalizar()); return }
        setRonda(siguiente)
        setEstado('listo')
      }, 1300)
    }
  }

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="ruleta-posicion" itemActual={sonido && posicion ? `${sonido}-${posicion}` : 'sin girar'} />
      <Refuerzo visible={refuerzo} mensaje="¡Muy bien!" personaje={ronda % 2 ? 'pato' : 'rana'} />
      <Cabecera titulo="¿Dónde suena?" ronda={ronda} onSalir={() => { sesion.abandonar(RONDAS); onSalir() }} />
      <main className="max-w-3xl mx-auto px-4 pb-10 text-center">
        <div className="flex justify-center gap-4 sm:gap-10">
          <Rueda titulo="Sonido" segmentos={sonidos.map(letraDe)} destino={destinos?.[0] ?? null} giro={giro}
            duracion={ajustes.duracion} vueltas={ajustes.vueltas} />
          <Rueda titulo="¿Dónde?" segmentos={['Principio', 'Medio', 'Final']} destino={destinos?.[1] ?? null} giro={giro}
            duracion={ajustes.duracion} vueltas={ajustes.vueltas + 1} />
        </div>
        {estado === 'jugando' && sonido && posicion && (
          <>
            <p className="mano mt-4 text-2xl">
              Busca palabras con <b>{letraDe(sonido)}</b> {TEXTO_POSICION[posicion]}
              <button onClick={() => { tablero.ayudas.current += 1; consigna(sonido, posicion) }}
                className="crayon ml-2 px-2 py-0.5 text-xl align-middle" style={{ background: 'var(--papel-2)' }}>🔊</button>
            </p>
            {/* Tres casillas: la marcada es donde tiene que sonar. */}
            <div className="mt-3 flex justify-center gap-2" aria-hidden>
              {POSICIONES.map((p) => (
                <span key={p} className="crayon w-12 h-10" style={{ background: p === posicion ? 'var(--cera-mostaza)' : 'var(--papel-2)' }} />
              ))}
            </div>
            <Tablero cartas={tablero.cartas} onTocar={tocar} />
          </>
        )}
        {estado !== 'jugando' && <BotonGirar onClick={girar} disabled={estado === 'girando'} />}
      </main>
    </div>
  )
}

// ─── Menú y panel del profesional ───────────────────────────────────────────

export default function Ruletas({ pacienteId, onFinish, onSalir }: Props) {
  const [juego, setJuego] = useState<Juego | null>(null)
  const [ajustes, setAjustes] = useState<Ajustes>(leerAjustes)
  const [panel, setPanel] = useState(false)

  function cambiar<K extends keyof Ajustes>(k: K, v: Ajustes[K]) {
    const nuevos = { ...ajustes, [k]: v }
    setAjustes(nuevos)
    try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(nuevos)) } catch { /* sin espacio */ }
  }

  const volver = () => setJuego(null)
  if (juego === 'silabas') return <RuletaSilabas pacienteId={pacienteId} ajustes={ajustes} onFinish={onFinish} onSalir={volver} />
  if (juego === 'sonido') return <RuletaSonido pacienteId={pacienteId} ajustes={ajustes} onFinish={onFinish} onSalir={volver} />
  if (juego === 'posicion') return <RuletaPosicion pacienteId={pacienteId} ajustes={ajustes} onFinish={onFinish} onSalir={volver} />

  const tarjetas: { id: Juego; emoji: string; titulo: string; texto: string; color: string }[] = [
    { id: 'silabas', emoji: '🎡', titulo: 'Ruleta de sílabas', texto: 'Gira consonante y vocal, y di la sílaba. El adulto valora.', color: 'var(--cera-coral)' },
    { id: 'sonido', emoji: '🔊', titulo: 'Ruleta del sonido', texto: 'Gira un sonido y busca los dibujos que empiezan por él.', color: 'var(--cera-azul)' },
    { id: 'posicion', emoji: '📍', titulo: '¿Dónde suena?', texto: 'Gira sonido y lugar: al principio, en medio o al final.', color: 'var(--cera-verde)' },
  ]

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <FeedbackBtn actividad="ruletas" itemActual="menu" />
      <header className="flex items-center gap-3 p-4 pr-36 sm:pr-4">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg">Ruletas</span>
        <span className="mano text-xs px-2 py-0.5 rounded-full text-white font-black" style={{ background: 'var(--cera-coral)' }}>BORRADOR</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        <h1 className="mano text-3xl text-center">🎯 Ruletas de sonidos</h1>
        <p className="mano text-center text-base mt-1" style={{ opacity: 0.75 }}>
          Cada partida son {RONDAS} giros: entre cinco y diez minutos.
        </p>

        <div className="mt-6 space-y-4">
          {tarjetas.map((t) => (
            <button key={t.id} onClick={() => setJuego(t.id)}
              className="crayon w-full text-left p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 active:scale-95"
              style={{ background: t.color, color: 'var(--tinta)' }}>
              <span className="text-5xl flex-shrink-0">{t.emoji}</span>
              <span>
                <span className="mano text-2xl font-black block leading-tight">{t.titulo}</span>
                <span className="mano text-base block">{t.texto}</span>
              </span>
            </button>
          ))}
        </div>

        <button onClick={() => setPanel((p) => !p)} className="crayon mano mt-8 w-full py-2 text-lg" style={{ background: 'var(--papel-2)' }}>
          ⚙️ Panel del profesional {panel ? '▲' : '▼'}
        </button>
        {panel && (
          <div className="crayon mt-3 p-4 space-y-4" style={{ background: 'var(--papel-2)' }}>
            <label className="block mano">
              <span className="block font-bold">Tipo de sílaba</span>
              <select value={ajustes.tipoSilaba} onChange={(e) => cambiar('tipoSilaba', e.target.value as TipoSilaba)}
                className="crayon mt-1 w-full px-3 py-2" style={{ background: 'var(--papel)' }}>
                <option value="directa">Directas (MA, PE, SO)</option>
                <option value="inversa">Inversas (AL, EN, OS)</option>
                <option value="trabada">Trabadas (PLA, TRE, BRO)</option>
              </select>
            </label>
            <label className="block mano">
              <span className="block font-bold">Cómo se presenta la sílaba</span>
              <select value={ajustes.modoSilaba} onChange={(e) => cambiar('modoSilaba', e.target.value as ModoSilaba)}
                className="crayon mt-1 w-full px-3 py-2" style={{ background: 'var(--papel)' }}>
                <option value="oir">Solo oír (sin letras, para quien aún no lee)</option>
                <option value="mixto">Ver y oír</option>
                <option value="leer">Solo leer (el modelo suena después de valorar)</option>
              </select>
            </label>
            <label className="block mano">
              <span className="block font-bold">Duración del giro: {ajustes.duracion} s</span>
              <input type="range" min={1} max={6} step={1} value={ajustes.duracion}
                onChange={(e) => cambiar('duracion', Number(e.target.value))} className="w-full" />
            </label>
            <label className="block mano">
              <span className="block font-bold">Vueltas mínimas: {ajustes.vueltas}</span>
              <input type="range" min={1} max={8} step={1} value={ajustes.vueltas}
                onChange={(e) => cambiar('vueltas', Number(e.target.value))} className="w-full" />
            </label>
            <p className="mano text-sm" style={{ opacity: 0.7 }}>
              La ruleta de sílabas la valora el adulto: FonoMundos no escucha al niño.
              Las otras dos se corrigen solas. Todo se guarda en la ficha del paciente.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
