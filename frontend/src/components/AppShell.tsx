import { useState } from 'react'
import { FileText, ExternalLink, Wifi, WifiOff, ArrowLeft, Copy, Check } from 'lucide-react'

interface Props {
  taskId: string | null
  connected: boolean
  onReset?: () => void
  children: React.ReactNode
}

export function AppShell({ taskId, connected, onReset, children }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyTaskId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!taskId) return
    navigator.clipboard.writeText(taskId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {taskId && onReset ? (
              <button
                onClick={onReset}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">返回</span>
              </button>
            ) : (
              <FileText className="h-6 w-6 text-indigo-600" />
            )}
            <span className="text-xl font-bold text-slate-900">docflow-team</span>
          </div>

          <div className="flex items-center gap-4">
            {taskId && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleCopyTaskId}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  title="点击复制 Task ID"
                >
                  {taskId.slice(0, 8)}
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                {connected ? (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-rose-500" />
                )}
              </div>
            )}
            <a
              href="https://github.com/claude89757/docflow-team"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
