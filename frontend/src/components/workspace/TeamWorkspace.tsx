import { useMemo } from 'react'
import type { WSMessage } from '../../types'
import { deriveTeamState } from '../../lib/formatActivity'
import { TeamSidebar } from './TeamSidebar'
import { ActivityStream } from './ActivityStream'
import { QualityTracker } from './QualityTracker'

interface Props {
  messages: WSMessage[]
}

export function TeamWorkspace({ messages }: Props) {
  const teamState = useMemo(() => deriveTeamState(messages), [messages])

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6 md:flex-row">
        <TeamSidebar members={teamState.members} />
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
