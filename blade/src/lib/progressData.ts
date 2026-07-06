import type { MuscleGroup, ProgressionState, WorkoutLog } from '../types'
import { getExercise } from '../data/exercises'
import { estimate1rm, totalVolume, isoDate } from './calculations'

export function buildE1rmSeries(state: ProgressionState) {
  return state.history.map((h) => ({
    date: h.date,
    e1rm: Math.round(estimate1rm(h.weightKg, h.topSetReps, h.avgRpe) * 10) / 10,
  }))
}

function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
  return `W${week}`
}

export function buildMuscleVolumeSeries(logs: WorkoutLog[]): { data: Record<string, number | string>[]; muscles: MuscleGroup[] } {
  const byWeek = new Map<string, Record<string, number>>()
  const muscleTotals = new Map<MuscleGroup, number>()

  for (const log of logs) {
    if (log.status !== 'completed') continue
    const week = isoWeekLabel(log.date)
    const bucket = byWeek.get(week) ?? {}
    for (const entry of log.entries) {
      if (entry.skipped) continue
      const exercise = getExercise(entry.exerciseId)
      if (!exercise) continue
      const vol = totalVolume(entry.sets)
      if (vol <= 0) continue
      for (const muscle of exercise.primaryMuscles) {
        bucket[muscle] = (bucket[muscle] ?? 0) + vol
        muscleTotals.set(muscle, (muscleTotals.get(muscle) ?? 0) + vol)
      }
    }
    byWeek.set(week, bucket)
  }

  const topMuscles = Array.from(muscleTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m]) => m)

  const weeks = Array.from(byWeek.keys())
  const data = weeks.map((week) => {
    const bucket = byWeek.get(week)!
    const row: Record<string, number | string> = { week }
    for (const m of topMuscles) row[m] = Math.round(bucket[m] ?? 0)
    return row
  })

  return { data, muscles: topMuscles }
}

export function buildAdherenceCalendar(logs: WorkoutLog[], days = 28): { date: string; trained: boolean }[] {
  const completedDates = new Set(logs.filter((l) => l.status === 'completed').map((l) => l.date))
  const out: { date: string; trained: boolean }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = isoDate(d)
    out.push({ date: ds, trained: completedDates.has(ds) })
  }
  return out
}
