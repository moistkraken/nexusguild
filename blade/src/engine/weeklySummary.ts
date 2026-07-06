import type { PrRecord, Profile, WorkoutLog } from '../types'
import { averageRpe, daysBetween, isoDate, totalVolume } from '../lib/calculations'

export interface WeeklySummary {
  sessionsCompleted: number
  sessionsTarget: number
  totalVolume: number
  avgRpe: number | null
  prCount: number
}

export function buildWeeklySummary(logs: WorkoutLog[], prs: PrRecord[], profile: Profile): WeeklySummary {
  const today = isoDate()
  const recent = logs.filter((l) => l.status === 'completed' && daysBetween(l.date, today) <= 6)
  const recentPrs = prs.filter((p) => daysBetween(p.date, today) <= 6)

  const allSets = recent.flatMap((l) => l.entries.flatMap((e) => e.sets))
  const vol = recent.reduce((sum, l) => sum + l.entries.reduce((s, e) => s + totalVolume(e.sets), 0), 0)

  return {
    sessionsCompleted: recent.length,
    sessionsTarget: profile.daysPerWeek,
    totalVolume: Math.round(vol),
    avgRpe: averageRpe(allSets),
    prCount: recentPrs.length,
  }
}
