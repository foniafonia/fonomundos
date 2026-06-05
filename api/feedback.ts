// Vercel Serverless Function (Node.js) — feedback de la comunidad
// POST /api/feedback  → guarda un reporte
// GET  /api/feedback  → devuelve todos los reportes

import { put, list } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BLOB_PATHNAME = 'feedback/fonomundos.json'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

interface FeedbackEntry {
  id: string
  ts: number
  actividad: string
  item_actual: string
  tipo: string
  mensaje: string
  version: string
}

async function leerSupabase(): Promise<FeedbackEntry[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('feedback')
    .select('id, created_at, actividad, item_actual, tipo, mensaje, version')
    .order('created_at', { ascending: false })
  if (error) return null
  return (data ?? []).map((r) => ({
    id: r.id,
    ts: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    actividad: r.actividad,
    item_actual: r.item_actual ?? '',
    tipo: r.tipo,
    mensaje: r.mensaje ?? '',
    version: r.version ?? '',
  }))
}

async function guardarSupabase(body: Partial<FeedbackEntry> & Omit<FeedbackEntry, 'id' | 'ts'>): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('feedback').insert({
    id: body.id,
    actividad: body.actividad,
    item_actual: body.item_actual,
    tipo: body.tipo,
    mensaje: body.mensaje,
    version: body.version,
  })
  if (error?.code === '23505') return true
  return !error
}

async function leerTodo(): Promise<FeedbackEntry[]> {
  const supabaseEntries = await leerSupabase()
  if (supabaseEntries) return supabaseEntries

  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME })
    if (!blobs.length) return []
    const res = await fetch(blobs[0].downloadUrl)
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

async function guardarTodo(entries: FeedbackEntry[]) {
  const json = JSON.stringify(entries)
  await put(BLOB_PATHNAME, json, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,   // ← fix: permitir sobrescribir el archivo
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    try {
      const body = req.body as Partial<FeedbackEntry> & Omit<FeedbackEntry, 'id' | 'ts'>
      const guardadoEnSupabase = await guardarSupabase(body)
      if (guardadoEnSupabase) return res.status(200).json({ ok: true, storage: 'supabase' })

      const entry: FeedbackEntry = {
        id: body.id ?? Math.random().toString(36).slice(2) + Date.now().toString(36),
        ts: Date.now(),
        ...body,
      }
      const prev = await leerTodo()
      await guardarTodo([...prev, entry])
      return res.status(200).json({ ok: true, total: prev.length + 1 })
    } catch (e) {
      return res.status(500).json({ error: String(e) })
    }
  }

  if (req.method === 'GET') {
    const entries = await leerTodo()
    return res.status(200).json(entries)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
