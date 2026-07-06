import type { Equipment, Exercise } from '../types'
import { EXERCISES, getExercise } from '../data/exercises'

/** Candidates for swapping an exercise: its declared substitutes first (filtered to available
 * equipment), then a same-pattern/same-primary-muscle fallback so there's always an option. */
export function findSubstitutes(
  exerciseId: string,
  availableEquipment: Equipment[],
  exclude: string[] = [],
): Exercise[] {
  const source = getExercise(exerciseId)
  if (!source) return []
  const equipSet = new Set(availableEquipment)
  const excludeSet = new Set([exerciseId, ...exclude])

  const declared = source.substitutes
    .map((id) => getExercise(id))
    .filter((e): e is Exercise => !!e)
    .filter((e) => !excludeSet.has(e.id) && e.equipment.some((eq) => equipSet.has(eq)))

  if (declared.length > 0) return declared

  return EXERCISES.filter(
    (e) =>
      !excludeSet.has(e.id) &&
      e.pattern === source.pattern &&
      e.primaryMuscles.some((m) => source.primaryMuscles.includes(m)) &&
      e.equipment.some((eq) => equipSet.has(eq)),
  )
}
