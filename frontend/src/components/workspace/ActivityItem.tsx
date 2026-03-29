import { Crown, Pencil, Palette, Search, FileText, Wrench, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ActivityEntry } from '../../types'
import { AGENT_LABELS } from '../../types'
import { ScoreCard } from './ScoreCard'

const AGENT_ICONS: Record<string, React.ReactNode> = {
  'team-lead': <Crown className="h-4 w-4" />,
  'content-generator': <FileText className="h-4 w-4" />,
  'content-editor': <Pencil className="h-4 w-4" />,
  'format-designer': <Palette className="h-4 w-4" />,
  'quality-reviewer': <Search className="h-4 w-4" />,
}

function agentIcon(agent?: string) {
  if (!agent) return <Wrench className="h-4 w-4" />
  return AGENT_ICONS[agent] || <FileText className="h-4 w-4" />
}

function timeStr(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

interface Props {
  entry: ActivityEntry
  round: number
}

export function ActivityItem({ entry, round }: Props) {
  const { type, agent, target, content, scores, timestamp } = entry

  // Harness decision (Team Lead)
  if (type === 'harness_decision') {
    return (
      <div className="animate-slide-up flex gap-3 rounded-xl bg-indigo-50 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <Crown className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-indigo-700">Team Lead</span>
            <span className="text-xs text-indigo-400">{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm text-indigo-600">{content}</p>
        </div>
      </div>
    )
  }

  // Agent working
  if (type === 'agent_working') {
    const label = agent ? (AGENT_LABELS[agent] || agent) : ''
    return (
      <div className="animate-slide-up flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {agentIcon(agent)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span className="text-xs text-slate-400">{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm text-slate-500">{content}</p>
        </div>
      </div>
    )
  }

  // Agent message (lateral communication)
  if (type === 'agent_message') {
    const fromLabel = agent ? (AGENT_LABELS[agent] || agent) : ''
    const toLabel = target ? (AGENT_LABELS[target] || target) : ''
    return (
      <div className="animate-slide-up flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {agentIcon(agent)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-700">{fromLabel}</span>
            <span className="text-xs text-slate-400">→</span>
            <span className="text-sm font-medium text-slate-700">{toLabel}</span>
            <span className="text-xs text-slate-400">{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm text-slate-500">{content}</p>
        </div>
      </div>
    )
  }

  // Tool call
  if (type === 'tool_call') {
    return (
      <div className="animate-slide-up flex items-center gap-2 px-3 py-1.5">
        <Wrench className="h-3 w-3 text-slate-300" />
        <span className="text-xs text-slate-400">{content}</span>
        <span className="text-xs text-slate-400">{timeStr(timestamp)}</span>
      </div>
    )
  }

  // Score
  if (type === 'score' && scores) {
    return (
      <div className="animate-slide-up">
        <ScoreCard scores={scores} round={round} />
      </div>
    )
  }

  // Rework request
  if (type === 'rework_request') {
    return (
      <div className="animate-slide-up flex gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <RefreshCw className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-amber-700">返工要求</span>
            <span className="text-xs text-amber-400">{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm text-amber-600">{content}</p>
        </div>
      </div>
    )
  }

  // Round start
  if (type === 'round_start') {
    return (
      <div className="animate-slide-up flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <RefreshCw className="h-3 w-3" /> 第 {entry.round} 轮
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
    )
  }

  // Complete
  if (type === 'complete') {
    return (
      <div className="animate-slide-up flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-check-pop" />
        <span className="text-sm font-medium text-emerald-700">{content}</span>
      </div>
    )
  }

  // Error
  if (type === 'error') {
    return (
      <div className="animate-slide-up flex items-center gap-3 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200">
        <AlertTriangle className="h-6 w-6 text-rose-500" />
        <span className="text-sm font-medium text-rose-700">{content}</span>
      </div>
    )
  }

  return null
}
