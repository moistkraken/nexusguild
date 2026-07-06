import type { MovementPattern, SplitDayType } from '../types'

/** Ordered rotation of training-day archetypes for a given weekly frequency. No rest days
 * embedded — rest is handled by the dashboard via the "trained today?" pointer, so a missed
 * day reshuffles forward instead of skipping a muscle group. */
export function buildWeeklySplit(daysPerWeek: number): SplitDayType[] {
  const n = Math.max(1, Math.min(7, daysPerWeek))
  switch (n) {
    case 1:
      return ['full-body']
    case 2:
      return ['full-body', 'full-body']
    case 3:
      return ['full-body', 'full-body', 'full-body']
    case 4:
      return ['upper', 'lower', 'upper', 'lower']
    case 5:
      return ['push', 'pull', 'legs', 'upper', 'lower']
    case 6:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs']
    default:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'full-body']
  }
}

/** Max recommended consecutive training days before a rest day is suggested. */
export function maxConsecutiveTrainingDays(daysPerWeek: number): number {
  if (daysPerWeek >= 6) return 3
  if (daysPerWeek >= 4) return 2
  return 1
}

export const DAY_TYPE_LABELS: Record<SplitDayType, string> = {
  'full-body': 'Full Body',
  upper: 'Upper Body',
  lower: 'Lower Body',
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Leg Day',
  rest: 'Rest Day',
}

/** Movement patterns emphasized on a given day type, in priority order (compounds first). */
export const DAY_TYPE_PATTERNS: Record<SplitDayType, MovementPattern[]> = {
  'full-body': [
    'squat',
    'horizontal-push',
    'horizontal-pull',
    'hinge',
    'vertical-pull',
    'core',
  ],
  upper: [
    'horizontal-push',
    'horizontal-pull',
    'vertical-push',
    'vertical-pull',
    'isolation',
    'isolation',
  ],
  lower: ['squat', 'hinge', 'lunge', 'isolation', 'core'],
  push: ['horizontal-push', 'vertical-push', 'isolation', 'isolation'],
  pull: ['vertical-pull', 'horizontal-pull', 'isolation', 'isolation'],
  legs: ['squat', 'hinge', 'lunge', 'isolation', 'isolation'],
  rest: [],
}
