export type Sex = 'male' | 'female' | 'other'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type Goal =
  | 'strength'
  | 'hypertrophy'
  | 'fat-loss'
  | 'endurance'
  | 'general-fitness'

export type Equipment =
  | 'barbell'
  | 'dumbbells'
  | 'machines'
  | 'bodyweight'
  | 'bands'
  | 'kettlebell'
  | 'cable'
  | 'pull-up-bar'
  | 'bench'

export type Unit = 'kg' | 'lb'

export interface Profile {
  id: 'profile'
  name: string
  age: number
  sex: Sex
  bodyweightKg: number
  heightCm: number
  experience: ExperienceLevel
  equipment: Equipment[]
  daysPerWeek: number
  sessionLengthMin: number
  injuries: string[]
  goal: Goal
  unit: Unit
  onboarded: boolean
  createdAt: string
  updatedAt: string
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'traps'
  | 'forearms'

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal-push'
  | 'horizontal-pull'
  | 'vertical-push'
  | 'vertical-pull'
  | 'lunge'
  | 'carry'
  | 'core'
  | 'isolation'

export interface Exercise {
  id: string
  name: string
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment[]
  pattern: MovementPattern
  isCompound: boolean
  unilateral?: boolean
  substitutes: string[]
  minExperience: ExperienceLevel
  cueNote?: string
}

export type SplitDayType =
  | 'full-body'
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'rest'

export interface PlanExerciseBlock {
  id: string
  exerciseId: string
  order: number
  isWarmup: boolean
  isMobility: boolean
  targetSets: number
  targetRepMin: number
  targetRepMax: number
  targetWeightKg: number | null
  targetRpe: number | null
  restSec: number
  notes?: string
  supersetGroup?: string
}

export type MesoPhase = 'accumulation' | 'intensification' | 'deload'

export type PlanStatus = 'planned' | 'in-progress' | 'completed' | 'skipped'

export interface CheckIn {
  energy: number
  soreness: number
  sleep: number
}

export interface WorkoutPlan {
  id: string
  date: string
  dayType: SplitDayType
  dayLabel: string
  mesocycleId: string
  mesoWeek: number
  phase: MesoPhase
  status: PlanStatus
  checkIn: CheckIn | null
  volumeMultiplier: number
  intensityMultiplier: number
  blocks: PlanExerciseBlock[]
  rationale: string
  createdAt: string
}

export interface SetLog {
  setNumber: number
  weightKg: number
  reps: number
  rpe: number | null
  isWarmup: boolean
  completed: boolean
  timestamp: string
}

export interface LoggedExercise {
  id: string
  planBlockId: string
  exerciseId: string
  swappedFromExerciseId?: string
  sets: SetLog[]
  skipped: boolean
}

export interface WorkoutLog {
  id: string
  planId: string
  date: string
  startedAt: string | null
  completedAt: string | null
  status: PlanStatus
  checkIn: CheckIn | null
  entries: LoggedExercise[]
  notes?: string
}

export interface ProgressionState {
  exerciseId: string
  currentWeightKg: number
  currentRepMin: number
  currentRepMax: number
  consecutiveStalls: number
  lastSessionDate: string | null
  lastSessionHitTop: boolean | null
  history: { date: string; weightKg: number; topSetReps: number; avgRpe: number | null }[]
}

export interface Mesocycle {
  id: string
  goal: Goal
  startDate: string
  lengthWeeks: number
  accumulationWeeks: number
  intensificationWeeks: number
  deloadWeeks: number
  currentWeek: number
  active: boolean
}

export interface BodyweightLog {
  id: string
  date: string
  weightKg: number
}

export type PrType = 'e1rm' | 'weight' | 'reps' | 'volume'

export interface PrRecord {
  id: string
  exerciseId: string
  date: string
  type: PrType
  value: number
  previousValue: number | null
}

export interface AppSettings {
  id: 'settings'
  anthropicApiKey: string | null
  lastMissedDayHandledDate: string | null
}
