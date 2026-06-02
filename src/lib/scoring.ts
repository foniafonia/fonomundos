import type { ResultadoRonda, Sesion } from '../types'

export interface Indices {
  // Precisión por dominio
  fonologicoGlobal: number      // % éxito fonémica
  silabicoGlobal: number        // % éxito silábica
  coherenciaLexica: number      // % éxito léxica
  rimasGlobal: number           // % éxito rimas (puente crítico)
  // Eficiencia
  automatizacion: number        // 0-100: aciertos a la primera sin ayuda
  velocidadProcesamiento: number // 0-100: rapidez (proxy RAN — < 6s = 100)
  precisionAuditiva: number     // 0-100: aciertos a la primera
  // Índices clínicos avanzados
  memoriaFonologica: number     // 0-100: retención de secuencias de sonidos
  riesgoLector: number          // 0-100: riesgo dificultad lectora (alto = peor)
  alertaDislexia: boolean       // velocidad baja + fallos fonémica = doble déficit
}

function pct(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100)
}

function media(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length
}

/** Mapea un tiempo de respuesta (ms) a una puntuación 0-100 (rápido = alto). */
function puntuarVelocidad(ms: number): number {
  const ref = 6000 // 6s = lento
  const v = Math.max(0, Math.min(1, 1 - ms / ref))
  return Math.round(v * 100)
}

export function calcularIndices(resultados: ResultadoRonda[]): Indices {
  if (resultados.length === 0) {
    return {
      fonologicoGlobal: 0, silabicoGlobal: 0, coherenciaLexica: 0, rimasGlobal: 0,
      automatizacion: 0, velocidadProcesamiento: 0, precisionAuditiva: 0,
      memoriaFonologica: 0, riesgoLector: 0, alertaDislexia: false,
    }
  }
  const fon = resultados.filter((r) => r.dominio === 'fonologica')
  const sil = resultados.filter((r) => r.dominio === 'silabica')
  const lex = resultados.filter((r) => r.dominio === 'lexica')
  const rim = resultados.filter((r) => r.dominio === 'rimas' as string)

  const fonologicoGlobal = pct(fon.filter((r) => r.acierto).length, fon.length)
  const silabicoGlobal = pct(sil.filter((r) => r.acierto).length, sil.length)
  const coherenciaLexica = pct(lex.filter((r) => r.acierto).length, lex.length)
  const rimasGlobal = pct(rim.filter((r) => r.acierto).length, rim.length)

  // Automatización: aciertos sin ayuda y a la primera
  const automatizacion = pct(
    resultados.filter((r) => r.acierto && !r.ayudaUsada && r.intentos === 1).length,
    resultados.length,
  )

  // Precisión auditiva: aciertos a la primera (sin importar ayuda)
  const precisionAuditiva = pct(
    resultados.filter((r) => r.acierto && r.intentos === 1).length,
    resultados.length,
  )

  const velocidadProcesamiento = Math.round(
    media(resultados.map((r) => puntuarVelocidad(r.tiempoMs))),
  )

  // Riesgo lector: combina baja precisión + lentitud + uso de ayudas (alto = más riesgo)
  const tasaError = pct(resultados.filter((r) => !r.acierto).length, resultados.length)
  const tasaAyuda = pct(resultados.filter((r) => r.ayudaUsada).length, resultados.length)
  const lentitud = 100 - velocidadProcesamiento
  const riesgoLector = Math.round(0.5 * tasaError + 0.2 * tasaAyuda + 0.3 * lentitud)

  // Memoria fonológica: aproximada por retención en cadenas (actividades largas sin ayuda)
  const cadenas = resultados.filter((r) => r.actividadId.includes('cadena'))
  const memoriaFonologica = cadenas.length
    ? pct(cadenas.filter((r) => r.acierto && !r.ayudaUsada).length, cadenas.length)
    : 0

  // Alerta de dislexia (doble déficit): velocidad < 45 + fonológico < 60
  // En español la lentitud es el rasgo más característico (ortografía transparente)
  const alertaDislexia = velocidadProcesamiento < 45 && fonologicoGlobal < 60 && resultados.length >= 10

  return {
    fonologicoGlobal, silabicoGlobal, coherenciaLexica, rimasGlobal,
    automatizacion, velocidadProcesamiento, precisionAuditiva,
    memoriaFonologica, riesgoLector, alertaDislexia,
  }
}

export function indicesDeSesiones(sesiones: Sesion[]): Indices {
  return calcularIndices(sesiones.flatMap((s) => s.resultados))
}

// ---------- Motor analítico: detección de patrones ----------
export interface Hallazgo {
  patron: string
  recomendacion: string
  severidad: 'alta' | 'media' | 'baja'
}

const PARES_CONFUSION = ['m/n', 'p/b', 'd/t', 'g/k']

export function detectarPatrones(resultados: ResultadoRonda[]): Hallazgo[] {
  const hallazgos: Hallazgo[] = []
  const idx = calcularIndices(resultados)

  if (resultados.length < 4) return hallazgos

  if (idx.silabicoGlobal < 60 && resultados.some((r) => r.dominio === 'silabica')) {
    hallazgos.push({
      patron: 'Dificultad de segmentación silábica',
      recomendacion: 'Reforzar conteo silábico con palmas y apoyo visual antes de subir longitud de palabra.',
      severidad: idx.silabicoGlobal < 40 ? 'alta' : 'media',
    })
  }
  if (idx.fonologicoGlobal < 60 && resultados.some((r) => r.dominio === 'fonologica')) {
    hallazgos.push({
      patron: 'Dificultad de análisis auditivo (fonemas)',
      recomendacion: 'Trabajar discriminación fonema a fonema con refuerzo auditivo y locución activa.',
      severidad: idx.fonologicoGlobal < 40 ? 'alta' : 'media',
    })
  }
  if (idx.coherenciaLexica < 60 && resultados.some((r) => r.dominio === 'lexica')) {
    hallazgos.push({
      patron: 'Dificultad de conciencia léxica (orden de la frase)',
      recomendacion: 'Trabajar la estructura sujeto-verbo con apoyo de imágenes antes de aumentar la longitud de la frase.',
      severidad: idx.coherenciaLexica < 40 ? 'alta' : 'media',
    })
  }
  if (idx.velocidadProcesamiento < 45) {
    hallazgos.push({
      patron: 'Velocidad de procesamiento fonológico baja',
      recomendacion: 'Introducir actividades de reacción rápida sin penalizar el error para automatizar.',
      severidad: 'media',
    })
  }
  if (idx.automatizacion < 50) {
    hallazgos.push({
      patron: 'Baja automatización (depende de ayudas/reintentos)',
      recomendacion: 'Mantener nivel actual hasta consolidar respuestas a la primera sin ayuda.',
      severidad: 'media',
    })
  }
  if (idx.riesgoLector >= 60) {
    hallazgos.push({
      patron: 'Indicador de riesgo de dificultad lectora elevado',
      recomendacion: 'Valorar cribado de dislexia y aumentar frecuencia de sesiones cortas.',
      severidad: 'alta',
    })
  }

  // ---- Nuevas alertas clínicas basadas en evidencia (NotebookLM v2) ----

  // DOBLE DÉFICIT: velocidad baja + fonológico bajo = perfil más grave de dislexia en español
  if (idx.alertaDislexia) {
    hallazgos.push({
      patron: '⚠️ ALERTA: Posible perfil de doble déficit (dislexia)',
      recomendacion: 'Velocidad de denominación baja + dificultad fonémica simultaneas. Este patrón identifica el 63% de casos con dificultades de fluidez lectora. Derivar a evaluación psicopedagógica completa (PROLEC-R). Priorizar actividades RAN y pseudopalabras.',
      severidad: 'alta',
    })
  }

  // RIMAS BAJAS: déficit en el puente hacia la fonémica
  if (idx.rimasGlobal < 60 && idx.rimasGlobal > 0) {
    hallazgos.push({
      patron: 'Dificultad en conciencia de rima',
      recomendacion: 'La sensibilidad a la rima es prerequisito para la segmentación fonémica y predictor temprano de dislexia. Trabajar el Mundo de Rimas antes de avanzar a fonémica.',
      severidad: idx.rimasGlobal < 40 ? 'alta' : 'media',
    })
  }

  // MEMORIA FONOLÓGICA BAJA
  if (idx.memoriaFonologica < 50 && resultados.some((r) => r.actividadId.includes('cadena'))) {
    hallazgos.push({
      patron: 'Memoria de trabajo fonológica reducida',
      recomendacion: 'El bucle fonológico es básico para retener sonidos mientras se procesa la palabra. Trabajar cadenas cortas antes de aumentar longitud.',
      severidad: 'media',
    })
  }

  // CONSOLIDACIÓN: nivel superado si precisión > 80% y automatización > 70%
  if (idx.fonologicoGlobal >= 80 && idx.automatizacion >= 70 && resultados.length >= 20) {
    hallazgos.push({
      patron: '✅ Nivel fonémico consolidado',
      recomendacion: 'Precisión >80% con automaticidad >70%. El niño puede avanzar al siguiente nivel. Valorar actividades de manipulación medial para confirmar consolidación real.',
      severidad: 'baja',
    })
  }

  void PARES_CONFUSION
  return hallazgos
}
