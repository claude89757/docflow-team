import { STARTER_SCENARIOS } from '../../lib/api'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  onSelect: (description: string) => void
}

export function StarterCards({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STARTER_SCENARIOS.map((s) => (
        <GlassCard key={s.label} hover className="cursor-pointer p-3" >
          <button
            onClick={() => onSelect(s.description)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {s.label}
            </span>
          </button>
        </GlassCard>
      ))}
    </div>
  )
}
