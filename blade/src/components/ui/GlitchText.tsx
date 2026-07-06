import type { ReactNode } from 'react'
import clsx from 'clsx'

export function GlitchText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('animate-glitch-in inline-block', className)}>{children}</span>
}
