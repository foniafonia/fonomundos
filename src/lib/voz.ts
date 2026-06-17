let activada = true
let vozElegida: SpeechSynthesisVoice | null = null
let speakTimer: number | null = null
let sequenceTimer: number | null = null
let sequenceToken = 0
let ultimaLocucion = ''
let ultimaLocucionAt = 0
let vozPreparada = false
const VOZ_PREFERIDA_KEY = 'fonomundos.vozPreferida'
const VOZ_MANUAL_KEY = 'fonomundos.vozPreferidaManual'
const VOZ_PRINCIPAL = 'Google español'
const VOZ_PRINCIPAL_LANG = 'es-ES'
const DEDUPE_LOCUCION_MS = 2200
const VELOCIDAD_COMUNIDAD = 0.88
const VELOCIDAD_LENTA = 0.78
const VELOCIDAD_PARTES = 0.68

interface OpcionesVoz {
  rate?: number
  pitch?: number
  dedupe?: boolean
}

const VOCES_MASCULINAS = [
  'google español',
  'google espanol',
  'grandpa',
  'abuelo',
  'reed',
  'rocko',
  'siri male',
  'siri hombre',
  'siri masculino',
  'siri voz 2',
  'siri voice 2',
  'siri voz 3',
  'siri voice 3',
  'jorge',
  'diego',
  'pablo',
  'juan',
  'carlos',
  'alvaro',
  'álvaro',
  'gonzalo',
  'enrique',
  'miguel',
]

const VOCES_FEMENINAS = [
  'monica',
  'mónica',
  'paulina',
  'paula',
  'maria',
  'maría',
  'lucia',
  'lucía',
  'angela',
  'ángela',
  'marisol',
  'luciana',
  'laura',
  'elena',
  'helena',
  'carmen',
  'soledad',
  'flo',
  'grandma',
  'abuela',
  'sandy',
  'shelley',
]

function avisarVozFallback(voz?: SpeechSynthesisVoice | null) {
  console.warn('[FM] Voz masculina española no disponible. Usando fallback español:', voz?.name ?? 'voz por defecto del navegador')
}

function prepararMotorVoz() {
  if (!('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.resume()
    if (vozPreparada) return
    window.speechSynthesis.getVoices()
    vozPreparada = true
  } catch {
    // iOS puede ignorar resume() hasta una interacción real.
  }
}

export function setVoz(v: boolean) {
  activada = v
  if (!v && 'speechSynthesis' in window) {
    cancelarVoz()
  }
}

export function vozActivada() {
  return activada
}

function normalizar(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function esVozMasculina(v: SpeechSynthesisVoice) {
  const nombre = normalizar(v.name)
  const lang = normalizar(v.lang)
  return lang.startsWith('es') && VOCES_MASCULINAS.some((voz) => nombre.includes(normalizar(voz)))
}

function pareceVozFemenina(v: SpeechSynthesisVoice) {
  const nombre = normalizar(v.name)
  return VOCES_FEMENINAS.some((voz) => nombre.includes(normalizar(voz)))
}

function puntuarVoz(v: SpeechSynthesisVoice) {
  const nombre = normalizar(v.name)
  const lang = normalizar(v.lang)
  if (!lang.startsWith('es')) return -1000
  if (nombre === normalizar(VOZ_PRINCIPAL) && lang === normalizar(VOZ_PRINCIPAL_LANG)) return 1000
  if (nombre.includes(normalizar(VOZ_PRINCIPAL)) && lang.startsWith('es')) return 940
  if (pareceVozFemenina(v) && !esVozMasculina(v)) return -150

  let score = 0
  if (lang.startsWith('es-es')) score += 35
  if (esVozMasculina(v)) score += 260
  if (nombre.includes('grandpa') || nombre.includes('abuelo')) score += 240
  if (nombre.includes('reed') || nombre.includes('rocko')) score += 190
  if (nombre.includes('jorge') || nombre.includes('diego') || nombre.includes('pablo')) score += 170
  if (nombre.includes('eddy')) score += 70
  if (!pareceVozFemenina(v)) score += 25
  return score
}

function pitchPara(voz?: SpeechSynthesisVoice | null, fallback = false) {
  if (!voz) return 0.7
  if (normalizar(voz.name).includes(normalizar(VOZ_PRINCIPAL))) return 1.0
  if (pareceVozFemenina(voz) && !esVozMasculina(voz)) return 0.55
  if (esVozMasculina(voz)) return 1.0
  return fallback ? 0.7 : 0.9
}

function vocesDisponibles() {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

function elegirVozFonomundos() {
  if (!('speechSynthesis' in window)) return null
  prepararMotorVoz()
  const voces = vocesDisponibles()
  if (!voces.length) return vozElegida

  const manual = localStorage.getItem(VOZ_MANUAL_KEY) === '1'
  const guardada = localStorage.getItem(VOZ_PREFERIDA_KEY)
  if (guardada) {
    const vozGuardada = voces.find((v) => v.name === guardada)
    const guardadaFiable = vozGuardada && puntuarVoz(vozGuardada) >= 250
    if (vozGuardada && (manual || guardadaFiable)) {
      vozElegida = vozGuardada
      return vozElegida
    }
    if (!manual) localStorage.removeItem(VOZ_PREFERIDA_KEY)
  }

  const puntuadas = voces
    .map((voz) => ({ voz, score: puntuarVoz(voz) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (puntuadas.length) {
    vozElegida = puntuadas[0].voz
    localStorage.setItem(VOZ_PREFERIDA_KEY, vozElegida.name)
    return vozElegida
  }

  const espanolasNoFemeninas = voces.filter((v) => {
    const lang = normalizar(v.lang)
    return lang.startsWith('es') && !pareceVozFemenina(v)
  })
  vozElegida = espanolasNoFemeninas.find((v) => normalizar(v.lang).startsWith('es-es')) ?? espanolasNoFemeninas[0] ?? null
  if (vozElegida) localStorage.setItem(VOZ_PREFERIDA_KEY, vozElegida.name)
  return vozElegida
}

function elegirVozFallbackEspanola() {
  if (!('speechSynthesis' in window)) return null
  const voces = vocesDisponibles()
  return voces.find((v) => normalizar(v.lang).startsWith('es-es')) ??
    voces.find((v) => normalizar(v.lang).startsWith('es')) ??
    null
}

export function listarVoces() {
  return vocesDisponibles()
    .filter((v) => normalizar(v.lang).startsWith('es'))
    .map((v) => ({
      name: v.name,
      lang: v.lang,
      masculina: esVozMasculina(v),
      femenina: pareceVozFemenina(v),
      score: puntuarVoz(v),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

export function getVozPreferida() {
  return localStorage.getItem(VOZ_PREFERIDA_KEY) || ''
}

export function setVozPreferida(nombre: string) {
  if (!nombre) {
    localStorage.removeItem(VOZ_PREFERIDA_KEY)
    localStorage.removeItem(VOZ_MANUAL_KEY)
    vozElegida = null
    elegirVozFonomundos()
    return
  }
  localStorage.setItem(VOZ_PREFERIDA_KEY, nombre)
  localStorage.setItem(VOZ_MANUAL_KEY, '1')
  vozElegida = vocesDisponibles().find((v) => v.name === nombre) ?? null
}

export function probarVoz(nombre?: string) {
  if (!('speechSynthesis' in window)) return
  prepararMotorVoz()
  window.speechSynthesis.cancel()
  const voces = vocesDisponibles()
  const voz = nombre ? voces.find((v) => v.name === nombre) : elegirVozFonomundos()
  const u = new SpeechSynthesisUtterance('Hola, soy la voz de FonoMundos.')
  if (voz) u.voice = voz
  u.lang = voz?.lang || 'es-ES'
  u.rate = VELOCIDAD_COMUNIDAD
  u.pitch = pitchPara(voz, !voz)
  window.speechSynthesis.resume()
  window.speechSynthesis.speak(u)
}

if ('speechSynthesis' in window) {
  window.addEventListener('pointerdown', prepararMotorVoz, { once: true, passive: true })
  window.addEventListener('touchend', prepararMotorVoz, { once: true, passive: true })
  window.speechSynthesis.onvoiceschanged = () => {
    vozElegida = null
    elegirVozFonomundos()
  }
}

function cancelarVoz() {
  sequenceToken += 1
  if (speakTimer !== null) {
    window.clearTimeout(speakTimer)
    speakTimer = null
  }
  if (sequenceTimer !== null) {
    window.clearTimeout(sequenceTimer)
    sequenceTimer = null
  }
  window.speechSynthesis.cancel()
}

function crearUtterance(texto: string, opciones: OpcionesVoz = {}) {
  const u = new SpeechSynthesisUtterance(texto)
  const voz = elegirVozFonomundos()
  const fallback = voz ? null : elegirVozFallbackEspanola()
  if (voz || fallback) {
    u.voice = voz ?? fallback!
  }
  if (!voz) {
    avisarVozFallback(fallback)
  }
  u.lang = voz?.lang ?? fallback?.lang ?? 'es-ES'
  u.rate = opciones.rate ?? VELOCIDAD_COMUNIDAD
  u.pitch = opciones.pitch ?? pitchPara(voz ?? fallback, !voz)
  return u
}

export function hablar(texto: string, opciones: OpcionesVoz = {}) {
  if (!activada || !('speechSynthesis' in window)) return
  prepararMotorVoz()
  const ahora = Date.now()
  if (opciones.dedupe !== false && texto === ultimaLocucion && ahora - ultimaLocucionAt < DEDUPE_LOCUCION_MS) return
  ultimaLocucion = texto
  ultimaLocucionAt = ahora

  sequenceToken += 1
  if (speakTimer !== null) {
    window.clearTimeout(speakTimer)
    speakTimer = null
  }
  if (sequenceTimer !== null) {
    window.clearTimeout(sequenceTimer)
    sequenceTimer = null
  }
  // Cancelar y esperar un tick antes de hablar (fix bug Chrome que silencia después de cancel)
  window.speechSynthesis.cancel()
  const speak = (intentos = 0) => {
    if (!window.speechSynthesis.getVoices().length && intentos < 8) {
      speakTimer = window.setTimeout(() => speak(intentos + 1), 250)
      return
    }
    speakTimer = null
    const u = crearUtterance(texto, opciones)
    window.speechSynthesis.resume()
    window.speechSynthesis.speak(u)
  }
  // Pequeño delay para asegurar que cancel() ha procesado
  if (window.speechSynthesis.speaking) {
    speakTimer = window.setTimeout(speak, 120)
  } else {
    speak()
  }
}

export function hablarLento(texto: string) {
  hablar(texto, { rate: VELOCIDAD_LENTA })
}

export function hablarMuyLento(texto: string) {
  hablar(texto, { rate: VELOCIDAD_PARTES })
}

export function hablarSecuencia(partes: string[], pausaMs = 650, opciones: OpcionesVoz = {}) {
  if (!activada || !('speechSynthesis' in window)) return
  const limpias = partes.map((p) => p.trim()).filter(Boolean)
  if (!limpias.length) return
  prepararMotorVoz()
  cancelarVoz()
  const token = sequenceToken

  const hablarParte = (idx: number, intentos = 0) => {
    if (token !== sequenceToken) return
    if (!window.speechSynthesis.getVoices().length && intentos < 8) {
      sequenceTimer = window.setTimeout(() => hablarParte(idx, intentos + 1), 250)
      return
    }
    sequenceTimer = null
    const u = crearUtterance(limpias[idx], {
      rate: opciones.rate ?? VELOCIDAD_LENTA,
      pitch: opciones.pitch,
    })
    u.onend = () => {
      if (token !== sequenceToken) return
      if (idx + 1 >= limpias.length) return
      sequenceTimer = window.setTimeout(() => hablarParte(idx + 1), pausaMs)
    }
    u.onerror = () => {
      if (token !== sequenceToken) return
      if (idx + 1 >= limpias.length) return
      sequenceTimer = window.setTimeout(() => hablarParte(idx + 1), pausaMs)
    }
    window.speechSynthesis.resume()
    window.speechSynthesis.speak(u)
  }

  hablarParte(0)
}

export function hablarPartes(partes: string[]) {
  hablarSecuencia(partes, 850, { rate: VELOCIDAD_PARTES })
}
