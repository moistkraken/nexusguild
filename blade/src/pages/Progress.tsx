import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { getExercise } from '../data/exercises'
import { buildAdherenceCalendar, buildE1rmSeries, buildMuscleVolumeSeries } from '../lib/progressData'
import { buildWeeklySummary } from '../engine/weeklySummary'
import { isoDate, uid } from '../lib/calculations'
import { Panel } from '../components/ui/Panel'
import { SectionHeading } from '../components/ui/SectionHeading'
import { GlitchText } from '../components/ui/GlitchText'
import { NeonButton } from '../components/ui/NeonButton'
import { StatTile } from '../components/ui/StatTile'
import { TextInput } from '../components/ui/FormControls'
import clsx from 'clsx'

const MUSCLE_COLORS = ['#00f0ff', '#ff2ee8', '#baff29', '#ffb703', '#ff3b5c']

const CHART_TOOLTIP_STYLE = {
  background: '#0d0d14',
  border: '1px solid rgba(0,240,255,0.3)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  color: '#e8fbff',
}

export function Progress() {
  const profile = useProfile()
  const logs = useLiveQuery(() => db.logs.toArray(), [])
  const progressionStates = useLiveQuery(() => db.progression.toArray(), [])
  const bodyweightLogs = useLiveQuery(() => db.bodyweight.orderBy('date').toArray(), [])
  const prs = useLiveQuery(() => db.prs.toArray(), [])
  const [selectedLift, setSelectedLift] = useState<string | null>(null)
  const [bwInput, setBwInput] = useState('')

  const liftableStates = useMemo(
    () => (progressionStates ?? []).filter((s) => s.history.length > 1 && getExercise(s.exerciseId)?.isCompound),
    [progressionStates],
  )

  const activeLiftId = selectedLift ?? liftableStates[0]?.exerciseId ?? null
  const activeState = liftableStates.find((s) => s.exerciseId === activeLiftId)
  const e1rmData = activeState ? buildE1rmSeries(activeState) : []

  const { data: volumeData, muscles } = useMemo(() => buildMuscleVolumeSeries(logs ?? []), [logs])
  const calendar = useMemo(() => buildAdherenceCalendar(logs ?? []), [logs])

  const bwData = (bodyweightLogs ?? []).map((b) => ({ date: b.date.slice(5), weightKg: b.weightKg }))
  const weeklySummary = useMemo(() => (profile ? buildWeeklySummary(logs ?? [], prs ?? [], profile) : null), [logs, prs, profile])

  async function logBodyweight() {
    const val = Number(bwInput)
    if (!val || !profile) return
    const weightKg = profile.unit === 'kg' ? val : val / 2.20462
    await db.bodyweight.put({ id: uid(), date: isoDate(), weightKg })
    await db.profile.put({ ...profile, bodyweightKg: weightKg, updatedAt: new Date().toISOString() })
    setBwInput('')
  }

  if (!profile) return null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-6">
      <header>
        <GlitchText className="font-display text-xl text-cyan text-glow-cyan tracking-[0.15em]">TELEMETRY</GlitchText>
        <div className="text-ink-dimmer text-[11px] font-display tracking-widest mt-1">PERFORMANCE DATA STREAM</div>
      </header>

      {weeklySummary && (
        <Panel className="p-4" accent="magenta">
          <SectionHeading accent="magenta" className="mb-3">
            Weekly Summary
          </SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Sessions"
              value={`${weeklySummary.sessionsCompleted}/${weeklySummary.sessionsTarget}`}
              accent="cyan"
            />
            <StatTile label="PRs" value={weeklySummary.prCount} accent="acid" />
            <StatTile label="Volume" value={weeklySummary.totalVolume} unit={profile.unit} accent="magenta" />
            <StatTile label="Avg RPE" value={weeklySummary.avgRpe ? weeklySummary.avgRpe.toFixed(1) : '—'} accent="cyan" />
          </div>
        </Panel>
      )}

      <Panel className="p-4">
        <SectionHeading className="mb-3">Adherence // Last 28 Days</SectionHeading>
        <div className="grid grid-cols-7 gap-1.5">
          {calendar.map((d) => (
            <div
              key={d.date}
              title={d.date}
              className={clsx(
                'aspect-square rounded-[2px]',
                d.trained ? 'bg-acid shadow-[0_0_6px_rgba(186,255,41,0.6)]' : 'bg-surface-2 border border-ink-dimmer/30',
              )}
            />
          ))}
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="!mb-0">Est. 1RM Trend</SectionHeading>
        </div>
        {liftableStates.length === 0 ? (
          <p className="text-ink-dim text-sm">Log a few sessions on a compound lift to unlock this trend.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {liftableStates.map((s) => {
                const ex = getExercise(s.exerciseId)
                return (
                  <button
                    key={s.exerciseId}
                    onClick={() => setSelectedLift(s.exerciseId)}
                    className={clsx(
                      'text-[10px] font-display tracking-wide px-2 py-1 border',
                      activeLiftId === s.exerciseId ? 'border-cyan text-cyan bg-cyan/10' : 'border-ink-dimmer/40 text-ink-dimmer',
                    )}
                  >
                    {ex?.name}
                  </button>
                )
              })}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={e1rmData}>
                <CartesianGrid stroke="rgba(0,240,255,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7f8ea0', fontSize: 10 }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#2a2a3a' }} />
                <YAxis tick={{ fill: '#7f8ea0', fontSize: 10 }} axisLine={{ stroke: '#2a2a3a' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="e1rm" stroke="#00f0ff" strokeWidth={2} dot={{ fill: '#00f0ff', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </Panel>

      <Panel className="p-4">
        <SectionHeading className="mb-3">Volume / Muscle Group / Week</SectionHeading>
        {volumeData.length === 0 ? (
          <p className="text-ink-dim text-sm">No completed sessions yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeData}>
                <CartesianGrid stroke="rgba(0,240,255,0.08)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#7f8ea0', fontSize: 10 }} axisLine={{ stroke: '#2a2a3a' }} />
                <YAxis tick={{ fill: '#7f8ea0', fontSize: 10 }} axisLine={{ stroke: '#2a2a3a' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                {muscles.map((m, i) => (
                  <Bar key={m} dataKey={m} stackId="vol" fill={MUSCLE_COLORS[i % MUSCLE_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {muscles.map((m, i) => (
                <div key={m} className="flex items-center gap-1.5 text-[10px] font-display tracking-wide text-ink-dim">
                  <span className="w-2 h-2" style={{ background: MUSCLE_COLORS[i % MUSCLE_COLORS.length] }} />
                  {m}
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      <Panel className="p-4">
        <SectionHeading className="mb-3">Bodyweight</SectionHeading>
        <div className="flex gap-2 mb-3">
          <TextInput
            type="number"
            placeholder={`Log today's weight (${profile.unit})`}
            value={bwInput}
            onChange={(e) => setBwInput(e.target.value)}
            className="min-w-0"
          />
          <NeonButton size="sm" onClick={logBodyweight}>
            Log
          </NeonButton>
        </div>
        {bwData.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bwData}>
              <CartesianGrid stroke="rgba(0,240,255,0.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#7f8ea0', fontSize: 10 }} axisLine={{ stroke: '#2a2a3a' }} />
              <YAxis tick={{ fill: '#7f8ea0', fontSize: 10 }} axisLine={{ stroke: '#2a2a3a' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="weightKg" stroke="#ff2ee8" strokeWidth={2} dot={{ fill: '#ff2ee8', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  )
}
