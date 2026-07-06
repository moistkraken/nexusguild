import clsx from 'clsx'

export function RestTimerBar({
  remaining,
  running,
  onAdd,
  onSkip,
}: {
  remaining: number
  running: boolean
  onAdd: (s: number) => void
  onSkip: () => void
}) {
  if (!running) return null
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2">
      <div className="max-w-lg mx-auto bg-void/95 border border-magenta/50 shadow-[0_0_20px_rgba(255,46,232,0.35)] clip-notch-sm backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-display tracking-widest text-magenta">RESTING</div>
          <div className={clsx('font-display text-2xl text-magenta text-glow-magenta tabular-nums', remaining <= 5 && 'animate-pulse-glow')}>
            {mm}:{String(ss).padStart(2, '0')}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onAdd(-15)} className="font-display text-xs border border-ink-dimmer/40 text-ink-dim px-2.5 py-1.5">
            −15
          </button>
          <button onClick={() => onAdd(15)} className="font-display text-xs border border-ink-dimmer/40 text-ink-dim px-2.5 py-1.5">
            +15
          </button>
          <button onClick={onSkip} className="font-display text-xs border border-magenta/50 text-magenta px-2.5 py-1.5">
            SKIP
          </button>
        </div>
      </div>
    </div>
  )
}
