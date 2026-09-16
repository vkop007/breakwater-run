import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let saved: string | null = null
let refuseWrites = false
beforeEach(() => {
  vi.resetModules()
  saved = null
  refuseWrites = false
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
  vi.stubGlobal('localStorage', {
    getItem: () => saved,
    setItem: (_key: string, value: string) => {
      if (refuseWrites) throw new Error('Storage denied')
      saved = value
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('settings persistence', () => {
  it('loads safe defaults for corrupt storage', async () => {
    saved = '{broken'
    const { useSettingsStore } = await import('../../src/stores/settingsStore')
    expect(useSettingsStore.getState()).toMatchObject({ quality: 'medium', uiScale: 1, resolutionScale: 1 })
  })

  it('validates stored types and clamps render and interface limits', async () => {
    saved = JSON.stringify({ quality: 'ultra', uiScale: 50, resolutionScale: -4, cameraSensitivity: 'fast', reducedMotion: 'yes' })
    const { useSettingsStore } = await import('../../src/stores/settingsStore')
    expect(useSettingsStore.getState()).toMatchObject({ quality: 'medium', uiScale: 1.15, resolutionScale: .5, cameraSensitivity: 1, reducedMotion: false })
  })

  it('restores a previously saved preference on reload', async () => {
    const { useSettingsStore } = await import('../../src/stores/settingsStore')
    useSettingsStore.getState().updateSettings({ quality: 'low', reducedMotion: true })
    vi.resetModules()
    const reloaded = await import('../../src/stores/settingsStore')
    expect(reloaded.useSettingsStore.getState()).toMatchObject({ quality: 'low', reducedMotion: true })
  })

  it('keeps settings functional and explains persistence failure when storage is denied', async () => {
    refuseWrites = true
    const { useSettingsStore } = await import('../../src/stores/settingsStore')
    useSettingsStore.getState().updateSettings({ quality: 'high', uiScale: 1.1 })
    expect(useSettingsStore.getState()).toMatchObject({ quality: 'high', uiScale: 1.1, storageAvailable: false })
  })
})
