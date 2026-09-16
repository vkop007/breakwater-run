import { useEffect, useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody, useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { Object3D, Vector3 } from 'three'
import type { Group, Mesh, SpotLight } from 'three'
import { VEHICLES, VEHICLE_SPAWNS } from '../../data/vehicles'
import type { VehicleSpawn } from '../../data/vehicles'
import { useGameStore } from '../../stores/gameStore'
import { input } from '../input/input'
import { runtime } from '../core/runtime'
import type { RuntimeVehicle } from '../core/runtime'
import { Box } from '../../scenes/ScenePrimitives'
import { chunkKey } from '../../data/district'
import { visibleChunks } from '../world/layout'
import { reportCrime } from '../core/events'

export default function Vehicles() {
  const player = useGameStore((s) => s.player.position)
  const owned = useGameStore((s) => s.owned)
  const extra = owned.filter((kind) => kind !== 'compact' && runtime.parked.has(`owned-${kind}`)).map((kind): VehicleSpawn => ({ id: `owned-${kind}`, kind, position: [93, 1.3, 25], yaw: 0, legal: true }))
  return <>{[...VEHICLE_SPAWNS, ...extra].filter((v) => {
    const p = runtime.vehicles.get(v.id)?.position || runtime.parked.get(v.id)?.position || v.position
    return runtime.occupied === v.id || Math.hypot(p[0] - player[0], p[2] - player[2]) < 145 && visibleChunks(player).includes(chunkKey(p[0], p[2]))
  }).map((spawn) => <Vehicle key={spawn.id} spawn={spawn} />)}</>
}
export function Vehicle({ spawn }: { spawn: VehicleSpawn }) {
  const body = useRef<RapierRigidBody>(null)
  const { world, rapier } = useRapier()
  const controller = useRef<ReturnType<typeof world.createVehicleController> | null>(null)
  const record = useRef<RuntimeVehicle | null>(null)
  const state = useRef(runtime.parked.get(spawn.id) || { position: spawn.position, yaw: spawn.yaw, health: 100 })
  const wheels = useRef<(Group | null)[]>([])
  const lamp = useRef<Mesh>(null), brakeLamp = useRef<Mesh>(null)
  const lightTarget = useMemo(() => new Object3D(), [])
  const headlight = useRef<SpotLight>(null)
  const activeVehicle = useGameStore((s) => s.vehicle?.id === spawn.id)
  const colors = useGameStore((s) => s.colors)
  const c = VEHICLES[spawn.kind]
  const lastCrash = useRef(0)
  useEffect(() => {
    if (!body.current) return
    const generation = runtime.generation
    const v = world.createVehicleController(body.current)
    v.indexUpAxis = 1; v.setIndexForwardAxis = 2
    for (const z of [c.halfLength * .7, -c.halfLength * .7]) for (const side of [-1, 1]) {
      v.addWheel({ x: side * c.halfWidth, y: 0, z }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, c.restLength, c.wheelRadius)
      const i = v.numWheels() - 1
      v.setWheelSuspensionStiffness(i, c.suspension / c.mass); v.setWheelSuspensionCompression(i, c.damping / c.mass)
      v.setWheelSuspensionRelaxation(i, c.damping / c.mass); v.setWheelMaxSuspensionTravel(i, .22)
      v.setWheelMaxSuspensionForce(i, c.mass * 20); v.setWheelFrictionSlip(i, 2.4); v.setWheelSideFrictionStiffness(i, 1)
    }
    const r: RuntimeVehicle = { id: spawn.id, kind: spawn.kind, body: body.current, speed: 0, health: state.current.health, headlights: false, position: [...state.current.position], yaw: state.current.yaw, legal: spawn.legal, brake: false, wheels: [0, 0, 0, 0], steering: 0, resetPosition: [...state.current.position] }
    controller.current = v; record.current = r; runtime.vehicles.set(spawn.id, r)
    return () => {
      if (generation === runtime.generation) { if (!spawn.id.startsWith('police')) runtime.parked.set(spawn.id, { position: [...r.position], yaw: r.yaw, health: r.health }); runtime.vehicles.delete(spawn.id); runtime.drivers.delete(spawn.id) }
       world.removeVehicleController(v); controller.current = null
    }
  }, [world, c, spawn.id, spawn.kind, spawn.legal])
  useBeforePhysicsStep(() => {
    const v = controller.current, r = record.current
    if (!v || !r) return
    const active = runtime.occupied === spawn.id, ai = runtime.drivers.get(spawn.id)
    const velocity = r.body.linvel(), rotation = r.body.rotation()
    const forward = new Vector3(0, 0, 1).applyQuaternion(rotation)
    r.speed = velocity.x * forward.x + velocity.z * forward.z
    const throttle = active ? Number(input.down('KeyW')) - Number(input.down('KeyS')) : ai?.throttle || 0
    const steer = active ? Number(input.down('KeyA')) - Number(input.down('KeyD')) : ai?.steer || 0
    const handbrake = active && input.down('Space')
    const opposing = throttle * r.speed < -1
    r.brake = opposing || handbrake || (ai?.brake || 0) > .2
    const upgraded = r.legal && (r.id === 'player-car' || r.id.startsWith('owned-')) && useGameStore.getState().discovered.includes('garage-upgrade')
    const engine = !opposing && r.health > 0 && (throttle > 0 ? r.speed < c.maxSpeed * (upgraded ? 1.1 : 1) : r.speed > -c.reverseSpeed)
      ? throttle * c.mass * c.acceleration * (upgraded ? 1.15 : 1) / 4 * Math.max(.25, r.health / 100) : 0
    r.steering += (steer * c.steering / (1 + Math.abs(r.speed) * .035) - r.steering) * .16
    const rainGrip = useGameStore.getState().weather === 'rain' ? .72 : 1
    for (let i = 0; i < 4; i++) {
      v.setWheelSteering(i, i < 2 ? r.steering : 0)
      v.setWheelEngineForce(i, engine)
      v.setWheelBrake(i, opposing ? c.brake * c.mass / 240 : handbrake && i >= 2 ? c.mass * .15 : ai?.brake ? c.mass * ai.brake / 15 : !active && !ai ? c.mass / 20 : .8)
      v.setWheelFrictionSlip(i, rainGrip * (handbrake && i >= 2 ? .65 : 2.4 * c.grip / 8))
      v.setWheelSideFrictionStiffness(i, handbrake && i >= 2 ? .25 : 1)
    }
    v.updateVehicle(1 / 60, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, (collider) => collider.parent()?.handle !== r.body.handle && collider.parent()?.handle !== runtime.playerBody?.handle)
    const p = r.body.translation()
    r.position = [p.x, p.y, p.z]; r.yaw = Math.atan2(forward.x, forward.z)
    if (active) { runtime.position = [...r.position]; runtime.heading = r.yaw; runtime.grounded = [0, 1, 2, 3].some((i) => v.wheelIsInContact(i)) }
    for (let i = 0; i < 4; i++) r.wheels[i] = v.wheelSuspensionLength(i) ?? c.restLength
    if (p.y < -8) {
      r.body.setTranslation({ x: r.resetPosition[0], y: 2, z: r.resetPosition[2] }, true)
      r.body.setLinvel({ x: 0, y: 0, z: 0 }, true); r.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  })
  useFrame(() => {
    const r = record.current, v = controller.current
    if (!r || !v) return
    wheels.current.forEach((wheel, i) => {
      if (!wheel) return
      wheel.position.y = -r.wheels[i]
      wheel.rotation.y = i < 2 ? r.steering : 0
      if (wheel.children[0]) wheel.children[0].rotation.x = v.wheelRotation(i) || 0
    })
    if (lamp.current) lamp.current.visible = r.headlights || useGameStore.getState().time < 360 || useGameStore.getState().time > 1110
    if (headlight.current) headlight.current.intensity = lamp.current?.visible ? 110 : 0
    if (brakeLamp.current) brakeLamp.current.visible = r.brake
  })
  const color = spawn.color || colors[spawn.kind]
  const van = spawn.kind === 'van', coupe = spawn.kind === 'coupe'
  return <RigidBody ref={body} position={state.current.position} rotation={[0, state.current.yaw, 0]} colliders={false}
    linearDamping={.12} angularDamping={2} ccd canSleep name={spawn.id}
    onContactForce={(event) => {
      const r = record.current
      if (!r || event.totalForceMagnitude < c.mass * 18 || runtime.elapsed - lastCrash.current < .6) return
      lastCrash.current = runtime.elapsed
      const damage = Math.min(28, (event.totalForceMagnitude / c.mass - 15) * .28)
      r.health = Math.max(0, r.health - damage)
      if (runtime.occupied === r.id) {
        runtime.shake = Math.min(.4, damage / 45)
        useGameStore.getState().notify(`Collision · vehicle condition ${Math.round(r.health)}%`, 'warning')
        if (damage > 5) reportCrime({ type: 'collision', position: [...r.position], severity: 1 })
      }
    }}>
    {activeVehicle && <><primitive object={lightTarget} position={[0, -.3, 18]} /><spotLight ref={headlight} position={[0, .6, c.halfLength]} target={lightTarget} color="#fff1cb" intensity={0} distance={42} angle={.48} penumbra={.6} decay={1.3} /></>}
    <CuboidCollider args={[c.halfWidth, .35, c.halfLength]} position={[0, .2, 0]} mass={c.mass} friction={.3} restitution={.05} />
    <CuboidCollider args={[c.halfWidth * .88, van ? .75 : .34, c.halfLength * .6]} position={[0, van ? .9 : .8, -.25]} mass={0} />
    <Box position={[0, .25, 0]} size={[c.halfWidth * 2, .65, c.halfLength * 2]} color={color} />
    <Box position={[0, van ? 1.0 : .82, -.25]} size={[c.halfWidth * 1.85, van ? 1.3 : coupe ? .5 : .6, c.halfLength * 1.2]} color={van ? color : '#3b6269'} />
    {van && <Box position={[0, 1.1, c.halfLength * .61 - .2]} size={[1.5, .6, .04]} color="#3b6269" />}
    <Box position={[0, van ? 1.7 : coupe ? 1.11 : 1.17, -.25]} size={[c.halfWidth * 1.9, .13, c.halfLength * 1.24]} color={color} />
    <Box position={[0, .15, c.halfLength + .02]} size={[c.halfWidth * 1.9, .17, .1]} color="#e5dfc9" />
    <mesh ref={lamp} position={[0, .45, c.halfLength + .06]}><boxGeometry args={[1.6, .18, .04]} /><meshBasicMaterial color="#fff4b0" /></mesh>
    <mesh ref={brakeLamp} position={[0, .42, -c.halfLength - .04]}><boxGeometry args={[1.5, .18, .05]} /><meshBasicMaterial color="#ff573d" /></mesh>
    {[c.halfLength * .7, -c.halfLength * .7].flatMap((z) => [-1, 1].map((side) => ({ x: side * c.halfWidth, z }))).map((p, i) => <group key={i} ref={(g) => { wheels.current[i] = g }} position={[p.x, -c.restLength, p.z]}>
      <group><mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[c.wheelRadius, c.wheelRadius, .22, 12]} /><meshStandardMaterial color="#253b40" /></mesh></group>
    </group>)}
    {spawn.id.startsWith('police') && <Box position={[0, 1.32, 0]} size={[1.3, .18, .35]} color="#637eaf" />}
  </RigidBody>
}
