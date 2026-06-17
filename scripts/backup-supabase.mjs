import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OUT_DIR = process.env.BACKUP_DIR || 'backup-output'
const PAGE_SIZE = 1000

const TABLES = [
  'profesionales',
  'pacientes',
  'sesiones',
  'feedback',
]

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY para crear el backup.')
}

const baseUrl = SUPABASE_URL.replace(/\/$/, '')

async function fetchTable(table) {
  const rows = []
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1
    const res = await fetch(`${baseUrl}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${to}`,
      },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`No se pudo exportar ${table}: ${res.status} ${body}`)
    }

    const batch = await res.json()
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

await mkdir(OUT_DIR, { recursive: true })

const generatedAt = new Date().toISOString()
const manifest = {
  app: 'fonomundos',
  generatedAt,
  tables: {},
}

for (const table of TABLES) {
  const rows = await fetchTable(table)
  manifest.tables[table] = { rows: rows.length }
  await writeFile(path.join(OUT_DIR, `${table}.json`), JSON.stringify(rows, null, 2))
  console.log(`${table}: ${rows.length} filas`)
}

await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

const summary = [
  '# Backup FonoMundos',
  '',
  `Generado: ${generatedAt}`,
  '',
  ...TABLES.map((table) => `- ${table}: ${manifest.tables[table].rows} filas`),
  '',
  'Contenido cifrado antes de subirse como artefacto de GitHub Actions.',
  '',
].join('\n')

await writeFile(path.join(OUT_DIR, 'RESUMEN.md'), summary)
