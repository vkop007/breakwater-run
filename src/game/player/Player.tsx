import { useEffect, useRef } from 'react'
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import type { RapierRigidBody, RapierCollider } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useAppStore } from '../../stores/appStore'
import { useGameStore } from '../../stores/gameStore'
import { input } from '../input/input'
import { runtime } from '../core/runtime'
import { Box } from '../../scenes/ScenePrimitives'

export default function Player() {
  const body = useRef<RapierRigidBody>(null), collider = useRef<RapierCollider>(null)
  const visual = useRef<Group>(null)
  const leftLeg = useRef<Group>(null), rightLeg = useRef<Group>(null), leftArm = useRef<Group>(null), rightArm = useRef<Group>(null)
  const character = useAppStore((s) => s.character)
  const { world, rapier } = useRapier()
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null)
  const motion = useRef({ x: 0, z: 0, y: 0, grounded: false, angle: Math.PI, gait: 0, lastY: 0 })
  const spawn = useRef([...useGameStore.getState().safePosition] as [number, number, number])
  useEffect(() => {
    const generation = runtime.generation
    runtime.playerBody = body.current; runtime.playerCollider = collider.current
    const c = world.createCharacterController(.02)
    c.enableAutostep(.3, .25, false); c.enableSnapToGround(.2); c.setMaxSlopeClimbAngle(Math.PI / 4); c.setMinSlopeSlideAngle(Math.PI / 3)
    c.setApplyImpulsesToDynamicBodies(true); c.setCharacterMass(75); controller.current = c
    return () => { world.removeCharacterController(c); controller.current = null; if (generation === runtime.generation) { runtime.playerBody = null; runtime.playerCollider = null } }
  }, [world])
  useBeforePhysicsStep(() => {
    if (!body.current || !collider.current || !controller.current) return
    if (runtime.occupied) { body.current.setEnabled(false); return }
    if (!body.current.isEnabled()) body.current.setEnabled(true)
    const m = motion.current, dt = 1 / 60
    let forward = Number(input.down('KeyW')) - Number(input.down('KeyS'))
    let right = Number(input.down('KeyD')) - Number(input.down('KeyA'))
    const length = Math.hypot(forward, right)
    if (length > 0) { forward /= length; right /= length }
    const speed = input.down('ShiftLeft') || input.down('ShiftRight') ? 8.5 : input.down('AltLeft') || input.down('AltRight') ? 2.2 : 4.8
    const tx = (Math.sin(runtime.cameraYaw) * forward - Math.cos(runtime.cameraYaw) * right) * speed
    const tz = (Math.cos(runtime.cameraYaw) * forward + Math.sin(runtime.cameraYaw) * right) * speed
    const acceleration = length ? .2 : .3
    m.x += (tx - m.x) * acceleration; m.z += (tz - m.z) * acceleration
    if (input.take('Space') && m.grounded) { m.y = 7; m.grounded = false }
    m.y = Math.max(-28, m.y - 20 * dt)
    controller.current.computeColliderMovement(collider.current, { x: m.x * dt, y: m.y * dt, z: m.z * dt }, rapier.QueryFilterFlags.EXCLUDE_SENSORS)
    const movement = controller.current.computedMovement(), p = body.current.translation()
    const grounded = controller.current.computedGrounded()
    if (grounded && !m.grounded && m.y < -13) useGameStore.setState((s) => ({ player: { ...s.player, health: Math.max(0, s.player.health - (Math.abs(m.y) - 12) * 4) } }))
    m.grounded = grounded
    if (grounded) m.y = -.5
    const next = { x: p.x + movement.x, y: p.y + movement.y, z: p.z + movement.z }
    if (p.y < -8 || Math.abs(p.x) > 245 || Math.abs(p.z) > 245) {
      const safe = useGameStore.getState().safePosition
      body.current.setTranslation({ x: safe[0], y: safe[1], z: safe[2] }, true); m.y = 0; m.x = 0; m.z = 0
      runtime.position = [...safe]; runtime.grounded = false
      useGameStore.getState().notify('Back on solid ground.', 'warning'); return
    } else body.current.setNextKinematicTranslation(next)
    if (Math.hypot(m.x, m.z) > .15) {
      const desired = Math.atan2(m.x, m.z)
      m.angle += Math.atan2(Math.sin(desired - m.angle), Math.cos(desired - m.angle)) * .2
    }
    runtime.position = [next.x, next.y, next.z]; runtime.heading = m.angle; runtime.grounded = grounded
    runtime.moving = !grounded ? 'jumping' : length ? speed > 5 ? 'sprinting' : speed < 3 ? 'walking' : 'running' : 'idle'
  })
  useFrame((_, dt) => {
    if (!visual.current) return
    visual.current.visible = !runtime.occupied
    visual.current.rotation.y = motion.current.angle
    if (useAppStore.getState().phase !== 'playing') return
    const moving = runtime.moving !== 'idle' && runtime.grounded
    motion.current.gait += Math.min(dt, .05) * (runtime.moving === 'sprinting' ? 14 : 10)
    const swing = moving ? Math.sin(motion.current.gait) * .55 : 0
    if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
      leftLeg.current.rotation.x = swing; rightLeg.current.rotation.x = -swing
      leftArm.current.rotation.x = -swing; rightArm.current.rotation.x = swing
    }
  })
  const skin = character.preset === 'courier' ? '#ba805d' : character.preset === 'local' ? '#dcad83' : '#865a43'
  return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={spawn.current} name="player">
    <CapsuleCollider ref={collider} args={[.5, .35]} friction={0} />
    <group ref={visual} position={[0, -.85, 0]}>
      <Box position={[0, 1.08, 0]} size={[.62, .72, .35]} color={character.clothingColor} />
      <Box position={[0, 1.64, 0]} size={[.4, .43, .4]} color={skin} />
      <Box position={[0, 1.88, -.02]} size={[.45, .12, .43]} color="#344644" />
      {[{ side: -1, leg: leftLeg, arm: leftArm }, { side: 1, leg: rightLeg, arm: rightArm }].map(({ side, leg, arm }) => <group key={side}>
        <group ref={leg} position={[side * .17, .72, 0]}>
          <Box position={[0, -.33, 0]} size={[.24, .65, .27]} color="#3b5360" />
          <Box position={[0, -.66, .1]} size={[.26, .13, .43]} color="#e7dec8" />
        </group>
        <group ref={arm} position={[side * .42, 1.3, 0]}><Box position={[0, -.25, 0]} size={[.18, .56, .23]} color={skin} /></group>
      </group>)}
      {character.preset === 'courier' && <Box position={[0, 1.13, -.3]} size={[.44, .53, .22]} color="#c8aa68" />}
    </group>
  </RigidBody>
}
