import type { StoryProgress, Position } from './storyModeTypes'
import { WORLD_W, WORLD_H } from './storyModeConfig'

const KEY = 'fonomundos.storyMode'

const DEFAULT: StoryProgress = {
  avatarPos: { x: WORLD_W / 2, y: WORLD_H / 2 },
  visitedZones: [],
  lastZone: null,
}

export function loadProgress(): StoryProgress {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULT
  }
}

export function saveProgress(p: Partial<StoryProgress>) {
  const current = loadProgress()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...p }))
}

export function saveAvatarPos(pos: Position) {
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
