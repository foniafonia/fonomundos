import { useEffect, useRef, useState, useCallback } from 'react'
import type { StoryZone, Position } from './storyModeTypes'
import { WORLD_W, WORLD_H, AVATAR_SPEED, ZONE_RADIUS, AVATAR_SIZE, ZONES } from './storyModeConfig'
import { loadProgress, saveAvatarPos, markZoneVisited } from './storyModeStorage'
import VirtualJoystick from './VirtualJoystick'

interface Props {
  visitedZones: string[]
  onEnterZone: (zone: StoryZone) => void
  onSalir: () => void
}

function dist(a: Position, b: Position) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// Caminos del mapa (puntos de ruta visual)
const PATHS = [
  // horizontal principal
  { x1: 150, y1: 450, x2: 1450, y2: 450 },
  // vertical izquierda
  { x1: 280, y1: 150, x2: 280, y2: 750 },
  // vertical centro
  { x1: 760, y1: 150, x2: 760, y2: 780 },
  // vertical derecha
  { x1: 1220, y1: 150, x2: 1220, y2: 740 },
  // horizontal inferior
  { x1: 150, y1: 840, x2: 900, y2: 840 },
]

// Árboles decorativos
const TREES = [
  { x: 450, y: 300 }, { x: 520, y: 380 }, { x: 950, y: 320 },
  { x: 1020, y: 200 }, { x: 400, y: 800 }, { x: 900, y: 500 },
  { x: 1100, y: 820 }, { x: 160, y: 320 }, { x: 1400, y: 300 },
  { x: 1380, y: 600 }, { x: 200, y: 870 }, { x: 650, y: 550 },
  { x: 850, y: 880 }, { x: 1050, y: 450 },
]

export default function StoryMap({ visitedZones, onEnterZone, onSalir }: Props) {
  const progress = loadProgress()
  const [avatarPos, setAvatarPos] = useState<Position>(progress.avatarPos)
  const [nearZone, setNearZone] = useState<StoryZone | null>(null)
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const [step, setStep] = useState(0)
  const keysRef = useRef<Set<string>>(new Set())
  const joyRef = useRef({ up: false, down: false, left: false, right: false })
  const posRef = useRef(avatarPos)
  const rafRef = useRef<number>(0)
  const viewRef = useRef<HTMLDivElement>(null)

  posRef.current = avatarPos

  // Guarda posición al desmontar
  useEffect(() => {
    return () => saveAvatarPos(posRef.current)
  }, [])

  // Teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Joystick virtual
  const handleJoy = useCallback((s: typeof joyRef.current) => { joyRef.current = s }, [])

  // Game loop
  useEffect(() => {
    let frame = 0
    const loop = () => {
      const k = keysRef.current
      const j = joyRef.current
      let dx = 0, dy = 0
      if (k.has('ArrowLeft')  || k.has('a') || j.left)  dx -= AVATAR_SPEED
      if (k.has('ArrowRight') || k.has('d') || j.right) dx += AVATAR_SPEED
      if (k.has('ArrowUp')    || k.has('w') || j.up)    dy -= AVATAR_SPEED
      if (k.has('ArrowDown')  || k.has('s') || j.down)  dy += AVATAR_SPEED

      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }

      if (dx !== 0 || dy !== 0) {
        if (dx > 0) setFacing('right')
        if (dx < 0) setFacing('left')
        frame++
        if (frame % 8 === 0) setStep(s => (s + 1) % 4)

        setAvatarPos(p => {
          const nx = Math.max(AVATAR_SIZE / 2, Math.min(WORLD_W - AVATAR_SIZE / 2, p.x + dx))
          const ny = Math.max(AVATAR_SIZE / 2, Math.min(WORLD_H - AVATAR_SIZE / 2, p.y + dy))
          const np = { x: nx, y: ny }
          // detectar zona cercana
          let closest: StoryZone | null = null
          let minD = ZONE_RADIUS
          for (const z of ZONES) {
            const d = dist(np, z.position)
            if (d < minD) { minD = d; closest = z }
          }
          setNearZone(closest)
          return np
        })
      } else {
        frame = 0
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Cámara: centrar avatar en viewport
  const camX = Math.max(0, Math.min(WORLD_W - (viewRef.current?.clientWidth ?? 800), avatarPos.x - (viewRef.current?.clientWidth ?? 800) / 2))
  const camY = Math.max(0, Math.min(WORLD_H - (viewRef.current?.clientHeight ?? 600), avatarPos.y - (viewRef.current?.clientHeight ?? 600) / 2))

  function handleEntrar() {
    if (!nearZone) return
    markZoneVisited(nearZone.id)
    onEnterZone(nearZone)
  }

  // Avatar walking frames (CSS only)
  const avatarBob = [0, -3, 0, 3][step]

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#1a1208' }}>
      {/* HUD superior */}
      <div className="flex items-center gap-3 px-4 py-2 z-20 flex-shrink-0"
        style={{ background: 'rgba(26,18,8,0.85)', borderBottom: '2px solid #5a3a1a' }}>
        <button onClick={onSalir} className="crayon mano px-4 py-1.5 text-base" style={{ background: 'var(--papel-2)' }}>
          ← Salir
        </button>
        <span className="mano text-lg" style={{ color: '#f2c14e' }}>🗺️ FonoMundos</span>
        <span className="mano text-sm ml-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Zonas visitadas: {visitedZones.length}/{ZONES.length}
        </span>
      </div>

      {/* Mundo */}
      <div ref={viewRef} className="flex-1 overflow-hidden relative" style={{ cursor: 'none' }}>
        <div
          style={{
            width: WORLD_W, height: WORLD_H,
            position: 'absolute',
            transform: `translate(${-camX}px, ${-camY}px)`,
            willChange: 'transform',
          }}
        >
          {/* Fondo: hierba */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, #5a9e3a 0%, #3d7a25 50%, #2d5e18 100%)',
          }} />
          {/* Textura hierba (puntos) */}
          <svg style={{ position: 'absolute', inset: 0, opacity: 0.12 }} width={WORLD_W} height={WORLD_H}>
            {Array.from({ length: 120 }, (_, i) => (
              <circle key={i} cx={(i * 137.5) % WORLD_W} cy={(i * 89.3) % WORLD_H} r="3" fill="#fff" />
            ))}
          </svg>

          {/* Caminos */}
          <svg style={{ position: 'absolute', inset: 0 }} width={WORLD_W} height={WORLD_H}>
            {PATHS.map((p, i) => (
              <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                stroke="#d4b483" strokeWidth="42" strokeLinecap="round" opacity="0.85" />
            ))}
            {PATHS.map((p, i) => (
              <line key={`e${i}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                stroke="#c8a46a" strokeWidth="38" strokeLinecap="round" strokeDasharray="0"
                opacity="0.6" />
            ))}
          </svg>

          {/* Árboles */}
          {TREES.map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: t.x - 20, top: t.y - 36, fontSize: 40, userSelect: 'none', lineHeight: 1 }}>
              🌳
            </div>
          ))}

          {/* Zonas / Edificios */}
          {ZONES.map(z => {
            const visited = visitedZones.includes(z.id)
            const isNear = nearZone?.id === z.id
            return (
              <div key={z.id} style={{ position: 'absolute', left: z.position.x - 52, top: z.position.y - 70 }}>
                {/* Sombra del edificio */}
                <div style={{
                  position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 80, height: 16, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.25)',
                }} />
                {/* Edificio */}
                <div style={{
                  width: 104, padding: '10px 8px 8px',
                  background: z.color,
                  border: `3px solid ${isNear ? '#fff' : 'rgba(74,63,53,0.6)'}`,
                  borderRadius: 12,
                  boxShadow: isNear
                    ? `0 0 0 4px ${z.color}, 0 0 24px ${z.color}`
                    : '3px 4px 0 rgba(0,0,0,0.3)',
                  transform: isNear ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  cursor: 'pointer',
                  opacity: visited ? 1 : 0.9,
                  userSelect: 'none',
                }}>
                  <div style={{ fontSize: 38, lineHeight: 1 }}>{z.emoji}</div>
                  <div className="mano" style={{
                    fontSize: 11, marginTop: 4, color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontWeight: 700, lineHeight: 1.2,
                  }}>
                    {z.name}
                  </div>
                  {visited && (
                    <div style={{ fontSize: 12, marginTop: 2 }}>⭐</div>
                  )}
                </div>

                {/* Radio de interacción (debug desactivado) */}
              </div>
            )
          })}

          {/* Avatar */}
          <div style={{
            position: 'absolute',
            left: avatarPos.x - AVATAR_SIZE / 2,
            top: avatarPos.y - AVATAR_SIZE / 2 + avatarBob,
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            fontSize: AVATAR_SIZE,
            lineHeight: 1,
            userSelect: 'none',
            transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
            transition: 'top 0.05s',
          }}>
            🧒
          </div>
        </div>

        {/* Tarjeta de zona cercana */}
        {nearZone && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-pop"
            style={{ minWidth: 220 }}>
            <div className="crayon mano px-5 py-4 text-center"
              style={{
                background: nearZone.color,
                border: '3px solid rgba(74,63,53,0.5)',
                boxShadow: '4px 5px 0 rgba(0,0,0,0.3)',
                borderRadius: 12,
                color: '#fff',
              }}>
              <div style={{ fontSize: 32 }}>{nearZone.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{nearZone.name}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{nearZone.description}</div>
              <button
                onClick={handleEntrar}
                className="crayon mano mt-3 px-6 py-2 text-lg font-black text-white w-full"
                style={{ background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                ¡Entrar!
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }} className="mano">
              Pulsa ESPACIO o toca ¡Entrar!
            </div>
          </div>
        )}
      </div>

      {/* Joystick móvil */}
      <div className="flex-shrink-0 flex justify-between items-end px-6 pb-4 sm:hidden z-20"
        style={{ background: 'rgba(26,18,8,0.85)', borderTop: '2px solid #5a3a1a', paddingTop: 8 }}>
        <VirtualJoystick onChange={handleJoy} />
        <div className="flex flex-col items-center gap-1">
          {nearZone ? (
            <button
              onClick={handleEntrar}
              className="crayon mano px-6 py-3 text-lg font-black text-white"
              style={{ background: nearZone.color, border: '2px solid rgba(255,255,255,0.4)' }}
            >
              ¡Entrar! {nearZone.emoji}
            </button>
          ) : (
            <div className="mano text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 140 }}>
              Acércate a un edificio
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones teclado (solo escritorio) */}
      <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 z-20 mano text-xs"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        Muévete con ↑↓←→ · ESPACIO para entrar
      </div>
    </div>
  )
}
