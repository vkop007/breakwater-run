import { useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { runtime } from '../core/runtime'
import { onCommand } from '../core/commands'
import { Box } from '../../scenes/ScenePrimitives'
import { Sign } from '../../scenes/ScenePrimitives'
import { distance } from '../../data/district'
import type { Point } from '../../types/game'
const COURIER_POSITION: Point = [11, 1, 42]
export default function CourierEvent() {
  useGameStore((s) => Math.floor(s.time))
  const done = useGameStore((s) => s.discovered.includes('courier-helped')) && runtime.elapsed < runtime.courierCooldown
  useEffect(() => onCommand((command) => {
    if (command.type !== 'interact' || runtime.occupied || distance(runtime.position, COURIER_POSITION) > 3 || useGameStore.getState().discovered.includes('courier-helped') && runtime.elapsed < runtime.courierCooldown) return
    const s = useGameStore.getState()
    runtime.courierCooldown = runtime.elapsed + 180
    useGameStore.setState({ money: s.money + 125, discovered: s.discovered.includes('courier-helped') ? s.discovered : [...s.discovered, 'courier-helped'] })
    s.notify('Courier: Thanks for fixing the loose strap. You saved my route!'); s.notify('Stranded courier helped · +$125', 'success')
  }), [])
  if (done) return null
  return <group position={[11, .2, 42]}>
    <Box position={[0, .85, 0]} size={[.6, 1.4, .4]} color="#c59862" /><Box position={[0, 1.8, 0]} size={[.4, .4, .4]} color="#af7957" />
    <Box position={[.9, .3, 0]} size={[.65, .6, .65]} color="#d1ad68" />
    <Sign label="COURIER · NEED A HAND?" position={[0, 2.7, 0]} width={2.8} />
  </group>
}
