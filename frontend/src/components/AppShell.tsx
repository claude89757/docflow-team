import { useState } from 'react'
import { ExternalLink, ArrowLeft, Copy, Check, BarChart3 } from 'lucide-react'

interface Props {
  taskId: string | null
  connected: boolean
  onReset?: () => void
  onNavigate?: (page: 'home' | 'usage') => void
  currentPage?: string
  children: React.ReactNode
}

export function AppShell({ taskId, connected, onReset, onNavigate, currentPage, children }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyTaskId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!taskId) return
    navigator.clipboard.writeText(taskId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background blobs */}
      <div className="bg-blob bg-blob-purple" style={{ width: 300, height: 300, top: -50, left: '10%' }} />
      <div className="bg-blob bg-blob-blue" style={{ width: 250, height: 250, top: '40%', right: '5%' }} />
      <div className="bg-blob bg-blob-green" style={{ width: 200, height: 200, bottom: '10%', left: '30%' }} />

      {/* Nav */}
      <header className="sticky top-0 z-50 glass" style={{ borderRadius: 0, borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {taskId && onReset ? (
              <button
                onClick={onReset}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">返回</span>
              </button>
            ) : currentPage === 'usage' && onNavigate ? (
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">返回</span>
              </button>
            ) : null}
            <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              DocFlow
            </span>
          </div>

          <div className="flex items-center gap-3">
            {taskId && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleCopyTaskId}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono transition-colors hover:bg-black/5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  title="点击复制 Task ID"
                >
                  {taskId.slice(0, 8)}
                  {copied ? (
                    <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Connection indicator */}
            {taskId && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${connected ? 'animate-dot-pulse' : ''}`}
                  style={{ backgroundColor: connected ? 'var(--color-success)' : 'var(--color-error)' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {connected ? '已连接' : '未连接'}
                </span>
              </div>
            )}

            {/* Usage button */}
            {!taskId && onNavigate && currentPage !== 'usage' && (
              <button
                onClick={() => onNavigate('usage')}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-black/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <BarChart3 className="h-4 w-4" />
                用量
              </button>
            )}

            <a
              href="https://github.com/claude89757/docflow-team"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="rounded-lg p-1 transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
