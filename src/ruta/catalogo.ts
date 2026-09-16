import type { Dominio } from '../types'

/**
 * Cómo se juega cada actividad que usa la Ruta de 3 años.
 *
 * `construida: false` no es un detalle: una parada que necesita una actividad
 * sin construir BLOQUEA la Ruta. No se salta ni se reordena.
 */
export type Lanzador =
  | 'ruta'               // actividad propia de src/ruta/actividades
  | 'jugar'              // JugarActividad con el generador de data/actividades.ts
  | 'ordenar-frase'      // components/OrdenarFrase
  | 'emparejar-oracion'  // components/EmparejarOracion

export interface EntradaCatalogo {
  id: string
  titulo: string
  emoji: string
  construida: boolean
  lanzador?: Lanzador
  /**
   * Cuenta para dar la parada por superada (todas sus tareas fonológicas
   * dominadas). La articulación es pronunciación: se practica en la
   * rotación, pero no frena el paso de parada.
   */
  fonologica: boolean
  /**
   * Dominio con el que se guarda en la sesión del paciente. `null` = no se
   * guarda ahí: la valoración del adulto sobre cómo pronuncia no puede
   * mezclarse con los índices de conciencia fonológica.
   */
  dominio: Dominio | null
  /** Se le puede pedir un número concreto de ítems (repaso 3-4, cierre 2-3). */
  admiteItems: boolean
}

export const CATALOGO_RUTA: Record<string, EntradaCatalogo> = {
  'memoria-series': {
    id: 'memoria-series', titulo: 'Recuerda la serie', emoji: '👂',
    construida: true, lanzador: 'ruta', fonologica: true, dominio: 'lexica', admiteItems: true,
  },
  articulacion: {
    id: 'articulacion', titulo: 'Pronunciación', emoji: '🗣️',
    construida: true, lanzador: 'ruta', fonologica: false, dominio: null, admiteItems: true,
  },
  'contar-palabras': {
    id: 'contar-palabras', titulo: 'Cuenta las palabras', emoji: '✍️',
    construida: true, lanzador: 'jugar', fonologica: true, dominio: 'lexica', admiteItems: false,
  },
  'ordenar-frase': {
    id: 'ordenar-frase', titulo: 'Ordena la frase', emoji: '📝',
    construida: true, lanzador: 'ordenar-frase', fonologica: true, dominio: 'lexica', admiteItems: false,
  },
  'emparejar-oracion': {
    id: 'emparejar-oracion', titulo: 'Frase y dibujo', emoji: '🖼️',
    construida: true, lanzador: 'emparejar-oracion', fonologica: true, dominio: 'lexica', admiteItems: false,
  },
  'memoria-quitado': {
    id: 'memoria-quitado', titulo: '¿Cuál falta?', emoji: '🙈',
    construida: true, lanzador: 'ruta', fonologica: true, dominio: 'lexica', admiteItems: true,
  },
  'memoria-anadido': {
    id: 'memoria-anadido', titulo: '¿Cuál se ha añadido?', emoji: '➕',
    construida: true, lanzador: 'ruta', fonologica: true, dominio: 'lexica', admiteItems: true,
  },
  'compuestas-suma': {
    id: 'compuestas-suma', titulo: 'Junta dos palabras', emoji: '🔗',
    construida: false, fonologica: true, dominio: null, admiteItems: false,
  },
  'compuestas-resta': {
    id: 'compuestas-resta', titulo: 'Quita una palabra', emoji: '✂️',
    construida: false, fonologica: true, dominio: null, admiteItems: false,
  },
  'rima-buscar': {
    id: 'rima-buscar', titulo: 'Busca la rima', emoji: '🎵',
    construida: false, fonologica: true, dominio: null, admiteItems: false,
  },
  'rima-completar': {
    id: 'rima-completar', titulo: 'Completa la rima', emoji: '🎶',
    construida: false, fonologica: true, dominio: null, admiteItems: false,
  },
}

export function entradaDe(actividadId: string): EntradaCatalogo | undefined {
  return CATALOGO_RUTA[actividadId]
}
