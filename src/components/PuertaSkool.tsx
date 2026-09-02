/**
 * La puerta a la comunidad, con la medición dentro.
 *
 * Se usa en todas las pantallas para que el clic quede registrado con el sitio
 * del que salió. Sin eso no hay forma de saber qué pantalla convierte y cuál
 * solo estorba, y se acaba decidiendo por intuición.
 */
import { registrarEventoUso } from '../lib/analytics'
import { ACCESO, GANCHO, SKOOL, SKOOL_URL } from '../data/skool'

interface Props {
  /** De dónde sale el clic. Es la clave de la medición: ponle nombre propio. */
  origen: string
  /** 'boton' llama la atención; 'linea' se queda quieta en un pie de página. */
  variante?: 'boton' | 'linea'
  /** Texto de arriba. Por defecto, el que corresponda al origen. */
  gancho?: string | null
}

export default function PuertaSkool({ origen, variante = 'boton', gancho }: Props) {
  const texto = gancho === null ? null : (gancho ?? GANCHO[origen] ?? null)

  const alPulsar = () => registrarEventoUso('puerta_skool', { origen, acceso: ACCESO })

  if (variante === 'linea') {
    return (
      <a
        href={SKOOL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={alPulsar}
        className="flex items-center justify-center gap-2 mano text-sm"
        style={{ color: 'var(--cera-lila)', opacity: 0.8 }}
      >
        🐝 {SKOOL.boton}
      </a>
    )
  }

  return (
    <div className="space-y-2">
      {texto && (
        <p className="mano text-base" style={{ opacity: 0.8 }}>
          {texto}
        </p>
      )}
      <a
        href={SKOOL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={alPulsar}
        className="crayon mano block py-3 px-4 text-xl text-center text-white"
        style={{ background: 'var(--cera-azul)' }}
      >
        🐝 {SKOOL.boton}
      </a>
      <p className="mano text-sm text-center" style={{ opacity: 0.55 }}>
        {SKOOL.pie}
      </p>
    </div>
  )
}
