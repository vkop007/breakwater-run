import { useAppStore } from '../stores/appStore'
import Modal from './Modal'
const bindings = [
  ['Move / drive', 'W A S D'], ['Walk slowly', 'Alt'], ['Sprint on foot', 'Shift'], ['Jump / handbrake', 'Space'], ['Interact / enter vehicle', 'E'], ['Exit vehicle', 'F'], ['Camera distance / hood view', 'C'], ['Headlights', 'H'], ['Recover stuck vehicle', 'R'], ['District map', 'M'], ['Activities', 'Tab'], ['Pause / resume / back', 'Esc'], ['Performance panel', 'F3'],
]
export default function ControlsPanel() {
  const openPanel = useAppStore((state) => state.openPanel)
  return <Modal title="Get your bearings." eyebrow="CONTROLS / A QUICK FIELD GUIDE" onClose={() => openPanel(null)}><p className="modal-intro">The neighborhood is yours to explore. Use a keyboard and mouse to play.</p><div className="controls-section"><h3>On foot & behind the wheel</h3><dl className="controls-list">{bindings.map(([label, key]) => <div key={key}><dt>{label}</dt><dd><kbd>{key}</kbd></dd></div>)}<div><dt>Look around</dt><dd>Drag the mouse</dd></div><div><dt>Navigate menus</dt><dd><kbd>Tab</kbd><kbd>Enter</kbd></dd></div></dl></div><div className="controls-tip"><span className="eyebrow">A WORD FROM THE LOCALS</span><p>Look for a prompt near people, vehicles, and shops. Use the map to mark a destination, and keep an eye on witnesses if you borrow someone else’s ride.</p></div><button className="button-primary full-width" onClick={() => openPanel(null)}>Got it <span>✓</span></button></Modal>
}
