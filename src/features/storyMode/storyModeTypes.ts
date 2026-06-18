import type { Especial } from '../../screens/Mundo1'

export type Position = { x: number; y: number }

export type ZoneActivity =
  | { type: 'especial'; especial: Especial }
  | { type: 'jugar'; actividadId: string }

export type StoryZone = {
  id: string
  name: string
  emoji: string
  description: string
  position: Position
  color: string
  activity: ZoneActivity
}

export type StoryProgress = {
  avatarPos: Position
  visitedZones: string[]
  lastZone: string | null
}
