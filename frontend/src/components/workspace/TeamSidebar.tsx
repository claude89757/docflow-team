import { Users } from 'lucide-react'
import type { MemberState } from '../../types'
import { AgentAvatar } from './AgentAvatar'

interface Props {
  members: Record<string, MemberState>
}

export function TeamSidebar({ members }: Props) {
  const memberList = Object.values(members)

  return (
    <aside className="w-full shrink-0 md:w-56">
      <div className="sticky top-20">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Users className="h-3.5 w-3.5" />
          AI 团队
        </h3>
        <div className="flex flex-col gap-1">
          {memberList.map((m) => (
            <AgentAvatar key={m.role} role={m.role} label={m.label} status={m.status} />
          ))}
        </div>
      </div>
    </aside>
  )
}
