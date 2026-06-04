let activada = true

export function setVoz(v: boolean) {
  activada = v
  if (!v && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function vozActivada() {
  return activada
}

// Nombre exacto de la voz preferida (confirmada por el usuario)
const VOZ_PREFERIDA = 'Google español'

/** Selecciona la voz preferida. Si no está cargada aún, espera y reintenta. */
function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices()
  // 1. Voz exacta preferida
  const exacta = voces.find(v => v.name === VOZ_PREFERIDA)
  if (exacta) return exacta
  // 2. Cualquier Google en español (fallback si el nombre varía por sistema)
  const google = voces.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('es'))
  if (google) return google
  // 3. Local es-ES (macOS: Mónica, Jorge)
  const local = voces.find(v => v.localService && v.lang === 'es-ES')
  if (local) return local
  // 4. Cualquier es-ES
  return voces.find(v => v.lang.startsWith('es')) ?? null
}

export function hablar(texto: string) {
  if (!activada || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const speak = () => {
    const u = new SpeechSynthesisUtterance(texto)
    const voz = elegirVoz()
    if (voz) { u.voice = voz; u.lang = voz.lang }
    else u.lang = 'es-ES'
    u.rate = 0.92
    u.pitch = 1.0
    window.speechSynthesis.speak(u)
  }

  // Si las voces online aún no están cargadas, esperar y reintentar
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      speak()
    }
    return
  }

  if (window.speechSynthesis.speaking) {
    setTimeout(speak, 120)
  } else {
    speak()
  }
}
