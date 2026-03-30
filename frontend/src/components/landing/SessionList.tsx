import { Loader2 } from 'lucide-react'
import { useSessions } from '../../hooks/useSessions'

interface Props {
  onSelectTask: (taskId: string) => void
}

function statusIndicator(status: string) {
  if (status === 'completed') return { color: '#34c759', label: '已完成' }
  if (status === 'failed') return { color: '#ff3b30', label: '失败' }
  if (['pending', 'parsing', 'generating', 'editing', 'formatting', 'reviewing', 'reworking'].includes(status)) {
    return { color: '#007aff', label: '进行中', pulse: true }
  }
  return { color: '#ff9f0a', label: '已中断' }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export function SessionList({ onSelectTask }: Props) {
  const { sessions, loading } = useSessions()

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    )
  }

  if (sessions.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        最近会话
      </h3>
      <div className="space-y-1.5">
        {sessions.map(s => {
          const indicator = statusIndicator(s.status)
          return (
            <button
              key={s.task_id}
              onClick={() => onSelectTask(s.task_id)}
              className="glass flex w-full items-center gap-3 p-3 text-left transition-all hover:shadow-sm"
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${indicator.pulse ? 'animate-dot-pulse' : ''}`}
                style={{ backgroundColor: indicator.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {s.source_file || s.description?.slice(0, 30) || s.task_id}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {s.mode === 'generation' ? '生成' : '润色'} · {indicator.label}
                  {s.final_score != null && ` · 评分 ${s.final_score}`}
                  {s.rounds > 0 && ` · ${s.rounds} 轮`}
                </div>
              </div>
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                {timeAgo(s.updated_at)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
