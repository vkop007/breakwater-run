import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import { MISSIONS } from '../data/missions'
import { dispatch } from '../game/core/commands'
import Modal from './Modal'
import GameFeedback from './GameFeedback'
import { ArrowIcon } from './Icons'
export default function PauseMenu() {
  const resume = useAppStore((state) => state.resume)
  const openPanel = useAppStore((state) => state.openPanel)
  const returnToMenu = useAppStore((state) => state.returnToMenu)
  const pauseReason = useAppStore((state) => state.pauseReason)
  const mission = useGameStore((state) => state.mission)
  return <Modal title="Take your time." eyebrow="THE COAST CAN WAIT / PAUSED" onClose={resume} className="pause-modal"><p className="modal-intro">{pauseReason === 'focus' ? 'You stepped away, so we paused the city for you.' : 'A moment to take it all in.'}</p>{mission && <p className="pause-objective"><strong>{MISSIONS[mission.id].title}</strong><span>{mission.status === 'failed' ? mission.reason : MISSIONS[mission.id].objectives[mission.step]?.text}</span></p>}<nav className="pause-actions" aria-label="Pause menu"><button className="button-primary" onClick={resume}><span>Resume game</span><ArrowIcon /></button><div className="pause-shortcuts"><button className="button-line" onClick={() => openPanel('map')}>District map <span>↗</span></button><button className="button-line" onClick={() => openPanel('activities')}>Activities <span>↗</span></button><button className="button-line" onClick={() => openPanel('settings')}>Settings <span>↗</span></button><button className="button-line" onClick={() => openPanel('controls')}>Controls <span>↗</span></button></div><button className="button-line" onClick={() => dispatch({ type: 'save' })}>Save game <span>↓</span></button><button className="return-button" onClick={returnToMenu}>← Return to main menu</button></nav><GameFeedback /><p className="modal-footnote">Save before leaving. You can save safely on solid ground, on foot or in a stopped vehicle. Vehicle saves restore you on foot at your last safe position. <kbd>Esc</kbd> resumes.</p></Modal>
}
