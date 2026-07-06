import type { Goal, Mesocycle, MesoPhase } from '../types'
import {
  MESO_ACCUMULATION_WEEKS,
  MESO_DELOAD_WEEKS,
  MESO_INTENSIFICATION_WEEKS,
  MESO_LENGTH_WEEKS,
} from './templates'
import { isoDate, uid } from '../lib/calculations'

export function createMesocycle(goal: Goal): Mesocycle {
  return {
    id: uid(),
    goal,
    startDate: isoDate(),
    lengthWeeks: MESO_LENGTH_WEEKS,
    accumulationWeeks: MESO_ACCUMULATION_WEEKS,
    intensificationWeeks: MESO_INTENSIFICATION_WEEKS,
    deloadWeeks: MESO_DELOAD_WEEKS,
    currentWeek: 1,
    active: true,
  }
}

export function phaseForWeek(meso: Mesocycle, week: number): MesoPhase {
  if (week > meso.accumulationWeeks + meso.intensificationWeeks) return 'deload'
  if (week > meso.accumulationWeeks) return 'intensification'
  return 'accumulation'
}

export function advanceMesocycle(meso: Mesocycle): Mesocycle {
  const nextWeek = meso.currentWeek + 1
  if (nextWeek > meso.lengthWeeks) {
    return createMesocycle(meso.goal)
  }
  return { ...meso, currentWeek: nextWeek }
}

export const PHASE_DESCRIPTION: Record<MesoPhase, string> = {
  accumulation: 'building volume at moderate intensity',
  intensification: 'trimming volume, pushing intensity up',
  deload: 'deliberate deload — recover and supercompensate',
}
