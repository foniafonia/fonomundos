// ============================================================================
// Datos normativos por edad — basados en evidencia (NotebookLM / literatura)
// Umbrales de normalidad y alarma clínica para español (ortografía transparente)
// Criterio: alarma = 1.5 desviaciones estándar por debajo de la media del grupo
// ============================================================================

export type EdadGrupo = 4 | 5 | 6 | 7

export interface NormaIndice {
  normal: number      // puntuación mínima para rango normal
  alarma: number      // por debajo de este valor = señal de alarma clínica
  disponible: boolean // false si el índice no es valorable a esta edad (RAN <5 años)
}

export type NormasEdad = Record<string, NormaIndice>

// Tabla normativa estimativa basada en la literatura de conciencia fonológica en español
export const NORMAS_POR_EDAD: Record<EdadGrupo, NormasEdad> = {
  4: {
    fonologicoGlobal:      { normal: 50,  alarma: 40,  disponible: true },
    silabicoGlobal:        { normal: 65,  alarma: 55,  disponible: true },
    coherenciaLexica:      { normal: 70,  alarma: 60,  disponible: true },
    rimasGlobal:           { normal: 60,  alarma: 50,  disponible: true },
    memoriaFonologica:     { normal: 55,  alarma: 45,  disponible: true },
    velocidadProcesamiento:{ normal: 0,   alarma: 0,   disponible: false }, // RAN no valorable <5 años
    automatizacion:        { normal: 0,   alarma: 0,   disponible: false },
    precisionAuditiva:     { normal: 70,  alarma: 60,  disponible: true },
    riesgoLector:          { normal: 20,  alarma: 60,  disponible: true },  // invertido: bajo es mejor
  },
  5: {
    fonologicoGlobal:      { normal: 70,  alarma: 60,  disponible: true },
    silabicoGlobal:        { normal: 80,  alarma: 65,  disponible: true },
    coherenciaLexica:      { normal: 80,  alarma: 65,  disponible: true },
    rimasGlobal:           { normal: 80,  alarma: 70,  disponible: true },
    memoriaFonologica:     { normal: 70,  alarma: 55,  disponible: true },
    velocidadProcesamiento:{ normal: 50,  alarma: 40,  disponible: true },
    automatizacion:        { normal: 50,  alarma: 40,  disponible: true },
    precisionAuditiva:     { normal: 80,  alarma: 65,  disponible: true },
    riesgoLector:          { normal: 30,  alarma: 60,  disponible: true },
  },
  6: {
    fonologicoGlobal:      { normal: 78,  alarma: 65,  disponible: true },
    silabicoGlobal:        { normal: 90,  alarma: 75,  disponible: true },
    coherenciaLexica:      { normal: 90,  alarma: 75,  disponible: true },
    rimasGlobal:           { normal: 89,  alarma: 75,  disponible: true },
    memoriaFonologica:     { normal: 80,  alarma: 65,  disponible: true },
    velocidadProcesamiento:{ normal: 60,  alarma: 45,  disponible: true },
    automatizacion:        { normal: 70,  alarma: 55,  disponible: true },
    precisionAuditiva:     { normal: 85,  alarma: 70,  disponible: true },
    riesgoLector:          { normal: 40,  alarma: 60,  disponible: true },
  },
  7: {
    fonologicoGlobal:      { normal: 85,  alarma: 70,  disponible: true },
    silabicoGlobal:        { normal: 95,  alarma: 80,  disponible: true },
    coherenciaLexica:      { normal: 95,  alarma: 80,  disponible: true },
    rimasGlobal:           { normal: 93,  alarma: 78,  disponible: true },
    memoriaFonologica:     { normal: 85,  alarma: 70,  disponible: true },
    velocidadProcesamiento:{ normal: 80,  alarma: 60,  disponible: true },
    automatizacion:        { normal: 80,  alarma: 65,  disponible: true },
    precisionAuditiva:     { normal: 90,  alarma: 75,  disponible: true },
    riesgoLector:          { normal: 40,  alarma: 60,  disponible: true },
  },
}

/** Extrae el grupo de edad más cercano a la edad real del paciente */
export function grupoEdad(edadStr: string): EdadGrupo | null {
  const n = parseInt(edadStr)
  if (isNaN(n)) return null
  if (n <= 4) return 4
  if (n === 5) return 5
  if (n === 6) return 6
  return 7
}

export type NivelIndice = 'normal' | 'atencion' | 'alarma' | 'nodisponible'

/** Clasifica un índice según las normas para la edad */
export function clasificarIndice(
  nombre: string,
  valor: number,
  edad: EdadGrupo,
  invertido = false,
): NivelIndice {
  const norma = NORMAS_POR_EDAD[edad][nombre]
  if (!norma || !norma.disponible) return 'nodisponible'
  if (invertido) {
    // riesgoLector: alto es malo
    if (valor >= norma.alarma) return 'alarma'
    if (valor >= norma.normal) return 'atencion'
    return 'normal'
  }
  if (valor < norma.alarma) return 'alarma'
  if (valor < norma.normal) return 'atencion'
  return 'normal'
}

// ============================================================================
// Protocolo de cribado diagnóstico (20-30 min)
// Orden basado en sensibilidad predictiva y fatiga del niño
// ============================================================================

export interface PasoProtocolo {
  actividadId: string
  nombre: string
  emoji: string
  tipo: 'obligatoria' | 'opcional'
  condicion?: string  // cuándo se aplica
  duracionMin: number
  justificacion: string
}

export const PROTOCOLO_CRIBADO: PasoProtocolo[] = [
  {
    actividadId: 'ran',
    nombre: 'RAN — Velocidad de denominación',
    emoji: '⚡',
    tipo: 'obligatoria',
    duracionMin: 6,
    justificacion: 'Mejor predictor temprano en español. Apertura ideal: rápida y sensible.',
  },
  {
    actividadId: 'conteo-silabico',
    nombre: 'Conteo silábico',
    emoji: '👏',
    tipo: 'obligatoria',
    condicion: 'Obligatoria en menores de 6 años',
    duracionMin: 4,
    justificacion: 'Evalúa la base silábica. Fallo aquí indica retraso simple del lenguaje.',
  },
  {
    actividadId: 'detectar-rima',
    nombre: 'Detección de rimas',
    emoji: '🎵',
    tipo: 'obligatoria',
    duracionMin: 4,
    justificacion: 'Puente crítico hacia el fonema. Déficit en rimas = señal temprana de dislexia.',
  },
  {
    actividadId: 'conteo-fonemas',
    nombre: 'Conteo de fonemas',
    emoji: '🔢',
    tipo: 'obligatoria',
    duracionMin: 4,
    justificacion: 'Evalúa la capacidad segmental pura.',
  },
  {
    actividadId: 'pseudopalabras',
    nombre: 'Pseudopalabras',
    emoji: '🔬',
    tipo: 'obligatoria',
    duracionMin: 5,
    justificacion: 'CRÍTICA: elimina la memoria visual y diferencia dislexia de retraso simple.',
  },
  {
    actividadId: 'manipulacion-medial',
    nombre: 'Manipulación medial',
    emoji: '🔧',
    tipo: 'opcional',
    condicion: 'Solo si supera las anteriores',
    duracionMin: 5,
    justificacion: 'Confirma maestría fonémica total. No aplicar si hay fallos previos evidentes.',
  },
  {
    actividadId: 'cadena-fonemica',
    nombre: 'Cadenas de sonidos',
    emoji: '🔗',
    tipo: 'opcional',
    duracionMin: 6,
    justificacion: 'Evalúa memoria de trabajo fonológica integrada.',
  },
]

// ============================================================================
// Decisión clínica automática basada en el patrón de resultados
// ============================================================================

export type PerfilClinico =
  | 'riesgo-dislexia'      // velocidad baja + pseudopalabras mal
  | 'retraso-simple'       // rimas/silabas mal pero velocidad normal
  | 'consolidado'          // >80% + velocidad alta
  | 'desarrollo-normal'    // dentro de norma para edad
  | 'insuficiente'         // pocos datos

import type { Indices } from './scoring'

export function determinarPerfil(
  indices: Indices,
  edad: EdadGrupo | null,
): { perfil: PerfilClinico; descripcion: string; urgencia: 'alta' | 'media' | 'baja' | null } {
  if (!edad) return { perfil: 'insuficiente', descripcion: 'Introduce la edad del paciente para una interpretación clínica.', urgencia: null }

  const norma = NORMAS_POR_EDAD[edad]

  // Perfil 1: Riesgo de dislexia — DOBLE DÉFICIT
  const velBaja = norma.velocidadProcesamiento.disponible && indices.velocidadProcesamiento < norma.velocidadProcesamiento.alarma
  const fonBaja = indices.fonologicoGlobal < norma.fonologicoGlobal.alarma
  if (velBaja && fonBaja) {
    return {
      perfil: 'riesgo-dislexia',
      descripcion: '⚠️ Perfil de doble déficit: velocidad de denominación baja + dificultad fonológica. Sensibilidad del 63% para dislexia. Derivar a evaluación neuropsicológica completa (PROLEC-R). Iniciar intervención inmediata sin esperar diagnóstico formal.',
      urgencia: 'alta',
    }
  }

  // Perfil 2: Retraso simple del lenguaje
  const rimasBaja = indices.rimasGlobal > 0 && indices.rimasGlobal < norma.rimasGlobal.alarma
  const silBaja = indices.silabicoGlobal < norma.silabicoGlobal.alarma
  const velNormal = !norma.velocidadProcesamiento.disponible || indices.velocidadProcesamiento >= norma.velocidadProcesamiento.normal
  if ((rimasBaja || silBaja) && velNormal) {
    return {
      perfil: 'retraso-simple',
      descripcion: 'Perfil de retraso simple del lenguaje: dificultades en rimas y/o sílabas con velocidad de denominación dentro de la norma. Desarrollo lento pero armónico. Intervención fonológica sistemática sin urgencia de derivación.',
      urgencia: 'media',
    }
  }

  // Perfil 3: Consolidado
  if (
    indices.fonologicoGlobal >= 80 &&
    indices.automatizacion >= 70 &&
    (!norma.velocidadProcesamiento.disponible || indices.velocidadProcesamiento >= norma.velocidadProcesamiento.normal)
  ) {
    return {
      perfil: 'consolidado',
      descripcion: '✅ Nivel consolidado: precisión >80% con automaticidad adecuada. El niño puede avanzar al siguiente nivel. Valorar actividades de manipulación medial para confirmar.',
      urgencia: 'baja',
    }
  }

  // Perfil 4: Desarrollo normal (dentro de norma pero sin consolidar)
  return {
    perfil: 'desarrollo-normal',
    descripcion: 'Desarrollo dentro de norma para la edad. Continuar con la intervención programada.',
    urgencia: 'baja',
  }
}
