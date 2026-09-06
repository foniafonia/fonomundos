// Vercel Serverless Function (Node.js) — feedback de la comunidad
// POST /api/feedback  → guarda un reporte
// GET  /api/feedback  → devuelve todos los reportes solo al panel admin

import { put, list } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BLOB_PATHNAME = 'feedback/fonomundos.json'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_PIN = process.env.ADMIN_PIN
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
  proyecto?: string
}

function valueFromQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function authorized(req: VercelRequest) {
  if (!ADMIN_PIN) return false
  const pin = (
    valueFromQuery(req.query.pin) ||
    req.headers['x-admin-pin'] ||
    ''
  ).toString().trim().toLowerCase()
  return pin === ADMIN_PIN.trim().toLowerCase()
}

/** Sin proyecto declarado, es FonoMundos: así lo ya guardado no cambia. */
const PROYECTO_POR_DEFECTO = 'fonomundos'

/** Códigos de PostgREST/Postgres para "esa columna no existe". */
const FALTA_COLUMNA = ['PGRST204', '42703']

function limpiarProyecto(valor: unknown): string {
  const s = String(valor ?? '').trim().toLowerCase()
  // Nombre corto y sin sorpresas: se usa para filtrar y para pintar pestañas.
  return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(s) ? s : PROYECTO_POR_DEFECTO
}

async function leerSupabase(proyecto?: string): Promise<FeedbackEntry[] | null> {
  if (!supabase) return null

  const consulta = (conProyecto: boolean) => {
    let q = supabase!
      .from('feedback')
      .select(`id, created_at, actividad, item_actual, tipo, mensaje, version${conProyecto ? ', proyecto' : ''}`)
      .neq('tipo', 'analytics')
      .order('created_at', { ascending: false })
    if (conProyecto && proyecto) q = q.eq('proyecto', proyecto)
    return q
  }

  let { data, error } = await consulta(true)
  // La columna se añade con una migración que puede no estar aplicada todavía.
  // Sin esto, el monitor se quedaría en blanco hasta ejecutarla a mano.
  if (error && FALTA_COLUMNA.includes(error.code)) ({ data, error } = await consulta(false))
  if (error) return null

  return (data ?? []).map((r) => ({
    id: r.id,
    ts: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    actividad: r.actividad,
    item_actual: r.item_actual ?? '',
    tipo: r.tipo,
    mensaje: r.mensaje ?? '',
    version: r.version ?? '',
    proyecto: r.proyecto ?? PROYECTO_POR_DEFECTO,
  }))
}

async function guardarSupabase(body: Partial<FeedbackEntry> & Omit<FeedbackEntry, 'id' | 'ts'>): Promise<boolean> {
  if (!supabase) return false

  const fila = {
    id: body.id,
    actividad: body.actividad,
    item_actual: body.item_actual,
    tipo: body.tipo,
    mensaje: body.mensaje,
    version: body.version,
  }

  let { error } = await supabase
    .from('feedback')
    .insert({ ...fila, proyecto: limpiarProyecto(body.proyecto) })

  // Mismo motivo: si la columna aún no existe, se guarda igual. Un reporte
  // perdido no se recupera; la etiqueta del proyecto sí se puede poner después.
  if (error && FALTA_COLUMNA.includes(error.code)) ({ error } = await supabase.from('feedback').insert(fila))

  if (error?.code === '23505') return true
  return !error
}

async function leerTodo(proyecto?: string): Promise<FeedbackEntry[]> {
  const supabaseEntries = await leerSupabase(proyecto)
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pin')

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
    if (!ADMIN_PIN) return res.status(503).json({ error: 'ADMIN_PIN no configurado' })
    if (!authorized(req)) return res.status(401).json({ error: 'PIN requerido' })
    // ?proyecto=melilla para ver solo ese; sin parámetro, se ve todo junto.
    const filtro = valueFromQuery(req.query.proyecto)
    const entries = await leerTodo(filtro ? limpiarProyecto(filtro) : undefined)
    return res.status(200).json(entries)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
