let activada = true
let vozElegida: SpeechSynthesisVoice | null = null
let speakTimer: number | null = null
let ultimaLocucion = ''
let ultimaLocucionAt = 0
const VOZ_PREFERIDA_KEY = 'fonomundos.vozPreferida'
const VOZ_MANUAL_KEY = 'fonomundos.vozPreferidaManual'
const VOZ_PRINCIPAL = 'Google español'
const VOZ_PRINCIPAL_LANG = 'es-ES'

const VOCES_MASCULINAS = [
  'google español',
  'siri male',
  'siri hombre',
  'siri masculino',
  'siri voz 2',
  'siri voice 2',
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
]

function avisarVozFallback(voz?: SpeechSynthesisVoice | null) {
  console.warn('[FM] Voz masculina española no disponible. Usando fallback español:', voz?.name ?? 'voz por defecto del navegador')
}

export function setVoz(v: boolean) {
  activada = v
  if (!v && 'speechSynthesis' in window) window.speechSynthesis.cancel()
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

function vocesDisponibles() {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

function elegirVozFonomundos() {
  if (!('speechSynthesis' in window)) return null
  const voces = vocesDisponibles()
  if (!voces.length) return vozElegida

  const manual = localStorage.getItem(VOZ_MANUAL_KEY) === '1'
  const guardada = localStorage.getItem(VOZ_PREFERIDA_KEY)
  if (guardada) {
    const vozGuardada = voces.find((v) => v.name === guardada)
    if (vozGuardada && (manual || !pareceVozFemenina(vozGuardada))) {
      vozElegida = vozGuardada
      return vozElegida
    }
    if (!manual) localStorage.removeItem(VOZ_PREFERIDA_KEY)
  }

  const vozPrincipal = voces.find((v) => (
    normalizar(v.name) === normalizar(VOZ_PRINCIPAL) &&
    normalizar(v.lang) === normalizar(VOZ_PRINCIPAL_LANG)
  )) ?? voces.find((v) => (
    normalizar(v.name).includes(normalizar(VOZ_PRINCIPAL)) &&
    normalizar(v.lang).startsWith('es')
  ))
  if (vozPrincipal) {
    vozElegida = vozPrincipal
    localStorage.setItem(VOZ_PREFERIDA_KEY, vozElegida.name)
    return vozElegida
  }

  const preferidas = voces.filter(esVozMasculina)
  if (preferidas.length) {
    vozElegida =
      preferidas.find((v) => normalizar(v.name).includes('google espanol')) ??
      preferidas.find((v) => normalizar(v.lang).startsWith('es-es')) ??
      preferidas[0]
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
    }))
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
  window.speechSynthesis.cancel()
  const voces = vocesDisponibles()
  const voz = nombre ? voces.find((v) => v.name === nombre) : elegirVozFonomundos()
  const u = new SpeechSynthesisUtterance('Hola, soy la voz de FonoMundos.')
  if (voz) u.voice = voz
  u.lang = voz?.lang || 'es-ES'
  u.rate = 0.95
  u.pitch = voz && pareceVozFemenina(voz) ? 0.55 : 1
  window.speechSynthesis.speak(u)
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    vozElegida = null
    elegirVozFonomundos()
  }
}

export function hablar(texto: string) {
  if (!activada || !('speechSynthesis' in window)) return
  const ahora = Date.now()
  if (texto === ultimaLocucion && ahora - ultimaLocucionAt < 700) return
  ultimaLocucion = texto
  ultimaLocucionAt = ahora

  if (speakTimer !== null) {
    window.clearTimeout(speakTimer)
    speakTimer = null
  }
  // Cancelar y esperar un tick antes de hablar (fix bug Chrome que silencia después de cancel)
  window.speechSynthesis.cancel()
  const speak = (intentos = 0) => {
    if (!window.speechSynthesis.getVoices().length && intentos < 8) {
      speakTimer = window.setTimeout(() => speak(intentos + 1), 250)
      return
    }
    speakTimer = null
    const u = new SpeechSynthesisUtterance(texto)
    const voz = elegirVozFonomundos()
    const fallback = voz ? null : elegirVozFallbackEspanola()
    if (voz || fallback) {
      u.voice = voz ?? fallback!
    }
    if (!voz) {
      avisarVozFallback(fallback)
    }
    u.lang = 'es-ES'
    u.rate = 0.95
    u.pitch = voz && pareceVozFemenina(voz) ? 0.55 : voz ? 1 : 0.55
    window.speechSynthesis.speak(u)
  }
  // Pequeño delay para asegurar que cancel() ha procesado
  if (window.speechSynthesis.speaking) {
    speakTimer = window.setTimeout(speak, 120)
  } else {
    speak()
  }
}
