/**
 * Las siete celdas vivas de la colmena.
 *
 * Cambiar una URL aquí es todo lo que hace falta: la portada no sabe nada de
 * lo que hay detrás, solo navega. Si una URL queda vacía, la celda sigue
 * brillando y respondiendo pero no navega a ningún sitio.
 */
export type LiveCell = {
  id: string
  name: string
  line: string
  url: string
  /** Latitud/longitud aproximadas (grados) para colocarla en la esfera. */
  lat: number
  lon: number
}

export const LIVE_CELLS: LiveCell[] = [
  /*
   * La cámara mira desde +Z, así que la cara visible al cargar es lon ≈ 90.
   * Las seis primeras se reparten por esa cara sin amontonarse; la séptima
   * entra al girar, para que la colmena tenga algo que enseñar todavía.
   */
  {
    id: 'academia',
    name: 'ACADEMIA',
    line: 'Construye tu segundo cerebro digital.',
    url: 'https://www.skool.com/logopedia-7339/about',
    lat: 24,
    lon: 62,
  },
  {
    id: 'laboratorio',
    name: 'LABORATORIO',
    line: 'Herramientas, experimentos y prototipos.',
    url: '',
    lat: -22,
    lon: 116,
  },
  {
    id: 'comunidad',
    name: 'COMUNIDAD',
    line: 'Profesionales aprendiendo unos de otros.',
    url: 'https://t.me/logoped_ia',
    lat: 50,
    lon: 124,
  },
  {
    id: 'fonomundos',
    name: 'FONOMUNDOS',
    line: 'Videojuegos y experiencias educativas.',
    url: 'https://fonomundos.vercel.app',
    lat: -46,
    lon: 48,
  },
  {
    id: 'fonia',
    name: 'FÖNIA',
    line: 'Experiencia clínica y conocimiento profesional.',
    url: '',
    lat: 2,
    lon: 26,
  },
  {
    id: 'recursos',
    name: 'RECURSOS',
    line: 'Prompts, herramientas, documentos y sistemas.',
    url: '',
    lat: -4,
    lon: 152,
  },
  {
    id: 'proyectos',
    name: 'PROYECTOS',
    line: 'Ideas convertidas en productos reales.',
    url: '',
    lat: 36,
    lon: -6,
  },
]

export const WORDMARK = 'COLMENIA'
export const TAGLINE = 'Construye tu segundo cerebro digital.'
export const SUBLINE = 'Aprende. Construye. Comparte. Multiplica lo que sabes.'
