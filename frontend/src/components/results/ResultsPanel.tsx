import { useState } from 'react'
import { CheckCircle2, Download, FileText, FileBarChart2, AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import type { WSMessage, ScoreResult } from '../../types'
import { SCORE_LABELS } from '../../types'
import { API_URL } from '../../lib/api'

interface Props {
  taskId: string
  messages: WSMessage[]
  onReset: () => void
}

export function ResultsPanel({ taskId, messages, onReset }: Props) {
  const [expanded, setExpanded] = useState(false)
  const completeMsg = messages.find(m => m.type === 'team_complete')
  const failedMsg = messages.find(m => m.type === 'team_status' && m.status === 'failed')
  const scoreMsg = [...messages].reverse().find(m => m.type === 'score_update')
  const scores = scoreMsg?.scores as ScoreResult | undefined

  if (failedMsg) {
    return (
      <div className="animate-fade-in glass-lg mt-6 p-6" style={{ borderColor: 'rgba(255,59,48,0.15)' }}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-error)' }}>处理失败</h3>
        </div>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {String(failedMsg.error || '未知错误')}
        </p>
        <button
          onClick={onReset}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--btn-radius)' }}
        >
          <RotateCcw className="h-4 w-4" />
          重试
        </button>
      </div>
    )
  }

  if (!completeMsg) return null

  const result = String(completeMsg.result || '')
  const truncated = result.length > 500

  return (
    <div className="animate-fade-in glass-lg mt-6 p-6" style={{ borderColor: 'rgba(52,199,89,0.15)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 animate-check-pop" style={{ color: 'var(--color-success)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>处理完成</h3>
        {scores && (
          <span
            className="ml-auto text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {scores.total}<span className="text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>/10</span>
          </span>
        )}
      </div>

      {/* Score dimensions */}
      {scores && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(SCORE_LABELS).map(([key, label]) => {
            const val = scores[key as keyof ScoreResult] as number
            const color = val >= 8 ? 'var(--color-success)' : 'var(--color-warning)'
            return (
              <span
                key={key}
                className="rounded-md px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${color}10`, color }}
              >
                {label} {val}
              </span>
            )
          })}
        </div>
      )}

      {/* Result text */}
      {result && (
        <div className="mt-4">
          <p
            className={`${expanded ? '' : 'max-h-40'} overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed`}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {expanded || !truncated ? result : result.slice(0, 500) + '...'}
          </p>
          {truncated && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? '收起' : `展开（${result.length} 字符）`}
            </button>
          )}
        </div>
      )}

      {/* Download buttons */}
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`${API_URL}/api/download/${taskId}`}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--btn-radius)' }}
        >
          <Download className="h-4 w-4" />
          下载精修版
        </a>
        <a
          href={`${API_URL}/api/download/${taskId}/report`}
          className="glass flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
          style={{ color: 'var(--color-primary)', borderRadius: 'var(--btn-radius)' }}
        >
          <FileBarChart2 className="h-4 w-4" />
          处理报告
        </a>
        <a
          href={`${API_URL}/api/download/${taskId}/original`}
          className="glass flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)', borderRadius: 'var(--btn-radius)' }}
        >
          <FileText className="h-4 w-4" />
          原始版
        </a>
      </div>

      {/* Reset */}
      <div className="mt-4 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <RotateCcw className="h-4 w-4" />
          处理新文档
        </button>
      </div>
    </div>
  )
}
