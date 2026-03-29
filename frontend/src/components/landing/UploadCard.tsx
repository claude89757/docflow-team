import { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, FileSpreadsheet, Presentation, FileType, Loader2, AlertCircle } from 'lucide-react'
import { API_URL, MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from '../../lib/api'

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  '.docx': <FileText className="h-4 w-4" />,
  '.pptx': <Presentation className="h-4 w-4" />,
  '.xlsx': <FileSpreadsheet className="h-4 w-4" />,
  '.pdf': <FileType className="h-4 w-4" />,
}

interface Props {
  onTask: (taskId: string) => void
}

export function UploadCard({ onTask }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Auto-dismiss errors after 5s
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const validateFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number])) {
      return `不支持的格式：${ext}，仅支持 ${SUPPORTED_EXTENSIONS.join('/')}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
    return null
  }

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
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
        setError('处理启动失败，请重试')
        return
      }
      onTask(data.task_id)
    } catch {
      setError('网络错误，请检查连接')
    } finally {
      setUploading(false)
    }
  }, [onTask])

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

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={!uploading ? openFilePicker : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) { e.preventDefault(); openFilePicker() } }}
      className={`
        flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${uploading ? 'cursor-wait' : 'cursor-pointer'}
        ${dragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
        }
      `}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">上传中...</p>
        </div>
      ) : (
        <>
          <Upload className="mb-4 h-10 w-10 text-slate-400" />
          <p className="mb-1 text-base font-medium text-slate-700">拖拽文件到此处</p>
          <p className="mb-4 text-sm text-slate-400">或点击选择文件</p>
          <div className="flex gap-2">
            {Object.entries(FORMAT_ICONS).map(([ext, icon]) => (
              <span key={ext} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                {icon} {ext}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">最大 10MB</p>
        </>
      )}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border-l-4 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
