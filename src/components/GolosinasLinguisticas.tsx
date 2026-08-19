import { useState, useRef } from 'react'
import type { Sesion, ResultadoRonda } from '../types'
import { PALABRAS, barajar } from '../data/palabras'
import FeedbackBtn from './FeedbackBtn'
import PorQueAsi from './PorQueAsi'

interface Props {
  pacienteId: string
  onFinish: (s: Sesion) => void
  onSalir: () => void
}

type Fase = 'maquina' | 'letras' | 'silabas' | 'rima' | 'frase' | 'fin'

const PALABRAS_POR_SESION = 5
const ABECEDARIO = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','ñ','o','p','q','r','s','t','u','v','w','x','y','z']
const VOCALES = new Set(['a','e','i','o','u'])

function norm(l: string): string {
  return l.toLowerCase()
    .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
    .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ü/g,'u')
}

function letrasEnPalabra(texto: string): string[] {
  return [...new Set([...texto.toLowerCase()].map(norm).filter(l => /[a-zñ]/.test(l)))]
}

// Mapa de rimas fijo: correcto rima claramente, dis[] no riman
const RHYME_MAP: Record<string, { correcto: string; dis: [string, string] }> = {
  sol:       { correcto: 'caracol',   dis: ['pato',  'casa']    },
  pez:       { correcto: 'diez',      dis: ['luna',  'gato']    },
  pan:       { correcto: 'plan',      dis: ['nube',  'rosa']    },
  mar:       { correcto: 'collar',    dis: ['vela',  'gato']    },
  oso:       { correcto: 'goloso',    dis: ['luna',  'pan']     },
  uva:       { correcto: 'tuba',      dis: ['perro', 'sol']     },
  flor:      { correcto: 'color',     dis: ['silla', 'luna']    },
  casa:      { correcto: 'masa',      dis: ['perro', 'sol']     },
  pato:      { correcto: 'rato',      dis: ['luna',  'nube']    },
  silla:     { correcto: 'tortilla',  dis: ['pan',   'mar']     },
  luna:      { correcto: 'cuna',      dis: ['pato',  'sol']     },
  gato:      { correcto: 'plato',     dis: ['luna',  'flor']    },
  perro:     { correcto: 'cerro',     dis: ['casa',  'uva']     },
  queso:     { correcto: 'beso',      dis: ['mar',   'flor']    },
  rosa:      { correcto: 'cosa',      dis: ['perro', 'sol']     },
  dedo:      { correcto: 'miedo',     dis: ['casa',  'luna']    },
  nube:      { correcto: 'sube',      dis: ['pato',  'mar']     },
  foca:      { correcto: 'boca',      dis: ['luna',  'perro']   },
  sapo:      { correcto: 'trapo',     dis: ['nube',  'sol']     },
  vela:      { correcto: 'tela',      dis: ['gato',  'perro']   },
  mano:      { correcto: 'piano',     dis: ['rosa',  'luna']    },
  lobo:      { correcto: 'globo',     dis: ['vela',  'queso']   },
  jirafa:    { correcto: 'garrafa',   dis: ['lobo',  'sol']     },
  tomate:    { correcto: 'chocolate', dis: ['casa',  'perro']   },
  pelota:    { correcto: 'mascota',   dis: ['sol',   'mar']     },
  manzana:   { correcto: 'campana',   dis: ['gato',  'lobo']    },
  plátano:   { correcto: 'rábano',    dis: ['rosa',  'nube']    },
  caballo:   { correcto: 'gallo',     dis: ['mar',   'pato']    },
  elefante:  { correcto: 'gigante',   dis: ['casa',  'luna']    },
  mariposa:  { correcto: 'esposa',    dis: ['sol',   'gato']    },
}

/**
 * Género de las palabras del corpus. Se declara explícitamente (corpus cerrado)
 * porque la terminación engaña: "mano" es femenina y "plátano" masculina.
 * Reportado por la comunidad: la frase salía como "Veo un pelota aquí".
 */
const FEMENINAS = new Set([
  'luna', 'rosa', 'nube', 'foca', 'vela', 'mano', 'jirafa',
  'pelota', 'manzana', 'mariposa', 'uva', 'casa', 'silla', 'flor',
])

const esFem = (w: string) => FEMENINAS.has(w.toLocaleLowerCase('es-ES'))
const un = (w: string) => (esFem(w) ? 'una' : 'un')
const el = (w: string) => (esFem(w) ? 'la' : 'el')
const El = (w: string) => (esFem(w) ? 'La' : 'El')
const bonito = (w: string) => (esFem(w) ? 'bonita' : 'bonito')

const FRASES_TPL: ((w: string) => { txt: string; n: number })[] = [
  (w) => ({ txt: `Veo ${un(w)} ${w} aquí`, n: 4 }),
  (w) => ({ txt: `Tengo ${un(w)} ${w}`, n: 3 }),
  (w) => ({ txt: `Me gusta ${el(w)} ${w}`, n: 4 }),
  (w) => ({ txt: `Hay ${un(w)} ${w} ahí`, n: 4 }),
  (w) => ({ txt: `${El(w)} ${w} es ${bonito(w)}`, n: 4 }),
]

export default function GolosinasLinguisticas({ pacienteId, onFinish, onSalir }: Props) {
  const inicio = useRef(Date.now())
  const [palabras] = useState(() => barajar(PALABRAS).slice(0, PALABRAS_POR_SESION))
  const [idx, setIdx] = useState(0)
  const [fase, setFase] = useState<Fase>('maquina')
  const [resultados, setResultados] = useState<ResultadoRonda[]>([])
  const [girada, setGirada] = useState(false)

  // letras
  const [letrasTocadas, setLetrasTocadas] = useState<Set<string>>(new Set())
  const [sacudida, setSacudida] = useState<string | null>(null)

  // silabas
  const [tapCount, setTapCount] = useState(0)
  const [silabaFeedback, setSilabaFeedback] = useState<'ok' | 'mal' | null>(null)

  // rima
  const [opcionesRima, setOpcionesRima] = useState<{ label: string; correcto: boolean }[]>([])
  const [rimaFeedback, setRimaFeedback] = useState<boolean | null>(null)

  // frase
  const [frase, setFrase] = useState<{ txt: string; n: number } | null>(null)
  const [fraseTaps, setFraseTaps] = useState(0)
  const [fraseFeedback, setFraseFeedback] = useState<boolean | null>(null)

  const palabra = palabras[idx]
  const letrasCorrectas = letrasEnPalabra(palabra.texto)
  const letrasEncontradas = letrasCorrectas.filter(l => letrasTocadas.has(l))
  const letrasCompleto = letrasEncontradas.length === letrasCorrectas.length

  function registrar(dominio: 'fonologica' | 'silabica' | 'lexica', acierto: boolean) {
    setResultados(prev => [...prev, {
      actividadId: 'golosinas-linguisticas', dominio, acierto,
      intentos: 1, ayudaUsada: false,
      tiempoMs: Date.now() - inicio.current, dificultad: 2, ts: Date.now(),
    }])
  }

  function tocarLetra(letra: string) {
    const n = norm(letra)
    if (letrasTocadas.has(n)) return
    if (letrasCorrectas.includes(n)) {
      setLetrasTocadas(prev => new Set([...prev, n]))
    } else {
      setSacudida(n)
      setTimeout(() => setSacudida(null), 400)
    }
  }

  function iniciarRima() {
    const rhyme = RHYME_MAP[palabra.texto]
    if (!rhyme) { abrirFrase(); return }
    setOpcionesRima(barajar([
      { label: rhyme.correcto, correcto: true },
      { label: rhyme.dis[0], correcto: false },
      { label: rhyme.dis[1], correcto: false },
    ]))
    setRimaFeedback(null)
    setFase('rima')
  }

  function abrirFrase() {
    const f = FRASES_TPL[idx % FRASES_TPL.length](palabra.texto)
    setFrase(f)
    setFraseTaps(0)
    setFraseFeedback(null)
    setFase('frase')
  }

  function siguientePalabra() {
    const next = idx + 1
    if (next >= palabras.length) {
      setFase('fin')
    } else {
      setIdx(next)
      setFase('maquina')
      setGirada(false)
      setLetrasTocadas(new Set())
      setSacudida(null)
      setTapCount(0)
      setSilabaFeedback(null)
      setOpcionesRima([])
      setRimaFeedback(null)
      setFrase(null)
      setFraseTaps(0)
      setFraseFeedback(null)
    }
  }

  function terminar() {
    onFinish({ id: `golosinas-${Date.now()}`, pacienteId, inicio: inicio.current, fin: Date.now(), resultados })
  }

  const BtnSig = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      className="crayon mano"
      style={{ marginTop: 12, fontSize: 17, padding: '10px 28px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 8, boxShadow: '0 3px 0 #2e7d32', cursor: 'pointer' }}
      onClick={onClick}
    >{label}</button>
  )

  const Header = ({ etiqueta }: { etiqueta: string }) => (
    <header className="w-full flex items-center gap-3 p-4 md:px-8">
      <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background:'var(--papel-2)' }}>← Salir</button>
      <span className="mano text-lg md:text-2xl">{palabra.emoji} {palabra.texto}</span>
      <span className="ml-auto mano text-sm md:text-base opacity-60">{etiqueta}</span>
    </header>
  )

  // Tarjeta grande del estímulo (emoji + palabra), columna izquierda en desktop
  const CartaEstimulo = ({ mostrarTexto = true }: { mostrarTexto?: boolean }) => (
    <div className="tilt-1" style={{ background:'#fff8f0', border:'4px solid #ffcc80', borderRadius:20, padding:'28px 36px', textAlign:'center', boxShadow:'5px 7px 0 #ffb74d' }}>
      <div style={{ fontSize:'clamp(72px, 13vw, 180px)', lineHeight:1 }}>{palabra.emoji}</div>
      {mostrarTexto && <div className="mano" style={{ fontSize:'clamp(28px, 5vw, 52px)', fontWeight:'bold', marginTop:12 }}>{palabra.texto}</div>}
    </div>
  )

  // ── FASE: MÁQUINA ───────────────────────────────────────────────
  if (fase === 'maquina') return (
    <div className="papel min-h-full flex flex-col items-center" style={{ background: 'var(--papel)' }}>
      <FeedbackBtn actividad="golosinas-linguisticas" itemActual="maquina" />
      <header className="w-full flex items-center gap-3 p-4 md:px-8">
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>← Salir</button>
        <span className="mano text-lg md:text-2xl">Golosinas Lingüísticas</span>
        <span className="ml-auto mano text-sm md:text-base opacity-60">{idx + 1} / {palabras.length}</span>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center gap-8 py-8 px-4 md:px-10">
        <div className="flex flex-col items-center gap-3">
          <p className="mano text-base md:text-xl opacity-70 text-center">Gira la máquina para sacar tu golosina lingüística</p>
          <PorQueAsi
            pedido="Las rimas fallaban: a veces se marcaba como correcta una palabra que no rimaba."
            decision="Cada palabra tiene su rima verificada a mano y dos distractores que no riman, en vez de calcularlas al vuelo desde un banco pequeño."
            alternativa="No dejamos la rima automática porque con pocas palabras no siempre hay pareja real y acababa engañando; la rima es el núcleo de la tarea y no puede fallar."
          />
        </div>
        <style>{`
          @keyframes maquinaBounce { 0%{transform:scale(1)} 30%{transform:scale(0.93) rotate(-2deg)} 60%{transform:scale(1.04) rotate(1deg)} 100%{transform:scale(1) rotate(0deg)} }
          @keyframes slideDown { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
          @keyframes sacudir { 0%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} 100%{transform:translateX(0)} }
        `}</style>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center place-items-center">
          <svg viewBox="0 0 680 520" style={{ width:'100%', maxWidth:360, cursor: girada?'default':'pointer', animation: girada?'maquinaBounce 0.45s ease-out':'none', userSelect:'none' }} onClick={() => !girada && setGirada(true)}>
            <defs>
              <clipPath id="gc"><circle cx="340" cy="165" r="116"/></clipPath>
              <linearGradient id="gg" x1="0.2" y1="0.05" x2="0.85" y2="1">
                <stop offset="0%" stopColor="#e8fafb"/>
                <stop offset="100%" stopColor="#7dd8e8"/>
              </linearGradient>
            </defs>
            <rect x="329" y="40" width="22" height="20" rx="4" fill="#00796b"/>
            <circle cx="340" cy="38" r="9" fill="#004d40"/>
            <circle cx="340" cy="165" r="118" fill="url(#gg)"/>
            <g clipPath="url(#gc)">
              <circle cx="324" cy="270" r="13" fill="#ef9a9a"/><circle cx="351" cy="268" r="14" fill="#4dd0e1"/>
              <circle cx="301" cy="246" r="17" fill="#f48fb1"/><circle cx="337" cy="250" r="18" fill="#4dd0e1"/><circle cx="373" cy="246" r="17" fill="#ef9a9a"/>
              <circle cx="274" cy="207" r="16" fill="#4fc3f7"/><circle cx="312" cy="202" r="18" fill="#ef9a9a"/><circle cx="350" cy="200" r="19" fill="#26c6da"/><circle cx="388" cy="202" r="18" fill="#f48fb1"/><circle cx="418" cy="207" r="15" fill="#80deea"/>
              <circle cx="305" cy="163" r="16" fill="#f48fb1"/><circle cx="342" cy="156" r="18" fill="#4dd0e1"/><circle cx="379" cy="163" r="16" fill="#ef9a9a"/>
              <circle cx="320" cy="120" r="14" fill="#ef9a9a"/><circle cx="356" cy="116" r="14" fill="#4fc3f7"/>
              <circle cx="318" cy="241" r="4" fill="white" opacity="0.45"/><circle cx="330" cy="244" r="5" fill="white" opacity="0.45"/><circle cx="366" cy="240" r="4" fill="white" opacity="0.45"/>
              <circle cx="268" cy="200" r="4" fill="white" opacity="0.45"/><circle cx="306" cy="195" r="5" fill="white" opacity="0.45"/><circle cx="343" cy="193" r="5" fill="white" opacity="0.45"/><circle cx="381" cy="195" r="5" fill="white" opacity="0.45"/>
              <circle cx="298" cy="156" r="4" fill="white" opacity="0.45"/><circle cx="335" cy="148" r="5" fill="white" opacity="0.45"/><circle cx="373" cy="156" r="4" fill="white" opacity="0.45"/>
            </g>
            <circle cx="340" cy="165" r="118" fill="none" stroke="#0097a7" strokeWidth="4"/>
            <ellipse cx="290" cy="112" rx="26" ry="16" fill="white" opacity="0.3"/>
            <rect x="318" y="279" width="44" height="28" rx="4" fill="#00796b" stroke="#004d40" strokeWidth="2"/>
            <rect x="308" y="303" width="64" height="9" rx="4" fill="#00695c"/>
            <rect x="232" y="308" width="216" height="138" rx="16" fill="#4db6ac" stroke="#00796b" strokeWidth="3"/>
            <rect x="250" y="323" width="180" height="106" rx="10" fill="#45a49a" stroke="#00695c" strokeWidth="1.5"/>
            <text x="340" y="365" textAnchor="middle" fontFamily="cursive" fontSize="26" fontWeight="700" fill="#e91e63">golosinas</text>
            <text x="340" y="393" textAnchor="middle" fontFamily="sans-serif" fontSize="17" fontWeight="700" fill="#004d40">lingüísticas</text>
            <rect x="300" y="410" width="80" height="20" rx="6" fill="#00695c" stroke="#004d40" strokeWidth="2"/>
            <rect x="308" y="415" width="64" height="10" rx="3" fill="#004d40"/>
            <rect x="231" y="338" width="7" height="48" rx="3" fill="#00695c"/>
            <rect x="442" y="338" width="7" height="48" rx="3" fill="#00695c"/>
            <line x1="448" y1="358" x2="474" y2="358" stroke="#455a64" strokeWidth="8" strokeLinecap="round" style={{ transformOrigin:'448px 358px', transform: girada?'rotate(25deg)':'rotate(0deg)', transition:'transform 0.3s' }}/>
            <circle cx="478" cy="358" r="12" fill="#ff7043" stroke="#bf360c" strokeWidth="2.5" style={{ transformOrigin:'448px 358px', transform: girada?'rotate(25deg)':'rotate(0deg)', transition:'transform 0.3s' }}/>
            <circle cx="474" cy="354" r="4" fill="white" opacity="0.4"/>
            <rect x="250" y="443" width="180" height="7" rx="3" fill="#00695c"/>
            <rect x="268" y="448" width="144" height="24" rx="12" fill="#00897b" stroke="#00695c" strokeWidth="2"/>
            <rect x="288" y="469" width="104" height="13" rx="6" fill="#00695c"/>
            <circle cx="340" cy="450" r="11" fill="#f48fb1" stroke="#e91e63" strokeWidth="1.5"/>
            <circle cx="335" cy="445" r="3.5" fill="white" opacity="0.45"/>
          </svg>

          <div className="flex flex-col items-center gap-6 w-full">
            {girada && (
              <div className="tilt-2" style={{ background:'#fff8f0', border:'4px solid #ffcc80', borderRadius:20, padding:'28px 40px', textAlign:'center', boxShadow:'5px 7px 0 #ffb74d', animation:'slideDown 0.4s ease-out' }}>
                <div style={{ fontSize:'clamp(72px, 12vw, 150px)', lineHeight:1 }}>{palabra.emoji}</div>
                <div className="mano" style={{ fontSize:'clamp(28px, 5vw, 48px)', fontWeight:'bold', marginTop:10 }}>{palabra.texto}</div>
              </div>
            )}
            {girada
              ? <button className="crayon mano" style={{ fontSize:20, padding:'14px 40px', background:'#ff7043', color:'white', border:'none', borderRadius:12, boxShadow:'0 4px 0 #e64a19', cursor:'pointer' }} onClick={() => { setLetrasTocadas(new Set()); setFase('letras') }}>¡Empezar! 🎯</button>
              : <button className="crayon mano" style={{ fontSize:22, padding:'18px 48px', background:'#4caf50', color:'white', border:'none', borderRadius:14, boxShadow:'0 5px 0 #2e7d32', cursor:'pointer' }} onClick={() => setGirada(true)}>🎰 Girar la máquina</button>
            }
          </div>
        </div>
      </main>
    </div>
  )

  // ── FASE: LETRAS ────────────────────────────────────────────────
  if (fase === 'letras') return (
    <div className="papel min-h-full flex flex-col items-center" style={{ background:'var(--papel)' }}>
      <FeedbackBtn actividad="golosinas-linguisticas" itemActual={fase} />
      <Header etiqueta="1/4 · Letras" />
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-center gap-6 py-6 px-4 md:px-10">
        <div className="text-center">
          <p className="mano text-2xl md:text-3xl font-bold">¿Qué letras tiene?</p>
          <p className="mano text-sm md:text-lg opacity-60 mt-1">Toca las letras que aparecen en la palabra</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
          {/* Columna izquierda: estímulo + puzzle */}
          <div className="flex flex-col items-center gap-4">
            <CartaEstimulo />
            <p className="mano text-base md:text-xl" style={{ color: letrasCompleto ? '#43a047' : 'inherit' }}>
              {letrasEncontradas.length} / {letrasCorrectas.length} letras encontradas
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {letrasCorrectas.map(l => (
                <div key={l} style={{ width:58, height:58, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:'bold', background: letrasTocadas.has(l)?'#43a047':'#e0e0e0', color: letrasTocadas.has(l)?'white':'#757575', transition:'background 0.2s', border:`2px solid ${letrasTocadas.has(l)?'#2e7d32':'#bdbdbd'}` }}>
                  {letrasTocadas.has(l) ? l : '?'}
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: abecedario */}
          <div className="flex flex-col items-center gap-5">
            {/* Teclas grandes: la comunidad pidió que el teclado fuera "mucho
                más grande". 5 columnas en móvil para que quepan teclas gordas. */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2.5 md:gap-3 w-full" style={{ maxWidth:620 }}>
              {ABECEDARIO.map(l => {
                const n = norm(l)
                const encontrada = letrasTocadas.has(n)
                const esVocal = VOCALES.has(n)
                const isSacudida = sacudida === n
                return (
                  <button
                    key={l}
                    onClick={() => tocarLetra(l)}
                    disabled={encontrada}
                    className="flex items-center justify-center rounded-full font-bold aspect-square"
                    style={{
                      width:'100%', minWidth:52, fontSize:'clamp(20px,5vw,30px)', fontFamily:'inherit', cursor: encontrada?'default':'pointer',
                      border: encontrada ? '2px solid #43a047' : isSacudida ? '2px solid #f44336' : `2px solid ${esVocal?'#e91e63':'#1976d2'}`,
                      background: encontrada ? '#e8f5e9' : isSacudida ? '#ffebee' : esVocal ? '#fce4ec' : '#e3f2fd',
                      color: encontrada ? '#43a047' : isSacudida ? '#f44336' : esVocal ? '#e91e63' : '#1565c0',
                      animation: isSacudida ? 'sacudir 0.35s' : 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    {encontrada ? '✓' : l}
                  </button>
                )
              })}
            </div>
            <p className="mano text-xs md:text-sm opacity-50 text-center">Rosa = vocales · Azul = consonantes</p>
            {letrasCompleto && (
              <div style={{ background:'#e8f5e9', border:'2px solid #43a047', borderRadius:12, padding:'16px 24px', textAlign:'center', width:'100%', maxWidth:480 }}>
                <div className="mano text-xl md:text-2xl">🎉 ¡Encontraste todas las letras!</div>
                <div className="mano text-sm md:text-base mt-1 opacity-70">
                  Vocales: <b>{letrasCorrectas.filter(l => VOCALES.has(l)).join(', ') || '—'}</b> · Consonantes: <b>{letrasCorrectas.filter(l => !VOCALES.has(l)).join(', ') || '—'}</b>
                </div>
                <BtnSig label="Siguiente →" onClick={() => { setTapCount(0); setSilabaFeedback(null); setFase('silabas') }}/>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  // ── FASE: SÍLABAS ───────────────────────────────────────────────
  if (fase === 'silabas') {
    const correcto = palabra.silabas.length
    return (
      <div className="papel min-h-full flex flex-col items-center" style={{ background:'var(--papel)' }}>
        <FeedbackBtn actividad="golosinas-linguisticas" itemActual={fase} />
        <Header etiqueta="2/4 · Sílabas" />
        <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 py-6 px-4 md:px-10">
          <div className="text-center">
            <p className="mano text-2xl md:text-3xl font-bold">¿Cuántas sílabas tiene?</p>
            <p className="mano text-sm md:text-lg opacity-60 mt-1">Toca el botón una vez por cada sílaba</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center place-items-center">
            <CartaEstimulo />
            <div className="flex flex-col items-center gap-6 w-full">
              <button
                className="mano"
                style={{ fontSize:30, padding:'24px 48px', background: tapCount>0?'#1976d2':'#e3f2fd', color: tapCount>0?'white':'#1565c0', border:'3px solid #1976d2', borderRadius:18, boxShadow:'0 5px 0 #0d47a1', cursor:'pointer', userSelect:'none' }}
                onPointerDown={e => { e.currentTarget.style.transform='scale(0.93)'; setTapCount(n=>n+1) }}
                onPointerUp={e => { e.currentTarget.style.transform='scale(1)' }}
              >
                👏 {tapCount>0 ? `${tapCount} ${tapCount===1?'sílaba':'sílabas'}` : 'Palmada'}
              </button>
              <div style={{ display:'flex', gap:10 }}>
                {Array.from({ length: Math.max(tapCount,4) }, (_,i) => (
                  <div key={i} style={{ width:42, height:42, borderRadius:'50%', background: i<tapCount?'#1976d2':'#e0e0e0', border:'2px solid '+(i<tapCount?'#0d47a1':'#bdbdbd'), transition:'background 0.15s' }}/>
                ))}
              </div>
              {tapCount>0 && !silabaFeedback && (
                <button className="crayon mano" style={{ fontSize:18, padding:'12px 32px', background:'#ff7043', color:'white', border:'none', borderRadius:10, boxShadow:'0 3px 0 #e64a19', cursor:'pointer' }} onClick={() => { const bien=tapCount===correcto; setSilabaFeedback(bien?'ok':'mal'); registrar('silabica',bien) }}>Comprobar ✓</button>
              )}
              {silabaFeedback && (
                <div style={{ background: silabaFeedback==='ok'?'#e8f5e9':'#fff3e0', border:`2px solid ${silabaFeedback==='ok'?'#43a047':'#fb8c00'}`, borderRadius:12, padding:'16px 24px', textAlign:'center' }}>
                  <div className="mano text-xl md:text-2xl">{silabaFeedback==='ok' ? '🎉 ¡Correcto!' : `🤔 Son ${correcto}: ${palabra.silabas.join(' · ')}`}</div>
                  <BtnSig label="Siguiente →" onClick={iniciarRima}/>
                </div>
              )}
              {tapCount>0 && !silabaFeedback && (
                <button onClick={() => setTapCount(0)} className="mano" style={{ fontSize:13, opacity:0.5, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Reiniciar</button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── FASE: RIMA ──────────────────────────────────────────────────
  if (fase === 'rima') return (
    <div className="papel min-h-full flex flex-col items-center" style={{ background:'var(--papel)' }}>
      <FeedbackBtn actividad="golosinas-linguisticas" itemActual={fase} />
      <Header etiqueta="3/4 · Rima" />
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 py-6 px-4 md:px-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
          <div className="flex flex-col items-center gap-5">
            <div className="text-center">
              <p className="mano text-2xl md:text-3xl font-bold">¿Cuál rima con</p>
              <p className="mano font-bold" style={{ color:'#e91e63', fontSize:'clamp(32px,6vw,64px)' }}>{palabra.texto}?</p>
            </div>
            <CartaEstimulo mostrarTexto={false} />
          </div>
          <div className="flex flex-col gap-3 w-full">
            {opcionesRima.map(op => {
              const elegida = rimaFeedback !== null
              const esBien = elegida && op.correcto
              const esOtraEnMal = elegida && !op.correcto && rimaFeedback===false
              return (
                <button key={op.label} disabled={elegida} className="mano"
                  style={{ fontSize:'clamp(20px,3vw,28px)', padding:'18px 24px', background: esBien?'#e8f5e9': esOtraEnMal?'#fafafa':'var(--papel-2)', border:`3px solid ${esBien?'#43a047':esOtraEnMal?'#e0e0e0':'#bdbdbd'}`, borderRadius:14, cursor:elegida?'default':'pointer', boxShadow:elegida?'none':'0 3px 0 #bdbdbd', display:'flex', alignItems:'center', gap:10, color:'var(--tinta)' }}
                  onClick={() => { setRimaFeedback(op.correcto); registrar('fonologica',op.correcto) }}
                >
                  <span>{op.label}</span>
                  {esBien && <span style={{ marginLeft:'auto' }}>✅</span>}
                </button>
              )
            })}
            {rimaFeedback !== null && (
              <div style={{ background: rimaFeedback?'#e8f5e9':'#fff3e0', border:`2px solid ${rimaFeedback?'#43a047':'#fb8c00'}`, borderRadius:12, padding:'14px 20px', textAlign:'center' }}>
                <div className="mano text-xl md:text-2xl">{rimaFeedback ? '🎉 ¡Rima perfecta!' : `La que rima es: ${opcionesRima.find(o=>o.correcto)?.label}`}</div>
                <BtnSig label="Siguiente →" onClick={abrirFrase}/>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  // ── FASE: FRASE ─────────────────────────────────────────────────
  if (fase === 'frase' && frase) {
    const palabrasFrase = frase.txt.split(' ')
    return (
      <div className="papel min-h-full flex flex-col items-center" style={{ background:'var(--papel)' }}>
        <FeedbackBtn actividad="golosinas-linguisticas" itemActual={fase} />
        <Header etiqueta="4/4 · Frase" />
        <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 py-6 px-4 md:px-10">
          <div className="text-center">
            <p className="mano text-2xl md:text-3xl font-bold">¿Cuántas palabras tiene?</p>
            <p className="mano text-sm md:text-lg opacity-60 mt-1">Toca cada palabra para contarla</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="tilt-1" style={{ background:'#fff8f0', border:'4px solid #ffcc80', borderRadius:18, padding:'28px 32px', textAlign:'center', boxShadow:'4px 6px 0 #ffb74d' }}>
              <p className="mano" style={{ fontSize:'clamp(24px,4vw,40px)', lineHeight:2 }}>
                {palabrasFrase.map((w, i) => (
                  <span key={i} onClick={() => !fraseFeedback && setFraseTaps(n=>Math.min(n+1,palabrasFrase.length))} style={{ display:'inline-block', margin:'0 5px', background: i<fraseTaps?'#ffe082':'transparent', borderRadius:4, padding:'0 6px', cursor:fraseFeedback?'default':'pointer', transition:'background 0.15s' }}>{w}</span>
                ))}
              </p>
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                {palabrasFrase.map((_,i) => (
                  <div key={i} style={{ width:48, height:34, background: i<fraseTaps?'#1976d2':'#e0e0e0', borderRadius:7, border:`2px solid ${i<fraseTaps?'#0d47a1':'#bdbdbd'}`, transition:'background 0.15s', position:'relative' }}>
                    <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', width:20, height:9, background: i<fraseTaps?'#1565c0':'#bdbdbd', borderRadius:'3px 3px 0 0' }}/>
                  </div>
                ))}
              </div>
              <p className="mano text-lg md:text-2xl">{fraseTaps>0 ? `${fraseTaps} ${fraseTaps===1?'palabra':'palabras'}` : 'Toca las palabras'}</p>
              {fraseTaps>0 && fraseFeedback===null && (
                <button className="crayon mano" style={{ fontSize:18, padding:'12px 32px', background:'#ff7043', color:'white', border:'none', borderRadius:10, boxShadow:'0 3px 0 #e64a19', cursor:'pointer' }} onClick={() => { const bien=fraseTaps===frase.n; setFraseFeedback(bien); registrar('lexica',bien) }}>Comprobar ✓</button>
              )}
              {fraseFeedback !== null && (
                <div style={{ background: fraseFeedback?'#e8f5e9':'#fff3e0', border:`2px solid ${fraseFeedback?'#43a047':'#fb8c00'}`, borderRadius:12, padding:'14px 20px', textAlign:'center', width:'100%' }}>
                  <div className="mano text-xl md:text-2xl">{fraseFeedback ? '🎉 ¡Correcto!' : `Son ${frase.n} palabras`}</div>
                  <BtnSig label={idx+1<palabras.length ? 'Siguiente golosina →' : '¡Terminar! 🏆'} onClick={siguientePalabra}/>
                </div>
              )}
              {fraseTaps>0 && fraseFeedback===null && (
                <button onClick={() => setFraseTaps(0)} className="mano" style={{ fontSize:13, opacity:0.5, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Reiniciar</button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── FASE: FIN ────────────────────────────────────────────────────
  const total = resultados.length
  const bien = resultados.filter(r => r.acierto).length
  return (
    <div className="papel min-h-full flex flex-col items-center justify-center gap-6 p-6" style={{ background:'var(--papel)' }}>
      <FeedbackBtn actividad="golosinas-linguisticas" itemActual="fin" />
      <div className="text-center">
        <div style={{ fontSize:'clamp(80px,12vw,140px)' }}>🎉</div>
        <h2 className="mano text-3xl md:text-5xl font-bold mt-2">¡Sesión terminada!</h2>
        <p className="mano text-base md:text-xl mt-2 opacity-70">Has trabajado {palabras.length} golosinas lingüísticas</p>
      </div>
      <div style={{ background:'var(--papel-2)', border:'2px solid var(--tinta-2)', borderRadius:16, padding:'24px 40px', textAlign:'center', minWidth:220 }}>
        <div className="mano text-3xl md:text-4xl font-bold">{bien} / {total}</div>
        <div className="mano text-sm md:text-base opacity-60 mt-1">respuestas correctas</div>
      </div>
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
        {palabras.map(p => <div key={p.texto} style={{ fontSize:'clamp(32px,5vw,52px)' }} title={p.texto}>{p.emoji}</div>)}
      </div>
      <div style={{ display:'flex', gap:12 }}>
        <button className="crayon mano" style={{ fontSize:17, padding:'12px 28px', background:'var(--papel-2)', border:'2px solid var(--tinta-2)', borderRadius:10, cursor:'pointer' }} onClick={onSalir}>← Salir</button>
        <button className="crayon mano" style={{ fontSize:17, padding:'12px 28px', background:'#4caf50', color:'white', border:'none', borderRadius:10, boxShadow:'0 3px 0 #2e7d32', cursor:'pointer' }} onClick={terminar}>Guardar sesión ✓</button>
      </div>
    </div>
  )
}
