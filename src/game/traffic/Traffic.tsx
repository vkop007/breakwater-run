import { useMemo, useRef } from 'react'
import { useBeforePhysicsStep } from '@react-three/rapier'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { Vehicle } from '../vehicles/Vehicles'
import { runtime } from '../core/runtime'
import { distance, RACE_ROUTE, chunkKey } from '../../data/district'
import type { Point } from '../../types/game'
import type { VehicleSpawn } from '../../data/vehicles'
import { Box } from '../../scenes/ScenePrimitives'
import { visibleChunks } from '../world/layout'
import { steerTo } from './steering'
export default function Traffic() {
  const quality = useSettingsStore((s) => s.quality)
  const player = useGameStore((s) => s.player.position)
  const mission = useGameStore((s) => s.mission)
  const count = quality === 'low' ? 4 : quality === 'high' ? 10 : 7
  const tracks = useMemo(() => Array.from({ length: count }, (_, i) => {
    const cx = (i % 3 - 1) * 96, cz = (Math.floor(i / 3) % 2 - 1) * 96
    const route: Point[] = [[cx + 3, .9, cz + 3], [cx + 93, .9, cz + 3], [cx + 93, .9, cz + 93], [cx + 3, .9, cz + 93]]
    const at = i % 4
    const spawn: VehicleSpawn = { id: `traffic-${i}`, kind: i % 3 === 0 ? 'van' : 'compact', position: route[at], yaw: Math.atan2(route[(at + 1) % 4][0] - route[at][0], route[(at + 1) % 4][2] - route[at][2]), legal: false, color: ['#7d9b9c', '#caa273', '#9ca985', '#b27866'][i % 4] }
    return { spawn, route, next: (at + 1) % 4, stuck: 0 }
  }), [count])
  const rival = useMemo<VehicleSpawn>(() => ({ id: 'race-rival', kind: 'coupe', position: [-3, 1.2, 96], yaw: Math.PI / 2, legal: true, color: '#a88dbe' }), [])
  const race = useRef({ next: 1, elapsed: Infinity })
  useBeforePhysicsStep(() => {
    if (runtime.step % 6 !== 0) return
    for (const track of tracks) {
      const { id } = track.spawn, v = runtime.vehicles.get(id)
      if (runtime.occupied === id) { runtime.drivers.delete(id); continue }
      if (!v) {
        const state = runtime.parked.get(id) || { position: [...track.spawn.position] as Point, yaw: track.spawn.yaw, health: 100 }
        const target = track.route[track.next], dx = target[0] - state.position[0], dz = target[2] - state.position[2], len = Math.hypot(dx, dz)
        if (len < 1) track.next = (track.next + 1) % track.route.length
        else { state.position[0] += dx / len * .6; state.position[2] += dz / len * .6; state.yaw = Math.atan2(dx, dz) }
        runtime.parked.set(id, state); continue
      }
      const target = track.route[track.next]
      if (distance(v.position, target) < 7) track.next = (track.next + 1) % track.route.length
      const diff: Point = [target[0] - v.position[0], 0, target[2] - v.position[2]]
      const red = Math.floor(runtime.elapsed / 12) % 2 === (Math.abs(diff[0]) > Math.abs(diff[2]) ? 0 : 1)
      const nearIntersection = distance(v.position, target) < 17
      const ahead = [...runtime.vehicles.values()].some((other) => {
        if (other.id === id) return false
        const dx = other.position[0] - v.position[0], dz = other.position[2] - v.position[2]
        return Math.hypot(dx, dz) < 9 && dx * Math.sin(v.yaw) + dz * Math.cos(v.yaw) > 1 && Math.abs(dx * Math.cos(v.yaw) - dz * Math.sin(v.yaw)) < 2.4
      })
      const blockedByPlayer = !runtime.occupied && distance(v.position, runtime.position) < 7
      const stop = (red && nearIntersection) || ahead || blockedByPlayer
      steerTo(id, track.route[track.next], 8, stop)
      track.stuck = Math.abs(v.speed) < .2 && !red ? track.stuck + .1 : 0
      if (track.stuck > 15 && distance(v.position, runtime.position) > 60) { v.body.setTranslation({ x: track.spawn.position[0], y: 1.4, z: track.spawn.position[2] }, true); v.body.setLinvel({ x: 0, y: 0, z: 0 }, true); track.stuck = 0 }
    }
    const current = useGameStore.getState().mission
    if (current?.id === 'race' && current.status === 'active') {
      const v = runtime.vehicles.get(rival.id)
      if (current.elapsed < race.current.elapsed) { race.current.next = 1; if (v) { v.body.setTranslation({ x: -3, y: 1.2, z: 96 }, true); v.body.setRotation({ x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, true); v.body.setLinvel({ x: 0, y: 0, z: 0 }, true) } }
      race.current.elapsed = current.elapsed
      if (v && race.current.next < RACE_ROUTE.length) {
        if (distance(v.position, RACE_ROUTE[race.current.next]) < 11) race.current.next++
        if (race.current.next < RACE_ROUTE.length) steerTo(rival.id, RACE_ROUTE[race.current.next], 10)
        else runtime.drivers.set(rival.id, { throttle: 0, steer: 0, brake: 1 })
        useGameStore.setState({ racePosition: current.step + 1 >= race.current.next ? 1 : 2 })
      }
    }
    runtime.trafficCount = tracks.filter((t) => runtime.vehicles.has(t.spawn.id)).length
  })
  return <>
    {tracks.filter((t) => { const p = runtime.vehicles.get(t.spawn.id)?.position || runtime.parked.get(t.spawn.id)?.position || t.spawn.position; return runtime.occupied === t.spawn.id || distance(p, player) < 145 && visibleChunks(player).includes(chunkKey(p[0], p[2])) }).map((t) => <Vehicle key={t.spawn.id} spawn={t.spawn} />)}
    {mission?.id === 'race' && mission.status === 'active' && <Vehicle spawn={rival} />}
    <TrafficSignals />
  </>
}
function TrafficSignals() {
  useGameStore((s) => Math.floor(s.time))
  const green = Math.floor(runtime.elapsed / 12) % 2 === 0
  return <group>
    {[-96, 0, 96].flatMap((x) => [-96, 0, 96].map((z) => <group key={`${x},${z}`} position={[x + 7, 0, z - 8]}>
      <Box position={[0, 2.7, 0]} size={[.12, 5.4, .12]} color="#486663" />
      <Box position={[0, 5.3, 0]} size={[.5, 1.1, .4]} color="#34484c" />
      <mesh position={[0, green ? 5 : 5.5, .23]}><sphereGeometry args={[.14, 6, 6]} /><meshBasicMaterial color={green ? '#8dcc86' : '#f3785b'} /></mesh>
    </group>))}
  </group>
}
