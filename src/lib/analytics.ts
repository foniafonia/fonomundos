import type { Sesion } from '../types'

const VERSION = '0.2.0'
const VISITOR_KEY = 'fonomundos.analytics.visitor'
const LOCAL_KEY = 'fonomundos.analytics.local'

export type EventoUso =
  | 'app_abierta'
  | 'vista_cambiada'
  | 'modo_invitado'
  | 'login_abierto'
  | 'login_ok'
  | 'cuenta_detectada'
  | 'paciente_seleccionado'
  | 'actividad_iniciada'
  | 'actividad_terminada'
  | 'feedback_enviado'

export interface AnalyticsContext {
  professionalId?: string | null
  patientId?: string | null
}

function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function getVisitorId() {
  try {
    const prev = localStorage.getItem(VISITOR_KEY)
    if (prev) return prev
    const id = uuid()
    localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return 'anonimo'
  }
}

function getSessionId() {
  try {
    const key = 'fonomundos.analytics.session'
    const prev = sessionStorage.getItem(key)
    if (prev) return prev
    const id = uuid()
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return uuid()
  }
}

function deviceInfo() {
  if (typeof window === 'undefined') return {}
  return {
    language: navigator.language,
    platform: navigator.platform,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
    touch: navigator.maxTouchPoints > 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

function keepLocal(payload: Record<string, unknown>) {
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    const next = Array.isArray(prev) ? [payload, ...prev].slice(0, 200) : [payload]
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  } catch {
    // La analitica nunca debe bloquear el uso.
  }
}

function isLocalhost() {
  return typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

export function registrarEventoUso(
  event: EventoUso,
  details: Record<string, unknown> = {},
  context: AnalyticsContext = {},
) {
  if (typeof window === 'undefined') return

  const payload = {
    id: uuid(),
    ts: Date.now(),
    event,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    professionalId: context.professionalId ?? null,
    patientId: context.patientId ?? null,
    path: `${window.location.pathname}${window.location.hash}`,
    referrer: document.referrer || '',
    device: deviceInfo(),
    details,
    version: VERSION,
  }

  keepLocal(payload)
  if (isLocalhost()) return

  try {
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon('/api/analytics', blob)) return
    }
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    // Silencioso: el juego y el guardado clinico mandan.
  }
}

export function resumenSesionAnalytics(sesion: Sesion, actividadFallback?: string) {
  const resultados = sesion.resultados ?? []
  const aciertos = resultados.filter((r) => r.acierto).length
  const errores = resultados.length - aciertos
  const actividadId = resultados[0]?.actividadId ?? actividadFallback ?? 'sin-actividad'
  const ayudas = resultados.filter((r) => r.ayudaUsada).length
  const intentos = resultados.reduce((acc, r) => acc + (r.intentos || 0), 0)

  return {
    sesionId: sesion.id,
    actividadId,
    rondas: resultados.length,
    aciertos,
    errores,
    ayudas,
    intentos,
    duracionMs: Math.max(0, sesion.fin - sesion.inicio),
    modoEvaluacion: !!sesion.modoEvaluacion,
  }
}
