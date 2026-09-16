import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, Object3D, SRGBColorSpace } from 'three'
import type { InstancedMesh } from 'three'
import type { Block, Vec3 } from './sceneData'

export function Blocks({ blocks, emissive = '#000000', shadow = true }: { blocks: Block[]; emissive?: string; shadow?: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const object = new Object3D()
    const color = new Color()
    blocks.forEach((block, i) => {
      object.position.set(...block.position)
      object.scale.set(...block.size)
      object.rotation.set(0, block.rotation || 0, 0)
      object.updateMatrix()
      mesh.current!.setMatrixAt(i, object.matrix)
      mesh.current!.setColorAt(i, color.set(block.color))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [blocks])
  return <instancedMesh ref={mesh} args={[undefined, undefined, blocks.length]} castShadow={shadow} receiveShadow={shadow}>
    <boxGeometry /><meshStandardMaterial roughness={.86} emissive={emissive} emissiveIntensity={.7} />
  </instancedMesh>
}

export function Box({ position, size, color, rotation = 0 }: Block) {
  return <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
    <boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.8} />
  </mesh>
}

export function Sign({ label, position, width, color = '#f1e4c7', background = '#315d58', rotation = 0 }: {
  label: string; position: Vec3; width: number; color?: string; background?: string; rotation?: number
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 128)
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(10, 10, 492, 108)
    ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = color; ctx.fillText(label, 256, 65, 465)
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [label, background, color])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={position} rotation={[0, rotation, 0]}>
    <planeGeometry args={[width, width / 4]} /><meshBasicMaterial map={texture} />
  </mesh>
}

export function Palm({ position, height = 8, angle = 0 }: { position: Vec3; height?: number; angle?: number }) {
  return <group position={position} rotation={[0, angle, -.05]}>
    <mesh position={[0, height / 2, 0]} castShadow>
      <cylinderGeometry args={[.2, .35, height, 6]} /><meshStandardMaterial color="#9f825a" />
    </mesh>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <group key={i} position={[0, height, 0]} rotation={[.3, i * Math.PI / 3.5, 0]}>
      <mesh position={[1.75, -.3, 0]} rotation={[0, 0, -Math.PI / 2 - .22]} castShadow>
        <coneGeometry args={[.65, 4.4, 3]} /><meshStandardMaterial color={i % 2 ? '#587f60' : '#729b69'} />
      </mesh>
    </group>)}
  </group>
}

export function Car({ color, position, rotation = 0 }: { color: string; position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <Box position={[0, .8, 0]} size={[2.05, .7, 4.25]} color={color} />
    <Box position={[0, 1.37, -.25]} size={[1.85, .65, 2.15]} color="#345b60" />
    <Box position={[0, 1.74, -.25]} size={[1.95, .14, 2.2]} color={color} />
    <Box position={[0, 1.38, -.25]} size={[1.93, .8, .16]} color={color} />
    <Box position={[0, .55, 2.16]} size={[1.85, .2, .12]} color="#e5dcca" />
    <Box position={[0, .55, -2.16]} size={[1.85, .2, .12]} color="#e5dcca" />
    {[-1, 1].map((side) => <group key={side}>
      {[-1.35, 1.3].map((z) => <mesh key={z} position={[side * 1.02, .53, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[.48, .48, .25, 12]} /><meshStandardMaterial color="#294245" />
      </mesh>)}
      <Box position={[side * .7, .89, 2.15]} size={[.45, .23, .05]} color="#f5eac4" />
      <Box position={[side * .7, .89, -2.15]} size={[.45, .23, .05]} color="#d46345" />
    </group>)}
  </group>
}

export function Character({ color, preset }: { color: string; preset: string }) {
  const skin = preset === 'courier' ? '#ba805d' : preset === 'local' ? '#dcad83' : '#865a43'
  return <group position={[8, .58, 17.8]} rotation={[0, .3, 0]}>
    <Box position={[0, 1.15, 0]} size={[.68, .8, .36]} color={color} />
    <Box position={[0, 1.9, 0]} size={[.46, .52, .44]} color={skin} />
    <Box position={[0, 2.14, -.02]} size={[.51, .16, .48]} color="#394948" />
    {[-1, 1].map((s) => <group key={s}>
      <Box position={[s * .2, .45, 0]} size={[.26, .72, .29]} color="#345059" />
      <Box position={[s * .2, .09, .12]} size={[.29, .16, .5]} color="#ede1c8" />
      <Box position={[s * .47, 1.14, 0]} size={[.2, .7, .24]} color={skin} />
    </group>)}
    {preset === 'courier' && <Box position={[0, 1.17, -.32]} size={[.53, .6, .26]} color="#cfaf6b" />}
  </group>
}
