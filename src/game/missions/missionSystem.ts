import { useGameStore } from '../../stores/gameStore'
import { useAppStore } from '../../stores/appStore'
import { MISSIONS } from '../../data/missions'
import { LOCATIONS, RACE_ROUTE, distance } from '../../data/district'
import { VEHICLE_SPAWNS } from '../../data/vehicles'
import type { MissionId, Point } from '../../types/game'
import { runtime } from '../core/runtime'
import { input } from '../input/input'
import { takeCrimes } from '../core/events'
import { captureCheckpoint } from './checkpoints'
import { saveGame } from '../save/saveSystem'

function resetMissionVehicle(id: string, position: Point, yaw: number) {
  runtime.parked.set(id, { position: [...position], yaw, health: 100 })
  runtime.drivers.delete(id)
  const v = runtime.vehicles.get(id)
  if (!v) return
  v.health = 100; v.speed = 0; v.steering = 0; v.brake = false
  v.position = [...position]; v.resetPosition = [...position]; v.yaw = yaw
  v.body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true)
  v.body.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true)
  v.body.setLinvel({ x: 0, y: 0, z: 0 }, true); v.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
}

export function startMission(id: MissionId, restart = false) {
  const s = useGameStore.getState(), definition = MISSIONS[id]
  if (!restart && s.mission?.status === 'active') { s.notify('Finish or abandon your current activity first.', 'warning'); return false }
  if (definition.requiredMission && !s.completed.includes(definition.requiredMission)) { s.notify('Complete The Missing Car first.', 'warning'); return false }
  const contact = LOCATIONS.find((l) => l.id === (id === 'recovery' ? 'garage' : id))!
  if (!restart && distance(runtime.position, contact.position) > 24) { s.notify(`Visit ${contact.name} to start this activity. A waypoint is on your map.`); useGameStore.setState({ waypoint: contact.position }); return false }
  // A failed racer may have exited or returned to the safehouse. Its checkpoint
  // retains the original vehicle even when the body is no longer resident.
  const raceVehicle = restart && s.checkpoint?.mission.id === 'race' ? s.checkpoint.occupied : runtime.occupied
  if (id === 'race' && !raceVehicle) { s.notify('Enter a vehicle before starting the race.', 'warning'); return false }
  if (id === 'race' && /^(traffic|police|race-rival)/.test(raceVehicle || '')) { s.notify('Use a parked or owned vehicle for the circuit.', 'warning'); return false }
  useGameStore.setState({ mission: { id, step: 0, elapsed: 0, status: 'active', reason: '' }, racePosition: 1 })
  if (restart) {
    let position: Point = [contact.position[0], 1.3, contact.position[2]], yaw = Math.PI
    if (id === 'race' && raceVehicle) {
      position = [RACE_ROUTE[0][0] + 3, 1.3, RACE_ROUTE[0][2]]; yaw = Math.PI / 2
      resetMissionVehicle(raceVehicle, position, yaw)
      resetMissionVehicle('race-rival', [RACE_ROUTE[0][0] - 3, 1.3, RACE_ROUTE[0][2]], yaw)
    } else {
      const spawn = VEHICLE_SPAWNS.find((v) => v.id === definition.objectives[0].vehicle)!
      resetMissionVehicle(spawn.id, spawn.position, spawn.yaw)
    }
    runtime.occupied = id === 'race' ? raceVehicle : null
    runtime.position = [...position]; runtime.heading = yaw; runtime.cameraYaw = yaw; runtime.cameraMode = 0
    runtime.grounded = false; runtime.shake = 0
    runtime.playerBody?.setEnabled(!runtime.occupied)
    runtime.playerBody?.setTranslation({ x: position[0], y: position[1], z: position[2] }, true)
    input.clear(); takeCrimes()
    useGameStore.setState({ recovery: null, vehicle: null, player: { ...s.player, position: [...position], health: 100 }, wanted: { level: 0, state: 'clear', report: 0, escape: 0, caught: 0, lastKnown: [...position] } })
  }
  captureCheckpoint()
  s.notify(`${definition.title} · ${definition.objectives[0].text}`)
  useAppStore.setState({ phase: 'playing', panel: null }); return true
}
export function failMission(reason: string) {
  const s = useGameStore.getState()
  if (!s.mission || s.mission.status !== 'active') return
  useGameStore.setState({ mission: { ...s.mission, status: 'failed', reason } })
  s.notify(`${MISSIONS[s.mission.id].title}: ${reason}. Restart from Activities.`, 'warning')
}
export function advanceMission() {
  const s = useGameStore.getState(), m = s.mission
  if (!m || m.status !== 'active') return
  const definition = MISSIONS[m.id]
  if (m.step + 1 < definition.objectives.length) {
    useGameStore.setState({ mission: { ...m, step: m.step + 1 } })
    captureCheckpoint()
    s.notify(definition.objectives[m.step + 1].text); return
  }
  const first = !s.completed.includes(m.id)
  const reward = m.id === 'race' && s.racePosition > 1 ? 0 : definition.reward
  useGameStore.setState({
    mission: null, checkpoint: null, money: s.money + reward, completed: first ? [...s.completed, m.id] : s.completed,
    unlocked: definition.unlock && !s.unlocked.includes(definition.unlock) ? [...s.unlocked, definition.unlock] : s.unlocked,
    bestRace: m.id === 'race' ? Math.min(s.bestRace || Infinity, m.elapsed) : s.bestRace,
  })
  s.notify(`${definition.title} complete · ${reward ? `+$${reward}` : 'Practice finish'}`, 'success')
  if (m.id === 'recovery') s.notify('Quayline Garage is open. Repair, repaint, or buy a vehicle.', 'success')
  saveGame()
}
export function updateMission(dt: number) {
  const s = useGameStore.getState(), m = s.mission
  if (!m || m.status !== 'active') return
  const definition = MISSIONS[m.id], goal = definition.objectives[m.step]
  const elapsed = m.elapsed + dt
  useGameStore.setState({ mission: { ...m, elapsed } })
  if (definition.timeLimit && elapsed > definition.timeLimit) { failMission('Time ran out'); return }
  const requiredId = definition.objectives.find((o) => o.vehicle)?.vehicle
  const required = requiredId ? runtime.vehicles.get(requiredId) || runtime.parked.get(requiredId) : null
  if (required && required.health <= 0) { failMission('The mission vehicle was destroyed'); return }
  const vehicle = runtime.occupied ? runtime.vehicles.get(runtime.occupied) : null
  if (vehicle && vehicle.health <= 0) { failMission('The vehicle was destroyed'); return }
  if (goal.kind === 'enter' && runtime.occupied === goal.vehicle) {
    if (m.id === 'hot-exit') useGameStore.setState({ wanted: { ...s.wanted, level: 2, state: 'pursuit', escape: 18, lastKnown: [...runtime.position] } })
    advanceMission()
  } else if (goal.kind === 'escape' && s.wanted.level === 0 && s.wanted.state === 'clear') advanceMission()
  else if (['drive', 'return', 'checkpoint'].includes(goal.kind) && vehicle && (!goal.vehicle || goal.vehicle === vehicle.id) && distance(runtime.position, goal.target) < goal.radius && (goal.kind === 'checkpoint' || Math.abs(vehicle.speed) < 3)) advanceMission()
}
export function interactObjective(): boolean {
  const s = useGameStore.getState(), m = s.mission
  if (!m || m.status !== 'active') return false
  const goal = MISSIONS[m.id].objectives[m.step]
  if (['collect', 'deliver', 'talk'].includes(goal.kind) && distance(runtime.position, goal.target) < goal.radius && !runtime.occupied) {
    if (m.id === 'delivery' && goal.kind === 'deliver') {
      const van = runtime.vehicles.get('delivery-van') || runtime.parked.get('delivery-van')
      if (!van || distance(van.position, goal.target) > 25) { s.notify('Bring the delivery van closer before unloading.', 'warning'); return true }
    }
    advanceMission(); return true
  }
  return false
}
