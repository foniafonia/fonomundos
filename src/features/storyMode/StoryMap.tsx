import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { StoryZone, TilePos } from './storyModeTypes'
import { GRID_COLS, GRID_ROWS, AVATAR_SPEED, ZONE_REACH, ZONES } from './storyModeConfig'
import { loadProgress, saveAvatarPos, markZoneVisited } from './storyModeStorage'
import VirtualJoystick from './VirtualJoystick'

// ─── World coordinates ────────────────────────────────────────────────────────
const TILE_PX = 44
const WORLD_W  = GRID_COLS * TILE_PX   // 1144
const WORLD_H  = GRID_ROWS * TILE_PX   // 968

function tx(col: number) { return col * TILE_PX }
function ty(row: number) { return row * TILE_PX }
function tileDist(a: TilePos, b: TilePos) {
  return Math.sqrt((a.col - b.col) ** 2 + (a.row - b.row) ** 2)
}

// ─── Decorative trees ────────────────────────────────────────────────────────
const TREES: { col: number; row: number; r?: number }[] = [
  { col: 7.5,  row: 4.5 }, { col: 8.8,  row: 3.8, r: 0.8 },
  { col: 14.5, row: 4.2 }, { col: 16,   row: 5.5 },
  { col: 21.5, row: 4.8 }, { col: 23,   row: 6.2, r: 0.85 },
  { col: 5,    row: 7.5 }, { col: 4,    row: 9.2, r: 0.9 },
  { col: 1,    row: 5   }, { col: 1.5,  row: 14  },
  { col: 9.5,  row: 13.5 }, { col: 16.2, row: 14.3 },
  { col: 17.8, row: 15.6, r: 0.85 }, { col: 22.8, row: 13.5 },
  { col: 21.2, row: 15.2 }, { col: 4,   row: 18.5, r: 0.9 },
  { col: 5.8,  row: 19.5 }, { col: 13.8, row: 18.5 },
  { col: 20.8, row: 18.2 }, { col: 24.8, row: 10  },
  { col: 25,   row: 4   }, { col: 6.2,  row: 3   },
  { col: 23.2, row: 18.5 }, { col: 0.8, row: 20.2 },
]

// ─── Road strips (tile rects) ─────────────────────────────────────────────────
const ROADS = [
  { c1: 0,  r1: 7,  c2: GRID_COLS, r2: 9  },  // horizontal main
  { c1: 6,  r1: 0,  c2: 8,         r2: GRID_ROWS }, // vertical 1
  { c1: 15, r1: 0,  c2: 17,        r2: GRID_ROWS }, // vertical 2
  { c1: 22, r1: 0,  c2: 24,        r2: GRID_ROWS }, // vertical 3
]

// ─── Tree SVG component ───────────────────────────────────────────────────────
function MapTree({ col, row, r = 1 }: { col: number; row: number; r?: number }) {
  const cx = tx(col), cy = ty(row)
  const cr = TILE_PX * 0.38 * r

  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={cx + 8} cy={cy + 8} rx={cr * 0.9} ry={cr * 0.45} fill="rgba(0,0,0,0.18)" />
      {/* Dark base crown */}
      <circle cx={cx} cy={cy} r={cr} fill="#2e7d32" />
      {/* Mid crown */}
      <circle cx={cx - cr * 0.08} cy={cy - cr * 0.08} r={cr * 0.85} fill="#388e3c" />
      {/* Light crown */}
      <circle cx={cx - cr * 0.22} cy={cy - cr * 0.25} r={cr * 0.62} fill="#4caf50" />
      {/* Highlight */}
      <circle cx={cx - cr * 0.34} cy={cy - cr * 0.38} r={cr * 0.32} fill="#81c784" opacity="0.72" />
    </g>
  )
}

// ─── Building component ───────────────────────────────────────────────────────
function MapBuilding({ zone, visited, isNear }: { zone: StoryZone; visited: boolean; isNear: boolean }) {
  const bx = tx(zone.position.col)
  const by = ty(zone.position.row)
  const BW = zone.bw * TILE_PX
  const BD = zone.bd * TILE_PX
  const cx = bx + BW / 2
  const bottom = by + BD     // southmost pixel of footprint

  // Facade dimensions (in front of the footprint, camera-facing)
  const FH = Math.round(zone.bh * 14 + 22)           // facade height (compact, not width-dependent)
  const RH = Math.round(BW * 0.24)                   // roof height above facade
  const wallTop = bottom - FH
  const roofPeak = wallTop - RH
  const emojiSize = Math.min(BW * 0.26, 28)

  const roofType =
    zone.id === 'carpa-bingo'     ? 'tent' :
    zone.id === 'taller-policubos' ? 'flat' :
    zone.id === 'biblioteca'       ? 'flat' :
    'pitched'

  // Window positions (upper part of facade)
  const winY = wallTop + FH * 0.14
  const winW = Math.round(BW * 0.12)
  const winH = Math.round(FH * 0.28)
  const winPositions = zone.bw >= 4
    ? [cx - BW * 0.30, cx - BW * 0.10, cx + BW * 0.10, cx + BW * 0.30]
    : [cx - BW * 0.25, cx + BW * 0.25]

  const doorW = Math.round(BW * 0.17)
  const doorH = Math.round(FH * 0.44)
  const doorY = wallTop + FH - doorH
  const gradId = `g_${zone.id}`

  return (
    <g>
      {/* Footprint ground tint */}
      <rect x={bx} y={by} width={BW} height={BD}
        fill={zone.colorTop} opacity="0.10" rx="6" />

      {/* Building soft shadow */}
      <rect x={bx + 12} y={wallTop + 14} width={BW + 6} height={FH + 6}
        fill="rgba(0,0,0,0.28)" rx="8"
        style={{ filter: 'blur(10px)' }} />

      {/* ── Roof ── */}
      {roofType === 'pitched' && (
        <>
          {/* Roof back face (depth illusion) */}
          <polygon
            points={`${bx + 4},${wallTop + 6} ${cx},${roofPeak + 6} ${bx + BW - 4},${wallTop + 6}`}
            fill={zone.colorRight} opacity="0.5"
          />
          {/* Roof main face */}
          <polygon
            points={`${bx - 8},${wallTop} ${cx},${roofPeak} ${bx + BW + 8},${wallTop}`}
            fill={zone.colorRight}
          />
          {/* Roof ridge highlight */}
          <line x1={bx - 8} y1={wallTop} x2={cx} y2={roofPeak}
            stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        </>
      )}
      {roofType === 'flat' && (
        <>
          <rect x={bx - 6} y={roofPeak} width={BW + 12} height={RH}
            fill={zone.colorRight} rx="4" />
          <rect x={bx - 6} y={roofPeak} width={BW + 12} height={6}
            fill="rgba(255,255,255,0.2)" rx="4 4 0 0" />
          {/* Parapet teeth */}
          {Array.from({ length: Math.floor((BW + 12) / 22) }, (_, i) => (
            <rect key={i}
              x={bx - 6 + i * 22} y={roofPeak - 9}
              width="15" height="11" rx="2"
              fill={zone.colorRight} />
          ))}
        </>
      )}
      {roofType === 'tent' && (
        <>
          {/* Striped tent cone */}
          {Array.from({ length: zone.bw * 2 }, (_, i) => {
            const n = zone.bw * 2
            const x1 = bx + (i / n) * BW
            const x2 = bx + ((i + 1) / n) * BW
            return (
              <polygon key={i}
                points={`${x1},${wallTop} ${x2},${wallTop} ${cx},${roofPeak}`}
                fill={i % 2 === 0 ? zone.colorRight : zone.colorTop}
              />
            )
          })}
          {/* Tent outline */}
          <polygon points={`${bx},${wallTop} ${cx},${roofPeak} ${bx + BW},${wallTop}`}
            fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
          {/* Flag pole + pennant */}
          <line x1={cx} y1={roofPeak} x2={cx} y2={roofPeak - 28}
            stroke="#6d4c41" strokeWidth="3" strokeLinecap="round" />
          <polygon points={`${cx},${roofPeak - 28} ${cx + 20},${roofPeak - 20} ${cx},${roofPeak - 12}`}
            fill={zone.colorLeft} />
        </>
      )}

      {/* ── Front wall ── */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>
      </defs>
      <rect x={bx} y={wallTop} width={BW} height={FH} fill={zone.colorLeft} rx="3 3 0 0" />
      <rect x={bx} y={wallTop} width={BW} height={FH} fill={`url(#${gradId})`} rx="3 3 0 0" />

      {/* Wall base darker band */}
      <rect x={bx} y={wallTop + FH * 0.68} width={BW} height={FH * 0.32}
        fill="rgba(0,0,0,0.14)" rx="0 0 3 3" />

      {/* ── Windows ── */}
      {roofType !== 'tent' && winPositions.map((wx, i) => (
        <g key={i}>
          <rect x={wx - winW / 2} y={winY} width={winW} height={winH}
            rx="3" fill="#c8e8f8" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
          <line x1={wx} y1={winY} x2={wx} y2={winY + winH}
            stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          <line x1={wx - winW / 2} y1={winY + winH / 2}
            x2={wx + winW / 2} y2={winY + winH / 2}
            stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          {/* Window glint */}
          <rect x={wx - winW / 2 + 2} y={winY + 2} width={winW * 0.35} height={winH * 0.35}
            rx="1" fill="rgba(255,255,255,0.45)" />
        </g>
      ))}

      {/* ── Door ── */}
      {roofType !== 'tent' && (
        <>
          <rect x={cx - doorW / 2} y={doorY} width={doorW} height={doorH}
            rx="4 4 0 0" fill={zone.colorRight} opacity="0.85" />
          <rect x={cx - doorW / 2} y={doorY} width={doorW} height={doorH}
            rx="4 4 0 0" fill="rgba(0,0,0,0.28)" />
          {/* Door knob */}
          <circle cx={cx + doorW / 2 - 5} cy={doorY + doorH * 0.55}
            r="2.5" fill="rgba(255,255,255,0.4)" />
        </>
      )}

      {/* ── Zone emoji (on roof/facade center) ── */}
      <text
        x={cx} y={roofType === 'tent' ? wallTop + FH * 0.42 : wallTop + FH * 0.36}
        textAnchor="middle" fontSize={emojiSize}
        style={{ userSelect: 'none' }}
      >
        {zone.emoji}
      </text>

      {/* ── Building name ── */}
      <text
        x={cx} y={bottom + 22}
        textAnchor="middle" fontSize="10.5" fontWeight="700"
        fill={zone.colorTop}
        stroke="rgba(0,25,0,0.85)" strokeWidth="3" paintOrder="stroke"
        style={{ userSelect: 'none' }} letterSpacing="0.3"
      >
        {zone.name}
      </text>

      {/* Visited star */}
      {visited && (
        <text x={bx + BW - 6} y={roofPeak - 2} fontSize="18" style={{ userSelect: 'none' }}>⭐</text>
      )}

      {/* ── Near indicator ── */}
      {isNear && (
        <>
          <rect
            x={bx - 7} y={roofPeak - 7}
            width={BW + 14} height={bottom - roofPeak + 14}
            rx="12" fill="none"
            stroke="#69f0ae" strokeWidth="3.5" strokeDasharray="9 5"
          />
          <circle cx={cx} cy={roofPeak - 24} r="7" fill="#69f0ae" />
          <circle cx={cx} cy={roofPeak - 24} r="13" fill="none" stroke="#69f0ae" strokeWidth="2.5" opacity="0.45" />
        </>
      )}
    </g>
  )
}

// ─── Avatar (emoji + plumb bob) ───────────────────────────────────────────────
function MapAvatar({ step, moving }: { step: number; moving: boolean }) {
  const bob = moving ? [-2, 0, 2, 0][step % 4] : 0
  return (
    <>
      {/* Ground shadow */}
      <ellipse cx="0" cy={4 + bob * 0.3} rx="20" ry="10" fill="rgba(0,0,0,0.32)" />
      {/* Character emoji */}
      <text x="0" y={-14 + bob} textAnchor="middle" fontSize="52"
        style={{ userSelect: 'none', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.55))' }}>
        🧒
      </text>
      {/* Sims plumb bob */}
      <line x1="0" y1="-76" x2="0" y2="-88" stroke="#00c853" strokeWidth="2" opacity="0.9" />
      <polygon points="0,-98 7,-89 0,-83 -7,-89" fill="#00e676" opacity="0.92" />
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  visitedZones: string[]
  onEnterZone: (zone: StoryZone) => void
  onSalir: () => void
}

export default function StoryMap({ visitedZones, onEnterZone, onSalir }: Props) {
  const saved = loadProgress()
  const [avPos, setAvPos] = useState<TilePos>(() => saved.avatarPos)
  const [nearZone, setNearZone] = useState<StoryZone | null>(null)
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const [step, setStep] = useState(0)
  const [moving, setMoving] = useState(false)

  const keysRef = useRef<Set<string>>(new Set())
  const joyRef  = useRef({ up: false, down: false, left: false, right: false })
  const posRef  = useRef(avPos)
  const nearRef = useRef<StoryZone | null>(null)
  const rafRef  = useRef<number>(0)
  const viewRef = useRef<HTMLDivElement>(null)

  posRef.current  = avPos
  nearRef.current = nearZone

  useEffect(() => () => saveAvatarPos(posRef.current), [])

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
      if (e.key === ' ' && nearRef.current) {
        markZoneVisited(nearRef.current.id)
        onEnterZone(nearRef.current)
      }
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [onEnterZone])

  const handleJoy = useCallback((s: typeof joyRef.current) => { joyRef.current = s }, [])

  useEffect(() => {
    let fc = 0
    const loop = () => {
      const k = keysRef.current
      const j = joyRef.current
      let dc = 0, dr = 0
      if (k.has('ArrowLeft')  || k.has('a') || j.left)  dc -= AVATAR_SPEED
      if (k.has('ArrowRight') || k.has('d') || j.right) dc += AVATAR_SPEED
      if (k.has('ArrowUp')    || k.has('w') || j.up)    dr -= AVATAR_SPEED
      if (k.has('ArrowDown')  || k.has('s') || j.down)  dr += AVATAR_SPEED
      if (dc !== 0 && dr !== 0) { dc *= 0.707; dr *= 0.707 }

      if (dc !== 0 || dr !== 0) {
        if (dc > 0) setFacing('right')
        if (dc < 0) setFacing('left')
        fc++
        if (fc % 7 === 0) setStep(s => s + 1)
        setMoving(true)
        setAvPos(p => {
          const nc = Math.max(0.5, Math.min(GRID_COLS - 0.5, p.col + dc))
          const nr = Math.max(0.5, Math.min(GRID_ROWS - 0.5, p.row + dr))
          const np = { col: nc, row: nr }
          let closest: StoryZone | null = null
          let minD = ZONE_REACH
          for (const z of ZONES) {
            const center = { col: z.position.col + z.bw / 2, row: z.position.row + z.bd / 2 }
            const d = tileDist(np, center)
            if (d < minD) { minD = d; closest = z }
          }
          setNearZone(closest)
          return np
        })
      } else {
        fc = 0
        setMoving(false)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Avatar world pixel position
  const avX = avPos.col * TILE_PX
  const avY = avPos.row * TILE_PX

  // Camera — fallback a window para primer render
  const vw = viewRef.current?.clientWidth  ?? (typeof window !== 'undefined' ? window.innerWidth  : 800)
  const vh = viewRef.current?.clientHeight ?? (typeof window !== 'undefined' ? window.innerHeight - 300 : 500)
  const camX = Math.max(0, Math.min(WORLD_W - vw, avX - vw / 2))
  const camY = Math.max(0, Math.min(WORLD_H - vh, avY - vh / 2 + 30))

  // Painter's algorithm: sort trees and buildings by their southmost pixel row
  type RObj =
    | { depth: number; kind: 'tree'; col: number; row: number; r?: number }
    | { depth: number; kind: 'building'; zone: StoryZone }

  const renderables = useMemo<RObj[]>(() => {
    const objs: RObj[] = [
      ...TREES.map(t => ({
        depth: ty(t.row) + TILE_PX * 0.4,
        kind: 'tree' as const, col: t.col, row: t.row, r: t.r,
      })),
      ...ZONES.map(z => ({
        depth: ty(z.position.row + z.bd),
        kind: 'building' as const, zone: z,
      })),
    ]
    return objs.sort((a, b) => a.depth - b.depth)
  }, [])

  const avDepthPx = avY + TILE_PX * 0.15
  const before = renderables.filter(o => o.depth <= avDepthPx)
  const after  = renderables.filter(o => o.depth > avDepthPx)

  function renderObj(o: RObj, key: string) {
    if (o.kind === 'tree') return <MapTree key={key} col={o.col} row={o.row} r={o.r} />
    return (
      <MapBuilding
        key={key}
        zone={o.zone}
        visited={visitedZones.includes(o.zone.id)}
        isNear={nearZone?.id === o.zone.id}
      />
    )
  }

  function handleEntrar() {
    if (!nearZone) return
    markZoneVisited(nearZone.id)
    onEnterZone(nearZone)
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a1f08' }}>
      {/* HUD */}
      <div className="flex items-center gap-3 px-4 py-2 z-20 flex-shrink-0"
        style={{ background: 'rgba(8,24,6,0.93)', borderBottom: '2px solid #1e5012' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base"
          style={{ background: 'var(--papel-2)' }}>
          ← Salir
        </button>
        <span className="mano font-bold text-base" style={{ color: '#a5d6a7' }}>
          FonoMundos — Modo Historia
        </span>
        <span className="mano text-sm ml-auto" style={{ color: 'rgba(165,214,167,0.5)' }}>
          {visitedZones.length}/{ZONES.length} visitadas
        </span>
      </div>

      {/* World viewport */}
      <div ref={viewRef} className="flex-1 overflow-hidden relative">
        <svg
          width={WORLD_W} height={WORLD_H}
          style={{
            position: 'absolute',
            transform: `translate(${-camX}px, ${-camY}px)`,
            willChange: 'transform',
          }}
        >
          <defs>
            {/* Grass tile pattern */}
            <pattern id="grassPat" x="0" y="0" width={TILE_PX} height={TILE_PX} patternUnits="userSpaceOnUse">
              <rect width={TILE_PX} height={TILE_PX} fill="#4caf50" />
              <rect width={TILE_PX} height={TILE_PX} fill="rgba(0,0,0,0.05)" />
              {/* Corner detail */}
              <rect x="0" y="0" width="2" height="2" fill="rgba(255,255,255,0.07)" />
              <rect x={TILE_PX - 2} y={TILE_PX - 2} width="2" height="2" fill="rgba(0,0,0,0.07)" />
            </pattern>

            {/* Road texture */}
            <pattern id="roadPat" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#c8a460" />
              <rect x="18" y="0" width="4" height="40" fill="rgba(255,255,255,0.08)" />
            </pattern>

            {/* Map border vignette */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="60%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </radialGradient>

            {/* Ambient light gradient */}
            <radialGradient id="ambient" cx="35%" cy="25%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,220,0.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Ground */}
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#grassPat)" />
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#ambient)" />

          {/* Roads */}
          {ROADS.map((r, i) => {
            const rx = tx(r.c1), ry = ty(r.r1)
            const rw = tx(r.c2) - tx(r.c1), rh = ty(r.r2) - ty(r.r1)
            return (
              <g key={i}>
                <rect x={rx} y={ry} width={rw} height={rh} fill="url(#roadPat)" />
                {/* Road edges */}
                <rect x={rx} y={ry} width={rw} height={3} fill="rgba(100,70,20,0.3)" />
                <rect x={rx} y={ry + rh - 3} width={rw} height={3} fill="rgba(100,70,20,0.3)" />
                <rect x={rx} y={ry} width={3} height={rh} fill="rgba(100,70,20,0.3)" />
                <rect x={rx + rw - 3} y={ry} width={3} height={rh} fill="rgba(100,70,20,0.3)" />
              </g>
            )
          })}

          {/* Objects behind avatar */}
          {before.map((o, i) => renderObj(o, `b${i}`))}

          {/* Avatar */}
          <g transform={`translate(${avX}, ${avY}) scale(${facing === 'left' ? -1 : 1}, 1)`}>
            <MapAvatar step={step} moving={moving} />
          </g>

          {/* Objects in front of avatar */}
          {after.map((o, i) => renderObj(o, `a${i}`))}

          {/* Map vignette */}
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#vignette)" />
        </svg>

        {/* Zone popup */}
        {nearZone && (
          <div
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
            style={{ minWidth: 260 }}
          >
            <div className="crayon mano px-5 py-4 text-center rounded-2xl"
              style={{
                background: nearZone.colorLeft,
                border: '3px solid rgba(255,255,255,0.22)',
                boxShadow: `0 0 40px ${nearZone.colorTop}88, 5px 7px 0 rgba(0,0,0,0.5)`,
                color: '#fff',
              }}>
              <div style={{ fontSize: 38 }}>{nearZone.emoji}</div>
              <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>{nearZone.name}</div>
              <div style={{ fontSize: 13, opacity: 0.88, marginTop: 3 }}>{nearZone.description}</div>
              <button
                onClick={handleEntrar}
                className="crayon mano mt-3 px-6 py-2 text-lg font-black text-white w-full rounded-xl"
                style={{ background: 'rgba(0,0,0,0.32)', border: '2px solid rgba(255,255,255,0.35)' }}
              >
                ¡Entrar!
              </button>
            </div>
            <div className="mano text-xs" style={{ color: 'rgba(165,214,167,0.45)' }}>
              Pulsa ESPACIO o toca ¡Entrar!
            </div>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex-shrink-0 flex justify-between items-end px-6 pb-4 sm:hidden z-20"
        style={{ background: 'rgba(8,24,6,0.93)', borderTop: '2px solid #1e5012', paddingTop: 8 }}>
        <VirtualJoystick onChange={handleJoy} />
        <div className="flex flex-col items-center gap-1">
          {nearZone ? (
            <button onClick={handleEntrar} className="crayon mano px-6 py-3 text-lg font-black text-white"
              style={{ background: nearZone.colorLeft, border: '2px solid rgba(255,255,255,0.3)' }}>
              ¡Entrar! {nearZone.emoji}
            </button>
          ) : (
            <div className="mano text-xs text-center" style={{ color: 'rgba(165,214,167,0.3)', maxWidth: 140 }}>
              Acércate a un edificio
            </div>
          )}
        </div>
      </div>

      {/* Desktop hint */}
      <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 z-20 mano text-xs"
        style={{ color: 'rgba(165,214,167,0.3)' }}>
        ↑↓←→ o WASD para moverte · ESPACIO para entrar
      </div>
    </div>
  )
}
