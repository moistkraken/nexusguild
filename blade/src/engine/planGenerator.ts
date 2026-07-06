import type {
  CheckIn,
  Exercise,
  ExperienceLevel,
  Mesocycle,
  MesoPhase,
  PlanExerciseBlock,
  Profile,
  ProgressionState,
  SplitDayType,
  WorkoutPlan,
} from '../types'
import { EXERCISES, getExercise } from '../data/exercises'
import { DAY_TYPE_LABELS, DAY_TYPE_PATTERNS } from './splitBuilder'
import { getRepScheme } from './templates'
import { BEGINNER_LOAD_MULTIPLIER, EXPERIENCE_LOAD_SCALE } from './templates'
import { readinessFromCheckIn } from './checkIn'
import type { RpeTrendAdjustment } from './autoRegulation'
import { PHASE_DESCRIPTION } from './periodization'
import { initProgressionState, isLoadable } from './progression'
import { roundToIncrement, uid, isoDate } from '../lib/calculations'

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 }

const ISOLATION_TARGETS: Record<SplitDayType, Array<Exercise['primaryMuscles'][number]>> = {
  push: ['triceps', 'shoulders'],
  pull: ['biceps', 'traps'],
  legs: ['calves', 'hamstrings'],
  upper: ['biceps', 'triceps', 'shoulders'],
  lower: ['calves', 'core'],
  'full-body': ['core'],
  rest: [],
}

const INJURY_EXCLUSIONS: Record<string, string[]> = {
  knee: ['barbell-back-squat', 'front-squat', 'walking-lunge', 'bulgarian-split-squat', 'barbell-lunge', 'jump-squat', 'leg-extension', 'step-up'],
  shoulder: ['overhead-press', 'incline-barbell-press', 'dip', 'pike-pushup'],
  back: ['barbell-deadlift', 'good-morning', 'barbell-row', 'barbell-back-squat', 'front-squat'],
  spine: ['barbell-deadlift', 'good-morning', 'barbell-row', 'barbell-back-squat', 'front-squat'],
  wrist: ['pushup', 'ab-wheel', 'front-squat'],
  elbow: ['dip', 'close-grip-bench', 'dumbbell-skullcrusher'],
}

function injuryExcludedIds(injuries: string[]): Set<string> {
  const out = new Set<string>()
  const lower = injuries.map((i) => i.toLowerCase())
  for (const [keyword, ids] of Object.entries(INJURY_EXCLUSIONS)) {
    if (lower.some((i) => i.includes(keyword))) ids.forEach((id) => out.add(id))
  }
  return out
}

function exerciseCountForSession(minutes: number): number {
  return Math.max(3, Math.min(8, Math.round(minutes / 12)))
}

function seedFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function pickExercise(candidates: Exercise[], seed: number, usedIds: Set<string>): Exercise | null {
  const pool = candidates.filter((c) => !usedIds.has(c.id))
  if (pool.length === 0) return null
  const compounds = pool.filter((c) => c.isCompound)
  const finalPool = compounds.length > 0 ? compounds : pool
  return finalPool[seed % finalPool.length]
}

function startingWeightKg(exercise: Exercise, profile: Profile): number {
  const base = BEGINNER_LOAD_MULTIPLIER[exercise.pattern] ?? 0.2
  const scale = EXPERIENCE_LOAD_SCALE[profile.experience] ?? 1
  return roundToIncrement(Math.max(0, profile.bodyweightKg * base * scale))
}

const WARMUP_TEXT: Record<SplitDayType, string[]> = {
  'full-body': ['5 min easy cardio (bike/row/jog)', '10x bodyweight squat', '10x arm circles + band pull-apart'],
  upper: ['5 min easy cardio', '10x band pull-apart', '8x scapular push-up', 'arm circles + light shoulder dislocates'],
  lower: ['5 min easy cardio', '10x bodyweight squat', '10x walking lunge (bodyweight)', 'hip circles + leg swings'],
  push: ['5 min easy cardio', '10x scapular push-up', 'band pull-apart x15', '2 light ramp-up sets before first press'],
  pull: ['5 min easy cardio', 'band pull-apart x15', 'dead hang 20s', 'light lat activation row x15'],
  legs: ['5 min easy cardio', '10x bodyweight squat', 'walking lunge x10/side', 'hip circles + ankle mobility'],
  rest: [],
}

const MOBILITY_TEXT: Record<SplitDayType, string[]> = {
  'full-body': ['Couch stretch 60s/side', "World's greatest stretch x5/side"],
  upper: ['Doorway pec stretch 45s/side', 'Thoracic rotations x10/side'],
  lower: ['Couch stretch 60s/side', 'Pigeon stretch 45s/side', 'Calf wall stretch 45s/side'],
  push: ['Doorway pec stretch 45s/side', 'Overhead triceps stretch 30s/side'],
  pull: ['Lat stretch on bar 30s', 'Child\'s pose 45s'],
  legs: ['Pigeon stretch 45s/side', 'Standing quad stretch 30s/side', 'Calf wall stretch 45s/side'],
  rest: [],
}

export interface GeneratePlanParams {
  profile: Profile
  dayType: SplitDayType
  mesocycle: Mesocycle
  phase: MesoPhase
  checkIn: CheckIn | null
  progressionStates: Map<string, ProgressionState>
  recentExerciseIds?: string[]
  autoRegulation?: RpeTrendAdjustment
}

export interface GeneratePlanResult {
  plan: WorkoutPlan
  newProgressionStates: Map<string, ProgressionState>
}

export function generateDailyPlan(params: GeneratePlanParams): GeneratePlanResult {
  const { profile, dayType, mesocycle, phase, checkIn, progressionStates, recentExerciseIds = [], autoRegulation } = params
  const repScheme = getRepScheme(profile.goal, phase)
  const readiness = checkIn ? readinessFromCheckIn(checkIn) : null
  const volumeMultiplier = readiness?.volumeMultiplier ?? 1
  const intensityMultiplier = (readiness?.intensityMultiplier ?? 1) * (autoRegulation?.intensityMultiplier ?? 1)

  const excluded = injuryExcludedIds(profile.injuries)
  const patterns = DAY_TYPE_PATTERNS[dayType]
  const count = exerciseCountForSession(profile.sessionLengthMin)
  const isolationTargets = ISOLATION_TARGETS[dayType]

  const newStates = new Map(progressionStates)
  const usedIds = new Set<string>()
  const blocks: PlanExerciseBlock[] = []
  let isolationCursor = 0

  for (let i = 0; i < count; i++) {
    const pattern = patterns[i % patterns.length]
    let candidates = EXERCISES.filter(
      (e) =>
        e.pattern === pattern &&
        !excluded.has(e.id) &&
        EXPERIENCE_RANK[e.minExperience] <= EXPERIENCE_RANK[profile.experience] &&
        e.equipment.some((eq) => profile.equipment.includes(eq)),
    )

    if (pattern === 'isolation') {
      const target = isolationTargets[isolationCursor % Math.max(1, isolationTargets.length)]
      isolationCursor++
      const targeted = candidates.filter((e) => target && e.primaryMuscles.includes(target))
      if (targeted.length > 0) candidates = targeted
    }

    if (candidates.length === 0) continue

    const seed = seedFromString(`${profile.id}-${dayType}-${isoDate()}-${i}`) + recentExerciseIds.length
    const exercise = pickExercise(candidates, seed, usedIds)
    if (!exercise) continue
    usedIds.add(exercise.id)

    const isAccessory = !exercise.isCompound
    const sets = Math.max(1, Math.round((isAccessory ? repScheme.accessorySets : repScheme.compoundSets) * volumeMultiplier))

    let state = newStates.get(exercise.id)
    if (!state) {
      state = initProgressionState(exercise.id, startingWeightKg(exercise, profile), repScheme.repMin, repScheme.repMax)
      newStates.set(exercise.id, state)
    }

    const loadable = isLoadable(exercise)
    const targetWeightKg = loadable ? roundToIncrement(state.currentWeightKg * intensityMultiplier) : null
    const repMin = loadable ? repScheme.repMin : state.currentRepMin
    const repMax = loadable ? repScheme.repMax : state.currentRepMax

    blocks.push({
      id: uid(),
      exerciseId: exercise.id,
      order: blocks.length,
      isWarmup: false,
      isMobility: false,
      targetSets: sets,
      targetRepMin: repMin,
      targetRepMax: repMax,
      targetWeightKg,
      targetRpe: Math.round((repScheme.rpe + (readiness && readiness.tone === 'boost' ? 0.5 : 0)) * 10) / 10,
      restSec: repScheme.restSec,
    })
  }

  const rationale = buildRationale({
    profile,
    dayType,
    phase,
    mesocycle,
    readinessLabel: [readiness?.label, autoRegulation?.label].filter(Boolean).join(' '),
    blocks,
  })

  const plan: WorkoutPlan = {
    id: uid(),
    date: isoDate(),
    dayType,
    dayLabel: DAY_TYPE_LABELS[dayType],
    mesocycleId: mesocycle.id,
    mesoWeek: mesocycle.currentWeek,
    phase,
    status: 'planned',
    checkIn,
    volumeMultiplier,
    intensityMultiplier,
    blocks,
    rationale,
    createdAt: new Date().toISOString(),
  }

  return { plan, newProgressionStates: newStates }
}

function buildRationale(args: {
  profile: Profile
  dayType: SplitDayType
  phase: MesoPhase
  mesocycle: Mesocycle
  readinessLabel?: string
  blocks: PlanExerciseBlock[]
}): string {
  const { profile, dayType, phase, mesocycle, readinessLabel, blocks } = args
  const goalText: Record<Profile['goal'], string> = {
    strength: 'maximal strength',
    hypertrophy: 'muscle growth',
    'fat-loss': 'fat loss with muscle retention',
    endurance: 'muscular endurance',
    'general-fitness': 'general fitness',
  }
  const parts: string[] = []
  parts.push(
    `${DAY_TYPE_LABELS[dayType]} — week ${mesocycle.currentWeek}/${mesocycle.lengthWeeks} of the mesocycle, ${PHASE_DESCRIPTION[phase]}.`,
  )
  parts.push(`Built around ${goalText[profile.goal]} for a ${profile.experience} lifter training ${profile.daysPerWeek}x/week.`)
  if (readinessLabel) parts.push(readinessLabel + '.')
  const compoundCount = blocks.filter((b) => getExercise(b.exerciseId)?.isCompound).length
  parts.push(`${blocks.length} exercises (${compoundCount} compound) sized to fit your ${profile.sessionLengthMin}-minute session.`)
  return parts.join(' ')
}

export function getWarmup(dayType: SplitDayType): string[] {
  return WARMUP_TEXT[dayType] ?? []
}

export function getMobility(dayType: SplitDayType): string[] {
  return MOBILITY_TEXT[dayType] ?? []
}
