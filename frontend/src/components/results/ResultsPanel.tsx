import { CheckCircle2, Download, FileText, AlertTriangle, RotateCcw } from 'lucide-react'
import type { WSMessage, ScoreResult } from '../../types'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Props {
  taskId: string
  messages: WSMessage[]
  onReset: () => void
}

export function ResultsPanel({ taskId, messages, onReset }: Props) {
  const completeMsg = messages.find(m => m.type === 'pipeline_complete')
  const failedMsg = messages.find(m => m.type === 'pipeline_status' && m.status === 'failed')
  const scoreMsg = [...messages].reverse().find(m => m.type === 'score_update')
  const scores = scoreMsg?.scores as ScoreResult | undefined

  if (failedMsg) {
    return (
      <div className="animate-fade-in mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
          <h3 className="text-lg font-semibold text-rose-700">处理失败</h3>
        </div>
        <p className="mt-3 text-sm text-rose-600">
          {String(failedMsg.error || '未知错误')}
        </p>
        <button
          onClick={onReset}
          className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <RotateCcw className="h-4 w-4" />
          重试
        </button>
      </div>
    )
  }

  if (!completeMsg) return null

  const result = String(completeMsg.result || '')

  return (
    <div className="animate-fade-in mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-check-pop" />
        <h3 className="text-lg font-semibold text-emerald-700">处理完成</h3>
        {scores && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
            {scores.total}/10
          </span>
        )}
      </div>

      {result && (
        <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {result.slice(0, 1000)}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`${API_URL}/api/download/${taskId}`}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          下载精修版
        </a>
        <a
          href={`${API_URL}/api/download/${taskId}/original`}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <FileText className="h-4 w-4" />
          下载原始版
        </a>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <RotateCcw className="h-4 w-4" />
          处理新文档
        </button>
      </div>
    </div>
  )
}
