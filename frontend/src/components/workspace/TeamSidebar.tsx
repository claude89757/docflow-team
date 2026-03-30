import type { MemberState, TokenState, ContextState } from '../../types'
import { AgentAvatar } from './AgentAvatar'
import { UsageMiniPanel } from './UsageMiniPanel'
import { MAX_ROUNDS } from '../../lib/api'

interface Props {
  members: Record<string, MemberState>
  round: number
  tokenState?: TokenState
  contextState?: ContextState
}

export function TeamSidebar({ members, round, tokenState, contextState }: Props) {
  const displayMembers = Object.values(members).filter(m => m.role !== 'team-lead')

  return (
    <aside className="flex w-full shrink-0 flex-col md:w-56">
      <div className="sticky top-20 flex max-h-[calc(100vh-120px)] flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            AI 团队
          </h3>
          {round > 0 && (
            <span className="glass px-2 py-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              第 {round} 轮 / 最多 {MAX_ROUNDS} 轮
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {displayMembers.map((m) => (
            <AgentAvatar
              key={m.role}
              role={m.role}
              label={m.label}
              status={m.status}
              tokens={tokenState?.agents[m.role] ? tokenState.agents[m.role].input_tokens + tokenState.agents[m.role].output_tokens : undefined}
            />
          ))}
        </div>
        {tokenState && contextState && (
          <UsageMiniPanel tokenState={tokenState} contextState={contextState} />
        )}
      </div>
    </aside>
  )
}
