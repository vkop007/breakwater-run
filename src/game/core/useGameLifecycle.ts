import { useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'

export function useGameLifecycle() {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || event.repeat) return
      const state = useAppStore.getState()
      if (state.phase === 'loading') return
      event.preventDefault()
      if (state.panel) state.openPanel(null)
      else if (state.phase === 'playing') state.pause()
      else if (state.phase === 'paused') state.resume()
      else if (state.phase === 'setup') state.returnToMenu()
    }
    const pause = () => useAppStore.getState().pause('focus')
    const visibility = () => { if (document.hidden) pause() }
    const pointerLock = () => { if (!document.pointerLockElement) pause() }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('pointerlockchange', pointerLock)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('pointerlockchange', pointerLock)
    }
  }, [])
}
