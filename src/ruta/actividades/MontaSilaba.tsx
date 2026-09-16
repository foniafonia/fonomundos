import { useEffect, useRef, useState } from 'react'
import { barajar } from '../../data/palabras'
import { decirFonema } from '../../lib/pronunciacion'
import { precargar, tieneClip } from '../../lib/vozArchivos'
import { CONSIGNAS, duracionEstimadaMs, duracionGrabadaMs, locutar } from '../locucion'
import {
  CONSONANTES_CONTINUAS, CONSONANTES_OCLUSIVAS, SILABAS_GESTOS, VOCALES, escribirSilaba, gestoDe, type SilabaGestos,
} from '../vocabulario'
import type { PropsBloque } from '../tipos'

/**
 * Monta la sílaba con fonogestos. En pruebas: todavía no está en la Ruta.
 *
 * Juega → se oye una sílaba y se monta tocando la consonante y la vocal.
 * Explora → se juntan libremente y se oye lo que sale. Es el primer paso
 * hacia escribir o decir algo y ver sus fonogestos.
 *
 * Solo suena la voz de José: la sílaba es su consonante y su vocal juntas sin
 * pausa («mmm·o»). Las sílabas del sintetizador confundían «mo» y «mu» y el
 * niño montaba lo que ponía la pantalla, no lo que oía.
 *
 * Por eso solo se juntan las consonantes que se alargan. La p y la b no: «pe»
 * + «a» enseñaría que pe + a = pa. Se ven en Explora, pero su sílaba tiene
 * que estar grabada entera.
 *
 * Todo lo que se toca tiene tamaño fijo: si la pantalla se mueve al elegir,
 * el siguiente toque cae en otra opción.
 *
 * Ayuda: la sílaba suena dos veces y se ven las letras.
 * No guarda nada: mientras esté en pruebas no hay dominio clínico decidido.
 */

const INTENTOS_MAX = 3
const PAUSA_POR_PARTES_MS = 850

const partesDe = (s: Pick<SilabaGestos, 'consonante' | 'vocal'>) => [decirFonema(s.consonante), decirFonema(s.vocal)]
const oirJunta = (s: SilabaGestos) => locutar(partesDe(s), { pausaMs: 0 })
const oirPorPartes = (s: SilabaGestos) => locutar(partesDe(s), { pausaMs: PAUSA_POR_PARTES_MS })
const duraJunta = (s: SilabaGestos) => duracionGrabadaMs(partesDe(s), 0)
const duraPorPartes = (s: SilabaGestos) => duracionGrabadaMs(partesDe(s), PAUSA_POR_PARTES_MS)

/** Solo sílabas cuyos dos sonidos están grabados: sin estímulo no hay tarea. */
const JUGABLES = SILABAS_GESTOS.filter((s) => partesDe(s).every((p) => tieneClip(p)))

/** Orden de sílabas sin repetir ninguna seguida (tampoco al volver a barajar). */
function secuenciaDe(total: number): SilabaGestos[] {
  const out: SilabaGestos[] = []
  while (out.length < total) {
    let tanda = barajar(JUGABLES)
    if (out.length && tanda[0] === out[out.length - 1]) tanda = [...tanda.slice(1), tanda[0]]
    out.push(...tanda)
  }
  return out.slice(0, total)
}

const minuscula = (l: string) => l.toLocaleLowerCase('es-ES')
const seAlarga = (c: string) => CONSONANTES_CONTINUAS.includes(c)

type Modo = 'juega' | 'explora'
type Fase = 'responde' | 'error' | 'bien' | 'mal'
type Marca = 'normal' | 'elegida' | 'bien' | 'mal'

const FONDO: Record<Marca, string> = {
  normal: '#fff',
  elegida: 'var(--cera-azul)',
  bien: 'var(--cera-verde)',
  mal: 'var(--cera-mostaza)',
}

const TAM = {
  hueco: 'w-28 h-28 sm:w-40 sm:h-40',
  opcion: 'w-14 h-14 sm:w-20 sm:h-20',
}

/** Fonogesto o, si ese sonido no tiene (o no carga), la letra. Siempre ocupa lo mismo. */
function ImagenGesto({ letra, tam }: { letra: string; tam: string }) {
  const [sinImagen, setSinImagen] = useState(false)
  const src = gestoDe(letra)
  if (src && !sinImagen) {
    return <img src={src} alt="" onError={() => setSinImagen(true)} draggable={false}
      className={`${tam} object-cover rounded-lg select-none`} />
  }
  return <span className={`${tam} mano flex items-center justify-center text-4xl`}>{minuscula(letra)}</span>
}

/** Hueco de la sílaba: mismo tamaño vacío o lleno, con la letra en un espacio reservado. */
function Hueco({ letra, marca, conLetra }: { letra: string | null; marca: Marca; conLetra: boolean }) {
  return (
    <div className="crayon p-1.5 flex flex-col items-center gap-1"
      style={{ background: letra ? FONDO[marca] : 'var(--papel-2)', borderStyle: letra ? 'solid' : 'dashed' }}>
      {letra ? <ImagenGesto letra={letra} tam={TAM.hueco} />
        : <span className={`${TAM.hueco} mano flex items-center justify-center text-4xl`} style={{ opacity: 0.4 }}>?</span>}
      <span className="mano text-2xl leading-none h-6">{letra && conLetra && gestoDe(letra) ? minuscula(letra) : ''}</span>
    </div>
  )
}

function Fila({ titulo, letras, elegida, onTocar, conLetras, desactivada }: {
  titulo: string
  letras: string[]
  elegida: string | null
  onTocar: (l: string) => void
  conLetras: boolean
  desactivada: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <span className="mano text-sm" style={{ opacity: 0.65 }}>{titulo}</span>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-2xl">
        {letras.map((l) => (
          <button key={l} onClick={() => onTocar(l)} disabled={desactivada}
            aria-label={`Sonido ${minuscula(l)}`}
            className="crayon p-1 sm:p-1.5 flex flex-col items-center gap-1 active:scale-95 transition-transform"
            style={{ background: FONDO[elegida === l ? 'elegida' : 'normal'], opacity: desactivada ? 0.55 : 1 }}>
            <ImagenGesto letra={l} tam={TAM.opcion} />
            <span className="mano text-xl leading-none h-5">{conLetras && gestoDe(l) ? minuscula(l) : ''}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MontaSilaba({ items, nivelAyuda, corte, onFin }: PropsBloque) {
  const [modo, setModo] = useState<Modo>('juega')
  const [letras, setLetras] = useState(nivelAyuda > 0)
  // Juega
  const [secuencia] = useState(() => secuenciaDe(items))
  const [indice, setIndice] = useState(0)
  const [consonante, setConsonante] = useState<string | null>(null)
  const [vocal, setVocal] = useState<string | null>(null)
  const [fase, setFase] = useState<Fase>('responde')
  const [intentos, setIntentos] = useState(1)
  const [temblor, setTemblor] = useState(false)
  // Explora
  const [libreC, setLibreC] = useState<string | null>(null)
  const [libreV, setLibreV] = useState<string | null>(null)

  const silaba = secuencia[indice]
  const cuenta = useRef({ aciertos: 0, total: 0 })
  // Refs y no estado: dos toques seguidos llegan antes de que React repinte, y
  // con el estado del render anterior se comprobaba dos veces.
  const eleccion = useRef<{ c: string | null; v: string | null }>({ c: null, v: null })
  const ocupado = useRef(false)
  const terminado = useRef(false)
  const temporizadores = useRef<number[]>([])

  function programar(fn: () => void, ms: number) {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }
  function limpiar() {
    temporizadores.current.forEach((id) => window.clearTimeout(id))
    temporizadores.current = []
  }
  useEffect(() => limpiar, [])

  // Precarga: la primera vez que suena cada sonido tarda en descargarse y la
  // repetición de la ayuda llegaba antes de que acabara.
  useEffect(() => {
    precargar([...CONSONANTES_CONTINUAS, ...CONSONANTES_OCLUSIVAS, ...VOCALES].map(decirFonema))
  }, [])

  function oirSilaba(conConsigna = false) {
    // La consigna y la sílaba van por separado: la sílaba suena sin pausa
    // interna y la consigna necesita su pausa detrás.
    const espera = conConsigna && tieneClip(CONSIGNAS.montaSilaba) ? duracionEstimadaMs([CONSIGNAS.montaSilaba]) + 600 : 0
    if (espera) locutar([CONSIGNAS.montaSilaba])
    programar(() => oirJunta(silaba), espera)
    // La repetición espera a que acabe la primera: si no, la corta.
    if (nivelAyuda > 0) programar(() => oirJunta(silaba), espera + duraJunta(silaba) + 700)
  }

  // Se engancha al índice, no a la sílaba: si saliera la misma dos veces, con
  // la sílaba como dependencia no volvería a sonar.
  useEffect(() => {
    if (modo !== 'juega' || !silaba) return
    const id = window.setTimeout(() => oirSilaba(indice === 0), 450)
    return () => window.clearTimeout(id)
  }, [indice, modo])

  useEffect(() => {
    if (corte) terminar(true)
  }, [corte])

  function terminar(parcial: boolean) {
    if (terminado.current) return
    terminado.current = true
    limpiar()
    onFin({ ...cuenta.current, parcial, sesionId: null })
  }

  function limpiarEleccion() {
    eleccion.current = { c: null, v: null }
    ocupado.current = false
    setConsonante(null)
    setVocal(null)
  }

  function siguiente() {
    if (terminado.current) return
    if (indice + 1 >= items) {
      terminar(false)
      return
    }
    limpiarEleccion()
    setIntentos(1)
    setFase('responde')
    setIndice(indice + 1)
  }

  function comprobar(c: string, v: string) {
    ocupado.current = true
    if (c === silaba.consonante && v === silaba.vocal) {
      setFase('bien')
      cuenta.current.total += 1
      cuenta.current.aciertos += 1
      oirJunta(silaba)
      programar(() => locutar([CONSIGNAS.muyBien]), duraJunta(silaba) + 250)
      programar(siguiente, duraJunta(silaba) + 1900)
      return
    }
    setTemblor(true)
    programar(() => setTemblor(false), 400)
    if (intentos >= INTENTOS_MAX) {
      setFase('mal')
      setConsonante(silaba.consonante)
      setVocal(silaba.vocal)
      cuenta.current.total += 1
      oirPorPartes(silaba)
      programar(() => oirJunta(silaba), duraPorPartes(silaba) + 600)
      programar(siguiente, duraPorPartes(silaba) + duraJunta(silaba) + 1600)
      return
    }
    setFase('error')
    setIntentos(intentos + 1)
    locutar([CONSIGNAS.otraVez])
    programar(() => {
      limpiarEleccion()
      setFase('responde')
      oirSilaba()
    }, 1300)
  }

  function tocarConsonante(c: string) {
    if (ocupado.current) return
    eleccion.current.c = c
    setConsonante(c)
    if (eleccion.current.v) comprobar(c, eleccion.current.v)
  }

  function tocarVocal(v: string) {
    if (ocupado.current) return
    eleccion.current.v = v
    setVocal(v)
    if (eleccion.current.c) comprobar(eleccion.current.c, v)
  }

  function sonarLibre(c: string | null, v: string | null) {
    if (c && v) {
      if (seAlarga(c)) oirJunta({ consonante: c, vocal: v, texto: escribirSilaba(c, v) })
      return
    }
    const solo = c ?? v
    if (solo) locutar([decirFonema(solo)])
  }

  function explorarConsonante(c: string) {
    setLibreC(c)
    sonarLibre(c, libreV)
  }

  function explorarVocal(v: string) {
    setLibreV(v)
    sonarLibre(libreC, v)
  }

  function cambiarModo(m: Modo) {
    limpiar()
    limpiarEleccion()
    setFase('responde')
    setModo(m)
    if (m === 'explora') setLetras(true)
  }

  const marcaHueco: Marca = fase === 'bien' ? 'bien' : fase === 'mal' ? 'mal' : 'elegida'
  const titulo = { responde: 'Escucha y monta la sílaba', error: 'Inténtalo otra vez', bien: '¡Muy bien!', mal: 'Era así' }[fase]
  const libre: SilabaGestos | null = libreC && libreV ? { consonante: libreC, vocal: libreV, texto: escribirSilaba(libreC, libreV) } : null
  const pista = (() => {
    if (libre && !seAlarga(libre.consonante)) {
      return `«${libre.texto}» todavía no se puede oír: la ${minuscula(libre.consonante)} no se alarga y la sílaba tiene que grabarse entera.`
    }
    if (!libreC && !libreV) return 'Toca una consonante y una vocal.'
    return ''
  })()
  const pestana = (m: Modo, texto: string) => (
    <button onClick={() => cambiarModo(m)} className="crayon mano px-4 py-1.5 text-base"
      style={{ background: modo === m ? 'var(--cera-lila)' : 'var(--papel-2)', color: modo === m ? '#fff' : 'var(--tinta)' }}>
      {texto}
    </button>
  )

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-3xl text-center">
      <div className="flex flex-wrap justify-center items-center gap-2">
        {pestana('juega', '🎯 Juega')}
        {pestana('explora', '🧪 Explora')}
        <button onClick={() => setLetras((l) => !l)} className="crayon mano px-3 py-1.5 text-sm" style={{ background: 'var(--papel-2)' }}>
          Aa letras: {letras ? 'sí' : 'no'}
        </button>
      </div>

      {modo === 'juega' ? (
        <>
          <span className="mano text-lg" style={{ color: 'var(--cera-lila)' }}>🧩 Monta la sílaba · {indice + 1}/{items}</span>
          <h1 className="mano text-3xl sm:text-4xl min-h-10 sm:min-h-12">{titulo}</h1>
          <button onClick={() => oirSilaba()} disabled={fase !== 'responde'}
            className="crayon mano px-5 py-2 text-lg disabled:opacity-40" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
            🔊 Oír la sílaba
          </button>

          <div className={`flex items-center gap-2 sm:gap-3 ${temblor ? 'animate-shake' : ''}`}>
            <Hueco letra={consonante} marca={marcaHueco} conLetra={letras || fase === 'mal'} />
            <span className="mano text-4xl">+</span>
            <Hueco letra={vocal} marca={marcaHueco} conLetra={letras || fase === 'mal'} />
          </div>
          <p className="mano text-4xl h-12">{fase === 'bien' || fase === 'mal' ? `= ${silaba.texto}` : ''}</p>

          <Fila titulo="Consonante" letras={CONSONANTES_CONTINUAS} elegida={consonante} onTocar={tocarConsonante}
            conLetras={letras} desactivada={fase !== 'responde'} />
          <Fila titulo="Vocal" letras={VOCALES} elegida={vocal} onTocar={tocarVocal}
            conLetras={letras} desactivada={fase !== 'responde'} />
          <p className="mano text-sm" style={{ opacity: 0.6 }}>Intento {intentos}/{INTENTOS_MAX}</p>
        </>
      ) : (
        <>
          <h1 className="mano text-3xl sm:text-4xl min-h-10 sm:min-h-12">Junta dos sonidos y escucha</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <Hueco letra={libreC} marca="elegida" conLetra={letras} />
            <span className="mano text-4xl">+</span>
            <Hueco letra={libreV} marca="elegida" conLetra={letras} />
          </div>
          <p className="mano text-4xl h-12">{libre ? `= ${libre.texto}` : ''}</p>
          <div className="flex gap-2 h-12 items-center">
            {libre && seAlarga(libre.consonante) && (
              <>
                <button onClick={() => oirJunta(libre)} className="crayon mano px-4 py-2 text-lg text-white"
                  style={{ background: 'var(--cera-verde)' }}>🔊 Junta</button>
                <button onClick={() => oirPorPartes(libre)} className="crayon mano px-4 py-2 text-lg"
                  style={{ background: 'var(--papel-2)' }}>🔊 Por partes</button>
              </>
            )}
          </div>
          <p className="mano text-sm min-h-10 max-w-md" style={{ opacity: 0.75 }}>{pista}</p>
          <Fila titulo="Consonante" letras={[...CONSONANTES_CONTINUAS, ...CONSONANTES_OCLUSIVAS]} elegida={libreC}
            onTocar={explorarConsonante} conLetras={letras} desactivada={false} />
          <Fila titulo="Vocal" letras={VOCALES} elegida={libreV} onTocar={explorarVocal}
            conLetras={letras} desactivada={false} />
        </>
      )}
    </div>
  )
}
