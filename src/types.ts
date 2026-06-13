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
  locucionPartes?: string[] // lectura por bloques con pausas: consigna, palabra, partes...
  estimuloEmoji?: string    // ilustración grande del estímulo
  estimuloTexto?: string    // palabra/estímulo mostrado
  opciones: Opcion[]
  correctaId: string
  ayuda: string             // pista mostrada al pedir ayuda
  ayudaPartes?: string[]    // pista por bloques cuando conviene escuchar despacio
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
  modoEvaluacion?: boolean       // true = protocolo profesional sin gamificación
  notasLogopeda?: string         // observaciones cualitativas durante la sesión
}

/** Modo de uso de la app */
export type ModoApp = 'juego' | 'evaluacion'

/**
 * Itinerario terapéutico (basado en evidencia neuropsicológica):
 * - prevencion: Léxica → Silábica → Rimas → Fonémica (niños <6 años, prevención)
 * - intervencion: Fonémica → Silábica → Léxica (niños >6 años, dislexia confirmada)
 */
export type Itinerario = 'prevencion' | 'intervencion'

export interface Paciente {
  id: string
  nombre: string
  edad: string
  curso: string
  diagnostico: string
  observaciones: string
  objetivos: string
  creado: number
  itinerario: Itinerario
  // Factores de riesgo (elevación clínica independiente de la puntuación)
  antecFamiliares: boolean  // antecedentes familiares de dislexia (+50-68% riesgo)
  lenguaMaterna: string     // español como L2 puede afectar validez de normas
  deficitSensorial: boolean // descarta validez del cribado si true
  // gamificación
  monedas: number
  xp: number
}
