// Vercel Serverless Function (Node.js) — feedback de la comunidad
// POST /api/feedback  → guarda un reporte
// GET  /api/feedback  → devuelve todos los reportes

import { put, list } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BLOB_PATHNAME = 'feedback/fonomundos.json'

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
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    try {
      const body = req.body as Omit<FeedbackEntry, 'id' | 'ts'>
      const entry: FeedbackEntry = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
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
