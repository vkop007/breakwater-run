import { useEffect, useMemo, useRef } from 'react'
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { runtime } from '../core/runtime'
import { useSettingsStore } from '../../stores/settingsStore'
import { distance } from '../../data/district'
import { reportCrime } from '../core/events'
import type { Point } from '../../types/game'
import { pedestrians } from './actors'
const corners: Point[] = [[-12, 0, -12], [-12, 0, 12], [12, 0, 12], [12, 0, -12]]
export default function Pedestrians() {
  const { world, rapier } = useRapier()
  const quality = useSettingsStore((s) => s.quality)
  const count = quality === 'low' ? 10 : quality === 'high' ? 30 : 20
  const mesh = useRef<InstancedMesh>(null)
  const object = useMemo(() => new Object3D(), [])
  useEffect(() => {
    pedestrians.length = 0
    for (let i = 0; i < count; i++) {
      const origin: Point = [((i % 3) - 1) * 96, 0, ((Math.floor(i / 3) % 3) - 1) * 96]
      const corner = i % 4, p: Point = [origin[0] + corners[corner][0], .95, origin[2] + corners[corner][2]]
      pedestrians.push({ id: i, position: p, heading: 0, state: 'walking', timer: i * .3, corner: (corner + 1) % 4, origin, body: null, lastCrime: -10 })
    }
    return () => { for (const npc of pedestrians) if (npc.body && world.getRigidBody(npc.body.handle)) world.removeRigidBody(npc.body); pedestrians.length = 0; runtime.npcCount = 0 }
  }, [world, count])
  useBeforePhysicsStep(() => {
    if (runtime.step % 6 !== 0) return
    for (const npc of pedestrians) {
      const d = distance(npc.position, runtime.position)
      if (d > 175) {
        if (npc.body) { world.removeRigidBody(npc.body); npc.body = null }
        if (runtime.elapsed % 5 < .11) {
          npc.origin = [Math.max(-192, Math.min(192, Math.round(runtime.position[0] / 96) * 96 + (npc.id % 3 - 1) * 96)), 0, Math.max(-192, Math.min(192, Math.round(runtime.position[2] / 96) * 96 + (Math.floor(npc.id / 3) % 3 - 1) * 96))]
          npc.position = [npc.origin[0] + corners[npc.corner][0], .95, npc.origin[2] + corners[npc.corner][2]]
        }
        continue
      }
      if (d < 65 && !npc.body) {
        npc.body = world.createRigidBody(rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(...npc.position))
        world.createCollider(rapier.ColliderDesc.capsule(.45, .28), npc.body)
      } else if (d > 80 && npc.body) { world.removeRigidBody(npc.body); npc.body = null }
      npc.timer = Math.max(0, npc.timer - .1)
      const hazard = [...runtime.vehicles.values()].find((v) => distance(v.position, npc.position) < 8 && Math.abs(v.speed) > 5)
      if (hazard) {
        const dx = npc.position[0] - hazard.position[0], dz = npc.position[2] - hazard.position[2], len = Math.hypot(dx, dz) || 1
        npc.state = 'fleeing'; npc.timer = 3
        npc.position[0] += dx / len * .36; npc.position[2] += dz / len * .36
        if (runtime.occupied === hazard.id && runtime.elapsed - npc.lastCrime > 8) { npc.lastCrime = runtime.elapsed; reportCrime({ type: distance(hazard.position, npc.position) < 2 ? 'collision' : 'dangerous-driving', position: [...npc.position], severity: 1 }) }
      } else if (npc.state === 'calling' && npc.timer > 0) {
        // Witness waits for its reporting timer while police logic verifies observation.
      } else if (npc.timer <= 0 || !['idle', 'talking', 'calling'].includes(npc.state)) {
        if (npc.state === 'fleeing' && npc.timer <= 0) npc.state = 'returning'
        const corner = corners[npc.corner], target: Point = [npc.origin[0] + corner[0], .95, npc.origin[2] + corner[2]]
        const dx = target[0] - npc.position[0], dz = target[2] - npc.position[2], len = Math.hypot(dx, dz)
        const crossing = Math.abs(npc.position[0] - npc.origin[0]) < 7 || Math.abs(npc.position[2] - npc.origin[2]) < 7
        const stop = !crossing && [...runtime.vehicles.values()].some((v) => Math.abs(v.speed) > 2 && distance(v.position, target) < 14)
        if (len < .7) {
          npc.corner = (npc.corner + 1) % 4
          if ((Math.floor(runtime.elapsed) + npc.id) % 4 === 0) { npc.state = npc.id % 2 ? 'talking' : 'idle'; npc.timer = 1.5 }
        } else if (!stop) {
          npc.state = crossing ? 'crossing' : npc.state === 'returning' ? 'returning' : 'walking'
          npc.heading = Math.atan2(dx, dz)
          npc.position[0] += dx / len * .14; npc.position[2] += dz / len * .14
        } else npc.state = 'reacting'
      }
      if (npc.body) npc.body.setNextKinematicTranslation({ x: npc.position[0], y: .95, z: npc.position[2] })
    }
    runtime.npcCount = pedestrians.filter((p) => distance(p.position, runtime.position) < 175).length
  })
  useFrame(() => {
    if (!mesh.current) return
    const palette = ['#c2856b', '#6d9497', '#d0b576', '#778f72', '#958cac']
    const color = new Color()
    let index = 0
    for (const npc of pedestrians) {
      const visible = distance(npc.position, runtime.position) < 175
      const swing = ['walking', 'crossing', 'fleeing', 'returning'].includes(npc.state) ? Math.sin(runtime.elapsed * 8 + npc.id) * .12 : 0
      const parts: { offset: Point; size: Point; color: string }[] = [
        { offset: [0, .3, 0], size: [.55, .68, .32], color: palette[npc.id % palette.length] },
        { offset: [0, .85, 0], size: [.37, .4, .37], color: npc.id % 2 ? '#c68b67' : '#986747' },
        { offset: [-.16, -.42, swing], size: [.22, .72, .26], color: '#435769' },
        { offset: [.16, -.42, -swing], size: [.22, .72, .26], color: '#435769' },
        { offset: [-.38, .25, -swing], size: [.16, .56, .2], color: '#b38465' },
        { offset: [.38, .25, swing], size: [.16, .56, .2], color: '#b38465' },
      ]
      for (const p of parts) {
        const [dx, dy, dz] = p.offset
        object.position.set(npc.position[0] + dx * Math.cos(npc.heading) + dz * Math.sin(npc.heading), npc.position[1] + dy, npc.position[2] - dx * Math.sin(npc.heading) + dz * Math.cos(npc.heading))
        object.rotation.set(0, npc.heading, 0); object.scale.set(...(visible ? p.size : [0, 0, 0] as Point)); object.updateMatrix()
        mesh.current.setMatrixAt(index, object.matrix); mesh.current.setColorAt(index, color.set(p.color)); index++
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[undefined, undefined, count * 6]} frustumCulled={false} castShadow><boxGeometry /><meshStandardMaterial roughness={.9} /></instancedMesh>
}
