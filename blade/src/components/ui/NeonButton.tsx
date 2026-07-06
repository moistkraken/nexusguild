import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'cyan' | 'magenta' | 'acid' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  cyan: 'border-cyan text-cyan bg-cyan/10 hover:bg-cyan/20 shadow-[0_0_10px_rgba(0,240,255,0.35)] hover:shadow-[0_0_18px_rgba(0,240,255,0.6)]',
  magenta:
    'border-magenta text-magenta bg-magenta/10 hover:bg-magenta/20 shadow-[0_0_10px_rgba(255,46,232,0.35)] hover:shadow-[0_0_18px_rgba(255,46,232,0.6)]',
  acid: 'border-acid text-acid bg-acid/10 hover:bg-acid/20 shadow-[0_0_10px_rgba(186,255,41,0.35)] hover:shadow-[0_0_18px_rgba(186,255,41,0.6)]',
  ghost: 'border-ink-dimmer/60 text-ink-dim bg-transparent hover:border-cyan/60 hover:text-cyan',
  danger:
    'border-danger text-danger bg-danger/10 hover:bg-danger/20 shadow-[0_0_10px_rgba(255,59,92,0.35)] hover:shadow-[0_0_18px_rgba(255,59,92,0.6)]',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-4 gap-2.5',
}

export function NeonButton({ variant = 'cyan', size = 'md', children, fullWidth, className, disabled, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'font-display uppercase tracking-wider clip-notch-sm border inline-flex items-center justify-center',
        'transition-all duration-150 active:scale-[0.97] disabled:opacity-35 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
