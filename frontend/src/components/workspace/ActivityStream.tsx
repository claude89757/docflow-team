import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import type { ActivityEntry } from '../../types'
import { ActivityItem } from './ActivityItem'

interface Props {
  activities: ActivityEntry[]
  round: number
}

export function ActivityStream({ activities, round }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activities.length])

  return (
    <div className="flex flex-1 flex-col">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <MessageSquare className="h-3.5 w-3.5" />
        团队协作动态
      </h3>

      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {activities.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            等待团队开始工作...
          </div>
        ) : (
          activities.map((entry) => (
            <ActivityItem key={entry.id} entry={entry} round={round} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
