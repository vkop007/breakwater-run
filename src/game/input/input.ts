import { useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { dispatch } from '../core/commands'
import { runtime } from '../core/runtime'
export const input = {
  held: new Set<string>(), pressed: new Set<string>(),
  down(code: string) { return this.held.has(code) },
  take(code: string) { const result = this.pressed.has(code); this.pressed.delete(code); return result },
  clear() { this.held.clear(); this.pressed.clear() },
}
export function useGameInput(canvas: HTMLCanvasElement) {
  useEffect(() => {
    let dragging = false
    const isActive = () => useAppStore.getState().phase === 'playing' && !useGameStore.getState().recovery && useGameStore.getState().ready
    const keydown = (event: KeyboardEvent) => {
      if (!isActive() || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'KeyE', 'KeyF', 'KeyC', 'KeyH', 'KeyR', 'KeyM', 'Tab', 'F3']
      if (!codes.includes(event.code)) return
      event.preventDefault()
      if (!input.held.has(event.code)) input.pressed.add(event.code)
      input.held.add(event.code)
      if (event.repeat) return
      const actions = { KeyE: 'interact', KeyF: 'exit', KeyC: 'camera', KeyH: 'headlights', KeyR: 'reset-vehicle' } as const
      if (event.code in actions) dispatch({ type: actions[event.code as keyof typeof actions] })
      if (event.code === 'KeyM') useAppStore.getState().openPanel('map')
      if (event.code === 'Tab') useAppStore.getState().openPanel('activities')
      if (event.code === 'F3') useGameStore.getState().setDebug(!useGameStore.getState().debug)
    }
    const keyup = (event: KeyboardEvent) => { input.held.delete(event.code) }
    const move = (event: MouseEvent) => {
      if (!isActive() || (!dragging && document.pointerLockElement !== canvas)) return
      const sensitivity = useSettingsStore.getState().cameraSensitivity * .0025
      runtime.cameraLookAt = runtime.elapsed
      runtime.cameraYaw -= event.movementX * sensitivity
      runtime.cameraPitch = Math.max(-.1, Math.min(1.2, runtime.cameraPitch + event.movementY * sensitivity))
    }
    const down = (event: MouseEvent) => { if (event.button === 0 && isActive()) dragging = true }
    const up = () => { dragging = false }
    const clear = () => { input.clear(); dragging = false }
    const unsubscribe = useAppStore.subscribe((s) => { if (s.phase !== 'playing') { clear(); if (document.pointerLockElement) document.exitPointerLock() } })
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('mousemove', move)
    canvas.addEventListener('mousedown', down); window.addEventListener('mouseup', up); window.addEventListener('blur', clear)
    return () => {
      clear(); unsubscribe(); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
      window.removeEventListener('mousemove', move); canvas.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); window.removeEventListener('blur', clear)
    }
  }, [canvas])
}
