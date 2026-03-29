import { FileText, ExternalLink, Wifi, WifiOff, ArrowLeft } from 'lucide-react'

interface Props {
  taskId: string | null
  connected: boolean
  onReset?: () => void
  children: React.ReactNode
}

export function AppShell({ taskId, connected, onReset, children }: Props) {
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
            <span className="text-lg font-semibold text-slate-900">docflow-team</span>
          </div>

          <div className="flex items-center gap-4">
            {taskId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-slate-400">{taskId}</span>
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
              className="text-slate-400 transition-colors hover:text-slate-600"
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
