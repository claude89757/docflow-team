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
    <div className="animate-slide-up mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
      <TrendingUp className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="shrink-0 text-xs font-medium text-slate-400">质量轨迹</span>

      <div className="flex items-center gap-2 overflow-x-auto">
        {scoreHistory.map((score, i) => (
          <span key={i} className="flex shrink-0 items-center gap-1">
            {i > 0 && <span className="text-xs text-slate-300">→</span>}
            <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${
              score >= 8 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {score}
            </span>
          </span>
        ))}
      </div>

      <span className="shrink-0 text-xs text-slate-300">
        第 {round} 轮 / 最多 {MAX_ROUNDS} 轮
      </span>

      {passed && (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> 达标
        </span>
      )}
    </div>
  )
}
