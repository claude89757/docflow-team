import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { TaskUsageRecord } from '../../types'
import { GlassCard } from '../ui/GlassCard'
import { AGENT_PERSONAS } from '../../lib/agents'

interface Props {
  history: TaskUsageRecord[]
}

const AGENTS = ['content-generator', 'content-editor', 'format-designer', 'quality-reviewer']
const COLORS = ['#5e5ce6', '#007aff', '#ff9f0a', '#30d158']

export function TokenDistribution({ history }: Props) {
  const agentTotals = AGENTS.map((agent, i) => {
    const total = history.reduce((sum, h) => {
      const u = h.agents?.[agent]
      return sum + (u ? u.input_tokens + u.output_tokens : 0)
    }, 0)
    const persona = AGENT_PERSONAS[agent]
    return { name: persona?.name || agent, value: total, color: COLORS[i] }
  }).filter(d => d.value > 0)

  if (agentTotals.length === 0) return null

  const total = agentTotals.reduce((s, d) => s + d.value, 0)

  return (
    <GlassCard className="p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        Token 分布（按智能体）
      </h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={agentTotals}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              dataKey="value"
              stroke="none"
            >
              {agentTotals.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${(Number(value) / 1000).toFixed(1)}K`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5">
          {agentTotals.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>{d.name}</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>{Math.round(d.value / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
