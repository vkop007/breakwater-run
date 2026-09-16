import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { useEffect, useMemo, useRef } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import { runtime } from '../core/runtime'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAppStore } from '../../stores/appStore'
export default function FollowCamera() {
  const { camera } = useThree()
  const { world, rapier } = useRapier()
  const vectors = useMemo(() => ({ target: new Vector3(), eye: new Vector3(), direction: new Vector3() }), [])
  const initialized = useRef(false)
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const fov = camera.fov
    camera.fov = 58; camera.clearViewOffset(); camera.updateProjectionMatrix()
    return () => { camera.fov = fov; camera.updateProjectionMatrix() }
  }, [camera])
  useFrame((_, delta) => {
    if (useAppStore.getState().phase !== 'playing') return
    const vehicle = runtime.occupied ? runtime.vehicles.get(runtime.occupied) : null
    if (vehicle && Math.abs(vehicle.speed) > 2 && runtime.elapsed - runtime.cameraLookAt > 1.5) runtime.cameraYaw += Math.atan2(Math.sin(vehicle.yaw - runtime.cameraYaw), Math.cos(vehicle.yaw - runtime.cameraYaw)) * (1 - Math.exp(-2.5 * delta))
    const p = vehicle?.body.translation() || runtime.playerBody?.translation()
    if (!p) return
    const { target, eye, direction } = vectors
    target.set(p.x, p.y + (vehicle ? 1 : .75), p.z)
    if (vehicle && runtime.cameraMode === 1) {
      const q = vehicle.body.rotation()
      direction.set(0, 0, 1).applyQuaternion(q)
      eye.set(p.x, p.y + 1.35, p.z).addScaledVector(direction, 1.65)
      target.copy(eye).addScaledVector(direction, 20)
    } else {
      const distance = vehicle ? 8.5 : runtime.cameraMode === 1 ? 4 : 6.8
      eye.set(-Math.sin(runtime.cameraYaw) * Math.cos(runtime.cameraPitch), Math.sin(runtime.cameraPitch), -Math.cos(runtime.cameraYaw) * Math.cos(runtime.cameraPitch)).multiplyScalar(distance).add(target)
      direction.copy(eye).sub(target)
      const length = direction.length(); direction.normalize()
      const hit = world.castRay(new rapier.Ray(target, direction), length, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, vehicle?.body || runtime.playerBody || undefined)
      if (hit) eye.copy(target).addScaledVector(direction, Math.max(.4, hit.timeOfImpact - .25))
    }
    camera.position.lerp(eye, initialized.current ? 1 - Math.exp(-12 * Math.min(delta, .05)) : 1)
    const settings = useSettingsStore.getState()
    if (settings.screenShake && !settings.reducedMotion && runtime.shake > .001) camera.position.x += Math.sin(runtime.elapsed * 80) * runtime.shake
    runtime.shake *= Math.exp(-8 * delta)
    camera.lookAt(target); initialized.current = true
  })
  return null
}
