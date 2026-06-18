import type { StoryZone } from './storyModeTypes'

export const GRID_COLS = 26
export const GRID_ROWS = 22
export const AVATAR_SPEED = 0.085   // tiles per frame (60fps)
export const ZONE_REACH  = 2.8     // tile distance for building interaction

export const AVATAR_START = { col: 13, row: 11 }

export const ZONES: StoryZone[] = [
  {
    id: 'casa-sonido',
    name: 'Casa del Sonido',
    emoji: '🏠',
    description: 'Busca la imagen que empieza por el sonido correcto',
    position: { col: 2, row: 2 },
    bw: 3, bd: 2, bh: 3,
    colorTop: '#ff9985', colorLeft: '#ef5350', colorRight: '#c62828',
    activity: { type: 'especial', especial: 'busca-sonido' },
  },
  {
    id: 'escuela-silabas',
    name: 'Escuela de Sílabas',
    emoji: '🏫',
    description: 'Clasifica palabras según sus sílabas',
    position: { col: 9, row: 2 },
    bw: 4, bd: 3, bh: 3.5,
    colorTop: '#fff176', colorLeft: '#fdd835', colorRight: '#f57f17',
    activity: { type: 'especial', especial: 'clasificar-silabas' },
  },
  {
    id: 'taller-policubos',
    name: 'Taller de Policubos',
    emoji: '🧱',
    description: 'Construye secuencias con los cubos',
    position: { col: 18, row: 1 },
    bw: 3, bd: 3, bh: 4,
    colorTop: '#80d8ff', colorLeft: '#0288d1', colorRight: '#01579b',
    activity: { type: 'especial', especial: 'policubos' },
  },
  {
    id: 'carpa-bingo',
    name: 'Carpa del Bingo',
    emoji: '🎪',
    description: 'Juega al bingo de fonemas y sílabas',
    position: { col: 2, row: 10 },
    bw: 3, bd: 3, bh: 2.5,
    colorTop: '#ea80fc', colorLeft: '#8e24aa', colorRight: '#4a148c',
    activity: { type: 'especial', especial: 'bingo' },
  },
  {
    id: 'plaza-domino',
    name: 'Plaza Dominó',
    emoji: '🎯',
    description: 'Encadena palabras por sus sonidos',
    position: { col: 10, row: 10 },
    bw: 3, bd: 3, bh: 3,
    colorTop: '#a5d6a7', colorLeft: '#43a047', colorRight: '#1b5e20',
    activity: { type: 'especial', especial: 'cadena-fonemica' },
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca Léxica',
    emoji: '📚',
    description: 'Ordena las palabras para formar frases',
    position: { col: 18, row: 9 },
    bw: 4, bd: 3, bh: 4,
    colorTop: '#ffcc80', colorLeft: '#ef8c00', colorRight: '#e65100',
    activity: { type: 'especial', especial: 'ordenar-frase' },
  },
  {
    id: 'mundo-rimas',
    name: 'Mundo de Rimas',
    emoji: '🌈',
    description: 'Encuentra las palabras que riman',
    position: { col: 7, row: 16 },
    bw: 3, bd: 3, bh: 2.5,
    colorTop: '#f48fb1', colorLeft: '#e91e63', colorRight: '#880e4f',
    activity: { type: 'especial', especial: 'detectar-rima' },
  },
]
