import { Physics } from '@react-three/rapier'
import { useGameStore } from '../stores/gameStore'
import CityWorld from '../game/world/CityWorld'
import AudioSystem from '../game/audio/AudioSystem'
import Environment from '../game/world/Environment'
import Player from '../game/player/Player'
import Vehicles from '../game/vehicles/Vehicles'
import FollowCamera from '../game/camera/FollowCamera'
import GameDriver from '../game/core/GameDriver'
import Pedestrians from '../game/npcs/Pedestrians'
import Traffic from '../game/traffic/Traffic'
import CourierEvent from '../game/npcs/CourierEvent'
import Police from '../game/police/Police'

export default function GameScene({ paused }: { paused: boolean }) {
  const debug = useGameStore((s) => s.collidersVisible)
  return <>
    <Environment /><AudioSystem />
    <Physics timeStep={1 / 60} paused={paused} colliders={false} gravity={[0, -9.81, 0]} interpolate maxCcdSubsteps={2} debug={debug}>
      <CityWorld /><Player /><Vehicles /><Pedestrians /><Traffic /><Police /><CourierEvent /><FollowCamera /><GameDriver />
    </Physics>
  </>
}
