import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import type { ActivityEntry } from '../../types'
import { ActivityItem } from './ActivityItem'

interface Props {
  activities: ActivityEntry[]
  round: number
}

export function ActivityStream({ activities, round }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll) {
      const t = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
      return () => clearTimeout(t)
    }
  }, [activities.length, autoScroll])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAutoScroll(nearBottom)
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        <MessageSquare className="h-3.5 w-3.5" />
        团队协作动态
      </h3>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="glass flex-1 space-y-2 overflow-y-auto p-4"
        style={{ maxHeight: 'min(calc(100vh - 240px), 600px)' }}
      >
        {activities.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            等待团队开始工作...
          </div>
        ) : (
          activities.map((entry) => (
            <ActivityItem key={entry.id} entry={entry} round={round} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {!autoScroll && activities.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true)
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="mt-2 self-center rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ backgroundColor: 'rgba(0, 122, 255, 0.08)', color: 'var(--color-primary)' }}
        >
          跳到最新
        </button>
      )}
    </div>
  )
}
