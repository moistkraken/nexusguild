import { db } from '../db/db'

export interface BladeExport {
  version: 1
  exportedAt: string
  profile: unknown[]
  plans: unknown[]
  logs: unknown[]
  progression: unknown[]
  mesocycles: unknown[]
  bodyweight: unknown[]
  prs: unknown[]
  settings: unknown[]
}

export async function exportAllData(): Promise<BladeExport> {
  const [profile, plans, logs, progression, mesocycles, bodyweight, prs, settings] = await Promise.all([
    db.profile.toArray(),
    db.plans.toArray(),
    db.logs.toArray(),
    db.progression.toArray(),
    db.mesocycles.toArray(),
    db.bodyweight.toArray(),
    db.prs.toArray(),
    db.settings.toArray(),
  ])
  return { version: 1, exportedAt: new Date().toISOString(), profile, plans, logs, progression, mesocycles, bodyweight, prs, settings }
}

export function downloadExport(data: BladeExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `blade-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importAllData(data: BladeExport): Promise<void> {
  await db.transaction(
    'rw',
    [db.profile, db.plans, db.logs, db.progression, db.mesocycles, db.bodyweight, db.prs, db.settings],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.plans.clear(),
        db.logs.clear(),
        db.progression.clear(),
        db.mesocycles.clear(),
        db.bodyweight.clear(),
        db.prs.clear(),
        db.settings.clear(),
      ])
      await Promise.all([
        db.profile.bulkAdd(data.profile as never[]),
        db.plans.bulkAdd(data.plans as never[]),
        db.logs.bulkAdd(data.logs as never[]),
        db.progression.bulkAdd(data.progression as never[]),
        db.mesocycles.bulkAdd(data.mesocycles as never[]),
        db.bodyweight.bulkAdd(data.bodyweight as never[]),
        db.prs.bulkAdd(data.prs as never[]),
        db.settings.bulkAdd(data.settings as never[]),
      ])
    },
  )
}
