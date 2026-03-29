import { useState, useCallback, useEffect } from 'react'
import { Sparkles, Loader2, ChevronDown, AlertCircle } from 'lucide-react'
import { API_URL, MAX_DESCRIPTION_LENGTH } from '../../lib/api'

const FORMATS = [
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'pptx', label: 'PPT (.pptx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
]

interface Props {
  onTask: (taskId: string) => void
}

export function GenerateCard({ onTask }: Props) {
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('docx')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Auto-dismiss errors after 5s
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), format }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: '生成失败' }))
        setError(err.detail || '生成失败')
        return
      }
      const data = await res.json()
      onTask(data.task_id)
    } catch {
      setError('网络错误，请检查连接')
    } finally {
      setGenerating(false)
    }
  }, [description, format, onTask])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <div className="relative mb-1">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="描述你需要的文档内容..."
          maxLength={MAX_DESCRIPTION_LENGTH}
          className="mb-0 w-full flex-1 resize-none rounded-xl border border-slate-200 p-4 text-sm text-slate-700 placeholder-slate-300 transition-colors focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          rows={6}
        />
        <span className="absolute bottom-2 right-3 text-xs text-slate-300">
          {description.length}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {/* Format selector */}
        <div className="relative">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm text-slate-600 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            {FORMATS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? '生成中...' : '生成文档'}
        </button>
      </div>

      <p className="mt-2 text-right text-xs text-slate-300">Ctrl+Enter 快速生成</p>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border-l-4 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
