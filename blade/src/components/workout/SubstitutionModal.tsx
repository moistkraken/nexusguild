import type { Exercise } from '../../types'
import { Panel } from '../ui/Panel'
import { NeonButton } from '../ui/NeonButton'
import { SectionHeading } from '../ui/SectionHeading'

export function SubstitutionModal({
  candidates,
  onSelect,
  onClose,
}: {
  candidates: Exercise[]
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <Panel accent="magenta" className="w-full max-w-md p-5 max-h-[80vh] overflow-y-auto animate-rise-fade">
        <SectionHeading accent="magenta" className="mb-4">
          Substitute Exercise
        </SectionHeading>
        {candidates.length === 0 && <p className="text-ink-dim text-sm">No equipment-matched substitutes found.</p>}
        <div className="space-y-2 mb-4">
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2.5 border border-ink-dimmer/40 hover:border-magenta hover:bg-magenta/10 transition-colors"
            >
              <div className="text-ink text-sm">{c.name}</div>
              <div className="text-ink-dimmer text-[10px] font-display tracking-wide uppercase">{c.equipment.join(' / ')}</div>
            </button>
          ))}
        </div>
        <NeonButton variant="ghost" fullWidth onClick={onClose}>
          Cancel
        </NeonButton>
      </Panel>
    </div>
  )
}
