import clsx from 'clsx'
import type { SetLog } from '../../types'

interface Props {
  set: SetLog
  unit: 'kg' | 'lb'
  onChange: (set: SetLog) => void
  onRemove: () => void
}

function displayWeight(kg: number, unit: 'kg' | 'lb') {
  if (unit === 'kg') return kg
  return Math.round(kg * 2.20462 * 10) / 10
}

function toKg(val: number, unit: 'kg' | 'lb') {
  return unit === 'kg' ? val : val / 2.20462
}

export function SetRow({ set, unit, onChange, onRemove }: Props) {
  return (
    <div
      className={clsx(
        'grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem_1.75rem] gap-2 items-center py-1.5 transition-colors min-w-0',
        set.completed && 'opacity-90',
      )}
    >
      <div className="font-display text-xs text-ink-dimmer text-center">{set.setNumber}</div>
      <input
        type="number"
        inputMode="decimal"
        value={displayWeight(set.weightKg, unit)}
        onChange={(e) => onChange({ ...set, weightKg: toKg(Number(e.target.value) || 0, unit) })}
        className="w-full min-w-0 bg-surface-2 border border-ink-dimmer/40 text-ink text-center py-1.5 text-sm focus:border-cyan outline-none"
        placeholder={unit}
      />
      <input
        type="number"
        inputMode="numeric"
        value={set.reps || ''}
        onChange={(e) => onChange({ ...set, reps: Number(e.target.value) || 0 })}
        className="w-full min-w-0 bg-surface-2 border border-ink-dimmer/40 text-ink text-center py-1.5 text-sm focus:border-cyan outline-none"
        placeholder="reps"
      />
      <input
        type="number"
        inputMode="decimal"
        min={1}
        max={10}
        value={set.rpe ?? ''}
        onChange={(e) => onChange({ ...set, rpe: e.target.value === '' ? null : Number(e.target.value) })}
        className="w-full min-w-0 bg-surface-2 border border-ink-dimmer/40 text-ink text-center py-1.5 text-sm focus:border-cyan outline-none"
        placeholder="RPE"
      />
      <button
        type="button"
        onClick={() => onChange({ ...set, completed: !set.completed })}
        className={clsx(
          'font-display text-xs h-8 border transition-all',
          set.completed
            ? 'bg-acid/20 border-acid text-acid shadow-[0_0_10px_rgba(186,255,41,0.4)]'
            : 'border-ink-dimmer/40 text-ink-dimmer',
        )}
      >
        {set.completed ? '✓' : ''}
      </button>
      <button type="button" onClick={onRemove} className="text-ink-dimmer hover:text-danger text-sm">
        ×
      </button>
    </div>
  )
}
