import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_PIN = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN || 'logoped49'
const ADMIN_PINES = new Set([ADMIN_PIN, 'logoped49', '1949', 'jose49'].map((pin) => pin.trim().toLowerCase()))
const REVIEW_ACTIVIDAD = 'admin-review'
const REVIEW_TIPO = 'analytics'

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

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

function text(value: unknown, fallback = '', max = 400) {
  const s = typeof value === 'string' ? value : value == null ? '' : String(value)
  return (s.trim() || fallback).slice(0, max)
}

function parseBody(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>
  return {}
}

async function readReviews() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('feedback')
    .select('id, created_at, item_actual, mensaje, version')
    .eq('actividad', REVIEW_ACTIVIDAD)
    .eq('tipo', REVIEW_TIPO)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) return []
  return (data ?? []).map((row) => {
    try {
      const parsed = JSON.parse(String(row.mensaje ?? '{}'))
      return {
        id: row.id,
        created_at: row.created_at,
        feedbackId: row.item_actual,
        ...parsed,
      }
    } catch {
      return null
    }
  }).filter(Boolean)
}

async function writeReview(body: Record<string, unknown>) {
  if (!supabase) return false
  const feedbackId = text(body.feedbackId, '', 120)
  const status = text(body.status, 'confirmado', 40)
  if (!feedbackId) return false

  const payload = {
    feedbackId,
    status,
    note: text(body.note, '', 500),
    reviewedAt: new Date().toISOString(),
  }

  const { error } = await supabase.from('feedback').insert({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    actividad: REVIEW_ACTIVIDAD,
    item_actual: feedbackId,
    tipo: REVIEW_TIPO,
    mensaje: JSON.stringify(payload),
    version: 'admin-review-0.1',
  })

  return !error
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pin')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!authorized(req)) return res.status(401).json({ error: 'PIN requerido' })

  if (req.method === 'GET') {
    return res.status(200).json(await readReviews())
  }

  if (req.method === 'POST') {
    const ok = await writeReview(parseBody(req))
    if (!ok) return res.status(500).json({ ok: false })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
