import type { Point } from '../types/game'
export const CHUNK_SIZE = 96
export const DISTRICT_LIMIT = 238
export const SAFE_SPAWN: Point = [9, 1.3, 20]
export interface Location { id: string; name: string; kind: 'home' | 'garage' | 'shop' | 'mission' | 'race' | 'gas' | 'park'; position: Point; color: string; description: string }
export const LOCATIONS: Location[] = [
  { id: 'home', name: 'Seabreeze Apartment', kind: 'home', position: [9, .2, 22], color: '#dca468', description: 'Save your progress, change clothing, and recover.' },
  { id: 'delivery', name: 'Parcel & Pine', kind: 'mission', position: [-9, .2, -22], color: '#e7b85e', description: 'Mara has packages waiting for a reliable driver.' },
  { id: 'garage', name: 'Quayline Garage', kind: 'garage', position: [105, .2, 18], color: '#65b6ba', description: 'Meet Ivo. Recover his car to unlock garage services.' },
  { id: 'shop', name: 'Sunroom Market', kind: 'shop', position: [9, .2, -105], color: '#e99574', description: 'Health recovery and fresh clothing colors.' },
  { id: 'gas', name: 'Sunline Service', kind: 'gas', position: [-87, .2, 18], color: '#d7ba64', description: 'Repair a nearby vehicle and get back on the road.' },
  { id: 'park', name: 'Lantern Gardens', kind: 'park', position: [25, .2, 25], color: '#82b87d', description: 'A quiet pocket of green in the neighborhood.' },
  { id: 'hot-exit', name: 'Old Freight Yard', kind: 'mission', position: [-87, .2, -178], color: '#cf8473', description: 'A risky vehicle job from Remy.' },
  { id: 'race', name: 'Harbor Circuit', kind: 'race', position: [9, .2, 108], color: '#b49cd0', description: 'One rival. Six checkpoints. A clean line to the finish.' },
]
export const COLLECTIBLES: Point[] = [[-15, .8, 22], [23, .8, 34], [88, .8, -30], [-105, .8, 110], [8, .8, 198]]
export const RACE_ROUTE: Point[] = [[0, .2, 96], [96, .2, 96], [96, .2, 0], [0, .2, 0], [-96, .2, 0], [-96, .2, 96], [0, .2, 96]]
export const ROUTE_NODES: Point[] = Array.from({ length: 25 }, (_, i) => [((i % 5) - 2) * 96, .1, (Math.floor(i / 5) - 2) * 96])
export function chunkKey(x: number, z: number) { return `${Math.max(-2, Math.min(2, Math.round(x / CHUNK_SIZE)))},${Math.max(-2, Math.min(2, Math.round(z / CHUNK_SIZE)))}` }
export function distance(a: Point, b: Point) { return Math.hypot(a[0] - b[0], a[2] - b[2]) }
