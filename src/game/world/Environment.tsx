import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import type { DirectionalLight, HemisphereLight, InstancedMesh, PointLight } from 'three'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { runtime } from '../core/runtime'
import { useAppStore } from '../../stores/appStore'
import type { Weather } from '../../types/game'
export default function Environment() {
  const sun = useRef<DirectionalLight>(null), ambient = useRef<HemisphereLight>(null), rain = useRef<InstancedMesh>(null)
  const street = useRef<PointLight>(null)
  const quality = useSettingsStore((s) => s.quality)
  const data = useMemo(() => ({ sky: new Color('#b1d7d2'), night: new Color('#162c47'), day: new Color(), object: new Object3D(), weatherAt: 180 }), [])
  const count = quality === 'low' ? 80 : quality === 'high' ? 600 : 280
  useFrame(({ scene }, dt) => {
    const s = useGameStore.getState(), daylight = Math.max(0, Math.sin((s.time / 1440 - .25) * Math.PI * 2))
    if (runtime.elapsed > data.weatherAt) {
      data.weatherAt = runtime.elapsed + 180
      const cycle: Weather[] = ['clear', 'cloudy', 'rain', 'cloudy']
      const weather = cycle[Math.floor(runtime.elapsed / 180) % cycle.length]
      useGameStore.setState({ weather }); s.notify(weather === 'rain' ? 'Light rain. Roads are slippery.' : weather === 'clear' ? 'The sky is clearing.' : 'Clouds are rolling in.')
    }
    data.day.set(s.weather === 'clear' ? '#b1d7d2' : s.weather === 'rain' ? '#789398' : '#96adb6')
    const target = data.night.clone().lerp(data.day, daylight)
    data.sky.lerp(target, Math.min(1, dt * .8)); scene.background = data.sky
    if (scene.fog) scene.fog.color.copy(data.sky)
    if (street.current) {
      const x = Math.round(runtime.position[0] / 96) * 96, z = Math.round(runtime.position[2] / 96) * 96
      const side = runtime.position[0] - x + runtime.position[2] - z > 0 ? 1 : -1
      street.current.position.set(x + side * 8, 5.2, z + side * 13); street.current.intensity = daylight < .08 ? 20 : 0
    }
    if (ambient.current) ambient.current.intensity = .25 + daylight * 1.15
    if (sun.current) {
      const angle = (s.time / 1440 - .25) * Math.PI * 2
      sun.current.intensity = .08 + daylight * (s.weather === 'clear' ? 2.5 : 1.1)
      sun.current.position.set(runtime.position[0] + Math.cos(angle) * 65, 28 + daylight * 75, runtime.position[2] + 30)
      sun.current.target.position.set(...runtime.position); sun.current.target.updateMatrixWorld()
    }
    if (rain.current) {
      rain.current.visible = s.weather === 'rain'
      if (s.weather === 'rain' && useAppStore.getState().phase === 'playing') {
        for (let i = 0; i < count; i++) {
          const x = ((i * 17.731) % 60) - 30, z = ((i * 29.617) % 60) - 30
          const y = ((i * 7.43 - runtime.elapsed * 15) % 24 + 24) % 24
          data.object.position.set(runtime.position[0] + x, y, runtime.position[2] + z)
          data.object.scale.set(.025, .45, .025); data.object.rotation.z = -.12; data.object.updateMatrix()
          rain.current.setMatrixAt(i, data.object.matrix)
        }
        rain.current.instanceMatrix.needsUpdate = true
      }
    }
  })
  return <>
    <color attach="background" args={['#b1d7d2']} /><fog attach="fog" args={['#b1d7d2', quality === 'low' ? 80 : 140, quality === 'high' ? 410 : 245]} />
    <pointLight ref={street} color="#ffd495" intensity={0} distance={18} decay={1.5} />
    <hemisphereLight ref={ambient} args={['#d4ebe9', '#b4a280', 1.4]} />
    <directionalLight ref={sun} position={[40, 80, 30]} intensity={2.5} color="#ffe3be" castShadow={quality !== 'low'} shadow-mapSize={[quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024]}
      shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-camera-near={1} shadow-camera-far={210} shadow-bias={-.0004} shadow-normalBias={.12} />
    <instancedMesh ref={rain} args={[undefined, undefined, count]} frustumCulled={false}><boxGeometry /><meshBasicMaterial color="#c7dfe7" transparent opacity={.4} depthWrite={false} /></instancedMesh>
  </>
}
