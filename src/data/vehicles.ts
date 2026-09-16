import type { Point, VehicleKind } from '../types/game'
export interface VehicleConfig {
  name: string; price: number; mass: number; maxSpeed: number; reverseSpeed: number; acceleration: number
  brake: number; steering: number; grip: number; suspension: number; damping: number; restLength: number
  halfWidth: number; halfLength: number; wheelRadius: number; color: string
}
export const VEHICLES: Record<VehicleKind, VehicleConfig> = {
  compact: { name: 'Pico', price: 900, mass: 850, maxSpeed: 23, reverseSpeed: 7, acceleration: 7, brake: 13, steering: .53, grip: 8, suspension: 28000, damping: 3200, restLength: .55, halfWidth: .9, halfLength: 1.85, wheelRadius: .36, color: '#e96e40' },
  coupe: { name: 'Kestrel', price: 2600, mass: 1150, maxSpeed: 38, reverseSpeed: 9, acceleration: 10.5, brake: 16, steering: .46, grip: 9, suspension: 37000, damping: 3900, restLength: .48, halfWidth: 1, halfLength: 2.1, wheelRadius: .38, color: '#388e9b' },
  van: { name: 'Hauler', price: 1600, mass: 1750, maxSpeed: 19, reverseSpeed: 5, acceleration: 5, brake: 11, steering: .5, grip: 7, suspension: 56000, damping: 5900, restLength: .6, halfWidth: 1.05, halfLength: 2.35, wheelRadius: .43, color: '#daba71' },
}
export interface VehicleSpawn { id: string; kind: VehicleKind; position: Point; yaw: number; legal: boolean; color?: string }
export const VEHICLE_SPAWNS: VehicleSpawn[] = [
  { id: 'player-car', kind: 'compact', position: [3.3, 1.2, 20], yaw: Math.PI, legal: true },
  { id: 'delivery-van', kind: 'van', position: [-3.3, 1.3, -20], yaw: 0, legal: true },
  { id: 'parked-coupe', kind: 'coupe', position: [99.3, 1.2, 20], yaw: Math.PI, legal: false },
  { id: 'recovery-car', kind: 'compact', position: [99.3, 1.2, -120], yaw: Math.PI, legal: false, color: '#83a77b' },
  { id: 'hot-car', kind: 'coupe', position: [-99.3, 1.2, -192], yaw: 0, legal: false, color: '#bd665a' },
]
