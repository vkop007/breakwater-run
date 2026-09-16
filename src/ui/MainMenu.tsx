import { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import { continueGame, refreshSaveStatus, resetSave } from '../game/save/saveSystem'
import { ArrowIcon } from './Icons'
export default function MainMenu() {
  const newGame = useAppStore((state) => state.newGame)
  const openPanel = useAppStore((state) => state.openPanel)
  const saveAvailable = useGameStore((state) => state.saveAvailable)
  const saveMessage = useGameStore((state) => state.saveMessage)
  const [confirmReset, setConfirmReset] = useState(false)
  useEffect(() => { refreshSaveStatus() }, [])
  return <main className="main-menu">
    <div className="main-title-block"><p className="eyebrow title-kicker"><span /> THE COAST IS CALLING.</p><h1 className="game-title"><span>BREAKWATER</span><span>RUN<span className="title-period">.</span></span></h1><p className="tagline">Every street is a new way home.</p></div>
    <nav className="main-actions" aria-label="Main menu"><button className="button-primary new-game" onClick={newGame}><span>New Game</span><ArrowIcon /></button><div className="continue-row"><button disabled={!saveAvailable} onClick={() => continueGame()}>Continue</button><span>{saveAvailable ? 'Your coast is waiting' : 'No saved game'}</span></div>{saveMessage && <p className="save-message" role="status">{saveMessage}</p>}{saveAvailable && (confirmReset ? <div className="reset-confirmation"><p>Delete the saved game on this device? This cannot be undone.</p><div><button onClick={() => { resetSave(); setConfirmReset(false) }}>Delete saved game</button><button onClick={() => setConfirmReset(false)}>Keep save</button></div></div> : <button className="reset-save-button" onClick={() => setConfirmReset(true)}>Reset saved game</button>)}</nav>
    <nav className="secondary-nav" aria-label="Game information"><button onClick={() => openPanel('settings')}>Settings</button><span>/</span><button onClick={() => openPanel('controls')}>Controls</button><span>/</span><button onClick={() => openPanel('credits')}>Credits</button></nav>
  </main>
}
