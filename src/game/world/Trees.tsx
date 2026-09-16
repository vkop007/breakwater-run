import { useLayoutEffect, useRef } from 'react'
import { Object3D } from 'three'
import type { InstancedMesh } from 'three'
import type { Point } from '../../types/game'
export default function Trees({ positions, shadow }: { positions: Point[]; shadow: boolean }) {
  const trunks = useRef<InstancedMesh>(null), leaves = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const object = new Object3D()
    positions.forEach((p, i) => {
      object.position.set(p[0], p[1] + 2.1, p[2]); object.updateMatrix(); trunks.current?.setMatrixAt(i, object.matrix)
      object.position.y = p[1] + 4.6; object.updateMatrix(); leaves.current?.setMatrixAt(i, object.matrix)
    })
    for (const mesh of [trunks.current, leaves.current]) if (mesh) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere() }
  }, [positions])
  return <>
    <instancedMesh ref={trunks} args={[undefined, undefined, positions.length]} castShadow={shadow}><cylinderGeometry args={[.2, .3, 4.2, 5]} /><meshStandardMaterial color="#9f825a" /></instancedMesh>
    <instancedMesh ref={leaves} args={[undefined, undefined, positions.length]} castShadow={shadow}><icosahedronGeometry args={[2.5, 0]} /><meshStandardMaterial color="#749267" /></instancedMesh>
  </>
}
