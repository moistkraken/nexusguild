import type { InputHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block font-display text-[11px] uppercase tracking-[0.15em] text-ink-dim mb-1.5">{children}</label>
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full bg-surface-2 border border-ink-dimmer/40 text-ink px-3 py-2.5 outline-none clip-notch-sm',
        'focus:border-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.25)] transition-shadow placeholder:text-ink-dimmer',
        props.className,
      )}
    />
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = 'cyan',
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  accent?: 'cyan' | 'magenta' | 'acid'
}) {
  const activeClass = {
    cyan: 'bg-cyan/15 border-cyan text-cyan shadow-[0_0_10px_rgba(0,240,255,0.3)]',
    magenta: 'bg-magenta/15 border-magenta text-magenta shadow-[0_0_10px_rgba(255,46,232,0.3)]',
    acid: 'bg-acid/15 border-acid text-acid shadow-[0_0_10px_rgba(186,255,41,0.3)]',
  }[accent]
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'font-display text-xs uppercase tracking-wider px-3 py-2 border clip-notch-sm transition-all',
            value === opt.value ? activeClass : 'border-ink-dimmer/40 text-ink-dim hover:border-ink-dim',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function MultiToggle<T extends string>({
  options,
  values,
  onChange,
  accent = 'cyan',
}: {
  options: { value: T; label: string }[]
  values: T[]
  onChange: (v: T[]) => void
  accent?: 'cyan' | 'magenta' | 'acid'
}) {
  const activeClass = {
    cyan: 'bg-cyan/15 border-cyan text-cyan shadow-[0_0_10px_rgba(0,240,255,0.3)]',
    magenta: 'bg-magenta/15 border-magenta text-magenta shadow-[0_0_10px_rgba(255,46,232,0.3)]',
    acid: 'bg-acid/15 border-acid text-acid shadow-[0_0_10px_rgba(186,255,41,0.3)]',
  }[accent]
  function toggle(v: T) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v))
    else onChange([...values, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={clsx(
            'font-display text-xs uppercase tracking-wider px-3 py-2 border clip-notch-sm transition-all',
            values.includes(opt.value) ? activeClass : 'border-ink-dimmer/40 text-ink-dim hover:border-ink-dim',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function NeonSlider({
  value,
  onChange,
  min = 1,
  max = 5,
  accent = 'cyan',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  accent?: 'cyan' | 'magenta' | 'acid'
}) {
  const accentColor = { cyan: '#00f0ff', magenta: '#ff2ee8', acid: '#baff29' }[accent]
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 appearance-none bg-surface-2 border border-ink-dimmer/40 outline-none cursor-pointer"
      style={{ accentColor }}
    />
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  accent = 'cyan',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  accent?: 'cyan' | 'magenta' | 'acid'
}) {
  const color = { cyan: 'text-cyan border-cyan/50', magenta: 'text-magenta border-magenta/50', acid: 'text-acid border-acid/50' }[accent]
  return (
    <div className="inline-flex items-stretch border border-ink-dimmer/40 clip-notch-sm">
      <button
        type="button"
        className={clsx('px-3 py-2 font-display', color)}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <div className="px-4 py-2 font-display min-w-[3.5rem] text-center border-x border-ink-dimmer/40">{value}</div>
      <button
        type="button"
        className={clsx('px-3 py-2 font-display', color)}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  )
}
