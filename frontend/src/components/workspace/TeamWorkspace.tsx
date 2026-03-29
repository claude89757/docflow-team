import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import type { WSMessage } from '../../types'
import { deriveTeamState } from '../../lib/formatActivity'
import { TeamSidebar } from './TeamSidebar'
import { ActivityStream } from './ActivityStream'
import { QualityTracker } from './QualityTracker'

interface Props {
  messages: WSMessage[]
  connected: boolean
}

export function TeamWorkspace({ messages, connected }: Props) {
  const teamState = useMemo(() => deriveTeamState(messages), [messages])

  if (!connected && messages.length === 0) {
    return (
      <div className="animate-fade-in flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        连接中...
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6 md:flex-row">
        <TeamSidebar members={teamState.members} round={teamState.round} />
        <ActivityStream activities={teamState.activities} round={teamState.round} />
      </div>
      <QualityTracker
        scoreHistory={teamState.scoreHistory}
        round={teamState.round}
        passed={teamState.latestScores?.passed || false}
      />
    </div>
  )
}
