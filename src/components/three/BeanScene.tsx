import { Suspense, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Bean } from '@/components/three/Bean'
import { Particles } from '@/components/three/Particles'
import { bean } from '@/components/three/state'
import { progress } from '@/hooks/useScrollProgress'
import { subscribe } from '@/lib/raf'
import { HANDOFF_BG, SCENE_BG, T } from '@/config'
import { range } from '@/lib/math'

type Props = { reduced: boolean; mobile: boolean; onInteract: () => void }

const DRAG_SPEED = 0.008

/**
 * Bridges the page's rAF loop to R3F's demand frameloop: request a render only while the
 * 3D layer is on screen and something is changing.
 */
function Invalidator({ reduced }: { reduced: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let lastP = -1
    return subscribe(() => {
      const p = progress.p
      if (p < T.handoffStart - 0.02) return
      const changed = p !== lastP
      lastP = p
      // Particles and idle motion need continuous frames unless motion is reduced.
      if (!reduced || changed || bean.dragging || bean.moving || Math.abs(bean.velY) > 1e-3) invalidate()
    })
  }, [invalidate, reduced])
  return null
}

const FROM_BG = new THREE.Color(HANDOFF_BG)
const TO_BG = new THREE.Color(SCENE_BG)

/** Background starts on the last video frame's tone and settles to the section color. */
function Backdrop() {
  const bg = useMemo(() => FROM_BG.clone(), [])
  const fog = useMemo(() => new THREE.Fog(bg, 6, 12), [bg])
  useFrame(() => {
    bg.lerpColors(FROM_BG, TO_BG, range(progress.p, T.handoffEnd, T.bgSettleEnd))
    fog.color.copy(bg)
  })
  return (
    <>
      <primitive attach="background" object={bg} />
      <primitive attach="fog" object={fog} />
    </>
  )
}

function Scene({ reduced, particles }: { reduced: boolean; particles: number }) {
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)
  const wide = size.width >= 1024
  return (
    <>
      <Backdrop />
      <ambientLight intensity={0.15} color="#ffe6cc" />
      {/* Warm key */}
      <directionalLight position={[3, 4, 5]} intensity={2.4} color="#ffd6a8" />
      {/* Soft rim from behind */}
      <directionalLight position={[-4, 2, -4]} intensity={3} color="#ffae6b" />
      <Suspense fallback={null}>
        <Environment preset="sunset" environmentIntensity={0.3} />
      </Suspense>
      <Bean reduced={reduced} wide={wide} viewportW={viewport.width} viewportH={viewport.height} />
      {!reduced && particles > 0 && <Particles count={particles} />}
    </>
  )
}

export default function BeanScene({ reduced, mobile, onInteract }: Props) {
  const [dpr, setDpr] = useState<number | [number, number]>(mobile ? [1, 1.5] : [1, 2])
  const [particles, setParticles] = useState(mobile ? 60 : 150)
  const drag = useRef({ id: -1, x: 0, y: 0, t: 0, touch: false })
  const interacted = useRef(false)

  const interact = () => {
    if (interacted.current) return
    interacted.current = true
    onInteract()
  }

  // Desktop idle parallax follows the cursor anywhere in the window.
  useEffect(() => {
    if (mobile || reduced) return
    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      bean.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      bean.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mobile, reduced])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      touch: e.pointerType !== 'mouse',
    }
    bean.dragging = true
    bean.velY = 0
    if (!drag.current.touch) e.currentTarget.setPointerCapture(e.pointerId)
    interact()
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!bean.dragging || e.pointerId !== d.id) return
    const now = performance.now()
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const dt = Math.max(1, now - d.t) / 1000
    bean.targetY += dx * DRAG_SPEED
    // Touch: horizontal only (vertical swipes belong to page scroll via touch-action: pan-y).
    if (!d.touch) bean.targetX = Math.max(-0.7, Math.min(0.7, bean.targetX + dy * DRAG_SPEED))
    bean.velY = bean.velY * 0.6 + ((dx * DRAG_SPEED) / dt) * 0.4
    d.x = e.clientX
    d.y = e.clientY
    d.t = now
  }

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== drag.current.id) return
    bean.dragging = false
    drag.current.id = -1
    // Released after a pause: no fling.
    if (performance.now() - drag.current.t > 80) bean.velY = 0
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.25
    if (e.key === 'ArrowLeft') bean.targetY -= step
    else if (e.key === 'ArrowRight') bean.targetY += step
    else if (e.key === 'ArrowUp') bean.targetX = Math.max(-0.7, bean.targetX - step)
    else if (e.key === 'ArrowDown') bean.targetX = Math.min(0.7, bean.targetX + step)
    else return
    e.preventDefault()
    interact()
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- focusable role="group" viewer: drag + arrow keys rotate the bean
    <div
      className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: 'pan-y' }}
      role="group"
      aria-roledescription="3D viewer"
      aria-label="Interactive 3D coffee bean. Drag, or focus and use the arrow keys, to rotate."
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard-operable viewer (arrow keys)
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <Canvas
        frameloop="demand"
        dpr={dpr}
        camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 30 }}
        gl={{ antialias: !mobile, alpha: false, powerPreference: 'high-performance', stencil: false }}
        style={{ touchAction: 'pan-y' }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1)
            setParticles((n) => Math.floor(n / 2))
          }}
          flipflops={3}
          onFallback={() => {
            setDpr(1)
            setParticles(0)
          }}
        />
        <Invalidator reduced={reduced} />
        <Scene reduced={reduced} particles={particles} />
      </Canvas>
    </div>
  )
}
