import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { getExercise } from '../data/exercises'
import { totalVolume, formatWeight } from '../lib/calculations'
import { Panel } from '../components/ui/Panel'
import { SectionHeading } from '../components/ui/SectionHeading'
import { GlitchText } from '../components/ui/GlitchText'

export function History() {
  const profile = useProfile()
  const logs = useLiveQuery(() => db.logs.orderBy('date').reverse().toArray(), [])

  if (!profile || !logs) return null

  const completed = logs.filter((l) => l.status === 'completed')

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
      <header className="mb-6">
        <GlitchText className="font-display text-xl text-cyan text-glow-cyan tracking-[0.15em]">MISSION LOG</GlitchText>
        <div className="text-ink-dimmer text-[11px] font-display tracking-widest mt-1">{completed.length} SESSIONS RECORDED</div>
      </header>

      {completed.length === 0 && (
        <Panel className="p-6 text-center">
          <p className="text-ink-dim text-sm">No completed sessions yet. Initiate your first workout from the dashboard.</p>
        </Panel>
      )}

      <div className="space-y-4">
        {completed.map((log) => {
          const activeEntries = log.entries.filter((e) => !e.skipped && e.sets.some((s) => s.completed))
          const sessionVolume = activeEntries.reduce((sum, e) => sum + totalVolume(e.sets), 0)
          return (
            <Panel key={log.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-display text-sm text-ink tracking-wide">{log.date}</div>
                <div className="text-acid text-xs font-display">{Math.round(sessionVolume)}{profile.unit} vol</div>
              </div>
              <div className="space-y-1.5">
                {activeEntries.map((e) => {
                  const ex = getExercise(e.exerciseId)
                  const workingSets = e.sets.filter((s) => s.completed && !s.isWarmup)
                  return (
                    <div key={e.id} className="text-xs text-ink-dim flex justify-between border-b border-ink-dimmer/10 pb-1 last:border-0">
                      <span>{ex?.name ?? e.exerciseId}</span>
                      <span className="font-display text-ink-dimmer">
                        {workingSets.map((s) => `${s.reps}@${formatWeight(s.weightKg, profile.unit)}`).join(', ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Panel>
          )
        })}
      </div>

      <div className="mt-8">
        <SectionHeading className="mb-3">Export Everything</SectionHeading>
        <p className="text-ink-dimmer text-xs">Full JSON backup & restore available in Settings.</p>
      </div>
    </div>
  )
}
