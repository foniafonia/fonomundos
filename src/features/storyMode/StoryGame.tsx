import { useEffect, useRef, useState, useCallback } from 'react'
import type { StoryZone } from './storyModeTypes'
import { loadProgress, saveProgress } from './storyModeStorage'
import './storyGame.css'

interface Props {
  visitedZones: string[]
  onEnterZone: (zone: StoryZone) => void
  onSalir: () => void
}

/* ── Global joystick vector (Phaser reads this in update loop) ── */
declare global { interface Window { __storyJoystick__: { x: number; y: number } } }
window.__storyJoystick__ = { x: 0, y: 0 }

export default function StoryGame({ visitedZones, onEnterZone, onSalir }: Props) {
  const mountRef   = useRef<HTMLDivElement>(null)
  const gameRef    = useRef<import('phaser').Game | null>(null)
  const joystickRef = useRef<ReturnType<typeof import('nipplejs')['create']> | null>(null)
  const joyZoneRef = useRef<HTMLDivElement>(null)

  const [nearZone, setNearZone]   = useState<StoryZone | null>(null)
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('fonomundos.story.intro'))

  /* ── Load saved position ─────────────────────────────────────── */
  const savedPos = loadProgress().avatarPos

  /* ── Boot Phaser ─────────────────────────────────────────────── */
  useEffect(() => {
    if (showIntro) return  // don't start until intro is dismissed
    let game: import('phaser').Game | null = null

    const boot = async () => {
      if (!mountRef.current) return
      const Phaser = (await import('phaser')).default
      const { WorldScene, START_X, START_Y } = await import('./scenes/WorldScene')

      const startX = typeof (savedPos as any)?.x === 'number' ? (savedPos as any).x : START_X
      const startY = typeof (savedPos as any)?.y === 'number' ? (savedPos as any).y : START_Y

      // Store start position globally so WorldScene.create() can read it
      ;(window as any).__storyStart__ = { x: startX, y: startY, visited: visitedZones }

      const el = mountRef.current!
      const W  = el.clientWidth  || window.innerWidth
      const H  = el.clientHeight || (window.innerHeight - 60)

      game = new Phaser.Game({
        type:            Phaser.AUTO,
        width:           W,
        height:          H,
        parent:          el,
        backgroundColor: '#5ca832',
        antialias:       true,
        roundPixels:     false,
        scene:           [WorldScene],
      })

      gameRef.current = game

      /* ── nipplejs joystick ─────────────────────────────────────── */
      if (joyZoneRef.current) {
        const nipplejs = await import('nipplejs')
        const manager = nipplejs.create({
          zone:        joyZoneRef.current,
          mode:        'dynamic',
          color:       'rgba(255,255,255,0.5)',
          size:        90,
          restOpacity: 0.4,
          threshold:   0.1,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(manager as any).on('move', (_evt: unknown, data: any) => {
          window.__storyJoystick__ = {
            x:  data.vector.x,
            y: -data.vector.y,
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(manager as any).on('end', () => {
          window.__storyJoystick__ = { x: 0, y: 0 }
        })
        joystickRef.current = manager
      }
    }

    boot()

    return () => {
      joystickRef.current?.destroy()
      joystickRef.current = null
      game?.destroy(true)
      gameRef.current = null
      window.__storyJoystick__ = { x: 0, y: 0 }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIntro])

  /* ── Zone events from Phaser ─────────────────────────────────── */
  useEffect(() => {
    const onNear  = (e: Event) => setNearZone((e as CustomEvent).detail.zone as StoryZone)
    const onLeave = () => setNearZone(null)
    window.addEventListener('story:zone-near',  onNear)
    window.addEventListener('story:zone-leave', onLeave)
    return () => {
      window.removeEventListener('story:zone-near',  onNear)
      window.removeEventListener('story:zone-leave', onLeave)
    }
  }, [])

  /* ── Resize Phaser on window resize ─────────────────────────── */
  useEffect(() => {
    const onResize = () => {
      if (!gameRef.current || !mountRef.current) return
      gameRef.current.scale.resize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ── Keyboard shortcut: Space / Enter = enter zone ───────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && nearZone) {
        handleEnter()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearZone])

  const handleEnter = useCallback(() => {
    if (!nearZone) return
    // Save avatar position before leaving
    const scene = gameRef.current?.scene.getScene('WorldScene') as any
    if (scene?.getPlayerPos) {
      const pos = scene.getPlayerPos()
      saveProgress({ avatarPos: pos })
    }
    onEnterZone(nearZone)
  }, [nearZone, onEnterZone])

  const dismissIntro = () => {
    localStorage.setItem('fonomundos.story.intro', '1')
    setShowIntro(false)
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="story-game-root">

      {/* ── INTRO MODAL ── */}
      {showIntro && (
        <div className="story-intro-overlay">
          <div className="story-intro-card">
            <div className="story-intro-emoji">🌍</div>
            <h2 className="story-intro-title">Bienvenido a FonoMundos</h2>
            <p className="story-intro-text">
              Cada rincón de este mundo entrena una habilidad.
              <br /><br />
              Camina, explora y entra donde quieras practicar.
            </p>
            <div className="story-intro-controls">
              <div className="story-intro-hint">
                <kbd>↑↓←→</kbd> o <kbd>WASD</kbd> — mover
              </div>
              <div className="story-intro-hint">
                <kbd>Espacio</kbd> — entrar a zona
              </div>
              <div className="story-intro-hint">
                En móvil usa el <strong>joystick</strong> de abajo
              </div>
            </div>
            <button className="story-intro-btn" onClick={dismissIntro}>
              ¡Explorar!
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER HUD ── */}
      <div className="story-header">
        <button className="story-back-btn" onClick={onSalir}>← Salir</button>
        <span className="story-title">FonoMundos — Modo Historia</span>
        <span className="story-count">{visitedZones.length}/7 visitadas</span>
      </div>

      {/* ── PHASER CANVAS ── */}
      <div ref={mountRef} className="story-canvas-mount" />

      {/* ── ZONE INTERACTION CARD ── */}
      {nearZone && !showIntro && (
        <div className="story-zone-card">
          <div className="story-zone-emoji">{nearZone.emoji}</div>
          <div className="story-zone-info">
            <strong className="story-zone-name">{nearZone.name}</strong>
            <p className="story-zone-desc">{nearZone.description}</p>
          </div>
          <button className="story-zone-enter-btn" onClick={handleEnter}>
            Entrar
          </button>
        </div>
      )}

      {/* ── JOYSTICK ZONE (mobile) ── */}
      {!showIntro && (
        <div ref={joyZoneRef} className="story-joystick-zone" />
      )}

      {/* ── ENTER HINT (keyboard) ── */}
      {nearZone && !showIntro && (
        <div className="story-enter-hint">
          Pulsa <kbd>Espacio</kbd> para entrar
        </div>
      )}
    </div>
  )
}
