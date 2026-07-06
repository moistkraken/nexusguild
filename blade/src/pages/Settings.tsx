import { useEffect, useRef, useState } from 'react'
import { db } from '../db/db'
import { useProfile, useSettings } from '../hooks/useProfile'
import type { Equipment, ExperienceLevel, Goal } from '../types'
import { Panel } from '../components/ui/Panel'
import { SectionHeading } from '../components/ui/SectionHeading'
import { GlitchText } from '../components/ui/GlitchText'
import { NeonButton } from '../components/ui/NeonButton'
import { FieldLabel, MultiToggle, SegmentedControl, Stepper, TextInput } from '../components/ui/FormControls'
import { downloadExport, exportAllData, importAllData } from '../lib/exportImport'

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'machines', label: 'Machines' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'bands', label: 'Bands' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'cable', label: 'Cable' },
  { value: 'pull-up-bar', label: 'Pull-Up Bar' },
  { value: 'bench', label: 'Bench' },
]

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'fat-loss', label: 'Fat Loss' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general-fitness', label: 'General' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function Settings() {
  const profile = useProfile()
  const settings = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const [form, setForm] = useState(profile)

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  useEffect(() => {
    if (settings) setApiKey(settings.anthropicApiKey ?? '')
  }, [settings])

  if (!form) return null

  async function save() {
    if (!form) return
    await db.profile.put({ ...form, updatedAt: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function saveApiKey() {
    const existing = await db.settings.get('settings')
    await db.settings.put({ id: 'settings', anthropicApiKey: apiKey || null, lastMissedDayHandledDate: existing?.lastMissedDayHandledDate ?? null })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleExport() {
    const data = await exportAllData()
    downloadExport(data)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      setImportMsg('Import complete. Reloading...')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setImportMsg('Import failed — invalid backup file.')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-6">
      <header>
        <GlitchText className="font-display text-xl text-cyan text-glow-cyan tracking-[0.15em]">SYSTEM CONFIG</GlitchText>
        <div className="text-ink-dimmer text-[11px] font-display tracking-widest mt-1">PROFILE // DATA // INTEGRATIONS</div>
      </header>

      <Panel className="p-5 space-y-4">
        <SectionHeading className="mb-1">Operative Profile</SectionHeading>
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <FieldLabel>Age</FieldLabel>
          <Stepper value={form.age} onChange={(v) => setForm({ ...form, age: v })} min={13} max={90} />
        </div>
        <div>
          <FieldLabel>Bodyweight ({form.unit})</FieldLabel>
          <Stepper
            value={form.unit === 'kg' ? Math.round(form.bodyweightKg) : Math.round(form.bodyweightKg * 2.20462)}
            onChange={(v) => setForm({ ...form, bodyweightKg: form.unit === 'kg' ? v : v / 2.20462 })}
            min={30}
            max={250}
          />
        </div>
        <div>
          <FieldLabel>Experience</FieldLabel>
          <SegmentedControl options={EXPERIENCE_OPTIONS} value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} />
        </div>
        <div>
          <FieldLabel>Goal</FieldLabel>
          <SegmentedControl options={GOAL_OPTIONS} value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} accent="magenta" />
        </div>
        <div>
          <FieldLabel>Equipment</FieldLabel>
          <MultiToggle options={EQUIPMENT_OPTIONS} values={form.equipment} onChange={(v) => setForm({ ...form, equipment: v })} />
        </div>
        <div>
          <FieldLabel>Training Days / Week</FieldLabel>
          <Stepper value={form.daysPerWeek} onChange={(v) => setForm({ ...form, daysPerWeek: v })} min={1} max={7} />
        </div>
        <div>
          <FieldLabel>Session Length (min)</FieldLabel>
          <Stepper value={form.sessionLengthMin} onChange={(v) => setForm({ ...form, sessionLengthMin: v })} min={15} max={120} step={5} />
        </div>
        <div>
          <FieldLabel>Injuries / Limitations (comma separated)</FieldLabel>
          <TextInput
            value={form.injuries.join(', ')}
            onChange={(e) =>
              setForm({ ...form, injuries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
            }
          />
        </div>
        <NeonButton fullWidth onClick={save}>
          {saved ? 'Saved ✓' : 'Save Profile'}
        </NeonButton>
      </Panel>

      <Panel className="p-5 space-y-3" accent="magenta">
        <SectionHeading accent="magenta" className="mb-1">
          AI Reasoning Hook
        </SectionHeading>
        <p className="text-ink-dim text-xs">
          Optional: add an Anthropic API key to let BLADE call Claude for richer plan rationale. Stored locally only, never leaves this device
          except to call the Anthropic API directly from your browser.
        </p>
        <TextInput type="password" placeholder="sk-ant-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <NeonButton variant="magenta" fullWidth onClick={saveApiKey}>
          Save Key
        </NeonButton>
      </Panel>

      <Panel className="p-5 space-y-3" accent="acid">
        <SectionHeading accent="acid" className="mb-1">
          Data Vault
        </SectionHeading>
        <p className="text-ink-dim text-xs">Everything lives in this browser's IndexedDB. Export regularly so you never lose your training history.</p>
        <div className="flex gap-2">
          <NeonButton variant="acid" fullWidth onClick={handleExport}>
            Export JSON
          </NeonButton>
          <NeonButton variant="ghost" fullWidth onClick={handleImportClick}>
            Import JSON
          </NeonButton>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        {importMsg && <p className="text-ink-dim text-xs">{importMsg}</p>}
      </Panel>
    </div>
  )
}
