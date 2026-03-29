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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {round && (
        <p className="mb-3 text-center text-xs font-medium text-slate-400">
          ── 第 {round} 轮评分 ──
        </p>
      )}

      <div className="space-y-2">
        {dims.map(([key, label]) => {
          const val = scores[key as keyof ScoreResult] as number
          const color = val >= 8 ? 'bg-emerald-500' : val >= 5 ? 'bg-amber-500' : 'bg-rose-500'
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-slate-500">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${color} animate-bar-fill`}
                  style={{ width: `${val * 10}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-slate-600">{val}</span>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm font-semibold text-slate-700">
          总分: {scores.total}/10
        </span>
        {scores.passed ? (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> 通过
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-medium text-rose-500">
            <XCircle className="h-4 w-4" /> 未通过
          </span>
        )}
      </div>
    </div>
  )
}
