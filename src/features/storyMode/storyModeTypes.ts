import type { Especial } from '../../screens/Mundo1'

export type TilePos = { col: number; row: number }

export type ZoneActivity =
  | { type: 'especial'; especial: Especial }
  | { type: 'jugar'; actividadId: string }

export type StoryZone = {
  id: string
  name: string
  emoji: string
  description: string
  position: TilePos          // tile coords (col, row)
  bw: number; bd: number; bh: number   // building width, depth, height (in tiles)
  colorTop: string; colorLeft: string; colorRight: string
  activity: ZoneActivity
}

export type StoryProgress = {
  avatarPos: TilePos
  visitedZones: string[]
  lastZone: string | null
}
