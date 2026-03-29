import type { TaskUsageRecord } from '../../types'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  history: TaskUsageRecord[]
}

export function TaskHistory({ history }: Props) {
  if (history.length === 0) return null

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-4 py-3" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          任务历史
        </h3>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        {history.map((h) => {
          const totalTokens = (h.total?.input_tokens || 0) + (h.total?.output_tokens || 0)
          return (
            <div key={h.task_id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {h.task_id.slice(0, 8)}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: h.mode === 'generation' ? 'rgba(94,92,230,0.08)' : 'rgba(0,122,255,0.08)',
                  color: h.mode === 'generation' ? 'var(--color-agent-generator)' : 'var(--color-primary)',
                }}
              >
                {h.mode === 'generation' ? '生成' : '润色'}
              </span>
              {h.final_score && (
                <span className="text-xs font-semibold" style={{ color: h.final_score >= 8 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {h.final_score}/10
                </span>
              )}
              <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {totalTokens.toLocaleString()} tokens
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {h.started_at?.slice(0, 10)}
              </span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
