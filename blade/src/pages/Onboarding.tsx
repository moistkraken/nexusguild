import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import type { Equipment, ExperienceLevel, Goal, Profile, Sex, Unit } from '../types'
import { NeonButton } from '../components/ui/NeonButton'
import { Panel } from '../components/ui/Panel'
import { SectionHeading } from '../components/ui/SectionHeading'
import { GlitchText } from '../components/ui/GlitchText'
import { FieldLabel, MultiToggle, SegmentedControl, Stepper, TextInput } from '../components/ui/FormControls'

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
  { value: 'general-fitness', label: 'General Fitness' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const STEPS = ['IDENTITY', 'BIOMETRICS', 'ARSENAL', 'SCHEDULE', 'OBJECTIVE', 'LIMITS'] as const

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [age, setAge] = useState(28)
  const [sex, setSex] = useState<Sex>('male')
  const [unit, setUnit] = useState<Unit>('kg')
  const [bodyweightKg, setBodyweightKg] = useState(75)
  const [heightCm, setHeightCm] = useState(175)
  const [experience, setExperience] = useState<ExperienceLevel>('beginner')
  const [equipment, setEquipment] = useState<Equipment[]>(['bodyweight', 'dumbbells'])
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [sessionLengthMin, setSessionLengthMin] = useState(60)
  const [goal, setGoal] = useState<Goal>('hypertrophy')
  const [injuriesText, setInjuriesText] = useState('')

  const isLast = step === STEPS.length - 1

  async function finish() {
    const now = new Date().toISOString()
    const profile: Profile = {
      id: 'profile',
      name: name.trim() || 'OPERATIVE',
      age,
      sex,
      bodyweightKg,
      heightCm,
      experience,
      equipment: equipment.length ? equipment : ['bodyweight'],
      daysPerWeek,
      sessionLengthMin,
      injuries: injuriesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      goal,
      unit,
      onboarded: true,
      createdAt: now,
      updatedAt: now,
    }
    await db.profile.put(profile)
    const settings = await db.settings.get('settings')
    if (!settings) {
      await db.settings.put({ id: 'settings', anthropicApiKey: null, lastMissedDayHandledDate: null })
    }
    navigate('/')
  }

  function next() {
    if (isLast) finish()
    else setStep((s) => s + 1)
  }

  return (
    <div className="min-h-dvh flex flex-col px-4 pt-10 pb-8 max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <GlitchText className="font-display text-3xl text-cyan text-glow-cyan tracking-[0.2em]">BLADE</GlitchText>
        <div className="text-ink-dim text-xs tracking-[0.3em] mt-1 font-display">SYSTEM CALIBRATION</div>
      </div>

      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 ${i <= step ? 'bg-cyan shadow-[0_0_6px_rgba(0,240,255,0.7)]' : 'bg-ink-dimmer/30'}`} />
        ))}
      </div>

      <Panel className="p-5 flex-1 flex flex-col animate-rise-fade" accent="cyan">
        <SectionHeading className="mb-5">{STEPS[step]}</SectionHeading>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <FieldLabel>Callsign / Name</FieldLabel>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RAZOR" />
            </div>
            <div>
              <FieldLabel>Age</FieldLabel>
              <Stepper value={age} onChange={setAge} min={13} max={90} />
            </div>
            <div>
              <FieldLabel>Sex</FieldLabel>
              <SegmentedControl
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                value={sex}
                onChange={setSex}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <FieldLabel>Units</FieldLabel>
              <SegmentedControl
                options={[
                  { value: 'kg', label: 'Kilograms' },
                  { value: 'lb', label: 'Pounds' },
                ]}
                value={unit}
                onChange={setUnit}
              />
            </div>
            <div>
              <FieldLabel>Bodyweight ({unit})</FieldLabel>
              <Stepper
                value={unit === 'kg' ? bodyweightKg : Math.round(bodyweightKg * 2.20462)}
                onChange={(v) => setBodyweightKg(unit === 'kg' ? v : v / 2.20462)}
                min={30}
                max={250}
                step={unit === 'kg' ? 1 : 2}
              />
            </div>
            <div>
              <FieldLabel>Height (cm)</FieldLabel>
              <Stepper value={heightCm} onChange={setHeightCm} min={120} max={230} />
            </div>
            <div>
              <FieldLabel>Experience Level</FieldLabel>
              <SegmentedControl options={EXPERIENCE_OPTIONS} value={experience} onChange={setExperience} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <FieldLabel>Available Equipment</FieldLabel>
            <MultiToggle options={EQUIPMENT_OPTIONS} values={equipment} onChange={setEquipment} />
            <p className="text-ink-dimmer text-xs">Select every piece of kit you can access. BLADE builds your plan only from this arsenal.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <FieldLabel>Training Days / Week</FieldLabel>
              <Stepper value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} />
            </div>
            <div>
              <FieldLabel>Session Length (minutes)</FieldLabel>
              <Stepper value={sessionLengthMin} onChange={setSessionLengthMin} min={15} max={120} step={5} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <FieldLabel>Primary Goal</FieldLabel>
            <SegmentedControl options={GOAL_OPTIONS} value={goal} onChange={setGoal} accent="magenta" />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <FieldLabel>Injuries / Limitations</FieldLabel>
            <TextInput
              value={injuriesText}
              onChange={(e) => setInjuriesText(e.target.value)}
              placeholder="e.g. knee, shoulder (comma separated)"
            />
            <p className="text-ink-dimmer text-xs">
              BLADE will route around flagged joints automatically. Leave blank if none. Editable anytime in Settings.
            </p>
          </div>
        )}

        <div className="mt-auto pt-6 flex gap-3">
          {step > 0 && (
            <NeonButton variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </NeonButton>
          )}
          <NeonButton variant="cyan" fullWidth onClick={next}>
            {isLast ? 'Initialize BLADE' : 'Continue'}
          </NeonButton>
        </div>
      </Panel>
    </div>
  )
}
