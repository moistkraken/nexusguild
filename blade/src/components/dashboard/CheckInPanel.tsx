import { useState } from 'react'
import type { CheckIn } from '../../types'
import { Panel } from '../ui/Panel'
import { SectionHeading } from '../ui/SectionHeading'
import { NeonSlider } from '../ui/FormControls'
import { NeonButton } from '../ui/NeonButton'

const LABELS: Record<keyof CheckIn, string> = {
  energy: 'Energy',
  soreness: 'Soreness',
  sleep: 'Sleep Quality',
}

export function CheckInPanel({ onSubmit, busy }: { onSubmit: (checkIn: CheckIn) => void; busy?: boolean }) {
  const [checkIn, setCheckIn] = useState<CheckIn>({ energy: 3, soreness: 3, sleep: 3 })

  return (
    <Panel accent="magenta" className="p-5 animate-rise-fade">
      <SectionHeading accent="magenta" className="mb-4">
        System Check-In
      </SectionHeading>
      <p className="text-ink-dim text-xs mb-5">Rate today's state. BLADE auto-regulates volume and intensity from your input.</p>
      <div className="space-y-5">
        {(Object.keys(LABELS) as (keyof CheckIn)[]).map((key) => (
          <div key={key}>
            <div className="flex justify-between font-display text-[11px] uppercase tracking-widest text-ink-dim mb-2">
              <span>{LABELS[key]}</span>
              <span className="text-magenta">{checkIn[key]}/5</span>
            </div>
            <NeonSlider
              accent="magenta"
              value={checkIn[key]}
              onChange={(v) => setCheckIn((c) => ({ ...c, [key]: v }))}
            />
          </div>
        ))}
      </div>
      <NeonButton className="mt-6" variant="magenta" fullWidth onClick={() => onSubmit(checkIn)} disabled={busy}>
        {busy ? 'Compiling Plan...' : 'Generate Today’s Plan'}
      </NeonButton>
    </Panel>
  )
}
