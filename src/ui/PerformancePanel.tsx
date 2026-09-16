import { useGameStore } from '../stores/gameStore'
export default function PerformancePanel() {
  const perf = useGameStore((state) => state.perf)
  const colliders = useGameStore((state) => state.collidersVisible)
  const setDebug = useGameStore((state) => state.setDebug)
  const rows = [['FPS', Math.round(perf.fps)], ['Frame', `${perf.frameMs.toFixed(1)} ms`], ['Draw calls', perf.drawCalls], ['Triangles', perf.triangles.toLocaleString()], ['Pedestrians', perf.npcs], ['Vehicles', perf.vehicles], ['Chunks', perf.chunks], ['Physics bodies', perf.bodies], ['Colliders', perf.colliders]]
  return <aside className="performance-panel" aria-label="Live performance"><div className="performance-title"><strong>Live performance</strong><button aria-label="Close performance panel" onClick={() => setDebug(false)}>×</button></div><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><label className="debug-colliders"><input type="checkbox" checked={colliders} onChange={(event) => useGameStore.setState({ collidersVisible: event.target.checked })} /> Show physics colliders</label><small><kbd>F3</kbd> toggle panel</small></aside>
}
