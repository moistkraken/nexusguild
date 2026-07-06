import { useEffect, useRef } from 'react'
import type { PrRecord } from '../../types'
import { getExercise } from '../../data/exercises'

const TYPE_LABEL: Record<PrRecord['type'], string> = {
  e1rm: 'EST. 1RM PR',
  weight: 'WEIGHT PR',
  reps: 'REP PR',
  volume: 'VOLUME PR',
}

export function PrCelebration({ prs, onDone }: { prs: PrRecord[]; onDone: () => void }) {
  // onDone is an inline callback that gets a new identity on every parent re-render (e.g. the
  // workout session's elapsed-time ticker). Route it through a ref so the dismiss timer is set
  // up exactly once on mount instead of being cancelled and restarted every render.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 2600)
    return () => clearTimeout(t)
  }, [])

  if (prs.length === 0) return null
  const first = prs[0]
  const exercise = getExercise(first.exerciseId)

  return (
    <div className="fixed inset-0 z-[60] bg-void/95 backdrop-blur flex items-center justify-center animate-flicker-in">
      <div className="text-center animate-pr-burst px-6">
        <div className="font-display text-acid text-glow-acid text-sm tracking-[0.4em] mb-2">⚡ PERSONAL RECORD ⚡</div>
        <div className="font-display text-3xl text-cyan text-glow-cyan tracking-wider mb-3">{TYPE_LABEL[first.type]}</div>
        <div className="text-ink text-lg mb-1">{exercise?.name}</div>
        <div className="font-display text-magenta text-glow-magenta text-2xl">
          {Math.round(first.value * 10) / 10}
          {first.type !== 'reps' ? 'kg' : ''}
        </div>
        {prs.length > 1 && <div className="text-ink-dimmer text-xs mt-3">+{prs.length - 1} more record{prs.length > 2 ? 's' : ''} this session</div>}
      </div>
    </div>
  )
}
