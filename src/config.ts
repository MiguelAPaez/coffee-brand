import { ROASTS } from '@/content/roasts'
import { appPath } from './routes'

/** Swap these to point at your own footage (see README for CORS requirements). */
export const VIDEO_URL = `${import.meta.env.BASE_URL}video/descent-desktop.mp4`
export const VIDEO_URL_MOBILE = `${import.meta.env.BASE_URL}video/descent-mobile.mp4`

export const INK = '#2A1B12'
export const CREAM = '#F4EDE4'
export const CHERRY = '#B3262E'
/** Background of the 3D section (S3/S4). */
export const SCENE_BG = '#1A110C'
/**
 * Dark tone sampled from the final video frame (cherry close-up; darkest-30% average #38100B,
 * slightly lifted). The 3D scene starts on this color at the handoff and settles to SCENE_BG,
 * so the cut reads as one continuous shot.
 */
export const HANDOFF_BG = '#3A1A12'

/** Light cloud base of the descent's first frames; inner pages reuse it for their opening band. */
export const BASE_LIGHT = '#e6e4e1'

export const MOBILE_BREAKPOINT = 768

/** Timeline, all values in scroll progress p (0..1). */
export const T = {
  videoEnd: 0.5,
  handoffStart: 0.46,
  handoffEnd: 0.54,
  mount3D: 0.35,
  splitStart: 0.62,
  splitEnd: 0.78,
  settleStart: 0.88,
  darkFootage: 0.3,
  scrubOffscreen: 0.56,
  /** Scene background settles from HANDOFF_BG to SCENE_BG over this range. */
  bgSettleEnd: 0.62,
  /** Final dim reaches 40% by here. */
  dimEnd: 0.95,
} as const

type NetworkInformation = { saveData?: boolean }

export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
}

export function pickVideoUrl(): string {
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection
  return isMobileViewport() || conn?.saveData ? VIDEO_URL_MOBILE : VIDEO_URL
}

export const NAV = [
  { label: 'Origin', href: appPath('/origin') },
  { label: 'Process', href: appPath('/process') },
  { label: 'Roasts', href: appPath('/roasts') },
  { label: 'Visit', href: appPath('/visit') },
  { label: 'Journal', href: appPath('/journal') },
] as const

/** Home shows the flagship roast; its data lives in content/roasts. */
export const SPECS = ROASTS[0].specs
export const FLAVORS = ROASTS[0].flavors
