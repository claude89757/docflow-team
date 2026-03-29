import { useState, useCallback } from 'react'
import { Sparkles, Loader2, ChevronDown, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

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

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, format }),
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

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="描述你需要的文档内容..."
        className="mb-4 flex-1 resize-none rounded-xl border border-slate-200 p-4 text-sm text-slate-700 placeholder-slate-300 transition-colors focus:border-indigo-300 focus:outline-none"
        rows={6}
      />

      <div className="flex items-center gap-3">
        {/* Format selector */}
        <div className="relative">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm text-slate-600 focus:border-indigo-300 focus:outline-none"
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
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? '生成中...' : '生成文档'}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
