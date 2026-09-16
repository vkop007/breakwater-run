import type { World, RigidBody } from '@dimforge/rapier3d-compat'
import type * as Rapier from '@dimforge/rapier3d-compat'
import type { Point } from '../../types/game'
export interface Pedestrian { id: number; position: Point; heading: number; state: 'idle' | 'walking' | 'crossing' | 'talking' | 'reacting' | 'fleeing' | 'calling' | 'returning'; timer: number; corner: number; origin: Point; body: RigidBody | null; lastCrime: number }
export const pedestrians: Pedestrian[] = []
export function visibleTo(world: World, rapier: Pick<typeof Rapier, 'Ray'>, from: Point, to: Point) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2], len = Math.hypot(dx, dy, dz)
  if (len < .1) return true
  return !world.castRay(new rapier.Ray({ x: from[0], y: from[1], z: from[2] }, { x: dx / len, y: dy / len, z: dz / len }), len, true, undefined, undefined, undefined, undefined, (c) => c.parent()?.isFixed() === true)
}
