let activada = true
let vozElegida: SpeechSynthesisVoice | null = null
let speakTimer: number | null = null
let ultimaLocucion = ''
let ultimaLocucionAt = 0
const VOZ_PREFERIDA_KEY = 'fonomundos.vozPreferida'
const VOZ_PRINCIPAL = 'Google español'
const VOZ_PRINCIPAL_LANG = 'es-ES'

const VOCES_MASCULINAS = [
  'google español',
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

function elegirVozFonomundos() {
  if (!('speechSynthesis' in window)) return null
  const voces = window.speechSynthesis.getVoices()
  if (!voces.length) return vozElegida

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

  const guardada = localStorage.getItem(VOZ_PREFERIDA_KEY)
  if (guardada) {
    const vozGuardada = voces.find((v) => v.name === guardada)
    if (vozGuardada && !pareceVozFemenina(vozGuardada)) {
      vozElegida = vozGuardada
      return vozElegida
    }
    localStorage.removeItem(VOZ_PREFERIDA_KEY)
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
    if (voz) u.voice = voz
    u.lang = 'es-ES'
    u.rate = 0.95
    u.pitch = 1
    window.speechSynthesis.speak(u)
  }
  // Pequeño delay para asegurar que cancel() ha procesado
  if (window.speechSynthesis.speaking) {
    speakTimer = window.setTimeout(speak, 120)
  } else {
    speak()
  }
}
