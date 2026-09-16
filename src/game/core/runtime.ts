import type { RapierRigidBody, RapierCollider } from '@react-three/rapier'
import type { Point, VehicleKind, VehicleMemory } from '../../types/game'
import { SAFE_SPAWN } from '../../data/district'
export interface RuntimeVehicle {
  id: string; kind: VehicleKind; body: RapierRigidBody; speed: number; health: number; headlights: boolean
  position: Point; yaw: number; legal: boolean; brake: boolean; wheels: number[]; steering: number; resetPosition: Point
}
export const runtime = {
  generation: 0,
  shake: 0,
  cameraLookAt: -10,
  courierCooldown: 60,
  playerBody: null as RapierRigidBody | null,
  playerCollider: null as RapierCollider | null,
  position: [...SAFE_SPAWN] as Point,
  heading: Math.PI,
  grounded: false,
  moving: 'idle' as 'idle' | 'walking' | 'running' | 'sprinting' | 'jumping',
  occupied: null as string | null,
  vehicles: new Map<string, RuntimeVehicle>(),
  parked: new Map<string, VehicleMemory>(),
  drivers: new Map<string, { throttle: number; steer: number; brake: number }>(),
  cameraYaw: Math.PI,
  cameraPitch: .28,
  cameraMode: 0,
  elapsed: 0,
  step: 0,
  npcCount: 0,
  trafficCount: 0,
  ready: false,
  reset() {
    this.generation++; this.courierCooldown = 60; this.npcCount = 0; this.trafficCount = 0; this.shake = 0; this.cameraLookAt = -10;
    this.playerBody = null; this.playerCollider = null; this.vehicles.clear(); this.parked.clear(); this.drivers.clear(); this.occupied = null
    this.position = [...SAFE_SPAWN]; this.heading = Math.PI; this.cameraYaw = Math.PI; this.cameraPitch = .28; this.cameraMode = 0
    this.grounded = false; this.moving = 'idle'; this.elapsed = 0; this.step = 0; this.ready = false
  },
}
