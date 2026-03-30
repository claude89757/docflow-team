import type { TokenState, ContextState } from '../../types'
import { AGENT_PERSONAS } from '../../lib/agents'

interface Props {
  tokenState: TokenState
  contextState: ContextState
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function estimateCost(tokenState: TokenState): string {
  const inputCost = tokenState.total.input_tokens / 1_000_000 * 3.0
  const outputCost = tokenState.total.output_tokens / 1_000_000 * 15.0
  return `$${(inputCost + outputCost).toFixed(3)}`
}

export function UsageMiniPanel({ tokenState, contextState }: Props) {
  const totalTokens = tokenState.total.input_tokens + tokenState.total.output_tokens
  const agents = ['content-generator', 'content-editor', 'format-designer', 'quality-reviewer']
  const maxAgentTokens = Math.max(1, ...agents.map(a => {
    const u = tokenState.agents[a]
    return u ? u.input_tokens + u.output_tokens : 0
  }))

  return (
    <div className="mt-auto border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
        📊 用量
      </div>

      {/* Totals */}
      <div className="mb-2 grid grid-cols-2 gap-1">
        <div className="rounded-md p-1.5 text-center" style={{ backgroundColor: 'rgba(0,122,255,0.04)' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{formatTokens(totalTokens)}</div>
          <div className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>tokens</div>
        </div>
        <div className="rounded-md p-1.5 text-center" style={{ backgroundColor: 'rgba(48,209,88,0.04)' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>{estimateCost(tokenState)}</div>
          <div className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>费用</div>
        </div>
      </div>

      {/* Per-agent bars */}
      <div className="space-y-1.5">
        {agents.map(agent => {
          const persona = AGENT_PERSONAS[agent]
          const usage = tokenState.agents[agent]
          const tokens = usage ? usage.input_tokens + usage.output_tokens : 0
          const pct = maxAgentTokens > 0 ? (tokens / maxAgentTokens) * 100 : 0
          const ctx = contextState.agents[agent]

          return (
            <div key={agent}>
              <div className="flex items-center justify-between text-[10px]">
                <span>{persona?.emoji} {persona?.name}</span>
                <span style={{ color: tokens > 0 ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>
                  {tokens > 0 ? formatTokens(tokens) : '—'}
                </span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: persona?.color || '#007aff' }}
                />
              </div>
              {ctx && (
                <div className="mt-0.5 flex items-center justify-between text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>上下文</span>
                  <span>{ctx.percentage}%</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
