/**
 * FonoMundos — Monitor de Salud Arquitectónica
 * Ejecutar: npm run salud
 *
 * Escanea src/ y detecta:
 * - Archivos demasiado grandes (>300 líneas)
 * - Demasiadas dependencias (>10 imports)
 * - Responsabilidades mezcladas (imports de módulos distintos)
 * - Riesgos futuros
 *
 * Actualiza automáticamente la sección SALUD ARQUITECTÓNICA en docs/ARQUITECTURA.md
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const ARCH_FILE = join(ROOT, 'docs', 'ARQUITECTURA.md')

// Umbrales
const UMBRAL_LINEAS = 300
const UMBRAL_IMPORTS = 10
const UMBRAL_CRITICO_LINEAS = 500

// Módulos y sus carpetas/patrones
const MODULOS: Record<string, string[]> = {
  plataforma: ['supabase', 'storageCloud', 'storage', 'useSesion', 'AuthScreen', 'PanelProfesional', 'migrar'],
  contenido: ['guia', 'actividades', 'palabras', 'Policubos', 'Cadena', 'JugarActividad', 'DetectarRima', 'RAN', 'Pseudopalabras', 'Manipulacion', 'UnirParejas', 'Clasificar', 'BuscaSonido', 'Crear', 'OrdenarFrase', 'EmparejarOracion', 'Mundo1', 'Mundo2', 'cadenaValidacion', 'adaptacion'],
  metricas: ['scoring', 'normas', 'RadarIndices', 'Logopeda'],
  ui: ['index.css', 'NavBar', 'Disclaimer', 'Personaje', 'voz', 'modoEvaluacion', 'accesibilidad', 'Landing', 'QueesFonomundos', 'PanelAccesibilidad'],
  comunidad: ['feedback', 'Comunidad', 'Admin', 'FeedbackBtn', 'FeedbackLogopeda'],
  ia: ['adaptacion'],
}

interface FileInfo {
  path: string
  rel: string
  lines: number
  imports: number
  importedModules: string[]
  mixedModules: string[]
}

function getFiles(dir: string, ext = ['.tsx', '.ts']): string[] {
  const result: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (entry.startsWith('.') || entry === 'node_modules') continue
      if (statSync(full).isDirectory()) result.push(...getFiles(full, ext))
      else if (ext.some(e => entry.endsWith(e))) result.push(full)
    }
  } catch { /* skip */ }
  return result
}

function detectModule(filename: string): string {
  for (const [mod, patterns] of Object.entries(MODULOS)) {
    if (patterns.some(p => filename.includes(p))) return mod
  }
  return 'sin_módulo'
}

function analyzeFile(filepath: string): FileInfo {
  const content = readFileSync(filepath, 'utf-8')
  const lines = content.split('\n').length
  const importLines = content.match(/^import .+ from .+/gm) || []
  const imports = importLines.length
  const rel = relative(ROOT, filepath)

  // Detectar módulos de los que importa
  const importedModules = new Set<string>()
  for (const imp of importLines) {
    const match = imp.match(/from ['"](.+)['"]/)
    if (match) {
      const mod = detectModule(match[1])
      if (mod !== 'sin_módulo') importedModules.add(mod)
    }
  }

  // El módulo propio del archivo
  const ownModule = detectModule(rel)
  const mixed = [...importedModules].filter(m => m !== ownModule && m !== 'sin_módulo')

  return { path: filepath, rel, lines, imports, importedModules: [...importedModules], mixedModules: mixed }
}

function severity(f: FileInfo): '🔴' | '🟡' | '🟢' {
  if (f.lines > UMBRAL_CRITICO_LINEAS) return '🔴'
  if (f.lines > UMBRAL_LINEAS || f.imports > UMBRAL_IMPORTS || f.mixedModules.length > 2) return '🟡'
  return '🟢'
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

const files = getFiles(SRC).map(analyzeFile)
const problemas = files.filter(f => severity(f) !== '🟢').sort((a, b) => b.lines - a.lines)
const ok = files.filter(f => severity(f) === '🟢').length
const total = files.length

console.log(`\n📊 FonoMundos — Salud Arquitectónica`)
console.log(`   ${total} archivos analizados · ${ok} OK · ${problemas.length} con alertas\n`)

if (problemas.length === 0) {
  console.log('✅ Arquitectura saludable — sin alertas')
} else {
  for (const f of problemas) {
    const sev = severity(f)
    const issues = []
    if (f.lines > UMBRAL_CRITICO_LINEAS) issues.push(`🚨 ${f.lines} líneas (crítico)`)
    else if (f.lines > UMBRAL_LINEAS) issues.push(`📏 ${f.lines} líneas`)
    if (f.imports > UMBRAL_IMPORTS) issues.push(`📦 ${f.imports} imports`)
    if (f.mixedModules.length > 2) issues.push(`🔀 mezcla: ${f.mixedModules.join(', ')}`)
    console.log(`${sev} ${f.rel}`)
    console.log(`   ${issues.join(' · ')}`)
  }
}

// ── GENERAR SECCIÓN MARKDOWN ──────────────────────────────────────────────────

const ahora = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

let seccion = `\n---\n\n## SALUD ARQUITECTÓNICA\n\n`
seccion += `> Generado automáticamente por \`npm run salud\` · ${ahora}\n`
seccion += `> ${total} archivos · ${ok} OK · ${problemas.length} con alertas · Umbrales: ${UMBRAL_LINEAS} líneas / ${UMBRAL_IMPORTS} imports\n\n`

if (problemas.length === 0) {
  seccion += `### ✅ Arquitectura saludable\n\nNingún archivo supera los umbrales definidos.\n`
} else {
  const criticos = problemas.filter(f => severity(f) === '🔴')
  const advertencias = problemas.filter(f => severity(f) === '🟡')

  if (criticos.length > 0) {
    seccion += `### 🔴 Críticos (acción inmediata)\n\n`
    for (const f of criticos) {
      seccion += `**\`${f.rel}\`** — ${f.lines} líneas`
      if (f.imports > UMBRAL_IMPORTS) seccion += `, ${f.imports} imports`
      if (f.mixedModules.length > 0) seccion += `, mezcla módulos: \`${f.mixedModules.join('`, `')}\``
      seccion += `\n`
    }
    seccion += '\n'
  }

  if (advertencias.length > 0) {
    seccion += `### 🟡 Advertencias (vigilar)\n\n`
    for (const f of advertencias) {
      const issues = []
      if (f.lines > UMBRAL_LINEAS) issues.push(`${f.lines} líneas`)
      if (f.imports > UMBRAL_IMPORTS) issues.push(`${f.imports} imports`)
      if (f.mixedModules.length > 1) issues.push(`mezcla: \`${f.mixedModules.join('`, `')}\``)
      seccion += `- \`${f.rel}\` — ${issues.join(' · ')}\n`
    }
    seccion += '\n'
  }
}

// Estadísticas por módulo
seccion += `### 📊 Estadísticas por módulo\n\n`
seccion += `| Módulo | Archivos | Líneas totales | Archivo más grande |\n`
seccion += `|---|---|---|---|\n`
for (const mod of Object.keys(MODULOS)) {
  const modFiles = files.filter(f => detectModule(f.rel) === mod)
  if (modFiles.length === 0) continue
  const totalLines = modFiles.reduce((s, f) => s + f.lines, 0)
  const biggest = modFiles.sort((a, b) => b.lines - a.lines)[0]
  seccion += `| \`${mod}\` | ${modFiles.length} | ${totalLines} | \`${biggest.rel}\` (${biggest.lines}l) |\n`
}

// Refactorizaciones recomendadas
seccion += `\n### 🔧 Refactorizaciones recomendadas\n\n`
const recs = problemas.filter(f => f.lines > UMBRAL_LINEAS || f.mixedModules.length > 1)
if (recs.length === 0) {
  seccion += `Ninguna en este momento.\n`
} else {
  for (const f of recs.slice(0, 5)) {
    if (f.lines > UMBRAL_CRITICO_LINEAS) {
      seccion += `- **\`${f.rel}\`** — Dividir en submódulos (${f.lines} líneas)\n`
    } else if (f.mixedModules.length > 1) {
      seccion += `- **\`${f.rel}\`** — Separar responsabilidades: importa de \`${f.mixedModules.join('`, `')}\`\n`
    } else {
      seccion += `- **\`${f.rel}\`** — Revisar crecimiento (${f.lines} líneas)\n`
    }
  }
}

seccion += `\n### 📅 Historial de salud\n\n`
seccion += `| Fecha | Archivos | Críticos | Advertencias |\n`
seccion += `|---|---|---|---|\n`
seccion += `| ${ahora} | ${total} | ${problemas.filter(f => severity(f) === '🔴').length} | ${problemas.filter(f => severity(f) === '🟡').length} |\n`
seccion += `\n*Para añadir al historial, ejecutar \`npm run salud\` periódicamente.*\n`

// ── ACTUALIZAR ARQUITECTURA.md ────────────────────────────────────────────────

const arch = readFileSync(ARCH_FILE, 'utf-8')
const marcador = '\n---\n\n## SALUD ARQUITECTÓNICA'
const idx = arch.indexOf(marcador)
const base = idx >= 0 ? arch.substring(0, idx) : arch
writeFileSync(ARCH_FILE, base + seccion)

console.log(`\n✅ ARQUITECTURA.md actualizado con sección SALUD ARQUITECTÓNICA`)
