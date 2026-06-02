let activada = true

export function setVoz(v: boolean) {
  activada = v
  if (!v && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function vozActivada() {
  return activada
}

export function hablar(texto: string) {
  if (!activada || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'es-ES'
  u.rate = 0.95
  u.pitch = 1.05
  window.speechSynthesis.speak(u)
}
