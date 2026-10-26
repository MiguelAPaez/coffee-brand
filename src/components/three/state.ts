/**
 * Mutable interaction state shared between DOM pointer handlers and the R3F frame loop.
 * Never stored in React state: it changes every frame.
 */
export const bean = {
  /** Accumulated drag rotation target (radians). */
  targetX: 0,
  targetY: 0,
  /** Angular velocity around Y after release (rad/s), for inertia. */
  velY: 0,
  dragging: false,
  /** Normalised cursor position (-1..1) for the idle parallax tilt. */
  pointerX: 0,
  pointerY: 0,
  /** True while any damped value is still converging. */
  moving: false,
}
