import type { MemberStatus } from '../../types'
import { getPersona } from '../../lib/agents'

interface Props {
  role: string
  label: string
  status: MemberStatus
  tokens?: number
}

export function AgentAvatar({ role, status, tokens }: Props) {
  const persona = getPersona(role)
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const isInactive = status === 'inactive'

  return (
    <div
      className={`glass flex items-center gap-3 px-3 py-2.5 transition-all duration-300 ${
        isActive ? 'animate-glow-pulse' : ''
      } ${isInactive ? 'opacity-45' : ''}`}
      style={isActive ? { borderColor: `${persona.color}20`, boxShadow: `0 0 12px ${persona.color}15` } : undefined}
    >
      {/* Emoji avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
      >
        {persona.emoji}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: isInactive ? 'var(--color-text-tertiary)' : persona.color }}>
          {persona.name}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isActive ? 'animate-dot-pulse' : ''}`}
            style={{
              backgroundColor: isActive ? persona.color : isCompleted ? 'var(--color-success)' : 'rgba(0,0,0,0.15)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {isActive ? '工作中' : isCompleted ? '完成' : '待命'}
          </span>
        </div>
        {typeof tokens === 'number' && tokens > 0 && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {tokens.toLocaleString()} tokens
          </p>
        )}
      </div>
    </div>
  )
}
