// ============================================================================
// FonoMundos · Sistema de feedback de la comunidad
// Flujo: comunidad reporta → Supabase → Jose copia para Claude → auditoría → mejoras
// ============================================================================

import { enqueueSyncItem, getSyncQueue, markSyncFailed, removeSyncItem } from './syncQueue'
import { supabase, supabaseActivo } from './supabase'
import { registrarEventoUso } from './analytics'

export type TipoFeedback =
  | 'se_repite'
  | 'icono'
  | 'contenido'
  | 'mecanica'
  | 'no_avanza'
  | 'otro'

export const TIPOS_FEEDBACK: Record<TipoFeedback, string> = {
  se_repite:  '🔁 Se repite mucho',
  icono:      '🖼️ Icono/dibujo incorrecto',
  contenido:  '📝 Contenido erróneo',
  mecanica:   '⚙️ La actividad no funciona',
  no_avanza:  '🚫 Se queda bloqueado',
  otro:       '💬 Otro',
}

export interface FeedbackEntry {
  id?: string
  created_at?: string
  actividad: string
  item_actual: string
  tipo: TipoFeedback
  mensaje: string
  version: string
}

const VERSION = '0.2.0'
const KEY_LOCAL = 'fonomundos.feedback'
const KEY_ULTIMO_ENVIO = 'fonomundos.feedback.ultimoEnvio'

function feedbackId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function fechaEntry(entry: FeedbackEntry): string {
  const legacyTs = (entry as FeedbackEntry & { ts?: number }).ts
  return entry.created_at ?? (legacyTs ? new Date(legacyTs).toISOString() : new Date().toISOString())
}

function normalizarFeedback(entry: FeedbackEntry): FeedbackEntry {
  return {
    ...entry,
    id: entry.id ?? feedbackId(),
    created_at: fechaEntry(entry),
  }
}

// ---------- Telegram (alerta en tiempo real a Jose) ----------
async function alertarTelegram(entry: Omit<FeedbackEntry, 'id' | 'created_at'>) {
  const token = import.meta.env.VITE_TG_BOT_TOKEN as string | undefined
  const chatId = import.meta.env.VITE_TG_CHAT_ID as string | undefined
  if (!token || !chatId) return
  const tipo = TIPOS_FEEDBACK[entry.tipo]
  const texto = [
    `🐛 *Nuevo reporte FonoMundos*`,
    `📚 \`${entry.actividad}\` · *${entry.item_actual || '—'}*`,
    `🏷️ ${tipo}`,
    entry.mensaje ? `💬 _"${entry.mensaje}"_` : '',
    `🔖 v${entry.version}`,
  ].filter(Boolean).join('\n')
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' }),
    })
  } catch { /* silencioso */ }
}

// ---------- API propia (Vercel Edge Function) ----------
// En desarrollo usa localhost; en producción usa la URL de Vercel
function apiUrl() {
  return typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api/feedback'
    : '/api/feedback'
}

async function insertarRemoto(entry: FeedbackEntry): Promise<boolean> {
  if (supabaseActivo()) {
    try {
      const { error } = await supabase!.from('feedback').insert({
        id: entry.id,
        actividad: entry.actividad,
        item_actual: entry.item_actual,
        tipo: entry.tipo,
        mensaje: entry.mensaje,
        version: entry.version,
      })
      if (error?.code === '23505') return true
      if (!error) return true
    } catch { /* fallback a API */ }
  }

  try {
    const res = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    return res.ok
  } catch { return false }
}

export async function obtenerFeedbackRemoto(): Promise<FeedbackEntry[]> {
  if (supabaseActivo()) {
    try {
      const { data, error } = await supabase!
        .from('feedback')
        .select('id, created_at, actividad, item_actual, tipo, mensaje, version')
        .neq('tipo', 'analytics')
        .order('created_at', { ascending: false })
      if (!error && data) return data as FeedbackEntry[]
    } catch { /* fallback a API */ }
  }

  try {
    const res = await fetch(apiUrl())
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.map(normalizarFeedback) : []
  } catch { return [] }
}

// ---------- Storage local (fallback sin internet) ----------
function guardarLocal(entry: FeedbackEntry) {
  try {
    const prev: FeedbackEntry[] = JSON.parse(localStorage.getItem(KEY_LOCAL) || '[]')
    prev.push(normalizarFeedback(entry))
    localStorage.setItem(KEY_LOCAL, JSON.stringify(prev))
  } catch { /* sin espacio */ }
}

export function getFeedbackLocal(): FeedbackEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY_LOCAL) || '[]') } catch { return [] }
}

// ---------- API pública ----------
export async function enviarFeedback(
  actividad: string,
  item_actual: string,
  tipo: TipoFeedback,
  mensaje: string,
): Promise<{ supabase: boolean }> {
  const firma = JSON.stringify({ actividad, item_actual, tipo, mensaje: mensaje.trim() })
  try {
    const ultimo = JSON.parse(localStorage.getItem(KEY_ULTIMO_ENVIO) || 'null') as { firma: string; ts: number } | null
    if (ultimo?.firma === firma && Date.now() - ultimo.ts < 5000) return { supabase: true }
    localStorage.setItem(KEY_ULTIMO_ENVIO, JSON.stringify({ firma, ts: Date.now() }))
  } catch { /* sin localStorage: seguimos con envío normal */ }

  const entry = { id: feedbackId(), created_at: new Date().toISOString(), actividad, item_actual, tipo, mensaje, version: VERSION }
  registrarEventoUso('feedback_enviado', {
    feedbackId: entry.id,
    actividad,
    itemActual: item_actual,
    tipo,
    mensajeLongitud: mensaje.length,
  })
  guardarLocal(entry)
  const [remoto] = await Promise.all([
    insertarRemoto(entry),
    alertarTelegram(entry),
  ])
  if (!remoto) enqueueSyncItem('feedback', entry, 'No se pudo subir el feedback')
  return { supabase: remoto }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size)
  )
}

export async function sincronizarFeedbackPendiente(): Promise<{ ok: number; pendientes: number }> {
  const pendientes = getSyncQueue().filter((item) => item.kind === 'feedback')
  let ok = 0

  const chunks = chunkArray(pendientes, 10)
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(item => insertarRemoto(normalizarFeedback(item.payload as FeedbackEntry)))
    )

    results.forEach((result, idx) => {
      const item = chunk[idx]
      if (result.status === 'fulfilled' && result.value) {
        removeSyncItem(item.id)
        ok++
      } else {
        markSyncFailed(item.id, result.status === 'rejected' ? String(result.reason) : 'Fallo al insertar')
      }
    })
  }

  return { ok, pendientes: getSyncQueue().filter((item) => item.kind === 'feedback').length }
}

// ---------- Generar resumen para Claude ----------
export function generarResumenParaClaude(entries: FeedbackEntry[]): string {
  if (!entries.length) return 'No hay feedback todavía.'

  const agrupado: Partial<Record<TipoFeedback, FeedbackEntry[]>> = {}
  for (const e of entries) {
    if (!agrupado[e.tipo]) agrupado[e.tipo] = []
    agrupado[e.tipo]!.push(e)
  }

  const lineas: string[] = [
    `=== AUDITORÍA FONOMUNDOS ===`,
    `${entries.length} reportes de la comunidad`,
    `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
    ``,
  ]

  for (const [tipo, lista] of Object.entries(agrupado) as [TipoFeedback, FeedbackEntry[]][]) {
    lineas.push(`${TIPOS_FEEDBACK[tipo]} (${lista.length})`)
    // agrupar por actividad+item
    const subgrupo: Record<string, string[]> = {}
    for (const e of lista) {
      const k = `${e.actividad} · "${e.item_actual}"`
      if (!subgrupo[k]) subgrupo[k] = []
      if (e.mensaje) subgrupo[k].push(e.mensaje)
    }
    for (const [ctx, msgs] of Object.entries(subgrupo)) {
      lineas.push(`  - ${ctx}`)
      for (const m of msgs) lineas.push(`    "${m}"`)
    }
    lineas.push('')
  }

  lineas.push('=== FIN ===')
  return lineas.join('\n')
}

// ---------- Export CSV ----------
export function exportarFeedbackCSV(entries: FeedbackEntry[]) {
  if (!entries.length) return
  const cols = ['id', 'fecha', 'actividad', 'item', 'tipo', 'mensaje', 'version']
  const rows = entries.map((e) => [
    e.id, e.created_at, e.actividad, e.item_actual, e.tipo,
    `"${(e.mensaje || '').replace(/"/g, "'")}"`, e.version,
  ])
  const csv = [cols, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fonomundos-feedback-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
