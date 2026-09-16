import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { Settings } from '../types/app'
import Modal from './Modal'

type RangeKey = 'resolutionScale' | 'uiScale' | 'cameraSensitivity' | 'masterVolume' | 'effectsVolume' | 'ambienceVolume' | 'musicVolume' | 'dialogueVolume'
interface Range { key: RangeKey; label: string; help: string; min: number; max: number; step: number }
const graphics: Range[] = [
  { key: 'resolutionScale', label: 'Render resolution', help: 'Lower for a smoother ride on smaller devices.', min: 0.5, max: 1.5, step: 0.1 },
  { key: 'cameraSensitivity', label: 'Camera sensitivity', help: 'Adjust how quickly the camera turns as you look around.', min: 0.4, max: 2, step: 0.1 },
]
const audio: Range[] = [
  { key: 'masterVolume', label: 'Master volume', help: 'All sounds in the city.', min: 0, max: 1, step: .05 },
  { key: 'effectsVolume', label: 'Effects', help: 'Engines, footsteps, collisions, and sirens.', min: 0, max: 1, step: .05 },
  { key: 'ambienceVolume', label: 'City ambience', help: 'The sound of the waterfront.', min: 0, max: 1, step: .05 },
  { key: 'musicVolume', label: 'Music', help: 'A quiet soundtrack for the road.', min: 0, max: 1, step: .05 },
  { key: 'dialogueVolume', label: 'Dialogue', help: 'Spoken character conversations, where browser voices are available.', min: 0, max: 1, step: .05 },
]
const interfaceSize: Range = { key: 'uiScale', label: 'Interface size', help: 'Make menus and text comfortable to read.', min: 0.85, max: 1.15, step: 0.05 }
function RangeSetting({ setting }: { setting: Range }) {
  const value = useSettingsStore((state) => state[setting.key])
  const update = useSettingsStore((state) => state.updateSettings)
  return <div className="setting-row range-setting"><div className="setting-heading"><label htmlFor={setting.key}>{setting.label}</label><output htmlFor={setting.key}>{setting.key === 'cameraSensitivity' ? `${value.toFixed(1)}×` : `${Math.round(value * 100)}%`}</output></div><p>{setting.help}</p><input type="range" id={setting.key} min={setting.min} max={setting.max} step={setting.step} value={value} onChange={(event) => update({ [setting.key]: Number(event.target.value) })} /></div>
}
function ToggleSetting({ setting, label, help }: { setting: 'reducedMotion' | 'subtitles' | 'screenShake'; label: string; help: string }) {
  const checked = useSettingsStore((state) => state[setting])
  const update = useSettingsStore((state) => state.updateSettings)
  return <div className="setting-row toggle-row"><div><label htmlFor={setting}>{label}</label><p>{help}</p></div><input id={setting} type="checkbox" role="switch" checked={checked} onChange={(event) => update({ [setting]: event.target.checked })} /></div>
}
export default function SettingsPanel() {
  const openPanel = useAppStore((state) => state.openPanel)
  const quality = useSettingsStore((state) => state.quality)
  const storageAvailable = useSettingsStore((state) => state.storageAvailable)
  const update = useSettingsStore((state) => state.updateSettings)
  const reset = useSettingsStore((state) => state.resetSettings)
  const [section, setSection] = useState<'graphics' | 'audio' | 'accessibility'>('graphics')
  return <Modal title="Your kind of comfortable." eyebrow="SETTINGS / MAKE IT YOURS" onClose={() => openPanel(null)} className="settings-modal"><p className="modal-intro">A few adjustments before you head out.</p><div className="segmented-control settings-sections" role="group" aria-label="Settings category">{(['graphics', 'audio', 'accessibility'] as const).map((value) => <button key={value} aria-pressed={section === value} onClick={() => setSection(value)}>{value}</button>)}</div>
    {section === 'graphics' && <><div className="setting-row"><div className="setting-heading"><span id="quality-label">Graphics quality</span><span className="small-label">QUALITY PRESET</span></div><div className="segmented-control" role="group" aria-labelledby="quality-label">{(['low', 'medium', 'high'] as Settings['quality'][]).map((option) => <button key={option} aria-pressed={quality === option} onClick={() => update({ quality: option })}>{option}</button>)}</div><p>Shadows, scenery detail, and view distance update immediately. Antialiasing follows this preset after reloading.</p></div>{graphics.map((setting) => <RangeSetting key={setting.key} setting={setting} />)}<ToggleSetting setting="screenShake" label="Camera shake" help="Add a small camera response to vehicle impacts." /></>}
    {section === 'audio' && audio.map((setting) => <RangeSetting key={setting.key} setting={setting} />)}
    {section === 'accessibility' && <><RangeSetting setting={interfaceSize} /><ToggleSetting setting="reducedMotion" label="Reduced motion" help="Reduce idle animation and camera movement." /><ToggleSetting setting="subtitles" label="Dialogue captions" help="Show text when you talk to people around the neighborhood." /></>}
    <div className="settings-footer"><button className="text-button" onClick={reset}>Restore defaults</button><span>{storageAvailable ? 'Preferences saved on this device' : 'Storage unavailable — settings won’t persist'}</span></div><button className="button-primary full-width" onClick={() => openPanel(null)}>All set <span>✓</span></button></Modal>
}
