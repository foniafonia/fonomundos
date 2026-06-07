import { put, list } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BLOB_PATHNAME = 'analytics/fonomundos-events.json'
const MAX_EVENTS = 5000
const MAX_BODY_CHARS = 5000
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_PIN = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN || 'logoped49'
const ADMIN_PINES = new Set([ADMIN_PIN, 'logoped49', '1949', 'jose49'].map((pin) => pin.trim().toLowerCase()))

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

interface AnalyticsEvent {
  id: string
  ts: number
  event: string
  visitorId: string
  sessionId: string
  professionalId?: string | null
  patientId?: string | null
  path?: string
  referrer?: string
  device?: Record<string, unknown>
  details?: Record<string, unknown>
  server?: Record<string, unknown>
  version?: string
}

function valueFromQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function authorized(req: VercelRequest) {
  const pin = (
    valueFromQuery(req.query.pin) ||
    req.headers['x-admin-pin'] ||
    ''
  ).toString().trim().toLowerCase()
  return ADMIN_PINES.has(pin)
}

function parseBody(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>
  return {}
}

function text(value: unknown, fallback = '', max = 220) {
  const s = typeof value === 'string' ? value : value == null ? '' : String(value)
  const clean = s.trim()
  return (clean || fallback).slice(0, max)
}

function jsonLimit(value: unknown, max = MAX_BODY_CHARS): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  try {
    const parsed = JSON.parse(JSON.stringify(value))
    const str = JSON.stringify(parsed)
    if (str.length <= max) return parsed
    return { truncated: true, raw: str.slice(0, max) }
  } catch {
    return {}
  }
}

function normalize(req: VercelRequest): AnalyticsEvent {
  const body = parseBody(req)
  const id = text(body.id, globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, 80)
  const event = text(body.event, 'evento', 80)
  const userAgent = text(req.headers['user-agent'] || body.userAgent, '', 420)

  return {
    id,
    ts: Number(body.ts) || Date.now(),
    event,
    visitorId: text(body.visitorId, 'anonimo', 120),
    sessionId: text(body.sessionId, 'sesion', 120),
    professionalId: body.professionalId ? text(body.professionalId, '', 120) : null,
    patientId: body.patientId ? text(body.patientId, '', 120) : null,
    path: text(body.path, '', 320),
    referrer: text(body.referrer, '', 320),
    device: {
      ...jsonLimit(body.device, 1800),
      userAgent,
    },
    details: jsonLimit(body.details, 1800),
    server: {
      country: text(req.headers['x-vercel-ip-country'], '', 12),
      city: text(req.headers['x-vercel-ip-city'], '', 80),
      region: text(req.headers['x-vercel-ip-country-region'], '', 80),
    },
    version: text(body.version, '0.2.0', 40),
  }
}

function rowToEvent(row: Record<string, unknown>): AnalyticsEvent | null {
  try {
    const parsed = JSON.parse(String(row.mensaje ?? '{}'))
    return {
      ...parsed,
      id: String(row.id ?? parsed.id ?? ''),
      ts: row.created_at ? new Date(String(row.created_at)).getTime() : Number(parsed.ts) || Date.now(),
    }
  } catch {
    return null
  }
}

async function readSupabase(): Promise<AnalyticsEvent[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('feedback')
    .select('id, created_at, actividad, item_actual, tipo, mensaje, version')
    .eq('actividad', 'analytics')
    .eq('tipo', 'analytics')
    .order('created_at', { ascending: false })
    .limit(MAX_EVENTS)
  if (error) return null
  return (data ?? []).map(rowToEvent).filter(Boolean) as AnalyticsEvent[]
}

async function writeSupabase(event: AnalyticsEvent): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('feedback').insert({
    id: event.id,
    actividad: 'analytics',
    item_actual: event.event,
    tipo: 'analytics',
    mensaje: JSON.stringify(event),
    version: event.version ?? '0.2.0',
  })
  if (error?.code === '23505') return true
  return !error
}

async function readBlob(): Promise<AnalyticsEvent[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME })
    if (!blobs.length) return []
    const res = await fetch(blobs[0].downloadUrl)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function writeBlob(entries: AnalyticsEvent[]) {
  await put(BLOB_PATHNAME, JSON.stringify(entries.slice(0, MAX_EVENTS)), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

async function readAll() {
  const supabaseEntries = await readSupabase()
  if (supabaseEntries) return supabaseEntries
  return readBlob()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pin')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    try {
      const event = normalize(req)
      const saved = await writeSupabase(event)
      if (saved) return res.status(200).json({ ok: true, storage: 'supabase' })

      const prev = await readBlob()
      await writeBlob([event, ...prev])
      return res.status(200).json({ ok: true, storage: 'blob', total: Math.min(prev.length + 1, MAX_EVENTS) })
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e) })
    }
  }

  if (req.method === 'GET') {
    if (!authorized(req)) return res.status(401).json({ error: 'PIN requerido' })
    const entries = await readAll()
    return res.status(200).json(entries)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
