import { useState, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Props {
  onUploaded: (taskId: string) => void
  onGenerate: (taskId: string) => void
}

export function UploadZone({ onUploaded, onGenerate }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || '上传失败')
        return
      }
      const data = await res.json()
      // 触发处理
      await fetch(`${API_URL}/api/process/${data.task_id}`, { method: 'POST' })
      onUploaded(data.task_id)
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    setGenerating(true)
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, format: 'docx' }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || '生成失败')
        return
      }
      const data = await res.json()
      onGenerate(data.task_id)
    } finally {
      setGenerating(false)
    }
  }, [description, onGenerate])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
      {/* 上传区 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          flex: 1,
          border: `2px dashed ${dragging ? '#4f46e5' : '#d1d5db'}`,
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          background: dragging ? '#eef2ff' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.docx,.pptx,.xlsx,.pdf'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) handleUpload(file)
          }
          input.click()
        }}
      >
        {uploading ? (
          <p style={{ color: '#6b7280' }}>上传中...</p>
        ) : (
          <>
            <p style={{ fontSize: 18, color: '#374151', margin: '0 0 8px' }}>
              拖拽文件到此处
            </p>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              支持 .docx .pptx .xlsx .pdf (最大 10MB)
            </p>
          </>
        )}
      </div>

      {/* 生成区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述你需要的文档内容..."
          style={{
            flex: 1,
            padding: 16,
            border: '1px solid #d1d5db',
            borderRadius: 12,
            resize: 'none',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          style={{
            padding: '12px 24px',
            background: generating ? '#9ca3af' : '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? '生成中...' : '生成文档'}
        </button>
      </div>
    </div>
  )
}
