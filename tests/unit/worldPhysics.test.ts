import { beforeAll, afterEach, describe, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { makeChunk, visibleChunks } from '../../src/game/world/layout'
let world: RAPIER.World
beforeAll(async () => { await RAPIER.init() })
afterEach(() => world?.free())
function city() {
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  for (const chunk of [[0, 0], [1, 0]]) for (const s of makeChunk(...chunk as [number, number]).solids) world.createCollider(RAPIER.ColliderDesc.cuboid(s.size[0] / 2, s.size[1] / 2, s.size[2] / 2).setTranslation(...s.position))
  return world
}
describe('real Rapier city geometry', () => {
  it('supports road, sidewalk and a streamed chunk boundary without falling through', () => {
    city()
    const bodies = [[0, 3, 20], [8, 3, 20], [48, 3, 0]].map(([x,y,z]) => {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,z))
      world.createCollider(RAPIER.ColliderDesc.ball(.3), body); return body
    })
    for (let i=0;i<240;i++) world.step()
    expect(bodies[0].translation().y).toBeCloseTo(.3, 1)
    expect(bodies[1].translation().y).toBeCloseTo(.48, 1)
    expect(bodies[2].translation().y).toBeCloseTo(.3, 1)
  })
  it('blocks a moving capsule at a building and steps onto pavement', () => {
    city()
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(9, 1.05, -27))
    const collider = world.createCollider(RAPIER.ColliderDesc.capsule(.5,.35),body)
    const controller = world.createCharacterController(.02)
    controller.enableAutostep(.3,.25,false); controller.enableSnapToGround(.2)
    for(let i=0;i<160;i++) {
      controller.computeColliderMovement(collider,{x:.1,y:-.1,z:0})
      const p=body.translation(),m=controller.computedMovement()
      body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});world.step()
    }
    const building=makeChunk(0,0).solids.find(s=>s.id.endsWith('building-1'))!
    expect(body.translation().x).toBeLessThan(building.position[0]-building.size[0]/2-.3)
    expect(body.translation().y).toBeGreaterThan(.8)
    expect(controller.computedGrounded()).toBe(true)
    world.removeCharacterController(controller)
  })
  it('keeps world residency bounded at every district edge', () => {
    city()
    for (const x of [-238,0,238]) for(const z of [-238,0,238]) {
      expect(visibleChunks([x,1,z]).length).toBeLessThanOrEqual(9)
      expect(new Set(visibleChunks([x,1,z])).size).toBe(visibleChunks([x,1,z]).length)
    }
    expect(visibleChunks([0,1,0],2)).toHaveLength(25)
  })
})
