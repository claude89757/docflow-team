import { GlassCard } from '../ui/GlassCard'

interface Props {
  icon: string
  label: string
  value: string | number
}

export function StatCard({ icon, label, value }: Props) {
  return (
    <GlassCard className="p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
    </GlassCard>
  )
}
