import { useEffect, useRef } from 'react'
import { useAfterPhysicsStep, useRapier } from '@react-three/rapier'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useGameStore } from '../../stores/gameStore'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { runtime } from './runtime'
import { onCommand } from './commands'
import { useGameInput, input } from '../input/input'
import { COLLECTIBLES, LOCATIONS, SAFE_SPAWN, distance } from '../../data/district'
import { VEHICLES } from '../../data/vehicles'
import { MISSIONS } from '../../data/missions'
import { reportCrime } from './events'
import { failMission, interactObjective, startMission, updateMission } from '../missions/missionSystem'
import { continueGame, saveGame } from '../save/saveSystem'
import { pedestrians } from '../npcs/actors'
import { dispatch } from './commands'
import { restoreCheckpoint } from '../missions/checkpoints'
import { visibleChunks } from '../world/layout'

export default function GameDriver() {
  const { world, rapier } = useRapier()
  const gl = useThree((s) => s.gl)
  useGameInput(gl.domElement)
  const sample = useRef({ elapsed: 0, frames: 0, hud: 0 })
  const recovery = () => {
    const s = useGameStore.getState()
    runtime.occupied = null
    runtime.playerBody?.setEnabled(true)
    runtime.playerBody?.setTranslation({ x: s.safePosition[0], y: s.safePosition[1], z: s.safePosition[2] }, true)
    runtime.position = [...s.safePosition]
    useGameStore.setState({ recovery: null, vehicle: null, player: { ...s.player, health: 100 }, wanted: { ...s.wanted, level: 0, state: 'clear', report: 0, escape: 0, caught: 0 } })
    useAppStore.setState({ phase: 'playing', panel: null })
    input.clear()
  }
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __breakwater: { runtime, game: useGameStore, app: useAppStore, settings: useSettingsStore, input, dispatch, pedestrians, world, rapier, startMission, reportCrime, saveGame, continueGame, restoreCheckpoint } })
    const unsubscribe = onCommand((command) => {
      const s = useGameStore.getState()
      if (command.type === 'load') { continueGame(); return }
      if (command.type === 'checkpoint') { if (!restoreCheckpoint()) { recovery(); if (s.mission) startMission(s.mission.id, true) } return }
      if (command.type === 'safehouse') { useGameStore.setState({ safePosition: [...SAFE_SPAWN] }); recovery(); return }
      if (s.recovery) return
      if (command.type === 'save') { saveGame(); return }
      if (command.type === 'waypoint') { useGameStore.setState({ waypoint: command.position }); return }
      if (command.type === 'mission') { startMission(command.id); return }
      if (command.type === 'restart-mission') { if (s.mission) startMission(s.mission.id, true); return }
      if (command.type === 'abandon-mission') { useGameStore.setState({ mission: null, checkpoint: null }); s.notify('Activity abandoned.'); return }
      const current = runtime.occupied ? runtime.vehicles.get(runtime.occupied) : null
      const near = [...runtime.vehicles.values()].filter((v) => distance(runtime.position, v.position) < 6 && Math.abs(v.speed) < 3 && v.health > 0).sort((a, b) => distance(runtime.position, a.position) - distance(runtime.position, b.position))[0]
      if (command.type === 'camera') { runtime.cameraMode = (runtime.cameraMode + 1) % 2; return }
      if (command.type === 'headlights') { if (current) current.headlights = !current.headlights; return }
      if (command.type === 'reset-vehicle') {
        if (!current) { s.notify('Enter a vehicle to recover it.'); return }
        if (Math.abs(current.speed) > 3) { s.notify('Stop the vehicle before resetting it.', 'warning'); return }
        const p = current.position
        const nx = Math.round(p[0] / 96) * 96
        const nz = Math.round(p[2] / 96) * 96
        const position = Math.abs(p[0] - nx) < Math.abs(p[2] - nz) ? { x: nx + 3, y: 1.4, z: p[2] } : { x: p[0], y: 1.4, z: nz + 3 }
        if (world.intersectionWithShape(position, { x: 0, y: 0, z: 0, w: 1 }, new rapier.Cuboid(1.2, .7, 2.5), rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, current.body)) { s.notify('The nearby road is blocked. Try a different spot.', 'warning'); return }
        current.body.setTranslation(position, true); current.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
        current.body.setLinvel({ x: 0, y: 0, z: 0 }, true); current.body.setAngvel({ x: 0, y: 0, z: 0 }, true); return
      }
      if (command.type === 'exit') {
        if (!current || !runtime.playerBody) return
        if (Math.abs(current.speed) > 3) { s.notify('Slow down before getting out.', 'warning'); return }
        const right = new Vector3(1, 0, 0).applyQuaternion(current.body.rotation())
        for (const side of [-1, 1]) {
          const p = current.body.translation(), pos = { x: p.x + right.x * side * 2.3, y: 1.2, z: p.z + right.z * side * 2.3 }
          const hit = world.intersectionWithShape(pos, { x: 0, y: 0, z: 0, w: 1 }, new rapier.Capsule(.5, .35), rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, runtime.playerBody)
          if (!hit) {
            runtime.occupied = null; input.clear(); runtime.playerBody.setEnabled(true); runtime.playerBody.setTranslation(pos, true); runtime.position = [pos.x, pos.y, pos.z]
            useGameStore.setState({ vehicle: null }); return
          }
        }
        s.notify('Both doors are blocked. Move the vehicle first.', 'warning'); return
      }
      if (command.type === 'purchase' || command.type === 'select-vehicle') {
        if (distance(runtime.position, LOCATIONS.find((l) => l.id === 'garage')!.position) > 35 || !s.completed.includes('recovery')) { s.notify('Unlock and visit Quayline Garage first.', 'warning'); return }
        if (command.type === 'purchase') {
          const price = VEHICLES[command.kind].price
          if (s.owned.includes(command.kind)) { s.notify('You already own this vehicle.'); return }
          if (!s.unlocked.includes(command.kind) || s.money < price) { s.notify('This vehicle is locked or you need more money.', 'warning'); return }
          useGameStore.setState({ money: s.money - price, owned: [...s.owned, command.kind] }); s.notify(`${VEHICLES[command.kind].name} purchased.`, 'success')
        } else {
          if (!s.owned.includes(command.kind)) { s.notify('Purchase this vehicle first.', 'warning'); return }
          if (current) { s.notify('Exit your current vehicle before retrieving another.'); return }
          const id = command.kind === 'compact' ? 'player-car' : `owned-${command.kind}`
          const vehicle = runtime.vehicles.get(id)
          const position = { x: 93, y: 1.3, z: 25 }
          if (world.intersectionWithShape(position, { x: 0, y: 0, z: 0, w: 1 }, new rapier.Cuboid(1.2, .7, 2.7), rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, vehicle?.body)) { s.notify('Clear the garage pickup space first.', 'warning'); return }
          runtime.parked.set(id, { position: [93, 1.3, 25], yaw: 0, health: vehicle?.health ?? runtime.parked.get(id)?.health ?? 100 })
          if (vehicle) { vehicle.body.setTranslation(position, true); vehicle.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true); vehicle.body.setLinvel({ x: 0, y: 0, z: 0 }, true); vehicle.body.setAngvel({ x: 0, y: 0, z: 0 }, true); vehicle.legal = true }
          s.notify(`${VEHICLES[command.kind].name} is parked outside.`)
        }
        return
      }
      if (command.type === 'service') {
        const contact = LOCATIONS.filter((l) => ['home', 'garage', 'shop', 'gas'].includes(l.kind)).find((l) => distance(runtime.position, l.position) < 35)
        const eligible = contact && (['repair'].includes(command.service) ? contact.kind === 'gas' || contact.kind === 'garage' && s.completed.includes('recovery') : ['paint', 'upgrade'].includes(command.service) ? contact.kind === 'garage' && s.completed.includes('recovery') : contact.kind === 'home' || contact.kind === 'shop')
        if (!eligible) { s.notify('Visit the correct service location. Garage services require The Missing Car.', 'warning'); return }
        if (['paint', 'clothes'].includes(command.service) && (!command.color || !/^#[0-9a-f]{6}$/i.test(command.color))) { s.notify('Choose a valid color.', 'warning'); return }
        const cost = { repair: 150, health: 50, paint: 100, clothes: 75, upgrade: 600 }[command.service]
        if (s.money < cost) { s.notify('Not enough money.', 'warning'); return }
        if (['repair', 'paint'].includes(command.service) && !near && !current) { s.notify('Park a vehicle nearby first.', 'warning'); return }
        const ride = current || near
        if (command.service === 'health' && s.player.health >= 100 || command.service === 'repair' && ride.health >= 99.9) { s.notify('Already in good condition.'); return }
        if (command.service === 'paint' && !(ride.id === 'player-car' || ride.id.startsWith('owned-'))) { s.notify('Repainting is available for your owned vehicles.', 'warning'); return }
        if (command.service === 'paint' && command.color === s.colors[ride.kind] || command.service === 'clothes' && command.color === useAppStore.getState().character.clothingColor) { s.notify('That color is already selected.'); return }
        if (command.service === 'repair') ride.health = 100
        if (command.service === 'health') useGameStore.setState({ player: { ...s.player, health: 100 } })
        if (command.service === 'paint' && command.color) useGameStore.setState({ colors: { ...s.colors, [(current || near).kind]: command.color } })
        if (command.service === 'clothes' && command.color) useAppStore.getState().updateCharacter({ clothingColor: command.color })
        if (command.service === 'upgrade') { if (s.discovered.includes('garage-upgrade')) { s.notify('Storage upgrade already purchased.'); return } useGameStore.setState({ discovered: [...s.discovered, 'garage-upgrade'] }) }
        useGameStore.setState({ money: s.money - cost }); s.notify(`${command.service} complete.`, 'success'); return
      }
      if (command.type === 'interact' && useAppStore.getState().phase === 'playing') {
        if (interactObjective()) return
        for (let i = 0; i < COLLECTIBLES.length; i++) if (!s.collected.includes(`shell-${i}`) && distance(runtime.position, COLLECTIBLES[i]) < 2.5) {
          useGameStore.setState({ collected: [...s.collected, `shell-${i}`], money: s.money + 75 }); s.notify('Coastal keepsake found · +$75', 'success'); return
        }
        const location = LOCATIONS.find((l) => distance(runtime.position, l.position) < 4.5 && (current || !near || distance(runtime.position, l.position) <= distance(runtime.position, near.position)))
        if (location) {
          if (location.id === 'home') { useGameStore.setState({ safePosition: [...SAFE_SPAWN] }); saveGame(); useAppStore.getState().openPanel('shop') }
          else if (location.id === 'garage') { useAppStore.getState().openPanel(s.completed.includes('recovery') ? 'garage' : 'activities'); s.notify('Ivo: Find my green Pico and the garage is yours to use.') }
          else if (location.kind === 'shop' || location.kind === 'gas') useAppStore.getState().openPanel('shop')
          else if (location.kind === 'mission' || location.kind === 'race') useAppStore.getState().openPanel('activities')
          else s.notify('Take a breath. Lantern Gardens is a good place to slow down.')
          return
        }
        if (!current && near && Math.abs(near.speed) < 3 && near.health > 0) {
          runtime.occupied = near.id; input.clear(); runtime.playerBody?.setEnabled(false); runtime.cameraYaw = near.yaw; runtime.cameraMode = 0
          const permitted = s.mission && ((s.mission.id === 'recovery' && near.id === 'recovery-car') || (s.mission.id === 'delivery' && near.id === 'delivery-van'))
          if (!near.legal && !permitted) reportCrime({ type: 'theft', position: [...near.position], severity: 1 })
          s.notify(`${VEHICLES[near.kind].name} · W accelerate, S brake, Space handbrake, F exit`)
        }
      }
    })
    const interval = window.setInterval(() => {
      const now = Date.now(), s = useGameStore.getState()
      if (s.notifications.some((n) => n.expires < now)) useGameStore.setState({ notifications: s.notifications.filter((n) => n.expires > now) })
    }, 500)
    return () => { unsubscribe(); clearInterval(interval) }
  // Commands read authoritative stores at dispatch time; Rapier world remains stable for this session.
  }, [world, rapier])
  useAfterPhysicsStep(() => {
    runtime.elapsed += 1 / 60; runtime.step++
    if (runtime.step === 2) { runtime.ready = true; useGameStore.setState({ ready: true }); useGameStore.getState().notify('Welcome to Lantern Quay. Visit Mara at Parcel & Pine to find your first job.') }
    if (runtime.step % 6 !== 0) return
    const s = useGameStore.getState(), p = runtime.position
    const vehicle = runtime.occupied ? runtime.vehicles.get(runtime.occupied) : null
    let interaction = ''
    const objective = s.mission?.status === 'active' ? MISSIONS[s.mission.id].objectives[s.mission.step] : null
    if (objective && ['collect', 'deliver', 'talk'].includes(objective.kind) && distance(p, objective.target) < objective.radius && !vehicle) interaction = objective.text
    const location = LOCATIONS.find((l) => distance(p, l.position) < 4.5 && (vehicle || ![...runtime.vehicles.values()].some((v) => v.health > 0 && Math.abs(v.speed) < 3 && distance(p, v.position) < distance(p, l.position))))
    if (!interaction && location) interaction = location.kind === 'home' ? 'Save at Seabreeze Apartment' : `Visit ${location.name}`
    if (!interaction && !vehicle) {
      const v = [...runtime.vehicles.values()].find((v) => distance(p, v.position) < 6 && Math.abs(v.speed) < 3 && v.health > 0)
      if (v) interaction = `Enter ${VEHICLES[v.kind].name}`
    }
    if (!interaction && COLLECTIBLES.some((c, i) => !s.collected.includes(`shell-${i}`) && distance(p, c) < 2.5)) interaction = 'Collect coastal keepsake'
    if (!interaction && !vehicle && (!s.discovered.includes('courier-helped') || runtime.elapsed >= runtime.courierCooldown) && distance(p, [11, 1, 42]) < 3) interaction = 'Help the stranded courier'
    const discovered = LOCATIONS.filter((l) => distance(p, l.position) < 35 && !s.discovered.includes(l.id)).map((l) => l.id)
    useGameStore.setState({
      player: { ...s.player, position: [...p], heading: runtime.heading, grounded: runtime.grounded, moving: runtime.moving },
      vehicle: vehicle ? { id: vehicle.id, kind: vehicle.kind, name: VEHICLES[vehicle.kind].name, speed: vehicle.speed, health: vehicle.health, headlights: vehicle.headlights } : null,
      interaction, time: (s.time + .1 * 1.4) % 1440, discovered: discovered.length ? [...s.discovered, ...discovered] : s.discovered,
    })
    updateMission(.1)
    if (s.player.health <= 0 && !s.recovery) { failMission('You were injured'); useGameStore.setState({ recovery: 'injured' }); useAppStore.getState().pause() }
  })
  useFrame((_, dt) => {
    const m = sample.current
    m.elapsed += dt; m.frames++
    if (m.elapsed >= .5) {
      const s = useGameStore.getState(), quality = useSettingsStore.getState().quality
      useGameStore.setState({ perf: { fps: Math.round(m.frames / m.elapsed), frameMs: Number((m.elapsed / m.frames * 1000).toFixed(1)), drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles, npcs: runtime.npcCount, vehicles: runtime.vehicles.size, chunks: visibleChunks(runtime.position, quality === 'high' ? 2 : 1).length, bodies: world.bodies.len(), colliders: world.colliders.len() }, ...(s.ready ? {} : {}) })
      m.elapsed = 0; m.frames = 0
    }
  })
  return null
}
