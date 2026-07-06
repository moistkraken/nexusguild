import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Panel } from './Panel'

export function StatTile({
  label,
  value,
  unit,
  accent = 'cyan',
  icon,
}: {
  label: string
  value: ReactNode
  unit?: string
  accent?: 'cyan' | 'magenta' | 'acid'
  icon?: ReactNode
}) {
  const glow = {
    cyan: 'text-cyan text-glow-cyan',
    magenta: 'text-magenta text-glow-magenta',
    acid: 'text-acid text-glow-acid',
  }[accent]
  return (
    <Panel className="p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between text-ink-dim text-[10px] font-display uppercase tracking-[0.15em]">
        <span className="truncate">{label}</span>
        {icon}
      </div>
      <div className={clsx('font-display text-xl leading-none truncate', glow)}>
        {value}
        {unit && <span className="text-xs ml-1 text-ink-dim">{unit}</span>}
      </div>
    </Panel>
  )
}
