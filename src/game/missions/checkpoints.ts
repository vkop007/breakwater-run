import { runtime } from '../core/runtime'
import { useGameStore } from '../../stores/gameStore'
import { useAppStore } from '../../stores/appStore'
import { input } from '../input/input'
import type { Checkpoint, VehicleMemory } from '../../types/game'

export function vehicleMemories(): Record<string, VehicleMemory> {
  const result: Record<string, VehicleMemory> = {}
  for (const [id, v] of runtime.parked) if (!/^(traffic|police|race-rival)/.test(id)) result[id] = { position: [...v.position], yaw: v.yaw, health: v.health }
  for (const [id, v] of runtime.vehicles) if (!/^(traffic|police|race-rival)/.test(id)) result[id] = { position: [...v.position], yaw: v.yaw, health: v.health }
  return result
}
export function captureCheckpoint() {
  const s = useGameStore.getState()
  if (!s.mission || s.mission.status !== 'active') return
  const checkpoint: Checkpoint = { mission: { ...s.mission }, position: [...runtime.position], occupied: runtime.occupied, vehicles: vehicleMemories() }
  useGameStore.setState({ checkpoint })
}
export function restoreCheckpoint(): boolean {
  const s = useGameStore.getState(), checkpoint = s.checkpoint
  if (!checkpoint || !s.mission || checkpoint.mission.id !== s.mission.id) return false
  for (const [id, saved] of Object.entries(checkpoint.vehicles)) {
    const memory = { ...saved, position: [...saved.position] as VehicleMemory['position'], health: Math.max(35, saved.health) }
    runtime.parked.set(id, memory)
    const v = runtime.vehicles.get(id)
    if (v) {
      v.health = memory.health; v.position = [...memory.position]; v.yaw = memory.yaw
      v.body.setTranslation({ x: memory.position[0], y: memory.position[1] + .1, z: memory.position[2] }, true)
      v.body.setRotation({ x: 0, y: Math.sin(memory.yaw / 2), z: 0, w: Math.cos(memory.yaw / 2) }, true)
      v.body.setLinvel({ x: 0, y: 0, z: 0 }, true); v.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  }
  runtime.occupied = checkpoint.occupied
  runtime.position = [...checkpoint.position]
  runtime.playerBody?.setEnabled(!runtime.occupied)
  if (!runtime.occupied) runtime.playerBody?.setTranslation({ x: checkpoint.position[0], y: checkpoint.position[1] + .1, z: checkpoint.position[2] }, true)
  const hot = checkpoint.mission.id === 'hot-exit' && checkpoint.mission.step === 1
  useGameStore.setState({ mission: { ...checkpoint.mission, status: 'active', reason: '' }, recovery: null, player: { ...s.player, position: [...checkpoint.position], health: 100 }, wanted: { level: hot ? 2 : 0, state: hot ? 'pursuit' : 'clear', escape: hot ? 18 : 0, report: 0, caught: 0, lastKnown: [...checkpoint.position] } })
  input.clear(); useAppStore.setState({ phase: 'playing', panel: null }); s.notify('Latest objective checkpoint restored.'); return true
}
