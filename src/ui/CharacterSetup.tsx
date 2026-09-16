import { useAppStore } from '../stores/appStore'
import type { CharacterPreset } from '../types/app'
import Modal from './Modal'
import { ArrowIcon } from './Icons'

const presets: { id: CharacterPreset; title: string; detail: string; number: string }[] = [
  { id: 'courier', title: 'The Courier', detail: 'Always one street ahead.', number: '01' },
  { id: 'local', title: 'The Local', detail: 'You know a place.', number: '02' },
  { id: 'roamer', title: 'The Roamer', detail: 'Take the long way home.', number: '03' },
]
const colors = [{ value: '#e96e40', name: 'Burnt orange' }, { value: '#397c7c', name: 'Sea green' }, { value: '#e2ba58', name: 'Sunflower' }, { value: '#e5dfcb', name: 'Warm ivory' }, { value: '#465d77', name: 'Harbor blue' }]
export default function CharacterSetup() {
  const character = useAppStore((state) => state.character)
  const updateCharacter = useAppStore((state) => state.updateCharacter)
  const play = useAppStore((state) => state.play)
  const returnToMenu = useAppStore((state) => state.returnToMenu)
  return <Modal title="Make yourself at home." eyebrow="01 / YOUR ARRIVAL" onClose={returnToMenu} className="setup-modal">
    <p className="modal-intro">New city. Fresh start. A little bit of you.</p>
    <form onSubmit={(event) => { event.preventDefault(); play() }}>
      <label className="field-label" htmlFor="character-name">WHAT SHOULD WE CALL YOU?</label>
      <input id="character-name" className="name-input" autoComplete="nickname" value={character.name} maxLength={20} onChange={(event) => updateCharacter({ name: event.target.value.replace(/[^\p{L}\p{N} .'-]/gu, '') })} placeholder="Your name" />
      <fieldset className="preset-field"><legend className="field-label">CHOOSE YOUR LOOK</legend><div className="preset-options">{presets.map((preset) => <button type="button" key={preset.id} className={`preset ${character.preset === preset.id ? 'selected' : ''}`} aria-pressed={character.preset === preset.id} onClick={() => updateCharacter({ preset: preset.id })}><span className="preset-number">{preset.number}<span>{character.preset === preset.id ? '✓' : '↗'}</span></span><strong>{preset.title}</strong><small>{preset.detail}</small></button>)}</div></fieldset>
      <div className="color-groups">{(['clothingColor', 'vehicleColor'] as const).map((key) => <fieldset key={key}><legend className="field-label">{key === 'clothingColor' ? 'YOUR CLOTHING' : 'YOUR FIRST RIDE'}</legend><div className="color-options">{colors.map((color) => <button key={color.value} type="button" style={{ backgroundColor: color.value }} className={`color-swatch ${character[key] === color.value ? 'selected' : ''}`} aria-label={`${key === 'clothingColor' ? 'Clothing' : 'Vehicle'}: ${color.name}`} aria-pressed={character[key] === color.value} onClick={() => updateCharacter({ [key]: color.value })}>{character[key] === color.value && <span>✓</span>}</button>)}</div></fieldset>)}</div>
      <div className="setup-preview-note"><span className="status-dot" /><p>Your look updates in the live scene.<br /><span>A Pico, a little cash, and a whole neighborhood to explore.</span></p></div>
      <button type="submit" className="button-primary full-width"><span>Start exploring</span><ArrowIcon /></button>
    </form>
  </Modal>
}
