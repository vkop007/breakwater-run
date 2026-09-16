import { dispatch } from '../game/core/commands'
import { useAppStore } from '../stores/appStore'
import { useGameStore } from '../stores/gameStore'
import Modal from './Modal'
import GameFeedback from './GameFeedback'
export default function RecoveryPanel() {
  const recovery = useGameStore((state) => state.recovery)
  const available = useGameStore((state) => state.saveAvailable)
  const returnToMenu = useAppStore((state) => state.returnToMenu)
  return <Modal title={recovery === 'arrested' ? 'The road caught up with you.' : 'Take a breath. Start again.'} eyebrow={recovery === 'arrested' ? 'LANTERN QUAY / ARRESTED' : 'LANTERN QUAY / RECOVERY'} onClose={returnToMenu} className="recovery-modal"><p className="modal-intro">{recovery === 'arrested' ? 'Your pursuit is over. Pick up from your checkpoint or return to the apartment.' : 'A rough landing, a fresh start. Recover at a safe location and head back out.'}</p><nav className="pause-actions" aria-label="Recovery options"><button className="button-primary" onClick={() => dispatch({ type: 'checkpoint' })}>Restart checkpoint <span>→</span></button><button className="button-line" onClick={() => dispatch({ type: 'safehouse' })}>Return to apartment <span>↗</span></button><button className="button-line" disabled={!available} onClick={() => dispatch({ type: 'load' })}>Load latest save <span>{available ? '↗' : 'No save'}</span></button><button className="return-button" onClick={returnToMenu}>← Return to main menu</button></nav><GameFeedback /></Modal>
}
