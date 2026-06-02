// ============================================================================
// FonoMundos · Sistema de feedback de la comunidad
// Flujo: comunidad reporta → Supabase → Jose copia para Claude → auditoría → mejoras
// ============================================================================

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

async function insertarRemoto(entry: Omit<FeedbackEntry, 'id' | 'created_at'>): Promise<boolean> {
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
  try {
    const res = await fetch(apiUrl())
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

// ---------- Storage local (fallback sin internet) ----------
function guardarLocal(entry: Omit<FeedbackEntry, 'id' | 'created_at'>) {
  try {
    const prev: FeedbackEntry[] = JSON.parse(localStorage.getItem(KEY_LOCAL) || '[]')
    prev.push({ ...entry, id: Date.now().toString(36), created_at: new Date().toISOString() })
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
  const entry = { actividad, item_actual, tipo, mensaje, version: VERSION }
  guardarLocal(entry)
  const [remoto] = await Promise.all([
    insertarRemoto(entry),
    alertarTelegram(entry),
  ])
  return { supabase: remoto }
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
