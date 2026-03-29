import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { TaskUsageRecord } from '../../types'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  history: TaskUsageRecord[]
}

export function TokenChart({ history }: Props) {
  const data = history
    .filter(h => h.started_at)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .map(h => ({
      date: h.started_at.slice(0, 10),
      tokens: (h.total?.input_tokens || 0) + (h.total?.output_tokens || 0),
    }))

  // Aggregate by date
  const byDate = new Map<string, number>()
  for (const d of data) {
    byDate.set(d.date, (byDate.get(d.date) || 0) + d.tokens)
  }
  const chartData = [...byDate.entries()].map(([date, tokens]) => ({ date, tokens }))

  if (chartData.length === 0) return null

  return (
    <GlassCard className="p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        Token 消耗趋势
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="var(--color-primary)"
            fill="url(#tokenGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
