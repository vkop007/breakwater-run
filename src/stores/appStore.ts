import { create } from 'zustand'
import type { Character, Panel, Phase, Viewpoint } from '../types/app'
import { useGameStore } from './gameStore'
import { runtime } from '../game/core/runtime'

interface AppState {
  phase: Phase
  panel: Panel
  character: Character
  viewpoint: Viewpoint
  pauseReason: 'manual' | 'focus'
  sceneReady: () => void
  newGame: () => void
  updateCharacter: (value: Partial<Character>) => void
  play: () => void
  pause: (reason?: 'manual' | 'focus') => void
  resume: () => void
  returnToMenu: () => void
  openPanel: (panel: Panel) => void
  setViewpoint: (viewpoint: Viewpoint) => void
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'loading',
  panel: null,
  character: { name: 'Alex', preset: 'courier', clothingColor: '#e96e40', vehicleColor: '#e96e40' },
  viewpoint: 'harbor',
  pauseReason: 'manual',
  sceneReady: () => set((state) => state.phase === 'loading' ? { phase: 'menu' } : {}),
  newGame: () => set({ phase: 'setup', panel: null }),
  updateCharacter: (value) => set((state) => ({ character: { ...state.character, ...value } })),
  play: () => { runtime.reset(); useGameStore.getState().reset(); set((state) => ({
    phase: 'playing', panel: null, viewpoint: 'harbor',
    character: { ...state.character, name: state.character.name.trim() || 'Alex' },
  })); useGameStore.setState({ colors: { ...useGameStore.getState().colors, compact: useAppStore.getState().character.vehicleColor } }) },
  pause: (reason = 'manual') => set((state) => state.phase === 'playing'
    ? { phase: 'paused', panel: null, pauseReason: reason } : {}),
  resume: () => set((state) => state.phase === 'paused' && !useGameStore.getState().recovery ? { phase: 'playing', panel: null } : {}),
  returnToMenu: () => set({ phase: 'menu', panel: null, viewpoint: 'harbor' }),
  openPanel: (panel) => set((state) => ({
    panel,
    ...(panel && state.phase === 'playing' ? { phase: 'paused' as const, pauseReason: 'manual' as const } : {}),
  })),
  setViewpoint: (viewpoint) => set({ viewpoint }),
}))
