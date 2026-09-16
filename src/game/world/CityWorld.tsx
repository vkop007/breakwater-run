import Trees from './Trees'
import { memo, useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Blocks, Sign } from '../../scenes/ScenePrimitives'
import { makeChunk, visibleChunks } from './layout'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { COLLECTIBLES, LOCATIONS } from '../../data/district'
import { MISSIONS } from '../../data/missions'
import type { Point } from '../../types/game'

export default function CityWorld() {
  const position = useGameStore((s) => s.player.position)
  const quality = useSettingsStore((s) => s.quality)
  const key = visibleChunks(position, quality === 'high' ? 2 : 1).join('|')
  const chunks = useMemo(() => key.split('|'), [key])
  return <group>
    {chunks.map((id) => <CityChunk key={id} id={id} />)}
    <RigidBody type="fixed" colliders={false}>
      {[-1, 1].map((side) => <group key={side}>
        <CuboidCollider args={[.7, 1.2, 240]} position={[side * 239, 1.2, 0]} />
        <CuboidCollider args={[240, 1.2, .7]} position={[0, 1.2, side * 239]} />
      </group>)}
    </RigidBody>
    <Blocks blocks={[-1, 1].flatMap((side) => [
      { position: [side * 239, 1.2, 0] as Point, size: [1.4, 2.4, 480] as Point, color: '#c5b590' },
      { position: [0, 1.2, side * 239] as Point, size: [480, 2.4, 1.4] as Point, color: '#c5b590' },
    ])} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}><planeGeometry args={[2000, 2000]} /><meshStandardMaterial color="#599d9e" roughness={.4} /></mesh>
    <WorldMarkers />
  </group>
}
const CityChunk = memo(function CityChunk({ id }: { id: string }) {
  const chunk = useMemo(() => { const [x, z] = id.split(',').map(Number); return makeChunk(x, z) }, [id])
  const night = useGameStore((s) => s.time < 360 || s.time > 1110)
  const rainy = useGameStore((s) => s.weather === 'rain')
  const near = useGameStore((s) => Math.hypot(s.player.position[0] - chunk.x, s.player.position[2] - chunk.z) < 110)
  const windows = useMemo(() => chunk.details.filter((b) => b.color === '#466b70'), [chunk])
  const blocks = useMemo(() => [...chunk.solids, ...chunk.details.filter((b) => b.color !== '#466b70')].map((b) => rainy && b.color === '#596b70' ? { ...b, color: '#394d58' } : b), [chunk, rainy])
  return <group>
    <Blocks blocks={blocks} shadow={near} />
    {near && <Blocks blocks={windows} shadow={false} emissive={night ? "#dbb574" : "#000000"} />}
    {night && near && [-1, 1].map((side) => <mesh key={side} position={[chunk.x + side * 8, .19, chunk.z + side * 13]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[6, 16]} /><meshBasicMaterial color="#ffd495" transparent opacity={.12} depthWrite={false} /></mesh>)}
    <RigidBody type="fixed" colliders={false} name={`chunk:${id}`}>
      {chunk.solids.map((solid) => <CuboidCollider key={solid.id} args={[solid.size[0] / 2, solid.size[1] / 2, solid.size[2] / 2]} position={solid.position} friction={.85} />)}
      {chunk.trees.map((p, i) => <CuboidCollider key={`tree${i}`} args={[.25, 2.5, .25]} position={[p[0], p[1] + 2.5, p[2]]} />)}
    </RigidBody>
    <Trees positions={chunk.trees} shadow={near} />
  </group>
})
function WorldMarkers() {
  const player = useGameStore((s) => s.player.position)
  const collected = useGameStore((s) => s.collected)
  const mission = useGameStore((s) => s.mission)
  const objective = mission && mission.status === 'active' ? MISSIONS[mission.id].objectives[mission.step] : null
  return <>
    {LOCATIONS.filter((l) => Math.hypot(l.position[0] - player[0], l.position[2] - player[2]) < 150).map((l) => <group key={l.id} position={l.position}>
      {Math.hypot(l.position[0] - player[0], l.position[2] - player[2]) > 4 && <mesh position={[0, 2.6, 0]}><octahedronGeometry args={[.3]} /><meshStandardMaterial color={l.color} emissive={l.color} emissiveIntensity={.4} /></mesh>}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]}><ringGeometry args={[1.4, 1.7, 24]} /><meshBasicMaterial color={l.color} transparent opacity={.8} /></mesh>
      <Sign label={l.name.toUpperCase()} position={[l.position[0] % 96 >= 0 ? 5 : -5, 3.2, 0]} width={4.5} rotation={l.position[0] % 96 >= 0 ? -Math.PI / 2 : Math.PI / 2} />
    </group>)}
    {COLLECTIBLES.map((p, i) => collected.includes(`shell-${i}`) ? null : <mesh key={i} position={p}><icosahedronGeometry args={[.25, 0]} /><meshStandardMaterial color="#eccb72" emissive="#bb741d" emissiveIntensity={.7} /></mesh>)}
    {objective?.kind === 'collect' && <group position={[objective.target[0], .5, objective.target[2]]}><mesh><boxGeometry args={[.6, .6, .6]} /><meshStandardMaterial color="#c79458" /></mesh><mesh position={[0, .31, 0]}><boxGeometry args={[.12, .02, .6]} /><meshStandardMaterial color="#efe0aa" /></mesh></group>}
    {objective && objective.kind !== 'escape' && <mesh position={[objective.target[0], 1.2, objective.target[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[mission?.id === 'race' ? 5 : 2, .12, 8, 40]} /><meshBasicMaterial color="#ffc960" />
    </mesh>}
  </>
}
