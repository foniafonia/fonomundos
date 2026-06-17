import NavBar from '../components/NavBar'

type PruebaId = 'fonema-inicial' | 'conteo-silabico' | 'contar-palabras'

interface Props {
  onJugar: (actividadId: PruebaId) => void
  onVerTodos: () => void
  onCuenta: () => void
  onSalir: () => void
}

const PRUEBAS: {
  id: PruebaId
  emoji: string
  titulo: string
  desc: string
  color: string
  recomendada?: boolean
}[] = [
  {
    id: 'fonema-inicial',
    emoji: '🔤',
    titulo: 'Empieza aquí',
    desc: 'Escucha una palabra y toca el sonido por el que empieza.',
    color: 'var(--cera-verde)',
    recomendada: true,
  },
  {
    id: 'conteo-silabico',
    emoji: '👏',
    titulo: 'Sílabas',
    desc: 'Da palmas y elige cuántas sílabas tiene la palabra.',
    color: 'var(--cera-mostaza)',
  },
  {
    id: 'contar-palabras',
    emoji: '✍️',
    titulo: 'Palabras',
    desc: 'Escucha una frase y cuenta cuántas palabras tiene.',
    color: 'var(--cera-azul)',
  },
]

export default function PruebaRapida({ onJugar, onVerTodos, onCuenta, onSalir }: Props) {
  return (
    <div className="papel min-h-full text-[var(--tinta)]">
      <NavBar
        titulo="Prueba rápida"
        onVolver={onSalir}
        volverLabel="← Portada"
        feedbackActividad="prueba-rapida"
      />

      <main className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-3xl flex-col justify-center px-4 py-6">
        <section className="mb-6 text-center">
          <p className="mano text-base font-black" style={{ color: 'var(--cera-azul)' }}>
            FonoMundos beta
          </p>
          <h1 className="mano mt-1 text-3xl font-black leading-tight sm:text-5xl">
            Elige una prueba rápida
          </h1>
          <p className="mano mx-auto mt-3 max-w-xl text-base leading-relaxed sm:text-lg" style={{ opacity: 0.78 }}>
            No necesitas cuenta ni código. Solo entra, juega una actividad y deja comentario si algo no se entiende.
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          {PRUEBAS.map((prueba) => (
            <button
              key={prueba.id}
              onClick={() => onJugar(prueba.id)}
              className={`crayon mano min-h-[150px] p-4 text-left transition-transform active:scale-[0.98] sm:min-h-[190px] ${prueba.recomendada ? 'tilt-1' : ''}`}
              style={{ background: prueba.recomendada ? prueba.color : 'var(--papel-2)', color: prueba.recomendada ? '#fff' : 'var(--tinta)' }}
            >
              <span className="mb-2 block text-4xl">{prueba.emoji}</span>
              {prueba.recomendada && (
                <span className="mb-2 inline-block rounded-full bg-white px-2 py-1 text-xs font-black" style={{ color: 'var(--tinta)' }}>
                  recomendado
                </span>
              )}
              <span className="block text-2xl font-black leading-tight">{prueba.titulo}</span>
              <span className="mt-2 block text-sm leading-relaxed" style={{ opacity: prueba.recomendada ? 0.95 : 0.72 }}>
                {prueba.desc}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onVerTodos}
            className="crayon mano min-h-14 px-4 py-3 text-base font-black"
            style={{ background: 'var(--papel)' }}
          >
            Ver todos los juegos
          </button>
          <button
            onClick={onCuenta}
            className="crayon mano min-h-14 px-4 py-3 text-base font-black text-white"
            style={{ background: 'var(--cera-azul)' }}
          >
            Soy profesional / tengo cuenta
          </button>
        </div>
      </main>
    </div>
  )
}
