import { useGameStore } from '../../stores/gameStore'
import { useAppStore } from '../../stores/appStore'
import { runtime } from '../core/runtime'
import type { SaveData, MissionId, VehicleKind, Point } from '../../types/game'
import { vehicleMemories } from '../missions/checkpoints'
import { MISSIONS } from '../../data/missions'
const KEY = 'breakwater.save.v1', BACKUP = 'breakwater.save.backup.v1'
const kinds = ['compact', 'coupe', 'van']
const missions = Object.keys(MISSIONS)
const finite = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const point = (v: unknown): v is Point => Array.isArray(v) && v.length === 3 && finite(v[0], -235, 235) && finite(v[1], .5, 30) && finite(v[2], -235, 235)
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
function validVehicles(value: unknown): value is SaveData['vehicles'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(([id, v]) => /^(player-car|delivery-van|parked-coupe|recovery-car|hot-car|owned-van|owned-coupe)$/.test(id) && v && typeof v === 'object' && point(v.position) && finite(v.yaw, -Math.PI * 2, Math.PI * 2) && finite(v.health, 0, 100))
}
export function validateSave(value: unknown): SaveData | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const s = (raw.version === 1 ? { ...raw, version: 2, vehicles: {}, checkpoint: null } : raw) as Partial<SaveData>
  if (s.version !== 2 || !s.character || typeof s.character.name !== 'string' || s.character.name.length > 20 || !['courier', 'local', 'roamer'].includes(s.character.preset)) return null
  if (![s.character.clothingColor, s.character.vehicleColor, ...Object.values(s.colors || {})].every((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c))) return null
  if (!s.colors || !kinds.every((kind) => typeof s.colors?.[kind as VehicleKind] === 'string')) return null
  if (!finite(s.money, 0, 1e8) || !finite(s.health, 1, 100) || !point(s.safePosition) || !finite(s.time, 0, 1440) || !['clear', 'cloudy', 'rain'].includes(String(s.weather))) return null
  if (!strings(s.completed) || s.completed.some((id) => !missions.includes(id)) || !strings(s.owned) || s.owned.some((id) => !kinds.includes(id)) || !strings(s.unlocked) || s.unlocked.some((id) => !kinds.includes(id))) return null
  if (!strings(s.discovered) || !strings(s.collected) || (s.bestRace !== null && !finite(s.bestRace, .01, 3600))) return null
  if (s.mission !== null) {
    const m = s.mission
    if (!m || !missions.includes(m.id) || !Number.isInteger(m.step) || m.step < 0 || m.step >= MISSIONS[m.id].objectives.length || !finite(m.elapsed, 0, 36000) || !['active', 'failed'].includes(m.status) || typeof m.reason !== 'string') return null
  }
  if (!validVehicles(s.vehicles)) return null
  if (s.checkpoint !== null) {
    const c = s.checkpoint
    if (!c || !point(c.position) || !validVehicles(c.vehicles) || !(c.occupied === null || typeof c.occupied === 'string' && (c.occupied in c.vehicles)) || !c.mission || !s.mission || c.mission.id !== s.mission.id || c.mission.status !== 'active' || !Number.isInteger(c.mission.step) || c.mission.step < 0 || c.mission.step >= MISSIONS[c.mission.id].objectives.length || !finite(c.mission.elapsed, 0, 36000)) return null
  }
  if (!s.owned.includes('compact') || s.owned.some((k) => !s.unlocked?.includes(k))) return null
  if (typeof s.savedAt !== 'string' || !Number.isFinite(Date.parse(s.savedAt))) return null
  return s as SaveData
}
export function readSave(): SaveData | null {
  try {
    for (const key of [KEY, BACKUP]) {
      try { const valid = validateSave(JSON.parse(localStorage.getItem(key) || 'null')); if (valid) return valid } catch { /* Try the last-good backup. */ }
    }
  } catch { /* Storage can be unavailable in private browsing. */ }
  return null
}
export function refreshSaveStatus() {
  const saved = readSave()
  useGameStore.setState({ saveAvailable: !!saved })
  return !!saved
}
export function saveGame(): boolean {
  const s = useGameStore.getState()
  if (!s.ready || s.recovery || s.player.health <= 0 || !runtime.grounded || runtime.occupied && Math.abs(runtime.vehicles.get(runtime.occupied)?.speed || 0) > 3 || s.wanted.level > 0 || s.wanted.state === 'reporting') {
    const message = 'Stop on safe, solid ground and lose any police attention before saving.'
    useGameStore.setState({ saveMessage: message }); s.notify(message, 'warning'); return false
  }
  const safe = runtime.occupied ? s.safePosition : [...runtime.position] as Point
  const save: SaveData = {
    version: 2, vehicles: vehicleMemories(), checkpoint: s.checkpoint, savedAt: new Date().toISOString(), character: { ...useAppStore.getState().character }, money: s.money,
    health: s.player.health, safePosition: safe, completed: [...s.completed], owned: [...s.owned], unlocked: [...s.unlocked], colors: { ...s.colors },
    mission: s.mission ? { ...s.mission } : null, bestRace: s.bestRace, discovered: [...s.discovered], collected: [...s.collected], time: s.time, weather: s.weather,
  }
  if (!validateSave(save)) { s.notify('The current position cannot be saved. Return to your apartment.', 'warning'); return false }
  try {
    const prior = readSave()
    if (prior) localStorage.setItem(BACKUP, JSON.stringify(prior))
    localStorage.setItem(KEY, JSON.stringify(save))
    useGameStore.setState({ saveAvailable: true, saveMessage: 'Progress saved on this device.', safePosition: safe })
    s.notify('Progress saved.', 'success'); return true
  } catch {
    useGameStore.setState({ saveMessage: 'Browser storage is unavailable or full. Progress has not been saved.' })
    s.notify('Could not save: browser storage is unavailable or full.', 'warning'); return false
  }
}
export function continueGame(): boolean {
  const saved = readSave()
  if (!saved) { useGameStore.setState({ saveAvailable: false, saveMessage: 'No valid save could be found.' }); return false }
  runtime.reset()
  useGameStore.getState().reset()
  useGameStore.setState({
    money: saved.money, player: { ...useGameStore.getState().player, position: saved.safePosition, health: saved.health },
    safePosition: saved.safePosition, completed: saved.completed as MissionId[], owned: saved.owned, unlocked: saved.unlocked,
    colors: saved.colors, checkpoint: saved.checkpoint, mission: saved.mission, bestRace: saved.bestRace, discovered: saved.discovered, collected: saved.collected,
    time: saved.time, weather: saved.weather, saveAvailable: true,
  })
  for (const [id, v] of Object.entries(saved.vehicles)) runtime.parked.set(id, { ...v, position: [...v.position] })
  runtime.position = [...saved.safePosition]
  useAppStore.setState({ character: saved.character, phase: 'playing', panel: null })
  return true
}
export function resetSave(): boolean {
  try {
    localStorage.removeItem(KEY); localStorage.removeItem(BACKUP)
    useGameStore.setState({ saveAvailable: false, saveMessage: 'Saved progress has been reset.' }); return true
  } catch { useGameStore.setState({ saveMessage: 'Browser storage could not be cleared.' }); return false }
}
