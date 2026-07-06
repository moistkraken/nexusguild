import type { ProgressionState } from '../types'

export interface RpeTrendAdjustment {
  intensityMultiplier: number
  label: string | null
}

/** Looks at the last few logged sessions across all tracked lifts and compares actual RPE to
 * the prescribed target. Consistently grinding below target -> nudge intensity up; consistently
 * over target -> back off before it turns into a stall. */
export function computeRpeTrendAdjustment(states: ProgressionState[], targetRpe: number): RpeTrendAdjustment {
  const recentAvgRpes = states
    .map((s) => s.history.slice(-3).filter((h) => h.avgRpe != null))
    .flat()
    .map((h) => h.avgRpe as number)

  if (recentAvgRpes.length < 3) return { intensityMultiplier: 1, label: null }

  const mean = recentAvgRpes.reduce((a, b) => a + b, 0) / recentAvgRpes.length
  const delta = mean - targetRpe

  if (delta <= -1) {
    return { intensityMultiplier: 1.04, label: 'Logged RPE trending well under target — auto-regulation is pushing intensity up' }
  }
  if (delta >= 1) {
    return { intensityMultiplier: 0.94, label: 'Logged RPE trending over target — auto-regulation is easing off before a stall' }
  }
  return { intensityMultiplier: 1, label: null }
}
