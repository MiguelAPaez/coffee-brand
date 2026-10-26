import * as THREE from 'three'

/** Ellipsoid proportions: length : width : thickness. */
const SCALE = new THREE.Vector3(1, 0.75, 0.55)
const CREASE_DEPTH = 0.16
const CREASE_WIDTH = 0.085

/**
 * One half of a coffee bean: a domed shell (z ≥ 0) with a flat inner face at z = 0 that has
 * the S-shaped center crease carved into it. Two draw groups: 0 = outer shell, 1 = inner face.
 * Built from a 128×76 sphere (~19.5k triangles), so two halves stay under 40k.
 */
export function createBeanHalf(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1, 128, 76)
  const pos = sphere.getAttribute('position') as THREE.BufferAttribute
  const inner = new Uint8Array(pos.count)

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    let z = pos.getZ(i)
    if (z <= 0) {
      inner[i] = 1
      // Project the back hemisphere onto the cut plane, then carve the crease (into the body = +z).
      const r = Math.min(1, Math.hypot(x, y))
      const centerline = 0.14 * Math.sin(x * Math.PI * 1.15)
      const d = (y - centerline) / CREASE_WIDTH
      const edgeFade = 1 - THREE.MathUtils.smoothstep(r, 0.72, 0.97)
      const lengthFade = 1 - THREE.MathUtils.smoothstep(Math.abs(x), 0.6, 0.92)
      z = CREASE_DEPTH * Math.exp(-d * d) * edgeFade * lengthFade
    }
    pos.setXYZ(i, x * SCALE.x, y * SCALE.y, z * SCALE.z)
  }

  // Split triangles into outer / inner groups.
  const index = sphere.getIndex()!
  const outer: number[] = []
  const cap: number[] = []
  for (let t = 0; t < index.count; t += 3) {
    const a = index.getX(t)
    const b = index.getX(t + 1)
    const c = index.getX(t + 2)
    ;(inner[a] && inner[b] && inner[c] ? cap : outer).push(a, b, c)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', pos)
  geo.setAttribute('uv', sphere.getAttribute('uv'))
  geo.setIndex([...outer, ...cap])
  geo.addGroup(0, outer.length, 0)
  geo.addGroup(outer.length, cap.length, 1)
  geo.computeVertexNormals()
  sphere.dispose()
  return geo
}

/** Tileable value-noise normal map, generated on a canvas (no texture files). */
export function createNoiseNormalMap(size = 256, strength = 2.2): THREE.CanvasTexture {
  const h = new Float32Array(size * size)
  const lattice = (cells: number, amp: number) => {
    const g = new Float32Array(cells * cells).map(() => Math.random())
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * cells
        const fy = (y / size) * cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const tx = fx - x0
        const ty = fy - y0
        const sx = tx * tx * (3 - 2 * tx)
        const sy = ty * ty * (3 - 2 * ty)
        const at = (i: number, j: number) => g[(j % cells) * cells + (i % cells)]
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
        const bot = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
        h[y * size + x] += (top + (bot - top) * sy) * amp
      }
    }
  }
  lattice(8, 0.5)
  lattice(32, 0.3)
  lattice(64, 0.2)

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const n = new THREE.Vector3(-dx, -dy, 1).normalize()
      const o = (y * size + x) * 4
      img.data[o] = (n.x * 0.5 + 0.5) * 255
      img.data[o + 1] = (n.y * 0.5 + 0.5) * 255
      img.data[o + 2] = (n.z * 0.5 + 0.5) * 255
      img.data[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 2)
  return tex
}
