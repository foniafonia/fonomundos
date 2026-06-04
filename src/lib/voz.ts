let activada = true

export function setVoz(v: boolean) {
  activada = v
  if (!v && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function vozActivada() {
  return activada
}

/** Selecciona la mejor voz española disponible. Prioridad: Google > local es-ES > cualquier es */
function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices()
  // 1. Google español (la mejor en Chrome)
  const google = voces.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('es'))
  if (google) return google
  // 2. Voz local es-ES de alta calidad (macOS: Mónica, Jorge)
  const local = voces.find(v => v.localService && v.lang === 'es-ES')
  if (local) return local
  // 3. Cualquier es-ES
  const esEs = voces.find(v => v.lang === 'es-ES')
  if (esEs) return esEs
  // 4. Cualquier español
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
  if (window.speechSynthesis.speaking) {
    setTimeout(speak, 120)
  } else {
    speak()
  }
}
