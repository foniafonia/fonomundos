let activada = true
let vozElegida: SpeechSynthesisVoice | null = null
const VOZ_PREFERIDA_KEY = 'fonomundos.vozPreferida'

const VOCES_MASCULINAS = [
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

function elegirVozMasculina() {
  if (!('speechSynthesis' in window)) return null
  const voces = window.speechSynthesis.getVoices()
  if (!voces.length) return vozElegida

  const guardada = localStorage.getItem(VOZ_PREFERIDA_KEY)
  if (guardada) {
    const vozGuardada = voces.find((v) => v.name === guardada)
    if (vozGuardada) {
      vozElegida = vozGuardada
      return vozElegida
    }
  }

  const preferidas = voces.filter((v) => {
    const nombre = normalizar(v.name)
    const lang = normalizar(v.lang)
    return lang.startsWith('es') && VOCES_MASCULINAS.some((voz) => nombre.includes(normalizar(voz)))
  })
  if (preferidas.length) {
    vozElegida =
      preferidas.find((v) => normalizar(v.name).includes('jorge')) ??
      preferidas.find((v) => normalizar(v.lang).startsWith('es-es')) ??
      preferidas[0]
    localStorage.setItem(VOZ_PREFERIDA_KEY, vozElegida.name)
    return vozElegida
  }

  const espanolasNoFemeninas = voces.filter((v) => {
    const nombre = normalizar(v.name)
    const lang = normalizar(v.lang)
    return lang.startsWith('es') && !VOCES_FEMENINAS.some((voz) => nombre.includes(normalizar(voz)))
  })
  vozElegida = espanolasNoFemeninas.find((v) => normalizar(v.lang).startsWith('es-es')) ?? espanolasNoFemeninas[0] ?? null
  if (vozElegida) localStorage.setItem(VOZ_PREFERIDA_KEY, vozElegida.name)
  return vozElegida
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    vozElegida = null
    elegirVozMasculina()
  }
}

export function hablar(texto: string) {
  if (!activada || !('speechSynthesis' in window)) return
  // Cancelar y esperar un tick antes de hablar (fix bug Chrome que silencia después de cancel)
  window.speechSynthesis.cancel()
  const speak = () => {
    const u = new SpeechSynthesisUtterance(texto)
    const voz = elegirVozMasculina()
    if (voz) u.voice = voz
    u.lang = 'es-ES'
    u.rate = voz ? 0.95 : 0.92
    u.pitch = voz ? 1 : 0.82
    window.speechSynthesis.speak(u)
  }
  // Pequeño delay para asegurar que cancel() ha procesado
  if (window.speechSynthesis.speaking) {
    setTimeout(speak, 120)
  } else {
    speak()
  }
}
