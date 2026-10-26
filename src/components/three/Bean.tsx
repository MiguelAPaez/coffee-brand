import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { createBeanHalf, createNoiseNormalMap } from '@/components/three/beanGeometry'
import { bean } from '@/components/three/state'
import { Hotspot } from '@/components/Hotspot'
import { progress } from '@/hooks/useScrollProgress'
import { lerp, range } from '@/lib/math'
import { FLAVORS, T } from '@/config'

const { damp } = THREE.MathUtils
const SPLIT_DISTANCE = 0.42
const SPLIT_ANGLE = 0.55
const EPS = 1e-4

// Hotspot anchors on the inner faces, in half-local coordinates (cap faces -z).
const ANCHORS: { half: 'front' | 'back'; pos: [number, number, number] }[] = [
  { half: 'front', pos: [-0.42, 0.26, -0.03] },
  { half: 'front', pos: [0.4, -0.3, -0.03] },
  { half: 'back', pos: [0.06, 0.32, -0.03] },
]

/**
 * Bean orientation: long axis vertical, halves separating left/right, so the inner faces
 * turn toward the camera as the halves hinge open.
 */
const BASE_QUAT = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)),
)

const CAMERA_Z = 6

/** Soft radial blob used as the contact shadow (far cheaper than a depth-rendered shadow). */
function createShadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(0,0,0,0.85)')
  grad.addColorStop(0.45, 'rgba(0,0,0,0.35)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

type Props = { reduced: boolean; wide: boolean; viewportW: number; viewportH: number }

export function Bean({ reduced, wide, viewportW, viewportH }: Props) {
  const geometry = useMemo(createBeanHalf, [])
  const normalMap = useMemo(() => createNoiseNormalMap(), [])
  const materials = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({
        color: '#4a2c1c',
        roughness: 0.55,
        clearcoat: 0.3,
        clearcoatRoughness: 0.35,
        normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
      }),
      new THREE.MeshStandardMaterial({
        color: '#a0714d',
        roughness: 0.92,
        normalMap,
        normalScale: new THREE.Vector2(0.18, 0.18),
      }),
    ],
    [normalMap],
  )
  const shadowTex = useMemo(createShadowTexture, [])
  useEffect(
    () => () => {
      shadowTex.dispose()
      geometry.dispose()
      normalMap.dispose()
      materials.forEach((m) => m.dispose())
    },
    [geometry, normalMap, materials, shadowTex],
  )

  const layout = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const tilt = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const front = useRef<THREE.Mesh>(null)
  const back = useRef<THREE.Mesh>(null)
  const split = useRef(reduced ? 1 : 0)
  const showRef = useRef(reduced)
  const [showHotspots, setShowHotspots] = useState(reduced)

  // Desktop: bean right of center, leaving the left column to the text.
  // Stacked layouts: bean in the lower part of the frame, scaled to fit the width.
  const scale = wide ? 1 : THREE.MathUtils.clamp(Math.min(viewportW / 2.7, (viewportH * 0.42) / 2), 0.5, 0.95)
  const x = wide ? viewportW * 0.17 : 0
  const y = wide ? 0 : -viewportH * 0.17

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta)
    const p = progress.p
    const s = spin.current!

    // Layout: drift to center for the final CTA, and yaw/pitch toward the camera so an
    // off-center bean shows both inner faces evenly.
    const settle = range(p, T.splitEnd + 0.08, T.settleStart + 0.06)
    const l = layout.current!
    const lx = lerp(x, 0, settle)
    l.position.set(lx, y, 0)
    l.scale.setScalar(lerp(scale, scale * 0.85, settle))
    l.rotation.set(Math.atan2(y, CAMERA_Z), Math.atan2(-lx, CAMERA_Z), 0)

    if (!bean.dragging) {
      if (Math.abs(bean.velY) > 1e-3) {
        bean.targetY += bean.velY * dt
        bean.velY *= Math.exp(-dt * 3)
      } else bean.velY = 0
      if (!reduced && p > T.settleStart) bean.targetY += dt * 0.25
    }
    s.rotation.y = damp(s.rotation.y, bean.targetY, 10, dt)
    s.rotation.x = damp(s.rotation.x, bean.targetX, 10, dt)

    const t = tilt.current!
    const tiltX = reduced || bean.dragging ? 0 : -bean.pointerY * 0.08
    const tiltY = reduced || bean.dragging ? 0 : bean.pointerX * 0.08
    t.rotation.x = damp(t.rotation.x, tiltX, 4, dt)
    t.rotation.y = damp(t.rotation.y, tiltY, 4, dt)

    const target = reduced ? 1 : range(p, T.splitStart, T.splitEnd)
    split.current = damp(split.current, target, 6, dt)
    if (Math.abs(split.current - target) < EPS) split.current = target
    const k = split.current
    shadow.current!.scale.set(1 + k * 0.9, 1, 1)
    ;(shadow.current!.material as THREE.MeshBasicMaterial).opacity = 0.5 - k * 0.15
    front.current!.position.z = k * SPLIT_DISTANCE
    front.current!.rotation.x = k * SPLIT_ANGLE
    back.current!.position.z = -k * SPLIT_DISTANCE
    back.current!.rotation.x = -k * SPLIT_ANGLE

    const show = k > 0.6 && p < T.settleStart
    if (show !== showRef.current) {
      showRef.current = show
      setShowHotspots(show)
    }

    bean.moving =
      Math.abs(s.rotation.y - bean.targetY) > EPS ||
      Math.abs(s.rotation.x - bean.targetX) > EPS ||
      Math.abs(t.rotation.x - tiltX) > EPS ||
      Math.abs(t.rotation.y - tiltY) > EPS ||
      k !== target
  })

  const occluders = [front, back] as React.RefObject<THREE.Object3D>[]
  const hotspots = (half: 'front' | 'back') =>
    showHotspots &&
    ANCHORS.map((a, i) =>
      a.half === half ? (
        <Html key={i} position={a.pos} occlude={occluders} zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
          <div className="-translate-y-1/2">
            <Hotspot name={FLAVORS[i].name} note={FLAVORS[i].note} />
          </div>
        </Html>
      ) : null,
    )

  return (
    <group ref={layout} position={[x, y, 0]} scale={scale}>
      <mesh ref={shadow} position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[1.6, 0.9]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.5} fog={false} />
      </mesh>
      <group ref={tilt}>
        <group ref={spin}>
          <group quaternion={BASE_QUAT}>
            <mesh ref={front} geometry={geometry} material={materials} castShadow>
              {hotspots('front')}
            </mesh>
            {/* Mirrored half: negative z-scale; three.js flips the face winding automatically. */}
            <mesh ref={back} geometry={geometry} material={materials} scale={[1, 1, -1]} castShadow>
              {hotspots('back')}
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
