import { ROUTE_NODES, chunkKey, distance } from '../../data/district'
import { visibleChunks } from '../world/layout'
import type { Point } from '../../types/game'
import type { VehicleSpawn } from '../../data/vehicles'
export function policeSpawns(level: number, player: Point, cameraYaw: number, occluded: (p: Point) => boolean = () => false): VehicleSpawn[] {
  const resident = visibleChunks(player)
  const nodes = ROUTE_NODES.filter((p) => {
    const d = distance(p, player), dot = ((p[0] - player[0]) * Math.sin(cameraYaw) + (p[2] - player[2]) * Math.cos(cameraYaw)) / d
    return d > 65 && d < 195 && (dot < .65 || occluded(p)) && resident.includes(chunkKey(p[0], p[2]))
  }).sort((a, b) => distance(a, player) - distance(b, player))
  if (!nodes.length) return []
  return Array.from({ length: Math.min(3, Math.max(0, level)) }, (_, i) => {
    const p = nodes[i % nodes.length]
    const z = Math.max(-230, Math.min(230, p[2] + Math.floor(i / nodes.length) * 8))
    return { id: `police-${i}`, kind: 'compact', position: [p[0] + 3, 1.3, z], yaw: level === 3 && i === 2 ? Math.PI / 2 : Math.abs(player[0] - p[0]) > Math.abs(player[2] - z) ? Math.sign(player[0] - p[0]) * Math.PI / 2 : player[2] > z ? 0 : Math.PI, legal: false, color: '#344e58' }
  })
}
