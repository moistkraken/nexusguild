import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { useRestTimer } from '../hooks/useRestTimer'
import type { LoggedExercise, PrRecord, WorkoutLog } from '../types'
import { getExercise } from '../data/exercises'
import { findSubstitutes } from '../engine/substitution'
import { finalizeWorkout, saveDraftLog, startWorkoutDraft } from '../engine/trainer'
import { Panel } from '../components/ui/Panel'
import { NeonButton } from '../components/ui/NeonButton'
import { LiveDot } from '../components/ui/LiveDot'
import { ExerciseCard } from '../components/workout/ExerciseCard'
import { RestTimerBar } from '../components/workout/RestTimerBar'
import { SubstitutionModal } from '../components/workout/SubstitutionModal'
import { PrCelebration } from '../components/workout/PrCelebration'
import { GlitchText } from '../components/ui/GlitchText'

export function WorkoutSession() {
  const navigate = useNavigate()
  const profile = useProfile()
  const plan = useLiveQuery(() => db.plans.filter((p) => p.status === 'planned' || p.status === 'in-progress').first(), [])

  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [swapBlockId, setSwapBlockId] = useState<string | null>(null)
  const [swaps, setSwaps] = useState<Record<string, string>>({})
  const [prs, setPrs] = useState<PrRecord[] | null>(null)
  const [stalled, setStalled] = useState<{ exerciseId: string; name: string }[]>([])
  const [finishing, setFinishing] = useState(false)
  const timer = useRestTimer()
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  useEffect(() => {
    if (!plan || log) return
    ;(async () => {
      if (plan.status === 'in-progress') {
        const existing = await db.logs.where('planId').equals(plan.id).and((l) => l.status === 'in-progress').first()
        if (existing) {
          setLog(existing)
          return
        }
      }
      const draft = await startWorkoutDraft(plan)
      setLog(draft)
    })()
  }, [plan, log])

  const totalSets = useMemo(() => log?.entries.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0) ?? 0, [log])

  if ((!profile || !plan || !log) && !prs) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="font-display text-cyan text-xs tracking-widest animate-pulse-glow">LOADING SESSION...</span>
      </div>
    )
  }

  // Finishing the workout flips the plan to "completed", which clears the pending-plan query
  // this page depends on — keep the celebration overlay alive on its own until it dismisses.
  if (!profile || !plan || !log) {
    return <PrCelebration prs={prs!} onDone={() => navigate('/')} />
  }

  function updateEntry(next: LoggedExercise) {
    if (!log) return
    const entries = log.entries.map((e) => (e.id === next.id ? next : e))
    const updated = { ...log, entries }
    setLog(updated)
    saveDraftLog(updated)
  }

  function handleSwapSelect(blockId: string, exerciseId: string) {
    setSwaps((s) => ({ ...s, [blockId]: exerciseId }))
    const entry = log!.entries.find((e) => e.planBlockId === blockId)
    if (entry) updateEntry({ ...entry, exerciseId, swappedFromExerciseId: entry.swappedFromExerciseId ?? entry.exerciseId })
    setSwapBlockId(null)
  }

  async function handleFinish() {
    if (!log || !plan) return
    setFinishing(true)
    const result = await finalizeWorkout(plan, log.entries, plan.checkIn, log.id)
    setFinishing(false)
    setStalled(result.stalledLifts)
    if (result.prs.length > 0) {
      setPrs(result.prs)
    } else {
      navigate('/')
    }
  }

  const mm = Math.floor(elapsed / 60)
  const ss = elapsed % 60

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-40">
      <header className="flex items-center justify-between mb-5">
        <div>
          <GlitchText className="font-display text-lg text-cyan text-glow-cyan tracking-widest">{plan.dayLabel}</GlitchText>
          <div className="text-ink-dimmer text-[11px] font-display tracking-widest">
            {totalSets} SETS LOGGED · {mm}:{String(ss).padStart(2, '0')}
          </div>
        </div>
        <LiveDot label="IN SESSION" color="magenta" />
      </header>

      <div className="space-y-4">
        {plan.blocks.map((block) => {
          const entry = log.entries.find((e) => e.planBlockId === block.id)
          const exercise = getExercise(block.exerciseId)
          if (!entry || !exercise) return null
          const swappedToId = swaps[block.id]
          const swappedTo = swappedToId ? getExercise(swappedToId) : undefined
          return (
            <ExerciseCard
              key={block.id}
              block={block}
              exercise={exercise}
              entry={entry}
              unit={profile.unit}
              swappedTo={swappedTo}
              onChangeEntry={updateEntry}
              onSetCompleted={(restSec) => timer.start(restSec)}
              onOpenSwap={() => setSwapBlockId(block.id)}
            />
          )
        })}
      </div>

      {stalled.length > 0 && (
        <Panel accent="acid" className="p-4 mt-4">
          <div className="font-display text-acid text-xs tracking-widest mb-1">AUTO-DELOAD TRIGGERED</div>
          <p className="text-ink-dim text-sm">
            {stalled.map((s) => s.name).join(', ')} stalled 3 sessions in a row — load dropped ~15% to rebuild clean reps.
          </p>
        </Panel>
      )}

      <NeonButton variant="acid" size="lg" fullWidth className="mt-6" onClick={handleFinish} disabled={finishing}>
        {finishing ? 'Compiling Session...' : '■ Finish Workout'}
      </NeonButton>

      <RestTimerBar remaining={timer.remaining} running={timer.running} onAdd={timer.addTime} onSkip={timer.stop} />

      {swapBlockId && (
        <SubstitutionModal
          candidates={findSubstitutes(
            log.entries.find((e) => e.planBlockId === swapBlockId)?.exerciseId ?? '',
            profile.equipment,
          )}
          onSelect={(ex) => handleSwapSelect(swapBlockId, ex.id)}
          onClose={() => setSwapBlockId(null)}
        />
      )}

      {prs && <PrCelebration prs={prs} onDone={() => navigate('/')} />}
    </div>
  )
}
