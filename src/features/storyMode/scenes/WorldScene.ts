import Phaser from 'phaser'
import type { StoryZone } from '../storyModeTypes'
import { ZONES } from '../storyModeConfig'

/* ── World constants ──────────────────────────────────────────────── */
export const WORLD_W = 3200
export const WORLD_H = 2400
export const START_X  = 1600
export const START_Y  = 1200

const SPEED        = 180   // px / second
const INTERACT_PX  = 200   // distance to trigger zone card

/* ── Zone pixel positions (center of building entrance) ────────────── */
export const ZONE_PX: Record<string, { x: number; y: number }> = {
  'casa-sonido':      { x: 460,  y: 400 },
  'escuela-silabas':  { x: 1600, y: 300 },
  'taller-policubos': { x: 2740, y: 400 },
  'carpa-bingo':      { x: 300,  y: 1200 },
  'plaza-domino':     { x: 2900, y: 1200 },
  'biblioteca':       { x: 460,  y: 2000 },
  'mundo-rimas':      { x: 2740, y: 2000 },
}

/* ── Palette ────────────────────────────────────────────────────────── */
const COL = {
  grassDark:  0x4a8c2a,
  grassMid:   0x5ca832,
  grassLight: 0x72c43e,
  grassHigh:  0x86d84c,
  path:       0xc8a46e,
  pathDark:   0xaa8850,
  pathLight:  0xdcbc8a,
  plaza:      0xb8a080,
  plazaDark:  0x9a8468,
  plazaLight: 0xd4bca0,
  water:      0x4ab0e8,
  waterDeep:  0x2880c0,
  shadow:     0x000000,
  fountain:   0x60c0f0,
  treeDark:   0x2a6e1a,
  treeMid:    0x3a9028,
  treeLight:  0x54b83c,
  treeHigh:   0x76d056,
  trunkCol:   0x6e4420,
  flowerRed:  0xe84040,
  flowerYel:  0xf0c830,
  flowerPink: 0xe870b0,
}

/* ── Zone color configs ───────────────────────────────────────────── */
const ZONE_COLORS: Record<string, { wall: number; roof: number; side: number; trim: number }> = {
  'casa-sonido':      { wall: 0xe05040, roof: 0xb83028, side: 0x943020, trim: 0xfff4f0 },
  'escuela-silabas':  { wall: 0xf0cc30, roof: 0xcca020, side: 0xa88018, trim: 0xfffef0 },
  'taller-policubos': { wall: 0x3090e0, roof: 0x2070b8, side: 0x1858a0, trim: 0xf0f8ff },
  'carpa-bingo':      { wall: 0x9040d0, roof: 0x7020b0, side: 0x561890, trim: 0xfdf0ff },
  'plaza-domino':     { wall: 0x40a860, roof: 0x288040, side: 0x1a6030, trim: 0xf0fff4 },
  'biblioteca':       { wall: 0xe08830, roof: 0xb86020, side: 0x904818, trim: 0xfff8f0 },
  'mundo-rimas':      { wall: 0xe060a0, roof: 0xc04080, side: 0xa02868, trim: 0xfff0f8 },
}

/* ── Tree positions ──────────────────────────────────────────────── */
const TREES = [
  // Border forest N
  ...[100,250,450,700,900,1100,1400,1700,1900,2100,2400,2700,2900,3100].map(x => ({ x, y: 100, r: 55 })),
  ...[150,350,600,850,1050,1300,1550,1800,2050,2300,2600,2850,3050].map(x => ({ x, y: 180, r: 45 })),
  // Border forest S
  ...[100,300,600,900,1200,1500,1800,2100,2400,2700,3000].map(x => ({ x, y: 2300, r: 55 })),
  ...[200,500,800,1100,1400,1700,2000,2300,2600,2900].map(x => ({ x, y: 2220, r: 45 })),
  // Border W
  ...[300,500,700,900,1100,1300,1500,1700,1900].map(y => ({ x: 100, y, r: 55 })),
  ...[400,600,800,1000,1200,1400,1600,1800].map(y => ({ x: 180, y, r: 45 })),
  // Border E
  ...[300,500,700,900,1100,1300,1500,1700,1900].map(y => ({ x: 3100, y, r: 55 })),
  ...[400,600,800,1000,1200,1400,1600,1800].map(y => ({ x: 3020, y, r: 45 })),
  // Interior clusters
  { x: 750,  y: 700,  r: 48 }, { x: 820, y: 760, r: 42 }, { x: 680, y: 760, r: 38 },
  { x: 1200, y: 600,  r: 44 }, { x: 1270,y: 660, r: 38 },
  { x: 2000, y: 650,  r: 48 }, { x: 2080,y: 700, r: 42 },
  { x: 2400, y: 680,  r: 44 }, { x: 2330,y: 740, r: 36 },
  { x: 800,  y: 1600, r: 46 }, { x: 870, y: 1660,r: 40 },
  { x: 1250, y: 1700, r: 44 },
  { x: 2000, y: 1650, r: 46 }, { x: 2080,y: 1700,r: 38 },
  { x: 2350, y: 1600, r: 44 }, { x: 2420,y: 1660,r: 36 },
  { x: 700,  y: 1200, r: 40 },
  { x: 2500, y: 1200, r: 40 },
  { x: 1600, y: 700,  r: 42 }, { x: 1660,y: 760, r: 36 },
  { x: 1600, y: 1700, r: 42 },
]

/* ── Flower positions ────────────────────────────────────────────── */
const FLOWERS = [
  { x: 600, y: 500, c: COL.flowerYel }, { x: 650, y: 520, c: COL.flowerRed },
  { x: 1500,y: 500, c: COL.flowerPink},{ x: 1550,y: 510, c: COL.flowerYel },
  { x: 2400,y: 550, c: COL.flowerRed }, { x: 2450,y: 530, c: COL.flowerPink},
  { x: 600, y: 1600,c: COL.flowerYel }, { x: 620, y: 1620,c: COL.flowerPink},
  { x: 1580,y: 1650,c: COL.flowerRed }, { x: 1630,y: 1640,c: COL.flowerYel },
  { x: 2400,y: 1580,c: COL.flowerPink},{ x: 2440,y: 1560,c: COL.flowerRed },
  { x: 950, y: 900, c: COL.flowerYel }, { x: 970, y: 920, c: COL.flowerPink},
  { x: 2250,y: 900, c: COL.flowerRed }, { x: 2230,y: 920, c: COL.flowerYel },
]

/* ═══════════════════════════════════════════════════════════════════ */
export class WorldScene extends Phaser.Scene {
  private playerGfx!: Phaser.GameObjects.Graphics
  private px = START_X
  private py = START_Y
  private facing: 'down' | 'up' | 'left' | 'right' = 'down'
  private walkTime = 0
  private moving = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>
  private lastNearZone: string | null = null
  private visitedZones: Set<string> = new Set()

  constructor() { super({ key: 'WorldScene' }) }

  create() {
    // Read start data set by StoryGame.tsx before game creation
    const startData = (window as any).__storyStart__ ?? {}
    this.px = startData.x ?? START_X
    this.py = startData.y ?? START_Y
    this.visitedZones = new Set(startData.visited ?? [])
    /* ---------- terrain ---------- */
    this.drawGround()
    this.drawPaths()
    this.drawPlaza()

    /* ---------- decorations (low depth) ---------- */
    this.drawFlowers()

    /* ---------- buildings ---------- */
    ZONES.forEach(z => this.drawBuilding(z))

    /* ---------- trees (high depth) ---------- */
    TREES.forEach(t => this.drawTree(t.x, t.y, t.r))

    /* ---------- player ---------- */
    this.playerGfx = this.add.graphics()
    this.playerGfx.setDepth(9999)

    /* ---------- camera ---------- */
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.scrollX = this.px - this.cameras.main.width  / 2
    this.cameras.main.scrollY = this.py - this.cameras.main.height / 2

    /* ---------- input ---------- */
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000

    /* ── input ─────────────────────────────── */
    const jv: { x: number; y: number } = (window as any).__storyJoystick__ ?? { x: 0, y: 0 }

    let dx = 0, dy = 0
    if (this.cursors.left.isDown  || this.wasdKeys['A']?.isDown) dx = -1
    else if (this.cursors.right.isDown || this.wasdKeys['D']?.isDown) dx =  1
    if (this.cursors.up.isDown    || this.wasdKeys['W']?.isDown) dy = -1
    else if (this.cursors.down.isDown  || this.wasdKeys['S']?.isDown) dy =  1

    if (Math.abs(jv.x) > 0.15) dx = jv.x
    if (Math.abs(jv.y) > 0.15) dy = jv.y

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }

    this.moving = dx !== 0 || dy !== 0

    /* ── direction ─────────────────────────── */
    if (dx < -0.1) this.facing = 'left'
    else if (dx > 0.1) this.facing = 'right'
    else if (dy < -0.1) this.facing = 'up'
    else if (dy > 0.1) this.facing = 'down'

    /* ── move ──────────────────────────────── */
    this.px = Phaser.Math.Clamp(this.px + dx * SPEED * dt, 60, WORLD_W - 60)
    this.py = Phaser.Math.Clamp(this.py + dy * SPEED * dt, 60, WORLD_H - 60)

    /* ── walk anim ─────────────────────────── */
    if (this.moving) this.walkTime += delta
    const walkFrame = Math.floor(this.walkTime / 160) % 4

    /* ── draw avatar ───────────────────────── */
    this.playerGfx.clear()
    this.drawAvatar(walkFrame)

    /* ── camera smooth follow ──────────────── */
    const lerp = 0.08
    const targetScrollX = this.px - this.cameras.main.width  / 2
    const targetScrollY = this.py - this.cameras.main.height / 2
    this.cameras.main.scrollX += (targetScrollX - this.cameras.main.scrollX) * lerp
    this.cameras.main.scrollY += (targetScrollY - this.cameras.main.scrollY) * lerp
    // Clamp camera
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX, 0, WORLD_W - this.cameras.main.width)
    this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, WORLD_H - this.cameras.main.height)

    /* ── zone detection ────────────────────── */
    this.checkZones()
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  AVATAR                                                       */
  /* ──────────────────────────────────────────────────────────── */
  private drawAvatar(frame: number) {
    const g = this.playerGfx
    const x = this.px, y = this.py
    const bob = this.moving ? (frame % 2 === 0 ? -2 : 2) : 0
    const f = this.facing

    // Shadow
    g.fillStyle(COL.shadow, 0.3)
    g.fillEllipse(x, y + 4, 28, 10)

    // Shoes
    g.fillStyle(0x2c1a0a)
    if (f === 'down' || f === 'up') {
      const lShoe = frame === 1 ? 3 : (frame === 3 ? -3 : 0)
      g.fillRoundedRect(x - 10, y - 4 + bob, 9, 8, 3)
      g.fillRoundedRect(x + 1,  y - 4 + bob + lShoe, 9, 8, 3)
    } else {
      g.fillRoundedRect(x - 5, y - 4 + bob, 12, 8, 3)
    }

    // Legs / pants
    g.fillStyle(0x1a2870)
    if (f === 'down' || f === 'up') {
      const lLeg = frame === 1 ? 2 : (frame === 3 ? -2 : 0)
      g.fillRect(x - 10, y - 20 + bob, 10, 18)
      g.fillRect(x,      y - 20 + bob + lLeg, 10, 18)
    } else {
      g.fillRect(x - 8, y - 20 + bob, 16, 18)
    }

    // Body / shirt (FonoMundos teal)
    g.fillStyle(0x00897b)
    g.fillRoundedRect(x - 13, y - 42 + bob, 26, 24, 5)

    // Arms
    g.fillStyle(0x00796b)
    if (f === 'left' || f === 'right') {
      const armSwing = frame === 1 ? 3 : (frame === 3 ? -3 : 0)
      g.fillRoundedRect(f === 'left' ? x - 18 : x + 10, y - 38 + bob + armSwing, 8, 14, 3)
    } else {
      const armSwing = frame === 1 ? 3 : (frame === 3 ? -3 : 0)
      g.fillRoundedRect(x - 21, y - 38 + bob - armSwing, 8, 14, 3)
      g.fillRoundedRect(x + 13, y - 38 + bob + armSwing, 8, 14, 3)
    }

    // Neck
    g.fillStyle(0xd4956a)
    g.fillRect(x - 4, y - 46 + bob, 8, 6)

    // Head
    g.fillStyle(0xf5c48a)
    g.fillCircle(x, y - 56 + bob, 14)

    // Hair
    g.fillStyle(0x3e1e04)
    g.fillEllipse(x, y - 66 + bob, 26, 12)
    if (f !== 'up') {
      g.fillEllipse(x - 12, y - 60 + bob, 8, 14)
      g.fillEllipse(x + 12, y - 60 + bob, 8, 14)
    } else {
      g.fillCircle(x, y - 56 + bob, 14)
    }

    // Face details (only front / sides)
    if (f === 'down') {
      g.fillStyle(0x1a1010)
      g.fillCircle(x - 5, y - 57 + bob, 2)
      g.fillCircle(x + 5, y - 57 + bob, 2)
      g.fillStyle(0xff8080)
      g.fillCircle(x - 8, y - 53 + bob, 2)
      g.fillCircle(x + 8, y - 53 + bob, 2)
    } else if (f === 'left') {
      g.fillStyle(0x1a1010)
      g.fillCircle(x - 8, y - 57 + bob, 2)
    } else if (f === 'right') {
      g.fillStyle(0x1a1010)
      g.fillCircle(x + 8, y - 57 + bob, 2)
    }

    // Direction arrow (subtle, when moving toward a zone)
    // (omitted for cleanliness)
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  TERRAIN                                                      */
  /* ──────────────────────────────────────────────────────────── */
  private drawGround() {
    const g = this.add.graphics()
    g.setDepth(0)

    // Base grass
    g.fillStyle(COL.grassMid)
    g.fillRect(0, 0, WORLD_W, WORLD_H)

    // Patches of variation
    const patches = [
      { x: 400,  y: 800,  w: 300, h: 200, c: COL.grassDark },
      { x: 800,  y: 400,  w: 200, h: 180, c: COL.grassLight },
      { x: 1200, y: 800,  w: 250, h: 200, c: COL.grassDark },
      { x: 1800, y: 600,  w: 280, h: 220, c: COL.grassLight },
      { x: 2200, y: 900,  w: 220, h: 180, c: COL.grassDark },
      { x: 2600, y: 700,  w: 260, h: 200, c: COL.grassLight },
      { x: 600,  y: 1400, w: 300, h: 200, c: COL.grassDark },
      { x: 1100, y: 1600, w: 220, h: 180, c: COL.grassLight },
      { x: 1900, y: 1500, w: 260, h: 200, c: COL.grassDark },
      { x: 2500, y: 1400, w: 240, h: 200, c: COL.grassLight },
      { x: 1000, y: 1100, w: 200, h: 150, c: COL.grassHigh },
      { x: 2100, y: 1000, w: 200, h: 150, c: COL.grassHigh },
    ]
    patches.forEach(p => {
      g.fillStyle(p.c)
      g.fillEllipse(p.x, p.y, p.w, p.h)
    })

    // Tiny grass tufts
    g.fillStyle(COL.grassDark)
    for (let i = 0; i < 120; i++) {
      const gx = 250 + ((i * 1847) % (WORLD_W - 500))
      const gy = 250 + ((i * 1237) % (WORLD_H - 500))
      g.fillRect(gx, gy, 4, 6)
      g.fillRect(gx + 6, gy + 2, 3, 5)
    }
    g.fillStyle(COL.grassLight)
    for (let i = 0; i < 80; i++) {
      const gx = 300 + ((i * 2311) % (WORLD_W - 600))
      const gy = 300 + ((i * 1693) % (WORLD_H - 600))
      g.fillRect(gx, gy, 3, 5)
    }

    // Forest edge darkening (vignette feel)
    g.fillStyle(COL.treeDark, 0.35)
    g.fillRect(0, 0, WORLD_W, 220)
    g.fillRect(0, WORLD_H - 220, WORLD_W, 220)
    g.fillRect(0, 0, 220, WORLD_H)
    g.fillRect(WORLD_W - 220, 0, 220, WORLD_H)
  }

  private drawPaths() {
    const g = this.add.graphics()
    g.setDepth(1)

    const drawPath = (pts: number[][], width: number, color: number) => {
      g.lineStyle(width, color, 1)
      g.beginPath()
      g.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1])
      g.strokePath()
    }

    const PW = 90  // path width

    // Main N-S road
    drawPath([[1600, 250], [1600, 950]], PW, COL.path)
    drawPath([[1600, 1450], [1600, 2150]], PW, COL.path)

    // Main E-W road
    drawPath([[300, 1200], [1400, 1200]], PW, COL.path)
    drawPath([[1800, 1200], [2900, 1200]], PW, COL.path)

    // NW diagonal to Casa Sonido
    drawPath([[1380, 1020], [900, 700], [460, 480]], 80, COL.path)

    // NE diagonal to Taller Policubos
    drawPath([[1820, 1020], [2300, 700], [2740, 480]], 80, COL.path)

    // SW diagonal to Biblioteca
    drawPath([[1380, 1380], [900, 1700], [460, 1920]], 80, COL.path)

    // SE diagonal to Mundo Rimas
    drawPath([[1820, 1380], [2300, 1700], [2740, 1920]], 80, COL.path)

    // Path edges (slightly darker lines)
    const EW = 4
    g.lineStyle(EW, COL.pathDark, 0.7)
    ;[
      [[1600, 250], [1600, 950]],
      [[1600, 1450], [1600, 2150]],
      [[300, 1200], [1400, 1200]],
      [[1800, 1200], [2900, 1200]],
      [[1380, 1020], [900, 700], [460, 480]],
      [[1820, 1020], [2300, 700], [2740, 480]],
      [[1380, 1380], [900, 1700], [460, 1920]],
      [[1820, 1380], [2300, 1700], [2740, 1920]],
    ].forEach(pts => {
      g.beginPath()
      g.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1])
      g.strokePath()
    })

    // Path pebbles / texture marks
    g.fillStyle(COL.pathDark, 0.5)
    const pebbles = [
      [1580,400],[1620,550],[1590,700],[1610,800],
      [1580,1600],[1620,1750],[1590,1900],[1610,2050],
      [500,1190],[700,1210],[900,1190],[1100,1210],[1300,1190],
      [1900,1190],[2100,1210],[2300,1190],[2500,1210],[2700,1190],
    ]
    pebbles.forEach(([px,py]) => {
      g.fillCircle(px, py, 5)
      g.fillCircle(px + 15, py + 8, 3)
    })
  }

  private drawPlaza() {
    const g = this.add.graphics()
    g.setDepth(1)
    const cx = 1600, cy = 1200, r = 220

    // Plaza base (cobblestone look)
    g.fillStyle(COL.plaza)
    g.fillCircle(cx, cy, r)

    // Cobblestone rings
    g.lineStyle(3, COL.plazaDark, 0.5)
    for (let ri = 40; ri <= r; ri += 40) g.strokeCircle(cx, cy, ri)

    // Cobblestone radial lines
    g.lineStyle(2, COL.plazaDark, 0.4)
    for (let angle = 0; angle < 360; angle += 30) {
      const rad = angle * Math.PI / 180
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r)
      g.strokePath()
    }

    // Plaza highlight
    g.fillStyle(COL.plazaLight, 0.3)
    g.fillCircle(cx - 30, cy - 30, r * 0.6)

    // Fountain base
    g.fillStyle(COL.plazaDark)
    g.fillCircle(cx, cy, 52)
    g.fillStyle(COL.water)
    g.fillCircle(cx, cy, 44)
    g.fillStyle(COL.waterDeep)
    g.fillCircle(cx, cy, 20)
    // Fountain jets (dots)
    g.fillStyle(COL.fountain, 0.8)
    for (let a = 0; a < 360; a += 60) {
      const rad = a * Math.PI / 180
      g.fillCircle(cx + Math.cos(rad) * 28, cy + Math.sin(rad) * 28, 4)
    }
    g.fillStyle(0xffffff, 0.7)
    g.fillCircle(cx, cy, 8)

    // Benches around plaza
    const benchAngles = [45, 135, 225, 315]
    benchAngles.forEach(angle => {
      const rad = angle * Math.PI / 180
      const bx = cx + Math.cos(rad) * 140
      const by = cy + Math.sin(rad) * 140
      g.fillStyle(0x8B5A2B)
      g.fillRoundedRect(bx - 20, by - 6, 40, 12, 3)
      g.fillStyle(0x5a3510)
      g.fillRect(bx - 20, by + 6, 6, 8)
      g.fillRect(bx + 14, by + 6, 6, 8)
    })
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  BUILDINGS                                                    */
  /* ──────────────────────────────────────────────────────────── */
  private drawBuilding(zone: StoryZone) {
    const pos = ZONE_PX[zone.id]
    if (!pos) return
    const { x, y } = pos
    const cols = ZONE_COLORS[zone.id] ?? { wall: 0xcccccc, roof: 0x999999, side: 0x777777, trim: 0xffffff }
    const visited = this.visitedZones.has(zone.id)

    const g = this.add.graphics()
    g.setDepth(y + 200)  // so painter's algo sorts correctly

    const BW = 200   // building width
    const BH = 100   // front wall height
    const BD = 60    // roof depth (visible from above)
    const SIDE = 25  // side wall width

    // Ground shadow
    g.fillStyle(COL.shadow, 0.2)
    g.fillEllipse(x + SIDE / 2, y + 14, BW + SIDE + 20, 36)

    // Side wall (right)
    g.fillStyle(cols.side)
    g.fillRect(x + BW / 2, y - BH, SIDE, BH + 10)

    // Roof top surface
    g.fillStyle(cols.roof)
    g.fillRect(x - BW / 2, y - BH - BD, BW + SIDE, BD + 6)

    // Roof ridge / trim
    g.fillStyle(cols.trim, 0.8)
    g.fillRect(x - BW / 2 + 4, y - BH - BD + 4, BW + SIDE - 8, 6)

    // Front wall
    g.fillStyle(cols.wall)
    g.fillRect(x - BW / 2, y - BH, BW, BH)

    // Front wall trim (darker bottom strip)
    g.fillStyle(cols.side, 0.4)
    g.fillRect(x - BW / 2, y - 12, BW, 12)

    // Windows (2)
    const WW = 28, WH = 32
    const winY = y - BH + 18
    const drawWindow = (wx: number) => {
      g.fillStyle(0xb8e8f8)
      g.fillRect(wx, winY, WW, WH)
      g.fillStyle(cols.trim, 0.9)
      g.fillRect(wx, winY, WW, 3)  // top frame
      g.fillRect(wx, winY + WH - 3, WW, 3)  // bottom frame
      g.fillRect(wx, winY, 3, WH)  // left frame
      g.fillRect(wx + WW - 3, winY, 3, WH)  // right frame
      g.lineStyle(2, cols.side, 0.5)
      g.lineTo(wx + WW / 2, winY)
      g.moveTo(wx + WW / 2, winY)
      g.lineTo(wx + WW / 2, winY + WH)
      g.moveTo(wx, winY + WH / 2)
      g.lineTo(wx + WW, winY + WH / 2)
      g.strokePath()
      // Window shine
      g.fillStyle(0xffffff, 0.3)
      g.fillRect(wx + 4, winY + 4, 6, 8)
    }
    drawWindow(x - BW / 2 + 24)
    drawWindow(x + BW / 2 - 24 - WW)

    // Door (center)
    const DW = 28, DH = 44
    const dox = x - DW / 2
    const doy = y - DH
    g.fillStyle(0x3e1e00)
    g.fillRect(dox, doy, DW, DH)
    g.fillStyle(0x5c3010)
    g.fillRect(dox + 2, doy + 2, DW - 4, DH - 2)
    // Door knob
    g.fillStyle(0xdaa520)
    g.fillCircle(dox + DW - 8, doy + DH / 2, 3)

    // Arch above door
    g.fillStyle(cols.roof)
    g.fillEllipse(x, doy - 2, DW + 6, 12)

    // Building sign (name)
    this.add.text(x, y - BH - BD - 16, zone.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#3e2006',
      stroke: '#ffffff',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(y + 201)

    // Zone emoji
    this.add.text(x, y - BH + 10, zone.emoji, {
      fontSize: '24px',
    }).setOrigin(0.5, 0.5).setDepth(y + 202)

    // Visited check mark
    if (visited) {
      this.add.text(x + BW / 2 - 4, y - BH - BD - 4, '✓', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#22c55e',
        stroke: '#ffffff',
        strokeThickness: 3,
      }).setOrigin(1, 1).setDepth(y + 203)
    }

    // Chimney (random per building based on id)
    const chimneyOffset = zone.id.charCodeAt(0) % 3 === 0 ? -40 : 40
    g.fillStyle(cols.side)
    g.fillRect(x + chimneyOffset - 7, y - BH - BD - 24, 14, 26)
    g.fillStyle(cols.wall)
    g.fillRect(x + chimneyOffset - 9, y - BH - BD - 28, 18, 8)

    // Interaction zone indicator (faint circle on ground)
    g.fillStyle(cols.wall, 0.08)
    g.fillCircle(x, y, INTERACT_PX)
    g.lineStyle(2, cols.wall, 0.2)
    g.strokeCircle(x, y, INTERACT_PX)
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  TREES                                                        */
  /* ──────────────────────────────────────────────────────────── */
  private drawTree(x: number, y: number, r: number) {
    const g = this.add.graphics()
    g.setDepth(y + r)  // depth = bottom of tree

    // Shadow
    g.fillStyle(COL.shadow, 0.22)
    g.fillEllipse(x + 6, y + r * 0.3, r * 1.6, r * 0.6)

    // Trunk
    g.fillStyle(COL.trunkCol)
    g.fillRect(x - r * 0.12, y, r * 0.24, r * 0.4)

    // Dark outer canopy
    g.fillStyle(COL.treeDark)
    g.fillCircle(x, y - r * 0.2, r)

    // Mid canopy
    g.fillStyle(COL.treeMid)
    g.fillCircle(x - r * 0.12, y - r * 0.35, r * 0.85)

    // Light highlight (upper left)
    g.fillStyle(COL.treeLight)
    g.fillCircle(x - r * 0.25, y - r * 0.5, r * 0.65)

    // Bright specular
    g.fillStyle(COL.treeHigh, 0.7)
    g.fillCircle(x - r * 0.3, y - r * 0.6, r * 0.38)

    // Tiny light dots (leaf texture)
    g.fillStyle(0xffffff, 0.12)
    for (let i = 0; i < 5; i++) {
      const lx = x + (((i * 31) % 20) - 10) * r / 30
      const ly = y - r * 0.4 + (((i * 17) % 16) - 8) * r / 30
      g.fillCircle(lx, ly, r * 0.08)
    }
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  DECORATIONS                                                  */
  /* ──────────────────────────────────────────────────────────── */
  private drawFlowers() {
    const g = this.add.graphics()
    g.setDepth(2)
    FLOWERS.forEach(f => {
      // Stem
      g.fillStyle(0x3a8a18)
      g.fillRect(f.x - 1, f.y - 8, 2, 10)
      // Petals
      g.fillStyle(f.c)
      for (let a = 0; a < 360; a += 72) {
        const rad = a * Math.PI / 180
        g.fillCircle(f.x + Math.cos(rad) * 5, f.y - 8 + Math.sin(rad) * 5, 4)
      }
      // Center
      g.fillStyle(0xffd700)
      g.fillCircle(f.x, f.y - 8, 3)
    })
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  ZONE DETECTION                                               */
  /* ──────────────────────────────────────────────────────────── */
  private checkZones() {
    let nearZone: StoryZone | null = null
    let minDist = INTERACT_PX

    for (const zone of ZONES) {
      const pos = ZONE_PX[zone.id]
      if (!pos) continue
      const dx = this.px - pos.x
      const dy = this.py - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) { minDist = dist; nearZone = zone }
    }

    if (nearZone?.id !== this.lastNearZone) {
      this.lastNearZone = nearZone?.id ?? null
      window.dispatchEvent(
        nearZone
          ? new CustomEvent('story:zone-near', { detail: { zone: nearZone } })
          : new CustomEvent('story:zone-leave')
      )
    }
  }

  /* Save current position for persistence */
  getPlayerPos() { return { x: this.px, y: this.py } }
}
