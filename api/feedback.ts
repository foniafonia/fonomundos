// Vercel Serverless Function — guarda y lee feedback de la comunidad
// POST /api/feedback  → guarda un reporte
// GET  /api/feedback  → devuelve todos los reportes (para auditoría)

import { put, list, getDownloadUrl } from '@vercel/blob'

const BLOB_KEY = 'feedback/fonomundos.json'

interface FeedbackEntry {
  id: string
  ts: number
  actividad: string
  item_actual: string
  tipo: string
  mensaje: string
  version: string
}

async function leerTodo(): Promise<FeedbackEntry[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    if (!blobs.length) return []
    const url = getDownloadUrl(blobs[0].url)
    const res = await fetch(url)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function guardarTodo(entries: FeedbackEntry[]) {
  const json = JSON.stringify(entries, null, 2)
  await put(BLOB_KEY, json, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  if (req.method === 'POST') {
    try {
      const body = await req.json() as Omit<FeedbackEntry, 'id' | 'ts'>
      const entry: FeedbackEntry = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        ts: Date.now(),
        ...body,
      }
      const prev = await leerTodo()
      await guardarTodo([...prev, entry])
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
    }
  }

  if (req.method === 'GET') {
    const entries = await leerTodo()
    return new Response(JSON.stringify(entries), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = { runtime: 'edge' }
