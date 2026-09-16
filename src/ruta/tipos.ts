/**
 * Tipos de la Ruta. El diseño clínico vive fuera del repo; aquí solo se
 * traduce a datos lo que ya está decidido.
 */

/** Solo = la app corrige. Acompañada = un adulto valora ✓/✗ porque el niño produce y FonoMundos no escucha. */
export type ModoTarea = 'solo' | 'acompanada'

/** Lo que el código necesita leer de los parámetros. El texto literal va aparte, en `parametros`. */
export interface ConfigTarea {
  /** Juegos de memoria: palabras del grupo al empezar. */
  n?: number
  /** Juegos de memoria: palabras del grupo al acabar la sesión (si crece). */
  nFinal?: number
  /** articulacion: sonido objetivo, como grafema (P, K, CH…). */
  sonido?: string
  /** contar-palabras / ordenar-frase: nivel (1 = más sencillo). */
  juego?: number
}

export interface Tarea {
  num: number
  /** Id del catálogo de actividades de la Ruta (catalogo.ts). */
  actividadId: string
  /** Qué se trabaja y cómo, para el adulto. */
  parametros: string
  modo: ModoTarea
  /** Qué ayuda se da si cuesta. */
  ayuda: string
  config: ConfigTarea
  /** Duda abierta del diseño sobre esta tarea. */
  duda?: string
}

export interface Repaso {
  actividadId: string
  /** Qué se repasa al empezar la sesión. */
  texto: string
  config: ConfigTarea
}

export interface Parada {
  /** Identificador interno estable: r3-p1 = Ruta de 3 años, parada 1. */
  id: string
  numero: number
  nombre: string
  objetivo: string
  tareas: Tarea[]
  /** Sesiones mínimas: cada tarea sale al menos en 2. */
  sesionesMinimas: number
  repaso: Repaso | null
  versionOral: string[]
  aparte: string[]
}

// ── Bloques de la sesión ────────────────────────────────────────────────────

/** Por qué se para un bloque antes de terminar. */
export type Corte = null | 'tiempo' | 'salir'

export interface ResultadoBloque {
  aciertos: number
  total: number
  parcial: boolean
  /** Sesión guardada en la ficha del paciente, si la hubo. */
  sesionId: string | null
}

/** Contrato de las actividades propias de la Ruta (src/ruta/actividades). */
export interface PropsBloque {
  pacienteId: string
  items: number
  /** 0 = normal. Sube cuando la tarea cuesta dos sesiones seguidas. */
  nivelAyuda: number
  config: ConfigTarea
  /** Guardar en la ficha del paciente. El cierre no se guarda: es de acierto seguro. */
  guardar: boolean
  /** Cuando deja de ser null, la actividad guarda lo hecho como parcial y llama a onFin. */
  corte: Corte
  onFin: (r: ResultadoBloque) => void
}
