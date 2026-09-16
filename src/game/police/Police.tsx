import { useMemo, useRef, useState } from 'react'
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import { useGameStore } from '../../stores/gameStore'
import { useAppStore } from '../../stores/appStore'
import { runtime } from '../core/runtime'
import { takeCrimes, reportCrime } from '../core/events'
import { pedestrians, visibleTo } from '../npcs/actors'
import { distance } from '../../data/district'
import { Vehicle } from '../vehicles/Vehicles'
import { steerTo, roadPath } from '../traffic/steering'
import { policeSpawns } from './spawning'
import type { Point } from '../../types/game'
import { failMission } from '../missions/missionSystem'
export default function Police() {
  const { world, rapier } = useRapier()
  const [spawnAttempt, retrySpawn] = useState(0)
  const level = useGameStore((s) => s.wanted.level)
  const witness = useRef<number | null>(null)
  const severity = useRef(1)
  const routes = useRef(new Map<string, { path: Point[]; next: number; at: number }>())
  const restricted = useRef(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry the spatial query after supporting chunks become resident.
  const units = useMemo(() => policeSpawns(level, runtime.position, runtime.cameraYaw, (p) => !visibleTo(world, rapier, [runtime.position[0], runtime.position[1] + 1, runtime.position[2]], [p[0], 1.7, p[2]])), [level, world, rapier, spawnAttempt])
  useBeforePhysicsStep(() => {
    if (runtime.step % 6 !== 0) return
    if (level > 0 && units.length === 0 && runtime.step % 60 === 0) retrySpawn((n) => n + 1)
    const s = useGameStore.getState(), wanted = { ...s.wanted }, p = runtime.position
    const eye: Point = [p[0], p[1] + .8, p[2]]
    const inside = p[0] < -70 && p[0] > -130 && p[2] < -166
    if (inside && !restricted.current) reportCrime({ type: 'restricted', position: [...p], severity: 1 })
    restricted.current = inside
    for (const crime of takeCrimes()) {
      const observer = pedestrians.find((npc) => distance(npc.position, crime.position) < 36 && ((crime.position[0] - npc.position[0]) * Math.sin(npc.heading) + (crime.position[2] - npc.position[2]) * Math.cos(npc.heading) > -4) && visibleTo(world, rapier, [npc.position[0], 1.8, npc.position[2]], eye))
      const police = [...runtime.vehicles.values()].find((v) => v.id.startsWith('police') && distance(v.position, p) < 70 && visibleTo(world, rapier, [v.position[0], 2, v.position[2]], eye))
      if (police) { wanted.level = Math.min(3, wanted.level + crime.severity); wanted.state = 'pursuit'; wanted.lastKnown = [...p] }
      else if (observer && wanted.state !== 'reporting' && wanted.level === 0) {
        witness.current = observer.id; observer.state = 'calling'; observer.timer = 4; severity.current = crime.severity
        wanted.state = 'reporting'; wanted.report = 4
        s.notify('A witness is calling the police. Leave their sight before the report completes.', 'warning')
      }
    }
    if (wanted.state === 'reporting') {
      const observer = pedestrians.find((n) => n.id === witness.current)
      const observed = observer && distance(observer.position, p) < 45 && visibleTo(world, rapier, [observer.position[0], 1.8, observer.position[2]], eye)
      if (!observed) { wanted.state = 'clear'; wanted.report = 0; s.notify('The witness lost sight of you.') }
      else {
        wanted.report = Math.max(0, wanted.report - .1)
        if (wanted.report === 0) { wanted.level = Math.min(3, wanted.level + severity.current); wanted.state = 'investigating'; wanted.lastKnown = [...p]; wanted.escape = 18; s.notify('Police are investigating the report.', 'warning') }
      }
    }
    if (wanted.level > 0) {
      const cops = [...runtime.vehicles.values()].filter((v) => v.id.startsWith('police'))
      const seeing = cops.some((v) => distance(v.position, p) < 90 && visibleTo(world, rapier, [v.position[0], 1.7, v.position[2]], eye))
      if (seeing) { wanted.state = 'pursuit'; wanted.lastKnown = [...p]; wanted.escape = 18 }
      else if (cops.length === 0) { wanted.state = 'investigating'; wanted.escape = 18 }
      else {
        if (wanted.state !== 'search') { wanted.state = 'search'; wanted.escape = 18 }
        wanted.escape = Math.max(0, wanted.escape - .1)
        if (wanted.escape === 0) { wanted.level = 0; wanted.state = 'clear'; wanted.caught = 0; s.notify('Search cleared. You lost the police.', 'success') }
      }
      const speed = runtime.occupied ? Math.abs(runtime.vehicles.get(runtime.occupied)?.speed || 0) : 0
      const caught = seeing && speed < 2 && cops.some((v) => distance(v.position, p) < 6)
      wanted.caught = caught ? wanted.caught + .1 : 0
      for (const cop of cops) {
        if (cop.id === 'police-2' && wanted.level === 3) { runtime.drivers.set(cop.id, { throttle: 0, steer: 0, brake: 1 }); continue }
        const destination = wanted.lastKnown
        let route = routes.current.get(cop.id)
        if (!route || runtime.elapsed - route.at > 4 || route.next >= route.path.length) {
          route = { path: roadPath(cop.position, destination, cop.yaw), next: 0, at: runtime.elapsed }; routes.current.set(cop.id, route)
        }
        if (distance(cop.position, route.path[route.next]) < 9 && route.next < route.path.length - 1) route.next++
        const target = distance(cop.position, destination) < 20 ? destination : route.path[route.next]
        const speed = distance(cop.position, target) < 24 ? 7 : wanted.level === 1 ? 15 : 22
        steerTo(cop.id, target, speed, wanted.state === 'search' && distance(cop.position, destination) < 8)
      }
      if (wanted.caught >= 4 && !s.recovery) {
        failMission('You were arrested'); useGameStore.setState({ recovery: 'arrested', money: Math.max(0, s.money - 100) }); useAppStore.getState().pause(); s.notify('Arrested · $100 fine', 'warning')
      }
    }
    useGameStore.setState({ wanted })
  })
  return <>{units.map((spawn) => <Vehicle key={spawn.id} spawn={spawn} />)}</>
}
