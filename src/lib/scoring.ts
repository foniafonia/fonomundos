import type { ResultadoRonda, Sesion } from '../types'

export interface Indices {
  fonologicoGlobal: number      // % éxito en dominio fonológico
  silabicoGlobal: number        // % éxito en dominio silábico
  coherenciaLexica: number      // % éxito en dominio léxico (frases)
  automatizacion: number        // 0-100: pocos intentos + sin ayudas
  velocidadProcesamiento: number // 0-100: rapidez de respuesta
  precisionAuditiva: number     // 0-100: aciertos a la primera
  riesgoLector: number          // 0-100: riesgo de dificultad lectora (alto = peor)
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
      fonologicoGlobal: 0, silabicoGlobal: 0, coherenciaLexica: 0, automatizacion: 0,
      velocidadProcesamiento: 0, precisionAuditiva: 0, riesgoLector: 0,
    }
  }
  const fon = resultados.filter((r) => r.dominio === 'fonologica')
  const sil = resultados.filter((r) => r.dominio === 'silabica')
  const lex = resultados.filter((r) => r.dominio === 'lexica')

  const fonologicoGlobal = pct(fon.filter((r) => r.acierto).length, fon.length)
  const silabicoGlobal = pct(sil.filter((r) => r.acierto).length, sil.length)
  const coherenciaLexica = pct(lex.filter((r) => r.acierto).length, lex.length)

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

  return {
    fonologicoGlobal, silabicoGlobal, coherenciaLexica, automatizacion,
    velocidadProcesamiento, precisionAuditiva, riesgoLector,
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
  // placeholder educativo de confusiones de pares (se ampliará con actividad de pares mínimos)
  void PARES_CONFUSION
  return hallazgos
}
