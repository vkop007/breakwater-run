import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../src/stores/appStore'

const initialState = useAppStore.getState()
beforeEach(() => useAppStore.setState(initialState, true))

describe('application lifecycle', () => {
  it('keeps appearance and viewpoint intact through focus-loss pause and explicit resume', () => {
    const app = useAppStore.getState()
    app.sceneReady()
    app.newGame()
    app.updateCharacter({ name: '  Mira  ', vehicleColor: '#397c7c' })
    app.play()
    app.setViewpoint('street')
    app.pause('focus')
    expect(useAppStore.getState()).toMatchObject({ phase: 'paused', pauseReason: 'focus', viewpoint: 'street' })
    app.resume()
    expect(useAppStore.getState()).toMatchObject({ phase: 'playing', character: { name: 'Mira', vehicleColor: '#397c7c' }, viewpoint: 'street' })
  })

  it('does not let a late loading callback or a blur interrupt setup', () => {
    const app = useAppStore.getState()
    app.sceneReady()
    app.newGame()
    app.sceneReady()
    app.pause('focus')
    app.resume()
    expect(useAppStore.getState().phase).toBe('setup')
  })

  it('opening and closing a panel during play requires explicit resume', () => {
    const app = useAppStore.getState()
    app.play()
    app.openPanel('settings')
    expect(useAppStore.getState()).toMatchObject({ phase: 'paused', panel: 'settings' })
    app.openPanel(null)
    expect(useAppStore.getState()).toMatchObject({ phase: 'paused', panel: null })
    app.resume()
    expect(useAppStore.getState().phase).toBe('playing')
  })

  it('returning to menu clears modal and camera state without erasing appearance', () => {
    const app = useAppStore.getState()
    app.updateCharacter({ preset: 'roamer', name: 'Mira' })
    app.play()
    app.setViewpoint('overlook')
    app.openPanel('controls')
    app.returnToMenu()
    expect(useAppStore.getState()).toMatchObject({ phase: 'menu', panel: null, viewpoint: 'harbor', character: { preset: 'roamer', name: 'Mira' } })
  })
})
