import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Accent = 'cyan' | 'magenta' | 'acid' | 'none'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  accent?: Accent
  notch?: boolean
}

const ACCENT_BORDER: Record<Accent, string> = {
  cyan: 'border-cyan/40',
  magenta: 'border-magenta/40',
  acid: 'border-acid/40',
  none: 'border-ink-dimmer/30',
}

export function Panel({ children, accent = 'none', notch = true, className, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'relative bg-surface/80 border backdrop-blur-sm',
        notch && 'clip-notch',
        ACCENT_BORDER[accent],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
