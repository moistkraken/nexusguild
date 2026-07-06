export function estimate1rm(weightKg: number, reps: number, rpe?: number | null): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  // Epley formula, RPE-adjusted reps-in-reserve when available
  const rir = rpe != null ? Math.max(0, 10 - rpe) : 0
  const effectiveReps = reps + rir
  return weightKg * (1 + effectiveReps / 30)
}

export function roundToIncrement(weightKg: number, incrementKg = 1.25): number {
  return Math.round(weightKg / incrementKg) * incrementKg
}

export function kgToLb(kg: number): number {
  return kg * 2.20462
}

export function lbToKg(lb: number): number {
  return lb / 2.20462
}

export function formatWeight(weightKg: number, unit: 'kg' | 'lb'): string {
  const val = unit === 'kg' ? weightKg : kgToLb(weightKg)
  return `${Math.round(val * 10) / 10}${unit}`
}

export function totalVolume(sets: { weightKg: number; reps: number; isWarmup: boolean }[]): number {
  return sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0)
}

export function averageRpe(sets: { rpe: number | null; isWarmup: boolean }[]): number | null {
  const working = sets.filter((s) => !s.isWarmup && s.rpe != null)
  if (working.length === 0) return null
  return working.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / working.length
}

export function isoDate(d: Date = new Date()): string {
  const yr = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${yr}-${mo}-${da}`
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a)
  const db = new Date(b)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
