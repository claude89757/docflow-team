import { Crown, Pencil, Palette, Search, FileText } from 'lucide-react'
import type { MemberStatus } from '../../types'

const ICONS: Record<string, React.ReactNode> = {
  'team-lead': <Crown className="h-4 w-4" />,
  'content-generator': <FileText className="h-4 w-4" />,
  'content-editor': <Pencil className="h-4 w-4" />,
  'format-designer': <Palette className="h-4 w-4" />,
  'quality-reviewer': <Search className="h-4 w-4" />,
}

interface Props {
  role: string
  label: string
  status: MemberStatus
}

export function AgentAvatar({ role, label, status }: Props) {
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const isInactive = status === 'inactive'

  return (
    <div
      className={`
        flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300
        ${isActive ? 'bg-indigo-50 animate-glow-pulse' : ''}
        ${isCompleted ? 'bg-emerald-50' : ''}
        ${isInactive ? 'opacity-40' : 'opacity-100'}
      `}
    >
      {/* Avatar circle */}
      <div className={`
        flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300
        ${isActive ? 'bg-indigo-100 text-indigo-600' : ''}
        ${isCompleted ? 'bg-emerald-100 text-emerald-600' : ''}
        ${isInactive ? 'bg-slate-100 text-slate-400' : ''}
      `}>
        {ICONS[role] || <FileText className="h-4 w-4" />}
      </div>

      {/* Label + status */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isInactive ? 'text-slate-400' : 'text-slate-700'}`}>
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`
            inline-block h-1.5 w-1.5 rounded-full
            ${isActive ? 'bg-indigo-500 animate-dot-pulse' : ''}
            ${isCompleted ? 'bg-emerald-500' : ''}
            ${isInactive ? 'bg-slate-300' : ''}
          `} />
          <span className={`text-xs ${isInactive ? 'text-slate-300' : 'text-slate-400'}`}>
            {isActive ? '工作中' : isCompleted ? '完成' : '待命'}
          </span>
        </div>
      </div>
    </div>
  )
}
