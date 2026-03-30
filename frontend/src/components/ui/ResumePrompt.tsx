import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { resumeTask } from '../../lib/api'

interface Props {
  taskId: string
  interruptedAt: string | null
  onResumed: () => void
  onRestart: () => void
}

export function ResumePrompt({ taskId, interruptedAt, onResumed, onRestart }: Props) {
  const [resuming, setResuming] = useState(false)

  const handleResume = async () => {
    setResuming(true)
    try {
      await resumeTask(taskId)
      onResumed()
    } catch {
      setResuming(false)
    }
  }

  return (
    <div className="glass mx-auto mb-6 max-w-2xl p-4" style={{ borderColor: 'rgba(255,159,10,0.2)' }}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-warning)' }} />
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            任务中断
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            此任务{interruptedAt ? `在 ${interruptedAt} 阶段` : ''}中断。可以从断点恢复执行。
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleResume}
              disabled={resuming}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-warning)' }}
            >
              {resuming && <Loader2 className="h-3 w-3 animate-spin" />}
              恢复执行
            </button>
            <button
              onClick={onRestart}
              className="glass rounded-lg px-4 py-1.5 text-xs font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              从头开始
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
