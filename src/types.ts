// ---------- Dominio léxico ----------
export interface Palabra {
  texto: string
  emoji: string
  silabas: string[]   // segmentación silábica
  fonemas: string[]   // fonemas (dígrafos ch/ll/rr/qu/gu = 1 fonema)
}

// ---------- Actividades ----------
export type Dominio = 'fonologica' | 'silabica' | 'lexica'

export interface Opcion {
  id: string
  etiqueta: string
  emoji?: string
}

/** Una ronda concreta generada por una actividad. Interacción común: elegir una opción. */
export interface Ronda {
  enunciado: string
  locucion: string          // texto que lee el sintetizador de voz
  estimuloEmoji?: string    // ilustración grande del estímulo
  estimuloTexto?: string    // palabra/estímulo mostrado
  opciones: Opcion[]
  correctaId: string
  ayuda: string             // pista mostrada al pedir ayuda
  dificultad: number        // 1..5
}

export interface DefinicionActividad {
  id: string
  titulo: string
  descripcion: string
  emoji: string
  dominio: Dominio
  generar: (dificultad: number) => Ronda
}

// ---------- Medición ----------
export interface ResultadoRonda {
  actividadId: string
  dominio: Dominio
  acierto: boolean
  intentos: number
  ayudaUsada: boolean
  tiempoMs: number
  dificultad: number
  ts: number
}

export interface Sesion {
  id: string
  pacienteId: string
  inicio: number
  fin: number
  resultados: ResultadoRonda[]
}

export interface Paciente {
  id: string
  nombre: string
  edad: string
  curso: string
  diagnostico: string
  observaciones: string
  objetivos: string
  creado: number
  // gamificación
  monedas: number
  xp: number
}
