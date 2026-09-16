import { useSettingsStore } from '../stores/settingsStore'
import { useGameStore } from '../stores/gameStore'
export default function GameFeedback() {
  const notifications = useGameStore((state) => state.notifications)
  const subtitles = useSettingsStore((state) => state.subtitles)
  const recent = notifications.filter((item) => subtitles || !/^(Mara|Ivo|Remy|Courier):/.test(item.text)).at(-1)
  return recent ? <p className={`command-feedback feedback-${recent.tone}`} role="status">{recent.text}</p> : null
}
