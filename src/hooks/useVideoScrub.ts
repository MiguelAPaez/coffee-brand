import { useEffect, useRef } from 'react'
import { clamp } from '@/lib/math'
import { subscribe } from '@/lib/raf'
import { progress } from '@/hooks/useScrollProgress'
import { T } from '@/config'
import { prefersReducedMotion } from '@/hooks/useMedia'
import { firstIntent } from '@/lib/intent'

const LERP_TAU = 8
const SNAP = 0.002

/**
 * Scroll-scrubbed video: the <video> is seeked to the eased scroll position every frame and
 * never played. Seeking stays cheap because the footage is encoded with a keyframe every
 * 6 frames (see README), so the browser decodes at most a few frames per seek.
 */
export function useVideoScrub(src: string, rangeEnd: number = T.videoEnd) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reduced = prefersReducedMotion()
    let duration = 0
    let current = 0
    let cancelled = false

    const onMeta = () => {
      if (Number.isFinite(video.duration)) duration = video.duration
    }
    onMeta()
    video.addEventListener('loadedmetadata', onMeta)

    // Attach the source only after the page has loaded so the video download never competes
    // with the JS, CSS and fonts the hero text needs (LCP).
    // Until then only metadata + the first frame are fetched; the full file buffers on first intent.
    const attachSrc = () => {
      if (video.getAttribute('src')) return
      video.preload = 'metadata'
      video.src = src
      void firstIntent().then(() => {
        if (!cancelled) video.preload = 'auto'
      })
    }
    if (document.readyState === 'complete') attachSrc()
    else window.addEventListener('load', attachSrc, { once: true })

    const unsub = subscribe((dt) => {
      const p = progress.p
      if (p > T.scrubOffscreen || !duration) return
      const target = clamp(p / rangeEnd) * duration
      if (reduced) current = target
      else {
        current += (target - current) * (1 - Math.exp(-dt * LERP_TAU))
        if (Math.abs(target - current) < SNAP) current = target
      }
      // One seek in flight at a time; the next frame picks up wherever the scroll has moved to.
      if (video.seeking || Math.abs(video.currentTime - current) <= 0.01) return
      video.currentTime = current
    })

    return () => {
      cancelled = true
      unsub()
      window.removeEventListener('load', attachSrc)
      video.removeEventListener('loadedmetadata', onMeta)
    }
  }, [src, rangeEnd])

  return { videoRef }
}
