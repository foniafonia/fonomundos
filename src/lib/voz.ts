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
  // Cancelar y esperar un tick antes de hablar (fix bug Chrome que silencia después de cancel)
  window.speechSynthesis.cancel()
  const speak = () => {
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = 'es-ES'
    u.rate = 0.95
    u.pitch = 1.05
    window.speechSynthesis.speak(u)
  }
  // Pequeño delay para asegurar que cancel() ha procesado
  if (window.speechSynthesis.speaking) {
    setTimeout(speak, 120)
  } else {
    speak()
  }
}
