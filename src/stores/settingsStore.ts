import { create } from 'zustand'
import type { Settings } from '../types/app'

const defaults: Settings = {
  quality: 'medium', resolutionScale: 1, uiScale: 1, cameraSensitivity: 1, reducedMotion: false,
  masterVolume: .45, effectsVolume: .7, ambienceVolume: .35, musicVolume: 0, dialogueVolume: .7, subtitles: true, screenShake: false,
}
function readSettings(): Settings {
  const base = { ...defaults }
  if (typeof window === 'undefined') return base
  base.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  try {
    const raw: unknown = JSON.parse(localStorage.getItem('breakwater.settings.v1') || 'null')
    if (!raw || typeof raw !== 'object') return base
    const value = raw as Record<string, unknown>
    if (['low', 'medium', 'high'].includes(String(value.quality))) base.quality = value.quality as Settings['quality']
    for (const key of ['resolutionScale', 'uiScale', 'cameraSensitivity'] as const) {
      const n = value[key]
      const [min, max] = key === 'uiScale' ? [0.85, 1.15] : key === 'cameraSensitivity' ? [0.4, 2] : [0.5, 1.5]
      if (typeof n === 'number' && Number.isFinite(n)) base[key] = Math.max(min, Math.min(max, n))
    }
    if (typeof value.reducedMotion === 'boolean') base.reducedMotion = value.reducedMotion
    for (const key of ['masterVolume', 'effectsVolume', 'ambienceVolume', 'musicVolume', 'dialogueVolume'] as const) {
      if (typeof value[key] === 'number' && Number.isFinite(value[key])) base[key] = Math.max(0, Math.min(1, value[key] as number))
    }
    for (const key of ['subtitles', 'screenShake'] as const) if (typeof value[key] === 'boolean') base[key] = value[key] as boolean
  } catch { /* Settings remain usable when browser storage is unavailable. */ }
  return base
}
interface SettingsState extends Settings {
  storageAvailable: boolean
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}
function persist(settings: Settings): boolean {
  try {
    localStorage.setItem('breakwater.settings.v1', JSON.stringify(settings))
    return true
  } catch { return false }
}
export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...readSettings(),
  storageAvailable: true,
  updateSettings: (values) => {
    const { quality, resolutionScale, uiScale, cameraSensitivity, reducedMotion, masterVolume, effectsVolume, ambienceVolume, musicVolume, dialogueVolume, subtitles, screenShake } = { ...get(), ...values }
    const settings = { quality, resolutionScale, uiScale, cameraSensitivity, reducedMotion, masterVolume, effectsVolume, ambienceVolume, musicVolume, dialogueVolume, subtitles, screenShake }
    set({ ...settings, storageAvailable: persist(settings) })
  },
  resetSettings: () => {
    const settings = { ...defaults, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }
    set({ ...settings, storageAvailable: persist(settings) })
  },
}))
