import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ActivityEntry } from '../../types'
import { getPersona } from '../../lib/agents'
import { SCORE_LABELS } from '../../types'
import type { ScoreResult } from '../../types'

function timeStr(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

interface Props {
  entry: ActivityEntry
  round: number
}

export function ActivityItem({ entry }: Props) {
  const { type, agent, target, content, scores, timestamp } = entry

  const persona = agent ? getPersona(agent) : getPersona('team-lead')
  const targetPersona = target ? getPersona(target) : null

  // Round start separator
  if (type === 'round_start') {
    return (
      <div className="animate-slide-up flex items-center gap-3 py-2">
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          <RefreshCw className="h-3 w-3" /> 第 {entry.round} 轮
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
      </div>
    )
  }

  // Complete
  if (type === 'complete') {
    return (
      <div className="animate-slide-up glass flex items-center gap-3 p-4" style={{ borderColor: 'rgba(52,199,89,0.15)' }}>
        <CheckCircle2 className="h-6 w-6 animate-check-pop" style={{ color: 'var(--color-success)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>{content}</span>
      </div>
    )
  }

  // Error
  if (type === 'error') {
    return (
      <div className="animate-slide-up glass flex items-center gap-3 p-4" style={{ borderColor: 'rgba(255,59,48,0.15)' }}>
        <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{content}</span>
      </div>
    )
  }

  // Tool call (minimal)
  if (type === 'tool_call') {
    return (
      <div className="animate-slide-up flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>⚙ {content}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
      </div>
    )
  }

  // Agent message arrow
  if (type === 'agent_message' && targetPersona) {
    return (
      <div className="animate-slide-up space-y-1">
        {/* Arrow */}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {persona.emoji} {persona.name}
          </span>
          <span className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {targetPersona.emoji} {targetPersona.name}
          </span>
        </div>
        {/* Bubble */}
        <div className="flex gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
          >
            {persona.emoji}
          </div>
          <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0 }}>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold" style={{ color: persona.color }}>{persona.name}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
            </div>
            <p className="mt-0.5 break-words text-sm" style={{ color: 'var(--color-text-secondary)' }}>{content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Score with inline dimensions
  if (type === 'score' && scores) {
    return (
      <div className="animate-slide-up flex gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
        >
          {persona.emoji}
        </div>
        <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0 }}>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold" style={{ color: persona.color }}>{persona.name}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{content}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(SCORE_LABELS).map(([key, label]) => {
              const val = (scores as ScoreResult)[key as keyof ScoreResult] as number
              const color = val >= 8 ? 'var(--color-success)' : 'var(--color-warning)'
              return (
                <span
                  key={key}
                  className="rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${color}10`, color }}
                >
                  {label} {val}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Rework request
  if (type === 'rework_request') {
    return (
      <div className="animate-slide-up flex gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
        >
          {persona.emoji}
        </div>
        <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0, borderColor: 'rgba(255,159,10,0.15)' }}>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>⚠ 返工要求</span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm" style={{ color: 'var(--color-warning)' }}>{content}</p>
        </div>
      </div>
    )
  }

  // Default: harness_decision, agent_working
  return (
    <div className="animate-slide-up flex gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
        style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
      >
        {persona.emoji}
      </div>
      <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0 }}>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: persona.color }}>{persona.name}</span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
        </div>
        <p className="mt-0.5 break-words text-sm" style={{ color: 'var(--color-text-secondary)' }}>{content}</p>
      </div>
    </div>
  )
}
