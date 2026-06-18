import type { StoryZone } from './storyModeTypes'

export const WORLD_W = 1600
export const WORLD_H = 1100
export const AVATAR_SPEED = 4
export const ZONE_RADIUS = 90
export const AVATAR_SIZE = 48

export const ZONES: StoryZone[] = [
  {
    id: 'casa-sonido',
    name: 'Casa del Sonido',
    emoji: '🏠',
    description: 'Busca la imagen que empieza por el sonido correcto',
    position: { x: 280, y: 220 },
    color: '#ef8e7a',
    activity: { type: 'especial', especial: 'busca-sonido' },
  },
  {
    id: 'escuela-silabas',
    name: 'Escuela de Sílabas',
    emoji: '🏫',
    description: 'Clasifica palabras según sus sílabas',
    position: { x: 700, y: 180 },
    color: '#f2c14e',
    activity: { type: 'especial', especial: 'clasificar-silabas' },
  },
  {
    id: 'taller-policubos',
    name: 'Taller de Policubos',
    emoji: '🧱',
    description: 'Construye secuencias con los cubos',
    position: { x: 1200, y: 240 },
    color: '#6cb6d9',
    activity: { type: 'especial', especial: 'policubos' },
  },
  {
    id: 'carpa-bingo',
    name: 'Carpa del Bingo',
    emoji: '🎪',
    description: 'Juega al bingo de fonemas y sílabas',
    position: { x: 300, y: 650 },
    color: '#b08ed9',
    activity: { type: 'especial', especial: 'bingo' },
  },
  {
    id: 'plaza-domino',
    name: 'Plaza Dominó',
    emoji: '🎯',
    description: 'Encadena palabras por sus sonidos',
    position: { x: 760, y: 680 },
    color: '#8bbf6a',
    activity: { type: 'especial', especial: 'cadena-fonemica' },
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca Léxica',
    emoji: '📚',
    description: 'Ordena las palabras para formar frases',
    position: { x: 1220, y: 640 },
    color: '#e8a800',
    activity: { type: 'especial', especial: 'ordenar-frase' },
  },
  {
    id: 'mundo-rimas',
    name: 'Mundo de Rimas',
    emoji: '🌈',
    description: 'Encuentra las palabras que riman',
    position: { x: 560, y: 940 },
    color: '#ef8e7a',
    activity: { type: 'especial', especial: 'detectar-rima' },
  },
]
