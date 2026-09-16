import { create } from 'zustand'
import type { Checkpoint, MissionId, MissionProgress, Notification, PerformanceSnapshot, PlayerSnapshot, Point, VehicleKind, VehicleSnapshot, WantedState, Weather } from '../types/game'
import { SAFE_SPAWN } from '../data/district'
import { VEHICLES } from '../data/vehicles'
export interface GameState {
  sessionId: number; ready: boolean; player: PlayerSnapshot; vehicle: VehicleSnapshot | null; money: number
  owned: VehicleKind[]; unlocked: VehicleKind[]; colors: Record<VehicleKind, string>; completed: MissionId[]
  checkpoint: Checkpoint | null; mission: MissionProgress | null; bestRace: number | null; racePosition: number; discovered: string[]; collected: string[]
  time: number; weather: Weather; wanted: WantedState; interaction: string; notifications: Notification[]
  waypoint: Point | null; mapRotate: boolean; debug: boolean; collidersVisible: boolean; perf: PerformanceSnapshot
  saveAvailable: boolean; saveMessage: string; recovery: 'arrested' | 'injured' | null; safePosition: Point
  notify: (text: string, tone?: Notification['tone']) => void
  reset: () => void; setDebug: (debug: boolean) => void; setMapRotate: (rotate: boolean) => void
}
export function freshGame() {
  return {
    ready: false, player: { position: [...SAFE_SPAWN] as Point, heading: Math.PI, health: 100, grounded: false, moving: 'idle' as const }, vehicle: null,
    money: 350, owned: ['compact'] as VehicleKind[], unlocked: ['compact', 'van'] as VehicleKind[],
    colors: { compact: VEHICLES.compact.color, coupe: VEHICLES.coupe.color, van: VEHICLES.van.color }, completed: [] as MissionId[],
    checkpoint: null, mission: null, bestRace: null, racePosition: 1, discovered: ['home', 'delivery'], collected: [], time: 9 * 60, weather: 'clear' as Weather,
    wanted: { level: 0, state: 'clear' as const, report: 0, escape: 0, caught: 0, lastKnown: [0, 0, 0] as Point },
    interaction: '', notifications: [] as Notification[], waypoint: null, recovery: null, safePosition: [...SAFE_SPAWN] as Point,
  }
}
let notificationId = 0
export const useGameStore = create<GameState>((set, get) => ({
  ...freshGame(), sessionId: 0, mapRotate: false, debug: false, collidersVisible: false, saveAvailable: false, saveMessage: '',
  perf: { fps: 0, frameMs: 0, drawCalls: 0, triangles: 0, npcs: 0, vehicles: 0, chunks: 0, bodies: 0, colliders: 0 },
  notify: (text, tone = 'info') => set((s) => ({ notifications: [...s.notifications.slice(-3), { id: ++notificationId, text, tone, expires: Date.now() + 5000 }] })),
  reset: () => set({ ...freshGame(), sessionId: get().sessionId + 1 }),
  setDebug: (debug) => set({ debug }),
  setMapRotate: (mapRotate) => set({ mapRotate }),
}))
