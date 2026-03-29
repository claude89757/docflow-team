import { useState, useCallback, useEffect } from 'react'
import { Upload, Loader2, AlertCircle, ChevronDown, Sparkles } from 'lucide-react'
import { API_URL, MAX_FILE_SIZE, MAX_DESCRIPTION_LENGTH, SUPPORTED_EXTENSIONS } from '../../lib/api'
import { GlassCard } from '../ui/GlassCard'
import { StarterCards } from './StarterCards'

const FORMATS = [
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'pptx', label: 'PPT (.pptx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
]

type Tab = 'upload' | 'generate'

interface Props {
  onTask: (taskId: string) => void
}

export function UnifiedInput({ onTask }: Props) {
  const [tab, setTab] = useState<Tab>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('docx')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleUpload = useCallback(async (file: File) => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number])) {
      setError(`不支持的格式：${ext}`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 10MB`)
      return
    }
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: '上传失败' }))
        setError(err.detail || '上传失败')
        return
      }
      const data = await res.json()
      const processRes = await fetch(`${API_URL}/api/process/${data.task_id}`, { method: 'POST' })
      if (!processRes.ok) {
        setError('处理启动失败')
        return
      }
      onTask(data.task_id)
    } catch {
      setError('网络错误')
    } finally {
      setUploading(false)
    }
  }, [onTask])

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
      setError('网络错误')
    } finally {
      setGenerating(false)
    }
  }, [description, format, onTask])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const openFilePicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = SUPPORTED_EXTENSIONS.join(',')
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleUpload(file)
      input.remove()
    }
    input.click()
  }

  const handleDemoClick = useCallback(async () => {
    setUploading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: '生成一份关于人工智能在教育领域应用的研究报告，包含现状分析、案例研究和未来展望三个章节。',
          format: 'docx',
        }),
      })
      if (!res.ok) {
        setError('体验启动失败')
        return
      }
      const data = await res.json()
      onTask(data.task_id)
    } catch {
      setError('网络错误')
    } finally {
      setUploading(false)
    }
  }, [onTask])

  return (
    <div>
      <GlassCard className="overflow-hidden p-0">
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'upload' ? 'border-b-2' : ''
            }`}
            style={{
              color: tab === 'upload' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              borderColor: tab === 'upload' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            上传文档
          </button>
          <button
            onClick={() => setTab('generate')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'generate' ? 'border-b-2' : ''
            }`}
            style={{
              color: tab === 'generate' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              borderColor: tab === 'generate' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            从描述生成
          </button>
        </div>

        <div className="p-6">
          {/* Upload Tab */}
          {tab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={!uploading ? openFilePicker : undefined}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) { e.preventDefault(); openFilePicker() } }}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
                uploading ? 'cursor-wait' : 'cursor-pointer'
              } ${dragging ? 'border-[var(--color-primary)] bg-blue-50/30' : 'border-[rgba(0,0,0,0.08)] hover:border-[var(--color-primary)] hover:bg-blue-50/20'}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>上传中...</p>
                </div>
              ) : (
                <>
                  <Upload className="mb-4 h-10 w-10" style={{ color: 'var(--color-text-tertiary)' }} />
                  <p className="mb-1 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    拖拽文件到此处
                  </p>
                  <p className="mb-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    或点击选择文件 · 支持 docx / pptx / xlsx / pdf · 最大 10MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {tab === 'generate' && (
            <div className="space-y-4">
              <StarterCards onSelect={(desc) => setDescription(desc)} />

              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                  placeholder="描述你需要的文档内容..."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className="w-full resize-none rounded-xl p-4 text-sm transition-colors focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    border: '0.5px solid rgba(0,0,0,0.06)',
                    color: 'var(--color-text-primary)',
                  }}
                  rows={4}
                />
                <span className="absolute bottom-2 right-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="glass appearance-none py-2.5 pl-3 pr-8 text-sm focus:outline-none"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !description.trim()}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 'var(--btn-radius)',
                  }}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? '生成中...' : '生成文档'}
                </button>
              </div>

              <p className="text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Ctrl+Enter 快速生成
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(255,59,48,0.06)', color: 'var(--color-error)' }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Demo button */}
      <div className="mt-4 text-center">
        <button
          onClick={handleDemoClick}
          disabled={uploading || generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-40"
          style={{
            color: 'var(--color-primary)',
            borderRadius: 'var(--btn-radius)',
            border: '0.5px solid rgba(0,122,255,0.2)',
          }}
        >
          <Sparkles className="h-4 w-4" />
          一键体验
        </button>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          用示例文档体验完整流程
        </p>
      </div>
    </div>
  )
}
