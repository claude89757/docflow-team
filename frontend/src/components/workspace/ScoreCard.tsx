import { CheckCircle2, XCircle } from 'lucide-react'
import type { ScoreResult } from '../../types'
import { SCORE_LABELS } from '../../types'

interface Props {
  scores: ScoreResult
  round?: number
}

export function ScoreCard({ scores, round }: Props) {
  const dims = Object.entries(SCORE_LABELS)

  return (
    <div className="glass p-4">
      {round && (
        <p className="mb-3 text-center text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          ── 第 {round} 轮评分 ──
        </p>
      )}

      <div className="space-y-2">
        {dims.map(([key, label]) => {
          const val = scores[key as keyof ScoreResult] as number
          const color = val >= 8 ? 'var(--color-success)' : val >= 5 ? 'var(--color-warning)' : 'var(--color-error)'
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                <div
                  className="h-full rounded-full animate-bar-fill"
                  style={{ width: `${val * 10}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          总分: {scores.total}/10
        </span>
        {scores.passed ? (
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-success)' }}>
            <CheckCircle2 className="h-4 w-4" /> 通过
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
            <XCircle className="h-4 w-4" /> 未通过
          </span>
        )}
      </div>
    </div>
  )
}
