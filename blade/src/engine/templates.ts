import type { Goal, MesoPhase } from '../types'

export interface RepScheme {
  repMin: number
  repMax: number
  compoundSets: number
  accessorySets: number
  rpe: number
  restSec: number
}

const GOAL_BASE: Record<Goal, RepScheme> = {
  strength: { repMin: 3, repMax: 6, compoundSets: 4, accessorySets: 3, rpe: 8, restSec: 180 },
  hypertrophy: { repMin: 8, repMax: 12, compoundSets: 4, accessorySets: 3, rpe: 8, restSec: 90 },
  'fat-loss': { repMin: 10, repMax: 15, compoundSets: 3, accessorySets: 3, rpe: 7, restSec: 60 },
  endurance: { repMin: 15, repMax: 20, compoundSets: 3, accessorySets: 2, rpe: 6, restSec: 45 },
  'general-fitness': { repMin: 8, repMax: 12, compoundSets: 3, accessorySets: 3, rpe: 7, restSec: 75 },
}

const PHASE_MODIFIER: Record<MesoPhase, { repShift: number; rpeShift: number; setShift: number; restShiftSec: number }> = {
  accumulation: { repShift: 0, rpeShift: 0, setShift: 0, restShiftSec: 0 },
  intensification: { repShift: -2, rpeShift: 1, setShift: -1, restShiftSec: 30 },
  deload: { repShift: -2, rpeShift: -3, setShift: -2, restShiftSec: 0 },
}

export function getRepScheme(goal: Goal, phase: MesoPhase): RepScheme {
  const base = GOAL_BASE[goal]
  const mod = PHASE_MODIFIER[phase]
  return {
    repMin: Math.max(2, base.repMin + mod.repShift),
    repMax: Math.max(base.repMin + mod.repShift + 2, base.repMax + mod.repShift),
    compoundSets: Math.max(2, base.compoundSets + mod.setShift),
    accessorySets: Math.max(1, base.accessorySets + Math.min(0, mod.setShift)),
    rpe: Math.max(4, Math.min(10, base.rpe + mod.rpeShift)),
    restSec: Math.max(30, base.restSec + mod.restShiftSec),
  }
}

/** Rough starting-weight multiplier of bodyweight for a lift's first prescription, by
 * experience level. Deliberately conservative — the overload engine corrects quickly from
 * logged performance. */
export const BEGINNER_LOAD_MULTIPLIER: Record<string, number> = {
  squat: 0.5,
  hinge: 0.6,
  'horizontal-push': 0.4,
  'horizontal-pull': 0.3,
  'vertical-push': 0.25,
  'vertical-pull': 0,
  lunge: 0.15,
  isolation: 0.1,
  core: 0,
  carry: 0.3,
}

export const EXPERIENCE_LOAD_SCALE: Record<string, number> = {
  beginner: 0.8,
  intermediate: 1,
  advanced: 1.25,
}

export const MESO_LENGTH_WEEKS = 6
export const MESO_ACCUMULATION_WEEKS = 3
export const MESO_INTENSIFICATION_WEEKS = 2
export const MESO_DELOAD_WEEKS = 1
