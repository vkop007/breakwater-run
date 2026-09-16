import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { PerspectiveCamera, Vector3 } from 'three'
import type { Group, DirectionalLight } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { Blocks, Box, Car, Character, Palm, Sign } from './ScenePrimitives'
import { makeBuildingBlocks, makeStreetBlocks } from './sceneData'
import type { Block, Vec3 } from './sceneData'

const viewpoints = {
  harbor: { eye: [58, 47, 68], target: [-5, 2, -2] },
  street: { eye: [32, 12, 39], target: [0, 4, 3] },
  overlook: { eye: [8, 78, 55], target: [0, 0, -3] },
} satisfies Record<string, { eye: Vec3; target: Vec3 }>

export default function FoundationScene({ paused }: { paused: boolean }) {
  const phase = useAppStore((s) => s.phase)
  const character = useAppStore((s) => s.character)
  const quality = useSettingsStore((s) => s.quality)
  const blocks = useMemo(() => [...makeBuildingBlocks(), ...makeStreetBlocks()], [])
  const light = useRef<DirectionalLight>(null)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (light.current) {
      light.current.shadow.map?.dispose()
      light.current.shadow.map = null
      const resolution = quality === 'high' ? 2048 : 1024
      light.current.shadow.mapSize.set(resolution, resolution)
      light.current.shadow.needsUpdate = true
    }
    invalidate()
  }, [quality, invalidate])

  return <>
    <color attach="background" args={['#aecfc9']} />
    <fog attach="fog" args={['#aecfc9', 145, 320]} />
    <ambientLight intensity={.7} color="#f1e5cf" />
    <hemisphereLight args={['#d4ebe9', '#b4a280', 1.6]} />
    <directionalLight ref={light} position={[-45, 80, 35]} intensity={3} color="#ffe0b2" castShadow={quality !== 'low'}
      shadow-camera-left={-65} shadow-camera-right={65} shadow-camera-top={65} shadow-camera-bottom={-65}
      shadow-camera-near={1} shadow-camera-far={180} shadow-bias={-.0004} shadow-normalBias={.12} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[850, 850]} /><meshStandardMaterial color="#65aaa6" roughness={.65} metalness={.12} />
    </mesh>
    <Water paused={paused} />
    <Blocks blocks={blocks} />
    <ShopFronts />
    <StreetFurniture />
    {[-32, -20, -8, 4, 28].map((x, i) => <Palm key={x} position={[x, 1, 13]} height={7.5 + i % 3} angle={i * 1.5} />)}
    <Palm position={[-29, .7, -7]} height={9} />
    <Palm position={[33, .7, -28]} height={10} />
    <Car color={character.vehicleColor} position={[12, .5, 16.3]} rotation={Math.PI / 2} />
    <Car color="#e3c584" position={[-17, .5, -6.5]} rotation={Math.PI / 2} />
    <Car color="#659792" position={[20.5, .5, -16]} />
    <Character color={character.clothingColor} preset={character.preset} />
    <Boat paused={paused} />
    <CameraRig paused={paused} />
    {phase === 'loading' && <ReadySignal />}
  </>
}

function ReadySignal() {
  const frames = useRef(0)
  useFrame(() => {
    if (++frames.current === 2) useAppStore.getState().sceneReady()
  })
  return null
}

function CameraRig({ paused }: { paused: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const viewpoint = useAppStore((s) => s.viewpoint)
  const phase = useAppStore((s) => s.phase)
  const sensitivity = useSettingsStore((s) => s.cameraSensitivity)
  const reduced = useSettingsStore((s) => s.reducedMotion)
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)
  const focus = phase === 'setup'
  const playing = phase === 'playing'
  useEffect(() => {
    const view = focus ? { eye: [22, 7, 29] as Vec3, target: [9, 1.4, 17] as Vec3 } : viewpoints[viewpoint]
    if (camera instanceof PerspectiveCamera) {
      if (focus && width > 760) camera.setViewOffset(width, height, -Math.min(width * .16, 250), 0, width, height)
      else camera.clearViewOffset()
    }
    camera.position.set(...view.eye)
    controls.current?.target.set(...view.target)
    camera.lookAt(new Vector3(...view.target))
    controls.current?.update()
    invalidate()
  }, [camera, viewpoint, focus, width, height, invalidate])
  return <OrbitControls ref={controls} enabled={!paused && (playing || phase === 'menu')}
    enableRotate={playing && !paused} enableZoom={playing && !paused} enablePan={false}
    enableDamping={!paused && !reduced} dampingFactor={.08} rotateSpeed={.6 * sensitivity} zoomSpeed={.7}
    minDistance={22} maxDistance={155} minPolarAngle={.15} maxPolarAngle={Math.PI / 2.15}
    autoRotate={!paused && !reduced && phase === 'menu'} autoRotateSpeed={.16} />
}

function ShopFronts() {
  const awnings = useMemo(() => {
    const parts: Block[] = []
    for (const [x, z, width, y, color] of [[-9, 11.3, 10, 3.4, '#4d8478'], [-23, 11.3, 9, 3.6, '#ca7652'], [5, 11.3, 8, 3.4, '#c89548']] as const) {
      for (let i = 0; i < width; i++) parts.push({ position: [x - width / 2 + i + .5, y, z], size: [1, .15, 2], color: i % 2 ? '#f0e4c8' : color })
      parts.push({ position: [x, 1.65, z - 1.12], size: [width - 1, 2.2, .08], color: '#43686a' })
    }
    return parts
  }, [])
  return <>
    <Blocks blocks={awnings} />
    <Sign label="PARCEL & PINE" position={[-9, 4.55, 10.57]} width={9} />
    <Sign label="SOLARA SOCIAL" position={[-23, 5.7, 10.57]} width={8} background="#b56e4e" />
    <Sign label="QUAYLINE" position={[28, 4.3, 12.56]} width={7} />
    <Sign label="LANTERN QUAY" position={[0, .3, 26.0]} width={12} background="#c6af8b" color="#6d7668" />
    <Sign label="THE SUNROOM" position={[5, 5, 10.57]} width={7.8} background="#c19651" />
  </>
}

function StreetFurniture() {
  const blocks = useMemo(() => {
    const parts: Block[] = []
    for (const x of [-29, -17, -5, 7, 31]) {
      parts.push({ position: [x, 3, 22.5], size: [.16, 5.5, .16], color: '#496563' })
      parts.push({ position: [x, 5.8, 22.5], size: [.8, .3, .8], color: '#eee4c7' })
      parts.push({ position: [x, 6, 22.5], size: [1, .12, 1], color: '#496563' })
    }
    for (const x of [-24, -12, 0, 28]) {
      parts.push({ position: [x, 1.1, 21], size: [2.7, .16, .85], color: '#ab8256' })
      parts.push({ position: [x, 1.55, 21.45], size: [2.7, .75, .15], color: '#ab8256' })
      for (const side of [-1, 1]) parts.push({ position: [x + side, .8, 21], size: [.15, .7, .7], color: '#4c6964' })
    }
    for (let i = 0; i < 9; i++) {
      const x = -35 + i * 8
      parts.push({ position: [x, .65, 23.5], size: [.25, .6, .25], color: '#54716c' })
    }
    return parts
  }, [])
  return <>
    <Blocks blocks={blocks} />
    {[-26, -21].map((x, i) => <group position={[x, .6, 16.3]} key={x}>
      <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[.06, .06, 5, 6]} /><meshStandardMaterial color="#e5d8b9" /></mesh>
      <mesh position={[0, 4.6, 0]} castShadow><coneGeometry args={[2.6, 1.0, 8]} /><meshStandardMaterial color={i ? '#e7c16d' : '#d97d56'} /></mesh>
      <Box position={[0, 1.5, 0]} size={[1.4, .15, 1.4]} color="#ebddbc" />
    </group>)}
  </>
}

function Boat({ paused }: { paused: boolean }) {
  const group = useRef<Group>(null)
  const clock = useRef(0)
  const reduced = useSettingsStore((s) => s.reducedMotion)
  useFrame((_, dt) => {
    if (paused || reduced || !group.current) return
    clock.current += Math.min(dt, .05)
    group.current.position.y = -1 + Math.sin(clock.current * .75) * .12
    group.current.rotation.z = Math.sin(clock.current * .6) * .018
  })
  return <group ref={group} position={[28, -1, 43]} rotation={[0, -.4, 0]}>
    <mesh position={[0, .7, 0]} scale={[1, .5, 2.6]} castShadow>
      <cylinderGeometry args={[1.7, 1.25, 2, 6]} /><meshStandardMaterial color="#f1e4c9" />
    </mesh>
    <Box position={[0, 1.3, -.4]} size={[2.4, 1.4, 3.1]} color="#dcd9c1" />
    <Box position={[0, 2.1, -.4]} size={[2.7, .18, 3.3]} color="#d58359" />
    <Box position={[0, 1.55, 1.18]} size={[1.8, .65, .08]} color="#517d7c" />
    <Box position={[0, 4, -.6]} size={[.1, 4, .1]} color="#6c827c" />
    <Box position={[.6, 5.7, -.6]} size={[1.2, .65, .05]} color="#d7855b" />
  </group>
}

function Water({ paused }: { paused: boolean }) {
  const group = useRef<Group>(null)
  const reduced = useSettingsStore((s) => s.reducedMotion)
  const clock = useRef(0)
  const blocks = useMemo(() => Array.from({ length: 64 }, (_, i): Block => ({
    position: [((i * 17.7) % 180) - 90, -1.46, 31 + ((i * 11.3) % 95)],
    size: [1 + i % 5, .025, .1], color: i % 3 ? '#8fbeb4' : '#b2d2c2',
  })), [])
  useFrame((_, dt) => {
    if (paused || reduced || !group.current) return
    clock.current += Math.min(dt, .05)
    group.current.position.x = Math.sin(clock.current * .2) * 1.2
  })
  return <group ref={group}><Blocks blocks={blocks} /></group>
}
