import { db } from '../db/db'
import type {
  CheckIn,
  LoggedExercise,
  Mesocycle,
  PrRecord,
  Profile,
  ProgressionState,
  SplitDayType,
  WorkoutLog,
  WorkoutPlan,
} from '../types'
import { buildWeeklySplit, maxConsecutiveTrainingDays } from './splitBuilder'
import { advanceMesocycle, createMesocycle, phaseForWeek } from './periodization'
import { generateDailyPlan } from './planGenerator'
import { applyPerformance, deloadAfterStall } from './progression'
import { computeRpeTrendAdjustment } from './autoRegulation'
import { getRepScheme } from './templates'
import { getExercise } from '../data/exercises'
import { estimate1rm, isoDate, totalVolume, uid, daysBetween } from '../lib/calculations'

export async function getActiveMesocycle(profile: Profile): Promise<Mesocycle> {
  const existing = await db.mesocycles.filter((m) => m.active).first()
  if (existing) return existing
  const meso = createMesocycle(profile.goal)
  await db.mesocycles.put(meso)
  return meso
}

interface Rotation {
  split: SplitDayType[]
  rotationIndex: number
  dayType: SplitDayType
  week: number
}

async function computeRotation(profile: Profile, mesocycle: Mesocycle): Promise<Rotation> {
  const split = buildWeeklySplit(profile.daysPerWeek)
  const completedCount = await db.plans
    .filter((p) => p.status === 'completed' && p.date >= mesocycle.startDate)
    .count()
  const rotationIndex = completedCount % split.length
  const week = Math.min(mesocycle.lengthWeeks, Math.floor(completedCount / split.length) + 1)
  return { split, rotationIndex, dayType: split[rotationIndex], week }
}

export interface RestRecommendation {
  shouldRest: boolean
  reason: string | null
}

export async function checkRestRecommendation(profile: Profile): Promise<RestRecommendation> {
  const recentLogs = await db.logs.orderBy('date').reverse().limit(10).toArray()
  const maxStreak = maxConsecutiveTrainingDays(profile.daysPerWeek)
  let streak = 0
  const today = isoDate()
  const completedDates = new Set(recentLogs.filter((l) => l.status === 'completed').map((l) => l.date))
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = isoDate(d)
    if (ds === today) continue
    if (completedDates.has(ds)) streak++
    else break
  }
  if (streak >= maxStreak) {
    return { shouldRest: true, reason: `${streak} consecutive training days logged — recovery is due before the next session.` }
  }
  return { shouldRest: false, reason: null }
}

/** Returns the pending plan if one exists (missed-day reshuffle keeps showing the same
 * plan until it's completed or explicitly skipped), otherwise generates a fresh one. */
export async function getOrCreateTodaysPlan(profile: Profile, checkIn: CheckIn | null): Promise<WorkoutPlan> {
  const pending = await db.plans.filter((p) => p.status === 'planned' || p.status === 'in-progress').first()
  if (pending) {
    if (checkIn && !pending.checkIn) {
      const updated = { ...pending, checkIn }
      await db.plans.put(updated)
      return updated
    }
    return pending
  }

  let mesocycle = await getActiveMesocycle(profile)
  let rotation = await computeRotation(profile, mesocycle)
  if (rotation.week >= mesocycle.lengthWeeks && rotation.rotationIndex === rotation.split.length - 1) {
    const completedInCycle = await db.plans
      .filter((p) => p.status === 'completed' && p.date >= mesocycle.startDate)
      .count()
    if (completedInCycle >= mesocycle.lengthWeeks * rotation.split.length) {
      const previous = mesocycle
      mesocycle = advanceMesocycle(mesocycle)
      await db.mesocycles.put({ ...previous, active: false })
      await db.mesocycles.put(mesocycle)
      rotation = await computeRotation(profile, mesocycle)
    }
  }
  const phase = phaseForWeek(mesocycle, rotation.week)

  const states = await db.progression.toArray()
  const stateMap = new Map(states.map((s) => [s.exerciseId, s]))
  const repScheme = getRepScheme(profile.goal, phase)
  const autoRegulation = computeRpeTrendAdjustment(states, repScheme.rpe)

  const { plan, newProgressionStates } = generateDailyPlan({
    profile,
    dayType: rotation.dayType,
    mesocycle,
    phase,
    checkIn,
    progressionStates: stateMap,
    autoRegulation,
  })

  await db.plans.put(plan)
  const toSave: ProgressionState[] = []
  newProgressionStates.forEach((state, exerciseId) => {
    if (!stateMap.has(exerciseId)) toSave.push(state)
  })
  if (toSave.length) await db.progression.bulkPut(toSave)

  if (rotation.week !== mesocycle.currentWeek) {
    await db.mesocycles.put({ ...mesocycle, currentWeek: rotation.week })
  }

  return plan
}

export async function skipPlan(plan: WorkoutPlan): Promise<void> {
  await db.plans.put({ ...plan, status: 'skipped' })
}

/** Scaffolds a draft WorkoutLog from a plan's blocks and marks the plan in-progress. Persisted
 * immediately so an interrupted session (tab closed mid-set) survives a reload. */
export async function startWorkoutDraft(plan: WorkoutPlan): Promise<WorkoutLog> {
  const draft: WorkoutLog = {
    id: uid(),
    planId: plan.id,
    date: isoDate(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: 'in-progress',
    checkIn: plan.checkIn,
    entries: plan.blocks.map((b) => ({
      id: uid(),
      planBlockId: b.id,
      exerciseId: b.exerciseId,
      sets: Array.from({ length: b.targetSets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: b.targetWeightKg ?? 0,
        reps: 0,
        rpe: null,
        isWarmup: false,
        completed: false,
        timestamp: new Date().toISOString(),
      })),
      skipped: false,
    })),
  }
  await db.logs.put(draft)
  await db.plans.put({ ...plan, status: 'in-progress' })
  return draft
}

export async function saveDraftLog(log: WorkoutLog): Promise<void> {
  await db.logs.put(log)
}

export interface FinalizeResult {
  log: WorkoutLog
  prs: PrRecord[]
  stalledLifts: { exerciseId: string; name: string }[]
}

export async function finalizeWorkout(
  plan: WorkoutPlan,
  entries: LoggedExercise[],
  checkIn: CheckIn | null,
  draftLogId?: string,
): Promise<FinalizeResult> {
  const now = new Date().toISOString()
  const date = isoDate()
  const log: WorkoutLog = {
    id: draftLogId ?? uid(),
    planId: plan.id,
    date,
    startedAt: plan.createdAt,
    completedAt: now,
    status: 'completed',
    checkIn,
    entries,
  }

  const prs: PrRecord[] = []
  const stalledLifts: { exerciseId: string; name: string }[] = []

  for (const entry of entries) {
    if (entry.skipped || entry.sets.length === 0) continue
    const exercise = getExercise(entry.exerciseId)
    if (!exercise) continue

    const state = await db.progression.get(entry.exerciseId)
    if (state) {
      const outcome = applyPerformance(state, exercise, entry.sets, date)
      let nextState = outcome.next
      if (outcome.stalledOut) {
        nextState = deloadAfterStall(outcome.next)
        stalledLifts.push({ exerciseId: exercise.id, name: exercise.name })
      }
      await db.progression.put(nextState)
    }

    const bestSet = entry.sets
      .filter((s) => s.completed && !s.isWarmup)
      .sort((a, b) => estimate1rm(b.weightKg, b.reps, b.rpe) - estimate1rm(a.weightKg, a.reps, a.rpe))[0]

    if (bestSet) {
      const e1rm = estimate1rm(bestSet.weightKg, bestSet.reps, bestSet.rpe)
      const priorPrs = await db.prs.where('exerciseId').equals(entry.exerciseId).toArray()
      const priorBestE1rm = priorPrs.filter((p) => p.type === 'e1rm').reduce((max, p) => Math.max(max, p.value), 0)
      if (e1rm > priorBestE1rm && e1rm > 0) {
        const pr: PrRecord = { id: uid(), exerciseId: entry.exerciseId, date, type: 'e1rm', value: e1rm, previousValue: priorBestE1rm || null }
        prs.push(pr)
        await db.prs.put(pr)
      }

      const priorBestWeight = priorPrs.filter((p) => p.type === 'weight').reduce((max, p) => Math.max(max, p.value), 0)
      if (bestSet.weightKg > priorBestWeight) {
        const pr: PrRecord = { id: uid(), exerciseId: entry.exerciseId, date, type: 'weight', value: bestSet.weightKg, previousValue: priorBestWeight || null }
        prs.push(pr)
        await db.prs.put(pr)
      }

      const vol = totalVolume(entry.sets)
      const priorBestVolume = priorPrs.filter((p) => p.type === 'volume').reduce((max, p) => Math.max(max, p.value), 0)
      if (vol > priorBestVolume) {
        const pr: PrRecord = { id: uid(), exerciseId: entry.exerciseId, date, type: 'volume', value: vol, previousValue: priorBestVolume || null }
        prs.push(pr)
        await db.prs.put(pr)
      }
    }
  }

  await db.logs.put(log)
  await db.plans.put({ ...plan, status: 'completed', checkIn })

  return { log, prs, stalledLifts }
}

export async function computeAdherenceStreak(): Promise<number> {
  const logs = await db.logs.orderBy('date').reverse().toArray()
  const completedDates = Array.from(new Set(logs.filter((l) => l.status === 'completed').map((l) => l.date))).sort(
    (a, b) => (a < b ? 1 : -1),
  )
  if (completedDates.length === 0) return 0
  let streak = 1
  for (let i = 1; i < completedDates.length; i++) {
    const gap = Math.abs(daysBetween(completedDates[i], completedDates[i - 1]))
    if (gap <= 3) streak++
    else break
  }
  return streak
}
