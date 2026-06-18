import type { StoryProgress, TilePos } from './storyModeTypes'

const KEY = 'fonomundos.storyMode'

const DEFAULT: StoryProgress = {
  avatarPos: { col: 11, row: 12 },  // center of map, between buildings
  visitedZones: [],
  lastZone: null,
}

export function loadProgress(): StoryProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    // Migrate: old format used pixel {x,y} → reset to center
    if (raw.avatarPos && 'x' in raw.avatarPos) {
      raw.avatarPos = DEFAULT.avatarPos
    }
    return { ...DEFAULT, ...raw }
  } catch {
    return DEFAULT
  }
}

export function saveProgress(p: Partial<StoryProgress>) {
  localStorage.setItem(KEY, JSON.stringify({ ...loadProgress(), ...p }))
}

export function saveAvatarPos(pos: TilePos) {
  saveProgress({ avatarPos: pos })
}

export function markZoneVisited(zoneId: string) {
  const p = loadProgress()
  if (!p.visitedZones.includes(zoneId)) {
    saveProgress({ visitedZones: [...p.visitedZones, zoneId], lastZone: zoneId })
  } else {
    saveProgress({ lastZone: zoneId })
  }
}
