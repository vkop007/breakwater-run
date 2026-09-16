import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import FoundationScene from '../../scenes/FoundationScene'
import { useGameStore } from '../../stores/gameStore'
const GameScene = lazy(() => import('../../scenes/GameScene'))

export default function GameCanvas() {
  const phase = useAppStore((state) => state.phase)
  const sessionId = useGameStore((state) => state.sessionId)
  const panel = useAppStore((state) => state.panel)
  const quality = useSettingsStore((state) => state.quality)
  const resolutionScale = useSettingsStore((state) => state.resolutionScale)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [hidden, setHidden] = useState(document.hidden)
  const [contextLost, setContextLost] = useState(false)
  const [supported] = useState(() => {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  })
  useEffect(() => {
    const visibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])
  if (!supported) throw new Error('WebGL 2 is not available in this browser.')
  if (contextLost) throw new Error('The graphics context was lost. Reload to restore the scene.')
  const paused = hidden || phase === 'paused' || panel !== null
  const inGame = phase === 'playing' || phase === 'paused'
  const dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : quality === 'low' ? 1 : 1.5) * resolutionScale
  return <div className="game-canvas" role="region" aria-label="Interactive 3D city of Lantern Quay" style={{ position: 'absolute', inset: 0 }}>
    <Canvas
      frameloop={paused || (!inGame && reducedMotion && phase !== 'loading') ? 'demand' : 'always'}
      dpr={Math.min(dpr, 2)}
      shadows={quality !== 'low' ? { type: PCFSoftShadowMap } : false}
      camera={{ position: [58, 47, 68], fov: 38, near: 0.3, far: 420 }}
      gl={{ antialias: quality !== 'low', alpha: false, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping }}
      fallback={<p>Lantern Quay requires a browser with WebGL 2 to play.</p>}
    >
      <ContextObserver onLost={() => setContextLost(true)} />
      <Suspense fallback={null}>{inGame ? <GameScene key={sessionId} paused={paused} /> : <FoundationScene paused={paused} />}</Suspense>
    </Canvas>
  </div>
}

function ContextObserver({ onLost }: { onLost: () => void }) {
  const canvas = useThree((state) => state.gl.domElement)
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); onLost() }
    canvas.addEventListener('webglcontextlost', handler)
    return () => canvas.removeEventListener('webglcontextlost', handler)
  }, [canvas, onLost])
  return null
}
