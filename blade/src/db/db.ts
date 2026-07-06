import Dexie, { type EntityTable } from 'dexie'
import type {
  Profile,
  WorkoutPlan,
  WorkoutLog,
  ProgressionState,
  Mesocycle,
  BodyweightLog,
  PrRecord,
  AppSettings,
} from '../types'

class BladeDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  plans!: EntityTable<WorkoutPlan, 'id'>
  logs!: EntityTable<WorkoutLog, 'id'>
  progression!: EntityTable<ProgressionState, 'exerciseId'>
  mesocycles!: EntityTable<Mesocycle, 'id'>
  bodyweight!: EntityTable<BodyweightLog, 'id'>
  prs!: EntityTable<PrRecord, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('blade-db')
    this.version(1).stores({
      profile: 'id',
      plans: 'id, date, status',
      logs: 'id, planId, date, status',
      progression: 'exerciseId',
      mesocycles: 'id, active',
      bodyweight: 'id, date',
      prs: 'id, exerciseId, date',
      settings: 'id',
    })
  }
}

export const db = new BladeDB()
