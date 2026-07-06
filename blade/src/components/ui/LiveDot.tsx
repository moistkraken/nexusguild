import clsx from 'clsx'

export function LiveDot({ label = 'LIVE', color = 'acid' }: { label?: string; color?: 'acid' | 'cyan' | 'magenta' | 'danger' }) {
  const dotColor = {
    acid: 'bg-acid shadow-[0_0_8px_2px_rgba(186,255,41,0.8)]',
    cyan: 'bg-cyan shadow-[0_0_8px_2px_rgba(0,240,255,0.8)]',
    magenta: 'bg-magenta shadow-[0_0_8px_2px_rgba(255,46,232,0.8)]',
    danger: 'bg-danger shadow-[0_0_8px_2px_rgba(255,59,92,0.8)]',
  }[color]
  const textColor = {
    acid: 'text-acid',
    cyan: 'text-cyan',
    magenta: 'text-magenta',
    danger: 'text-danger',
  }[color]
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.2em]">
      <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse-glow', dotColor)} />
      <span className={textColor}>{label}</span>
    </span>
  )
}
