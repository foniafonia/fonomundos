import type { Paciente } from '../types'
import { ACTIVIDADES } from '../data/actividades'
import { setVoz, vozActivada } from '../lib/voz'
import { modoEvaluacion, setModoEvaluacion } from '../lib/modoEvaluacion'
import { DisclaimerBanner } from '../components/Disclaimer'
import NavBar from '../components/NavBar'
import { supabaseActivo } from '../lib/storageCloud'
import { useState } from 'react'

export type Especial =
  | 'policubos' | 'cadena-fonemica' | 'cadena-silabica' | 'ordenar-frase'
  | 'policubos-silabico' | 'busca-sonido' | 'clasificar-silabas' | 'emparejar-oracion'
  | 'crear-palabras' | 'unir-sonido' | 'unir-silaba' | 'ordenar-imagen'
  | 'detectar-rima' | 'intruso-rima'
  | 'ran' | 'pseudopalabras' | 'manipulacion-medial'

interface Props {
  paciente: Paciente
  onJugar: (actividadId: string) => void
  onEspecial: (e: Especial) => void
  onMundo2: () => void
  onSalir: () => void
}

const ESPECIALES: { id: Especial; emoji: string; titulo: string; desc: string; dom: 'fonologica' | 'silabica' | 'lexica' }[] = [
  { id: 'policubos', emoji: '🧊', titulo: 'Policubos', desc: 'Segmenta la palabra sonido a sonido (empieza por PATO).', dom: 'fonologica' },
  { id: 'cadena-fonemica', emoji: '🔗', titulo: 'Cadena de sonidos', desc: 'Encadena: la última letra es la primera de la siguiente.', dom: 'fonologica' },
  { id: 'cadena-silabica', emoji: '⛓️', titulo: 'Cadena de sílabas', desc: 'Dominó silábico: sílaba final = sílaba inicial.', dom: 'silabica' },
  { id: 'policubos-silabico', emoji: '🧱', titulo: 'Policubos de sílabas', desc: 'Segmenta la palabra sílaba a sílaba (PA-TO).', dom: 'silabica' },
  { id: 'busca-sonido', emoji: '🔎', titulo: 'Caza del sonido', desc: 'Busca los dibujos que empiezan por /m/ /s/ /p/ /r/.', dom: 'fonologica' },
  { id: 'clasificar-silabas', emoji: '🗂️', titulo: 'Clasifica por sílabas', desc: 'Agrupa cada palabra por su número de sílabas (1-4).', dom: 'silabica' },
  { id: 'emparejar-oracion', emoji: '🖼️', titulo: 'Frase y dibujo', desc: 'Empareja cada oración con su imagen.', dom: 'lexica' },
  { id: 'unir-sonido', emoji: '🔤', titulo: 'Une por sonido', desc: 'Une las imágenes que empiezan por el mismo sonido.', dom: 'fonologica' },
  { id: 'unir-silaba', emoji: '🧩', titulo: 'Une por sílaba', desc: 'Une las imágenes que empiezan por la misma sílaba.', dom: 'silabica' },
  { id: 'crear-palabras', emoji: '🔡', titulo: 'Crea palabras', desc: 'Forma palabras con el banco de sílabas.', dom: 'silabica' },
  { id: 'ordenar-frase', emoji: '📝', titulo: 'Ordena la frase', desc: 'Conciencia léxica: coloca las palabras en orden correcto.', dom: 'lexica' },
  { id: 'ordenar-imagen', emoji: '🧩', titulo: 'Frase y dibujo (ordena)', desc: 'Ordena la frase que corresponde al dibujo.', dom: 'lexica' },
  // ---- Actividades diagnósticas (evidencia NotebookLM) ----
  { id: 'ran', emoji: '⚡', titulo: 'Velocidad RAN', desc: 'Nombra letras, números y colores lo más rápido posible. Mejor predictor de dislexia en español.', dom: 'fonologica' },
  { id: 'pseudopalabras', emoji: '🔬', titulo: 'Pseudopalabras', desc: 'Palabras inventadas. Elimina la memoria visual y revela la fonología pura.', dom: 'fonologica' },
  { id: 'manipulacion-medial', emoji: '🔧', titulo: 'Cambia el sonido', desc: 'Nivel experto: cambia el sonido del medio de la palabra. Indica maestría real.', dom: 'fonologica' },
]

const BG_DOM: Record<'fonologica' | 'silabica' | 'lexica', string> = {
  fonologica: 'var(--cera-verde)',
  silabica: 'var(--cera-mostaza)',
  lexica: 'var(--cera-azul)',
}
const ETIQUETA_DOM: Record<'fonologica' | 'silabica' | 'lexica', string> = {
  fonologica: 'Fonológica', silabica: 'Silábica', lexica: 'Léxica',
}
const TILTS = ['tilt-1', 'tilt-2', 'tilt-3']

export default function Mundo1({ paciente, onJugar, onEspecial, onMundo2, onSalir }: Props) {
  const [voz, setV] = useState(vozActivada())
  const [evalMode, setEvalMode] = useState(modoEvaluacion())

  function toggleEval() {
    const nv = !evalMode
    setModoEvaluacion(nv)
    setEvalMode(nv)
  }

  const esInvitado = !supabaseActivo()

  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      {evalMode && <DisclaimerBanner />}
      {/* Aviso modo invitado — datos solo en este dispositivo */}
      {esInvitado && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 mano text-sm"
          style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
          <span>⚠️ <b>Modo invitado</b> — los datos solo se guardan en este dispositivo. Si cambias de navegador se perderán.</span>
          <button
            onClick={onSalir}
            className="crayon mano px-3 py-1 text-xs flex-shrink-0"
            style={{ background: 'var(--tinta)', color: '#fff' }}
          >
            Crear cuenta →
          </button>
        </div>
      )}
      <NavBar
        titulo={`${paciente.nombre} · ⭐${paciente.xp} · 🪙${paciente.monedas}`}
        onVolver={onSalir}
        volverLabel="← Perfiles"
        feedbackActividad="mundo1"
      >
        <button onClick={() => { const nv = !voz; setVoz(nv); setV(nv) }}
          className="crayon mano px-2 py-1 text-sm" style={{ background: 'var(--papel-2)' }}>
          {voz ? '🔊' : '🔇'}
        </button>
        <button onClick={toggleEval}
          className="crayon mano px-2 py-1 text-sm"
          style={{ background: evalMode ? 'var(--cera-azul)' : 'var(--papel-2)', color: evalMode ? '#fff' : 'var(--tinta)' }}>
          {evalMode ? '🩺' : '🎮'}
        </button>
      </NavBar>
      <div className="max-w-4xl mx-auto px-4 py-6">

        <div className="text-center mb-8">
          <span className="mano text-lg" style={{ color: 'var(--cera-azul)' }}>Mundo 1</span>
          <h1 className="mano text-4xl tilt-3">Conciencia Fonológica</h1>
          <p className="mano text-base mt-1" style={{ opacity: 0.7 }}>Elige un juego. Cada partida son 10 retos y se adapta a ti.</p>
        </div>

        {/* Grid tipo Steam/Netflix — auto-fill responsive */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {ACTIVIDADES.map((a, i) => (
            <button
              key={a.id}
              onClick={() => onJugar(a.id)}
              className={`crayon ${i % 2 ? 'crayon-2' : ''} p-3 text-left transition-transform hover:-translate-y-1 active:scale-95`}
              style={{ background: 'var(--papel-2)' }}
            >
              <div className="text-3xl mb-1">{a.emoji}</div>
              <h2 className="mano text-base font-black leading-tight">{a.titulo}</h2>
              <p className="mano text-xs mt-0.5" style={{ opacity: 0.65 }}>{a.descripcion}</p>
              <span className="mano inline-block mt-2 text-xs px-2 py-0.5 rounded-full text-white" style={{ background: BG_DOM[a.dominio] }}>
                {ETIQUETA_DOM[a.dominio]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mano text-xl mb-2" style={{ color: 'var(--cera-azul)' }}>Actividades de la guía</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {ESPECIALES.map((a, i) => (
              <button
                key={a.id}
                onClick={() => onEspecial(a.id)}
                className={`crayon ${i % 2 ? 'crayon-2' : ''} p-3 text-left transition-transform hover:-translate-y-1 active:scale-95`}
                style={{ background: 'var(--papel-2)' }}
              >
                <div className="text-3xl mb-1">{a.emoji}</div>
                <h3 className="mano text-base font-black leading-tight">{a.titulo}</h3>
                <p className="mano text-xs mt-0.5" style={{ opacity: 0.65 }}>{a.desc}</p>
                <span className="mano inline-block mt-2 text-xs px-2 py-0.5 rounded-full text-white" style={{ background: BG_DOM[a.dom] }}>
                  {ETIQUETA_DOM[a.dom]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          {/* Mundo 2: DESBLOQUEADO */}
          <button
            onClick={onMundo2}
            className={`crayon mano ${TILTS[0]} px-4 py-3 text-base text-left hover:-translate-y-1 transition-transform`}
            style={{ background: 'var(--cera-lila)', color: '#fff' }}
          >
            🎵 Mundo 2 · Rimas
            <span className="block text-sm text-white/80">Puente hacia la fonémica · Clave para dislexia</span>
          </button>
          {/* Mundos 3-5: bloqueados */}
          {['Mundo 3 · Lectura', 'Mundo 4 · Vocabulario', 'Mundo 5 · Morfosintaxis'].map((m, i) => (
            <div key={m} className={`crayon mano ${TILTS[(i + 1) % 3]} px-4 py-3 text-base opacity-60`} style={{ background: 'var(--papel)', borderStyle: 'dashed' }}>
              🔒 {m} <span className="block text-sm" style={{ opacity: 0.6 }}>Próximamente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
