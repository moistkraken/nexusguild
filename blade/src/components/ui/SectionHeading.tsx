import type { ReactNode } from 'react'
import clsx from 'clsx'

export function SectionHeading({
  children,
  accent = 'cyan',
  className,
}: {
  children: ReactNode
  accent?: 'cyan' | 'magenta' | 'acid'
  className?: string
}) {
  const line = {
    cyan: 'from-cyan',
    magenta: 'from-magenta',
    acid: 'from-acid',
  }[accent]
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink whitespace-nowrap">{children}</h2>
      <span className={clsx('h-px flex-1 bg-gradient-to-r to-transparent', line)} />
    </div>
  )
}
