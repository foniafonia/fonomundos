import type { Paciente } from '../types'
import { ACTIVIDADES } from '../data/actividades'
import { setVoz, vozActivada } from '../lib/voz'
import { useState } from 'react'

export type Especial =
  | 'policubos' | 'cadena-fonemica' | 'cadena-silabica' | 'ordenar-frase'
  | 'policubos-silabico' | 'busca-sonido' | 'clasificar-silabas' | 'emparejar-oracion'
  | 'crear-palabras' | 'unir-sonido' | 'unir-silaba' | 'ordenar-imagen'

interface Props {
  paciente: Paciente
  onJugar: (actividadId: string) => void
  onEspecial: (e: Especial) => void
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

export default function Mundo1({ paciente, onJugar, onEspecial, onSalir }: Props) {
  const [voz, setV] = useState(vozActivada())
  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <header className="flex items-center justify-between mb-6">
          <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>
            ← Perfiles
          </button>
          <div className="mano text-lg" style={{ color: 'var(--cera-coral)' }}>{paciente.nombre} · ⭐ {paciente.xp} · 🪙 {paciente.monedas}</div>
          <button
            onClick={() => { const nv = !voz; setVoz(nv); setV(nv) }}
            className="crayon mano px-4 py-1.5 text-base"
            style={{ background: 'var(--papel-2)' }}
            aria-pressed={voz}
          >
            {voz ? '🔊 Voz' : '🔇 Voz'}
          </button>
        </header>

        <div className="text-center mb-8">
          <span className="mano text-lg" style={{ color: 'var(--cera-azul)' }}>Mundo 1</span>
          <h1 className="mano text-4xl tilt-3">Conciencia Fonológica</h1>
          <p className="mano text-base mt-1" style={{ opacity: 0.7 }}>Elige un juego. Cada partida son 10 retos y se adapta a ti.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {ACTIVIDADES.map((a, i) => (
            <button
              key={a.id}
              onClick={() => onJugar(a.id)}
              className={`crayon ${i % 2 ? 'crayon-2' : ''} ${TILTS[i % 3]} p-5 text-left transition-transform hover:-translate-y-1`}
              style={{ background: 'var(--papel-2)' }}
            >
              <div className="text-4xl mb-2">{a.emoji}</div>
              <h2 className="mano text-2xl">{a.titulo}</h2>
              <p className="mano text-base mt-1" style={{ opacity: 0.7 }}>{a.descripcion}</p>
              <span className="crayon mano inline-block mt-3 text-sm px-3 py-0.5 text-white" style={{ background: BG_DOM[a.dominio] }}>
                {ETIQUETA_DOM[a.dominio]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="mano text-2xl mb-3" style={{ color: 'var(--cera-azul)' }}>Actividades de la guía</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {ESPECIALES.map((a, i) => (
              <button
                key={a.id}
                onClick={() => onEspecial(a.id)}
                className={`crayon ${i % 2 ? 'crayon-2' : ''} ${TILTS[(i + 1) % 3]} p-5 text-left transition-transform hover:-translate-y-1`}
                style={{ background: 'var(--papel-2)' }}
              >
                <div className="text-4xl mb-2">{a.emoji}</div>
                <h3 className="mano text-xl">{a.titulo}</h3>
                <p className="mano text-sm mt-1" style={{ opacity: 0.7 }}>{a.desc}</p>
                <span className="crayon mano inline-block mt-3 text-sm px-3 py-0.5 text-white" style={{ background: BG_DOM[a.dom] }}>
                  {ETIQUETA_DOM[a.dom]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 opacity-70">
          {['Mundo 2 · Rimas', 'Mundo 3 · Lectura', 'Mundo 4 · Vocabulario', 'Mundo 5 · Morfosintaxis'].map((m, i) => (
            <div key={m} className={`crayon mano ${TILTS[i % 3]} px-4 py-3 text-base`} style={{ background: 'var(--papel)', borderStyle: 'dashed' }}>
              🔒 {m} <span className="block text-sm" style={{ opacity: 0.6 }}>Próximamente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
