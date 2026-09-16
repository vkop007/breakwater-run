import { lazy, Suspense, useEffect } from 'react'
import { GameErrorBoundary } from '../game/core/GameErrorBoundary'
import { useGameLifecycle } from '../game/core/useGameLifecycle'
import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { Brand, SunIcon } from '../ui/Icons'
import LoadingScreen from '../ui/LoadingScreen'
import MainMenu from '../ui/MainMenu'
import CharacterSetup from '../ui/CharacterSetup'
import PauseMenu from '../ui/PauseMenu'
import SettingsPanel from '../ui/SettingsPanel'
import ControlsPanel from '../ui/ControlsPanel'
import CreditsPanel from '../ui/CreditsPanel'
import GameHUD from '../ui/GameHUD'
import MapPanel from '../ui/GameMap'
import ActivitiesPanel from '../ui/ActivitiesPanel'
import ServicesPanel from '../ui/ServicesPanel'
import RecoveryPanel from '../ui/RecoveryPanel'

const GameCanvas = lazy(() => import('../game/core/GameCanvas'))

export default function App() {
  useGameLifecycle()
  const phase = useAppStore((state) => state.phase)
  const panel = useAppStore((state) => state.panel)
  const ready = useGameStore((state) => state.ready)
  const recovery = useGameStore((state) => state.recovery)
  const uiScale = useSettingsStore((state) => state.uiScale)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const inGame = phase === 'playing' || phase === 'paused'
  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale * 16}px`
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
  }, [uiScale, reducedMotion])

  return (
    <GameErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <div className={`game-shell phase-${phase}`}>
          <GameCanvas />
          {phase === 'loading' ? <LoadingScreen /> : <>
            <div className="menu-scrim" aria-hidden="true" />
            {!inGame && <header className="game-header" aria-label="Breakwater Run"><Brand /><div className="edition"><span className="status-dot" /> A LITTLE FURTHER FROM ORDINARY <span className="edition-build">PORT SOLARA / 01</span></div></header>}
            {phase === 'menu' && <div inert={!!panel}><MainMenu /></div>}
            {phase === 'setup' && !panel && <CharacterSetup />}
            {phase === 'playing' && !panel && !recovery && <GameHUD />}
            {inGame && recovery ? <RecoveryPanel /> : <>
              {phase === 'paused' && !panel && <PauseMenu />}
              {panel === 'settings' && <SettingsPanel />}
              {panel === 'controls' && <ControlsPanel />}
              {panel === 'credits' && <CreditsPanel />}
              {panel === 'map' && <MapPanel />}
              {panel === 'activities' && <ActivitiesPanel />}
              {panel === 'garage' && <ServicesPanel garage />}
              {panel === 'shop' && <ServicesPanel />}
            </>}
            {phase === 'menu' && <aside className="district-stamp" aria-label="District information"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><div className="district-name"><span>01</span><strong>LANTERN QUAY</strong></div><div className="district-weather"><span>PORT SOLARA · WATERFRONT</span><span><SunIcon /> SUNNY, AS USUAL</span></div></aside>}
            {!inGame && <footer className="build-footer"><span>PLAYABLE DISTRICT <i>·</i> v0.2.0</span><span className="footer-note">A city to get lost in. A place to find your way.</span></footer>}
            {phase === 'playing' && !ready && <LoadingScreen />}
          </>}
        </div>
      </Suspense>
    </GameErrorBoundary>
  )
}
