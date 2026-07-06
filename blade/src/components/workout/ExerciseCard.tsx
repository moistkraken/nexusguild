import clsx from 'clsx'
import type { Exercise, LoggedExercise, PlanExerciseBlock, SetLog } from '../../types'
import { Panel } from '../ui/Panel'
import { NeonButton } from '../ui/NeonButton'
import { SetRow } from './SetRow'
import { formatWeight } from '../../lib/calculations'

interface Props {
  block: PlanExerciseBlock
  exercise: Exercise
  entry: LoggedExercise
  unit: 'kg' | 'lb'
  swappedTo?: Exercise
  onChangeEntry: (entry: LoggedExercise) => void
  onSetCompleted: (restSec: number) => void
  onOpenSwap: () => void
}

export function ExerciseCard({ block, exercise, entry, unit, swappedTo, onChangeEntry, onSetCompleted, onOpenSwap }: Props) {
  const activeExercise = swappedTo ?? exercise

  function updateSet(index: number, set: SetLog) {
    const wasIncomplete = !entry.sets[index].completed
    const sets = entry.sets.map((s, i) => (i === index ? set : s))
    onChangeEntry({ ...entry, sets })
    if (wasIncomplete && set.completed) onSetCompleted(block.restSec)
  }

  function removeSet(index: number) {
    onChangeEntry({ ...entry, sets: entry.sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNumber: i + 1 })) })
  }

  function addSet() {
    const last = entry.sets[entry.sets.length - 1]
    const newSet: SetLog = {
      setNumber: entry.sets.length + 1,
      weightKg: last?.weightKg ?? block.targetWeightKg ?? 0,
      reps: 0,
      rpe: null,
      isWarmup: false,
      completed: false,
      timestamp: new Date().toISOString(),
    }
    onChangeEntry({ ...entry, sets: [...entry.sets, newSet] })
  }

  function toggleSkip() {
    onChangeEntry({ ...entry, skipped: !entry.skipped })
  }

  return (
    <Panel className={clsx('p-4', entry.skipped && 'opacity-40')} accent={entry.skipped ? 'none' : 'cyan'}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-ink font-display text-sm tracking-wide">{activeExercise.name}</div>
          {swappedTo && <div className="text-ink-dimmer text-[10px]">swapped from {exercise.name}</div>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onOpenSwap} className="text-[10px] font-display tracking-widest text-magenta border border-magenta/40 px-2 py-1">
            SWAP
          </button>
          <button
            onClick={toggleSkip}
            className="text-[10px] font-display tracking-widest text-ink-dimmer border border-ink-dimmer/40 px-2 py-1"
          >
            {entry.skipped ? 'UNDO' : 'SKIP'}
          </button>
        </div>
      </div>
      <div className="text-ink-dimmer text-xs font-display tracking-wide mb-3">
        Target: {block.targetSets} × {block.targetRepMin}-{block.targetRepMax}
        {block.targetWeightKg != null && ` @ ${formatWeight(block.targetWeightKg, unit)}`}
        {block.targetRpe != null && ` · RPE ${block.targetRpe}`} · Rest {block.restSec}s
      </div>

      {!entry.skipped && (
        <>
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem_1.75rem] gap-2 text-[10px] font-display tracking-widest text-ink-dimmer mb-1">
            <div className="text-center">#</div>
            <div className="text-center">{unit}</div>
            <div className="text-center">reps</div>
            <div className="text-center">rpe</div>
            <div className="text-center">done</div>
            <div />
          </div>
          {entry.sets.map((set, i) => (
            <SetRow key={i} set={set} unit={unit} onChange={(s) => updateSet(i, s)} onRemove={() => removeSet(i)} />
          ))}
          <NeonButton variant="ghost" size="sm" className="mt-2" onClick={addSet}>
            + Add Set
          </NeonButton>
        </>
      )}
    </Panel>
  )
}
