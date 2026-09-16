import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { runtime } from '../../src/game/core/runtime'
import { useGameStore } from '../../src/stores/gameStore'
import { startMission, updateMission } from '../../src/game/missions/missionSystem'
import { VEHICLE_SPAWNS } from '../../src/data/vehicles'
import { LOCATIONS } from '../../src/data/district'
import { captureCheckpoint } from '../../src/game/missions/checkpoints'
import { input } from '../../src/game/input/input'

let world: RAPIER.World
beforeAll(async () => { await RAPIER.init() })
beforeEach(() => { runtime.reset(); useGameStore.getState().reset(); world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }) })
afterEach(() => world.free())

it.each(['delivery', 'recovery', 'hot-exit'] as const)('restarts %s with its unloaded wreck restored and the player at the contact', (id) => {
  const vehicleId = { delivery: 'delivery-van', recovery: 'recovery-car', 'hot-exit': 'hot-car' }[id]
  const spawn = VEHICLE_SPAWNS.find((v) => v.id === vehicleId)!
  const contact = LOCATIONS.find((l) => l.id === (id === 'recovery' ? 'garage' : id))!
  runtime.parked.set(vehicleId, { position: [200, -3, 200], yaw: 2, health: 0 })
  runtime.occupied = vehicleId
  useGameStore.setState({ completed: ['recovery'], mission: { id, step: 1, elapsed: 80, status: 'failed', reason: 'wrecked' }, wanted: { level: 2, state: 'pursuit', escape: 18, report: 0, caught: 0, lastKnown: [200, 0, 200] } })
  expect(startMission(id, true)).toBe(true)
  updateMission(.1)
  expect(useGameStore.getState().mission).toMatchObject({ id, step: 0, status: 'active' })
  expect(runtime.parked.get(vehicleId)).toEqual({ position: spawn.position, yaw: spawn.yaw, health: 100 })
  expect(runtime.position).toEqual([contact.position[0], 1.3, contact.position[2]])
  expect(runtime.occupied).toBeNull()
  expect(useGameStore.getState().wanted.level).toBe(0)
  expect(useGameStore.getState().money).toBe(350)
  expect(useGameStore.getState().checkpoint?.vehicles[vehicleId].health).toBe(100)
})

it('restarts a destroyed, overturned race car after exiting without immediately failing again', () => {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(170, -2, 170))
  body.setRotation({ x: 1, y: 0, z: 0, w: 0 }, true)
  body.setLinvel({ x: 4, y: -3, z: 2 }, true); body.setAngvel({ x: 2, y: 1, z: 3 }, true)
  runtime.vehicles.set('player-car', { id: 'player-car', kind: 'compact', body, health: 0, speed: 8, position: [170, -2, 170], yaw: 0, headlights: false, legal: true, brake: true, wheels: [0, 0, 0, 0], steering: .5, resetPosition: [170, -2, 170] })
  runtime.occupied = 'player-car'
  useGameStore.setState({ mission: { id: 'race', step: 3, elapsed: 70, status: 'active', reason: '' } })
  captureCheckpoint()
  runtime.occupied = null
  useGameStore.setState({ mission: { ...useGameStore.getState().mission!, status: 'failed' } })
  input.held.add('KeyW')
  expect(startMission('race', true)).toBe(true)
  expect(runtime.occupied).toBe('player-car')
  expect(body.translation()).toMatchObject({ x: 3, z: 96 })
  expect(body.rotation().x).toBe(0); expect(body.rotation().z).toBe(0)
  expect(body.rotation().y).toBeCloseTo(Math.SQRT1_2)
  expect(body.linvel()).toEqual({ x: 0, y: 0, z: 0 }); expect(body.angvel()).toEqual({ x: 0, y: 0, z: 0 })
  expect(runtime.vehicles.get('player-car')?.health).toBe(100)
  expect(input.down('KeyW')).toBe(false)
  updateMission(.1)
  expect(useGameStore.getState().mission).toMatchObject({ step: 0, elapsed: .1, status: 'active' })
  expect(useGameStore.getState().checkpoint?.occupied).toBe('player-car')
})
