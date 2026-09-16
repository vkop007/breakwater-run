import { runtime } from '../core/runtime'
import type { Point } from '../../types/game'
export function steerTo(id: string, target: Point, desiredSpeed: number, stop = false) {
  const v = runtime.vehicles.get(id)
  if (!v) return
  const desired = Math.atan2(target[0] - v.position[0], target[2] - v.position[2])
  const angle = Math.atan2(Math.sin(desired - v.yaw), Math.cos(desired - v.yaw))
  const speed = Math.abs(angle) > .65 ? Math.min(desiredSpeed, 5) : desiredSpeed
  runtime.drivers.set(id, { throttle: stop ? 0 : v.speed < speed ? .7 : 0, brake: stop || v.speed > speed + 1 ? .7 : 0, steer: Math.max(-1, Math.min(1, angle * 1.8)) })
}

/** A small Manhattan road graph. Recomputed occasionally, never per render frame. */
export function roadPath(from: Point, destination: Point, yaw: number): Point[] {
  const clamp = (n: number) => Math.max(-2, Math.min(2, n))
  let x = clamp(Math.round(from[0] / 96)), z = clamp(Math.round(from[2] / 96))
  const gx = clamp(Math.round(destination[0] / 96)), gz = clamp(Math.round(destination[2] / 96))
  const alongZ = Math.abs(Math.cos(yaw)) > Math.abs(Math.sin(yaw))
  if (alongZ && Math.abs(from[2] - z * 96) > 15) z = clamp(Math.cos(yaw) > 0 ? Math.ceil(from[2] / 96) : Math.floor(from[2] / 96))
  if (!alongZ && Math.abs(from[0] - x * 96) > 15) x = clamp(Math.sin(yaw) > 0 ? Math.ceil(from[0] / 96) : Math.floor(from[0] / 96))
  const path: Point[] = [[x * 96 + 3, 1, z * 96 + 3]]
  while (x !== gx || z !== gz) {
    if (Math.abs(gx - x) > Math.abs(gz - z)) x += Math.sign(gx - x)
    else z += Math.sign(gz - z)
    path.push([x * 96 + 3, 1, z * 96 + 3])
  }
  if (Math.min(Math.abs(destination[0] - gx * 96), Math.abs(destination[2] - gz * 96)) < 10) path.push([...destination])
  return path
}
