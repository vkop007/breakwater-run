import type { Character } from './app'
export type Point = [number, number, number]
export type VehicleKind = 'compact' | 'coupe' | 'van'
export type Weather = 'clear' | 'cloudy' | 'rain'
export type MissionId = 'delivery' | 'recovery' | 'hot-exit' | 'race'
export type ObjectiveKind = 'talk' | 'enter' | 'collect' | 'deliver' | 'drive' | 'escape' | 'return' | 'checkpoint'
export interface Objective { kind: ObjectiveKind; text: string; target: Point; radius: number; vehicle?: string }
export interface MissionDefinition {
  id: MissionId; title: string; description: string; reward: number; giver: string
  objectives: Objective[]; timeLimit?: number; unlock?: VehicleKind; requiredMission?: MissionId
}
export interface MissionProgress { id: MissionId; step: number; elapsed: number; status: 'active' | 'failed'; reason: string }
export interface Notification { id: number; text: string; tone: 'info' | 'success' | 'warning'; expires: number }
export interface PlayerSnapshot {
  position: Point; heading: number; health: number; grounded: boolean; moving: 'idle' | 'walking' | 'running' | 'sprinting' | 'jumping'
}
export interface VehicleSnapshot { id: string; kind: VehicleKind; name: string; speed: number; health: number; headlights: boolean }
export interface WantedState { level: number; state: 'clear' | 'reporting' | 'investigating' | 'pursuit' | 'search'; report: number; escape: number; caught: number; lastKnown: Point }
export interface PerformanceSnapshot { fps: number; frameMs: number; drawCalls: number; triangles: number; npcs: number; vehicles: number; chunks: number; bodies: number; colliders: number }
export interface VehicleMemory { position: Point; yaw: number; health: number }
export interface Checkpoint { mission: MissionProgress; position: Point; occupied: string | null; vehicles: Record<string, VehicleMemory> }
export interface SaveData {
  version: 2; vehicles: Record<string, VehicleMemory>; checkpoint: Checkpoint | null; savedAt: string; character: Character; money: number; health: number; safePosition: Point
  completed: MissionId[]; owned: VehicleKind[]; unlocked: VehicleKind[]; colors: Record<VehicleKind, string>
  mission: MissionProgress | null; bestRace: number | null; discovered: string[]; collected: string[]; time: number; weather: Weather
}
export type GameCommand =
  | { type: 'interact' | 'exit' | 'reset-vehicle' | 'camera' | 'headlights' | 'save' | 'restart-mission' | 'abandon-mission' | 'safehouse' | 'checkpoint' | 'load' }
  | { type: 'mission'; id: MissionId }
  | { type: 'purchase' | 'select-vehicle'; kind: VehicleKind }
  | { type: 'service'; service: 'repair' | 'health' | 'paint' | 'clothes' | 'upgrade'; color?: string }
  | { type: 'waypoint'; position: Point }
