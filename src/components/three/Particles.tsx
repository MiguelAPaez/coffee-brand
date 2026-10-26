import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const BOUNDS = new THREE.Vector3(4.5, 2.8, 2.5)

/** Warm dust: a single InstancedMesh of tiny points drifting slowly upward. */
export function Particles({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() * 2 - 1) * BOUNDS.x,
        y: (Math.random() * 2 - 1) * BOUNDS.y,
        z: (Math.random() * 2 - 1) * BOUNDS.z - 0.5,
        speed: 0.04 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random(),
      })),
    [count],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.012, 0), [])
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#e9b98a', transparent: true, opacity: 0.55, depthWrite: false }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(({ clock }, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(0.1, delta)
    const t = clock.elapsedTime
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      s.y += s.speed * dt
      if (s.y > BOUNDS.y) s.y = -BOUNDS.y
      dummy.position.set(s.x + Math.sin(t * 0.3 + s.phase) * 0.15, s.y, s.z)
      dummy.scale.setScalar(s.size)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />
}
