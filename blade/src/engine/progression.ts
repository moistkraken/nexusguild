import type { Exercise, ProgressionState, SetLog } from '../types'
import { roundToIncrement } from '../lib/calculations'
import { isoDate } from '../lib/calculations'

export const STALL_LIMIT = 3

export interface ProgressionOutcome {
  next: ProgressionState
  hitTop: boolean
  hitMin: boolean
  stalledOut: boolean
}

function incrementFor(exercise: Exercise): number {
  if (!exercise.isCompound) return 1.25
  if (exercise.equipment.includes('barbell')) return 2.5
  return 1.25
}

/** Bodyweight-only movements (no external load) can't take a plate increment, so double
 * progression happens on the rep range itself instead of the weight. */
export function isLoadable(exercise: Exercise): boolean {
  return exercise.equipment.some((eq) => eq !== 'bodyweight')
}

export function initProgressionState(
  exerciseId: string,
  startWeightKg: number,
  repMin: number,
  repMax: number,
): ProgressionState {
  return {
    exerciseId,
    currentWeightKg: roundToIncrement(startWeightKg),
    currentRepMin: repMin,
    currentRepMax: repMax,
    consecutiveStalls: 0,
    lastSessionDate: null,
    lastSessionHitTop: null,
    history: [],
  }
}

/** Apply a completed session's working sets (at the prescribed weight) to progress the lift
 * using double-progression: hit the top of the rep range on every working set -> load goes up
 * and reps reset to the bottom; miss the bottom of the range -> hold (or gently back off after
 * repeated misses); anything between -> hold and try again for more reps next time. */
export function applyPerformance(
  state: ProgressionState,
  exercise: Exercise,
  workingSets: SetLog[],
  date: string = isoDate(),
): ProgressionOutcome {
  const completed = workingSets.filter((s) => s.completed && !s.isWarmup)
  if (completed.length === 0) {
    return { next: state, hitTop: false, hitMin: false, stalledOut: false }
  }

  const minReps = Math.min(...completed.map((s) => s.reps))
  const avgRpe =
    completed.filter((s) => s.rpe != null).reduce((sum, s) => sum + (s.rpe ?? 0), 0) /
    (completed.filter((s) => s.rpe != null).length || 1)

  const hitTop = minReps >= state.currentRepMax
  const hitMin = minReps >= state.currentRepMin
  const loadable = isLoadable(exercise)

  let nextWeight = state.currentWeightKg
  let nextRepMin = state.currentRepMin
  let nextRepMax = state.currentRepMax
  let consecutiveStalls = state.consecutiveStalls

  if (hitTop) {
    if (loadable) {
      nextWeight = roundToIncrement(state.currentWeightKg + incrementFor(exercise))
    } else {
      // No plates to add: push the rep target up instead, capped so it stays a set, not a test.
      nextRepMin = Math.min(state.currentRepMin + 2, 28)
      nextRepMax = Math.min(state.currentRepMax + 2, 30)
    }
    consecutiveStalls = 0
  } else {
    consecutiveStalls += 1
    if (!hitMin && consecutiveStalls >= 2) {
      if (loadable) {
        // Two-plus misses at this weight: back off ~7.5% to rebuild a clean base.
        nextWeight = roundToIncrement(state.currentWeightKg * 0.925)
      } else {
        nextRepMin = Math.max(state.currentRepMin - 2, 5)
        nextRepMax = Math.max(state.currentRepMax - 2, nextRepMin + 2)
      }
    }
  }

  const stalledOut = consecutiveStalls >= STALL_LIMIT

  const next: ProgressionState = {
    ...state,
    currentWeightKg: stalledOut ? state.currentWeightKg : nextWeight,
    currentRepMin: stalledOut ? state.currentRepMin : nextRepMin,
    currentRepMax: stalledOut ? state.currentRepMax : nextRepMax,
    consecutiveStalls: stalledOut ? 0 : consecutiveStalls,
    lastSessionDate: date,
    lastSessionHitTop: hitTop,
    history: [
      ...state.history.slice(-19),
      { date, weightKg: state.currentWeightKg, topSetReps: minReps, avgRpe: avgRpe || null },
    ],
  }

  return { next, hitTop, hitMin, stalledOut }
}

/** After a stall-out, either deload the lift (drop weight and rebuild) or, if the caller
 * decides history shows a persistent grind, swap it for an equipment-equivalent substitute. */
export function deloadAfterStall(state: ProgressionState): ProgressionState {
  return {
    ...state,
    currentWeightKg: roundToIncrement(state.currentWeightKg * 0.85),
    consecutiveStalls: 0,
  }
}
