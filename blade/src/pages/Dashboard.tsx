import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import type { CheckIn } from '../types'
import { getOrCreateTodaysPlan, skipPlan, checkRestRecommendation, computeAdherenceStreak } from '../engine/trainer'
import { getExercise } from '../data/exercises'
import { getWarmup, getMobility } from '../engine/planGenerator'
import { Panel } from '../components/ui/Panel'
import { SectionHeading } from '../components/ui/SectionHeading'
import { NeonButton } from '../components/ui/NeonButton'
import { LiveDot } from '../components/ui/LiveDot'
import { StatTile } from '../components/ui/StatTile'
import { GlitchText } from '../components/ui/GlitchText'
import { CheckInPanel } from '../components/dashboard/CheckInPanel'
import { formatWeight } from '../lib/calculations'

export function Dashboard() {
  const navigate = useNavigate()
  const profile = useProfile()
  const pendingPlan = useLiveQuery(
    () => db.plans.filter((p) => p.status === 'planned' || p.status === 'in-progress').first(),
    [],
  )
  const [busy, setBusy] = useState(false)
  const [restRec, setRestRec] = useState<{ shouldRest: boolean; reason: string | null } | null>(null)
  const [overrideRest, setOverrideRest] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!profile) return
    checkRestRecommendation(profile).then(setRestRec)
    computeAdherenceStreak().then(setStreak)
  }, [profile, pendingPlan])

  if (!profile) return null

  async function handleCheckIn(checkIn: CheckIn) {
    setBusy(true)
    try {
      await getOrCreateTodaysPlan(profile!, checkIn)
    } finally {
      setBusy(false)
    }
  }

  async function handleReshuffle() {
    if (!pendingPlan) return
    setBusy(true)
    try {
      await skipPlan(pendingPlan)
    } finally {
      setBusy(false)
    }
  }

  const showRestGate = restRec?.shouldRest && !overrideRest && !pendingPlan?.status.includes('progress')

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
      <header className="flex items-center justify-between mb-6">
        <div>
          <GlitchText className="font-display text-2xl text-cyan text-glow-cyan tracking-[0.15em]">BLADE</GlitchText>
          <div className="text-ink-dimmer text-[11px] font-display tracking-widest mt-0.5">
            {profile.name.toUpperCase()} // {profile.goal.toUpperCase().replace('-', ' ')}
          </div>
        </div>
        <LiveDot label="SYSTEM ONLINE" color="acid" />
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatTile label="Streak" value={streak} unit="days" accent="acid" />
        <StatTile
          label="Bodyweight"
          value={profile.unit === 'kg' ? Math.round(profile.bodyweightKg * 10) / 10 : Math.round(profile.bodyweightKg * 2.20462 * 10) / 10}
          unit={profile.unit}
          accent="cyan"
        />
        <StatTile label="Frequency" value={profile.daysPerWeek} unit="/wk" accent="magenta" />
      </div>

      {showRestGate && (
        <Panel accent="acid" className="p-4 mb-6 animate-rise-fade">
          <div className="font-display text-acid text-xs tracking-widest mb-1">RECOVERY ADVISED</div>
          <p className="text-ink-dim text-sm mb-3">{restRec?.reason}</p>
          <NeonButton variant="ghost" size="sm" onClick={() => setOverrideRest(true)}>
            Train Anyway
          </NeonButton>
        </Panel>
      )}

      {!showRestGate && !pendingPlan && <CheckInPanel onSubmit={handleCheckIn} busy={busy} />}

      {!showRestGate && pendingPlan && (
        <div className="space-y-5 animate-rise-fade">
          <Panel accent="cyan" className="p-5">
            <div className="flex items-center justify-between mb-2">
              <SectionHeading className="!mb-0">{pendingPlan.dayLabel}</SectionHeading>
            </div>
            <div className="flex gap-2 mb-4">
              <span className="text-[10px] font-display tracking-widest px-2 py-1 border border-cyan/30 text-cyan">
                WEEK {pendingPlan.mesoWeek}
              </span>
              <span className="text-[10px] font-display tracking-widest px-2 py-1 border border-magenta/30 text-magenta uppercase">
                {pendingPlan.phase}
              </span>
              {pendingPlan.volumeMultiplier !== 1 && (
                <span className="text-[10px] font-display tracking-widest px-2 py-1 border border-acid/30 text-acid">
                  ADAPTED
                </span>
              )}
            </div>
            <p className="text-ink-dim text-sm leading-relaxed">{pendingPlan.rationale}</p>
          </Panel>

          <Panel className="p-5">
            <SectionHeading className="mb-3">Warm-Up</SectionHeading>
            <ul className="text-sm text-ink-dim space-y-1.5 list-disc list-inside">
              {getWarmup(pendingPlan.dayType).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-5">
            <SectionHeading className="mb-3">Today's Blocks</SectionHeading>
            <div className="space-y-2">
              {pendingPlan.blocks.map((b) => {
                const ex = getExercise(b.exerciseId)
                return (
                  <div key={b.id} className="flex items-center justify-between border-b border-ink-dimmer/20 pb-2 last:border-0">
                    <div>
                      <div className="text-ink text-sm">{ex?.name ?? b.exerciseId}</div>
                      <div className="text-ink-dimmer text-xs font-display tracking-wide">
                        {b.targetSets} × {b.targetRepMin}-{b.targetRepMax}
                        {b.targetWeightKg != null && ` @ ${formatWeight(b.targetWeightKg, profile.unit)}`}
                        {b.targetRpe != null && ` · RPE ${b.targetRpe}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading className="mb-3">Mobility / Cooldown</SectionHeading>
            <ul className="text-sm text-ink-dim space-y-1.5 list-disc list-inside">
              {getMobility(pendingPlan.dayType).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Panel>

          <NeonButton variant="cyan" size="lg" fullWidth className="animate-pulse-glow" onClick={() => navigate('/workout')}>
            ▶ Initiate Workout
          </NeonButton>
          <NeonButton variant="ghost" size="sm" fullWidth onClick={handleReshuffle} disabled={busy}>
            Skip / Reshuffle Day
          </NeonButton>
        </div>
      )}
    </div>
  )
}
