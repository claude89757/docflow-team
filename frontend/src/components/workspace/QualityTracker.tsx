import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { MAX_ROUNDS } from '../../lib/api'

interface Props {
  scoreHistory: number[]
  round: number
  passed: boolean
}

export function QualityTracker({ scoreHistory, round, passed }: Props) {
  if (scoreHistory.length === 0) return null

  return (
    <div className="animate-slide-up glass mt-4 flex items-center gap-4 px-5 py-3">
      <TrendingUp className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
      <span className="shrink-0 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
        质量轨迹
      </span>

      <div className="flex items-center gap-2 overflow-x-auto">
        {scoreHistory.map((score, i) => (
          <span key={i} className="flex shrink-0 items-center gap-1">
            {i > 0 && (
              <span className="w-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
            )}
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                backgroundColor: score >= 8 ? 'rgba(52,199,89,0.1)' : 'rgba(255,159,10,0.1)',
                color: score >= 8 ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              {score}
            </span>
          </span>
        ))}
      </div>

      <span className="shrink-0 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        第 {round} 轮 / 最多 {MAX_ROUNDS} 轮
      </span>

      {passed && (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
          <CheckCircle2 className="h-3.5 w-3.5" /> 达标
        </span>
      )}
    </div>
  )
}
