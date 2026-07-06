import type { CheckIn } from '../types'

export interface ReadinessAdjustment {
  volumeMultiplier: number
  intensityMultiplier: number
  label: string
  tone: 'boost' | 'neutral' | 'caution' | 'backoff'
}

/**
 * energy/sleep: 1 (poor) - 5 (great). soreness: 1 (fresh) - 5 (wrecked).
 * Composite readiness score drives how hard today's session should push.
 */
export function readinessFromCheckIn(checkIn: CheckIn): ReadinessAdjustment {
  const score = checkIn.energy + checkIn.sleep + (6 - checkIn.soreness)

  if (score <= 6) {
    return {
      volumeMultiplier: 0.6,
      intensityMultiplier: 0.88,
      label: 'System depleted — auto-scaled to a recovery session',
      tone: 'backoff',
    }
  }
  if (score <= 9) {
    return {
      volumeMultiplier: 0.82,
      intensityMultiplier: 0.94,
      label: 'Readiness below baseline — volume trimmed, load eased',
      tone: 'caution',
    }
  }
  if (score <= 12) {
    return {
      volumeMultiplier: 1.0,
      intensityMultiplier: 1.0,
      label: 'Readiness nominal — plan executing as prescribed',
      tone: 'neutral',
    }
  }
  return {
    volumeMultiplier: 1.12,
    intensityMultiplier: 1.04,
    label: 'Readiness optimal — cleared to push beyond baseline',
    tone: 'boost',
  }
}

export const DEFAULT_CHECK_IN: CheckIn = { energy: 3, soreness: 3, sleep: 3 }
