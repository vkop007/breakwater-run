import { MISSIONS } from '../data/missions'
import { dispatch } from '../game/core/commands'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useGameStore } from '../stores/gameStore'
import { MiniMap } from './GameMap'
import PerformancePanel from './PerformancePanel'
const seconds = (value: number) => `${Math.max(0, Math.ceil(value))}s`
export default function GameHUD() {
  const subtitles = useSettingsStore((state) => state.subtitles)
  const name = useAppStore((state) => state.character.name)
  const pause = useAppStore((state) => state.pause)
  const openPanel = useAppStore((state) => state.openPanel)
  const health = useGameStore((state) => state.player.health)
  const money = useGameStore((state) => state.money)
  const vehicle = useGameStore((state) => state.vehicle)
  const mission = useGameStore((state) => state.mission)
  const wanted = useGameStore((state) => state.wanted)
  const interaction = useGameStore((state) => state.interaction)
  const notifications = useGameStore((state) => state.notifications)
  const time = useGameStore((state) => state.time)
  const weather = useGameStore((state) => state.weather)
  const debug = useGameStore((state) => state.debug)
  const racePosition = useGameStore((state) => state.racePosition)
  const missionDefinition = mission ? MISSIONS[mission.id] : null
  const objective = missionDefinition && mission ? missionDefinition.objectives[mission.step] : null
  const clock = `${String(Math.floor(time / 60) % 24).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}`
  return <main className="game-hud" aria-label="Gameplay heads-up display">
    <div className="hud-top-left"><div className="player-vitals"><div className="vitals-name"><span className="eyebrow">{name} / PORT SOLARA</span><strong>${Math.round(money).toLocaleString()}</strong></div><div className="health-row"><span>Health</span><meter min={0} max={100} value={health} aria-label="Player health" /><b>{Math.round(health)}</b></div></div>
      {mission && missionDefinition ? <section className={`mission-tracker ${mission.status === 'failed' ? 'mission-failed' : ''}`}><div className="tracker-label"><span className="eyebrow">{mission.status === 'failed' ? 'JOB INTERRUPTED' : mission.id === 'race' ? `HARBOR CIRCUIT / POSITION ${racePosition}` : 'ON THE JOB'}</span><span>{Math.min(mission.step + 1, missionDefinition.objectives.length)} / {missionDefinition.objectives.length}</span></div><h1>{missionDefinition.title}</h1><p>{mission.status === 'failed' ? mission.reason : objective?.text}</p>{missionDefinition.timeLimit && <strong className="mission-time">{seconds(missionDefinition.timeLimit - mission.elapsed)} remaining</strong>}<button onClick={() => openPanel('activities')}>{mission.status === 'failed' ? 'Restart or choose another job' : 'Job details'} <kbd>Tab</kbd></button></section> : <button className="free-roam-note" onClick={() => openPanel('activities')}><span className="eyebrow">A NEW DAY IN LANTERN QUAY</span><strong>Take the long way home.</strong><span>Find work & explore <kbd>Tab</kbd></span></button>}
    </div>
    <div className="hud-top-right"><div className="hud-clock"><span>{clock}</span><span>{weather === 'rain' ? 'Rain' : weather === 'cloudy' ? 'Cloudy' : 'Clear skies'}</span></div><nav className="hud-tools" aria-label="Game menus"><button onClick={() => useGameStore.getState().setDebug(!debug)} aria-label="Toggle performance panel" aria-pressed={debug}>F3</button><button onClick={() => pause()} aria-label="Pause game">Ⅱ <span>Pause</span> <kbd>Esc</kbd></button></nav>{wanted.state !== 'clear' && <section className={`wanted-indicator wanted-${wanted.state}`} aria-label="Police status"><div className="wanted-stars" aria-label={`Wanted level ${wanted.level}`}>{[1, 2, 3].map((star) => <span key={star} className={star <= wanted.level ? 'active' : ''}>★</span>)}</div><strong>{wanted.state === 'reporting' ? 'Witness reporting' : wanted.state === 'search' ? 'Stay out of sight' : wanted.state === 'investigating' ? 'Police investigating' : 'Police pursuit'}</strong><span>{wanted.state === 'reporting' ? `Report in ${seconds(wanted.report)}` : wanted.state === 'search' ? `Search ends in ${seconds(wanted.escape)}` : 'Break sight to escape'}</span>{wanted.caught > 0 && <span className="arrest-warning">Arrest in {seconds(4 - wanted.caught)}</span>}</section>}</div>
    <div className="hud-bottom-left"><MiniMap /></div>
    <div className="hud-center-bottom"><div className="game-notifications" role="status" aria-live="polite">{notifications.filter((item) => subtitles || !/^(Mara|Ivo|Remy|Courier):/.test(item.text)).map((notification) => <p key={notification.id} className={`toast toast-${notification.tone}`}>{notification.text}</p>)}</div>{interaction && <button className="interaction-prompt" onClick={() => dispatch({ type: 'interact' })}><kbd>E</kbd><span>{interaction}</span></button>}<div className="keyboard-hints" aria-label="Quick controls"><span><kbd>W A S D</kbd> {vehicle ? 'Drive' : 'Move'}</span><span><kbd>{vehicle ? 'F' : 'Shift'}</kbd> {vehicle ? 'Exit' : 'Sprint'}</span><span><kbd>Space</kbd> {vehicle ? 'Handbrake' : 'Jump'}</span><span><kbd>C</kbd> Camera</span><button onClick={() => openPanel('controls')}>All controls ↗</button></div></div>
    {vehicle && <section className="vehicle-dial" aria-label="Vehicle status"><span className="eyebrow">{vehicle.name}</span><div><strong>{Math.round(Math.abs(vehicle.speed) * 3.6)}</strong><span>KM/H</span></div><p><span>Condition</span><b>{Math.round(vehicle.health)}%</b></p><meter value={vehicle.health} min={0} max={100} aria-label="Vehicle condition" /><small>{vehicle.headlights ? 'Headlights on' : 'Headlights off'} <kbd>H</kbd></small></section>}
    {debug && <PerformancePanel />}
  </main>
}
