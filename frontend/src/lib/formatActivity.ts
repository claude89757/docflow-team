import type { WSMessage, ActivityEntry, ScoreResult, TeamState, MemberState } from '../types'
import { AGENT_LABELS } from '../types'

function agentLabel(raw: string): string {
  for (const [key, label] of Object.entries(AGENT_LABELS)) {
    if (raw.includes(key) || raw.includes(label)) return label
  }
  return raw
}

function matchAgent(raw: string): string | undefined {
  for (const key of Object.keys(AGENT_LABELS)) {
    if (raw.includes(key)) return key
  }
  return undefined
}

export function messageToActivity(msg: WSMessage, index: number): ActivityEntry | null {
  const id = `act-${index}-${msg.type}`
  const timestamp = Date.now()

  if (msg.type === 'team_status') {
    const status = String(msg.status || '')
    if (status === 'started') {
      return { id, timestamp, type: 'harness_decision', agent: 'team-lead', content: '启动文档精修任务' }
    }
    if (status === 'failed') {
      return { id, timestamp, type: 'error', content: String(msg.error || '处理失败') }
    }
    return null
  }

  if (msg.type === 'agent_status') {
    const agent = String(msg.agent || '')
    const status = String(msg.status || '')
    const role = matchAgent(agent)
    const label = agentLabel(agent)

    if (status === 'working') {
      return { id, timestamp, type: 'agent_working', agent: role, content: `${label} 开始工作` }
    }
    if (status === 'completed') {
      return { id, timestamp, type: 'agent_working', agent: role, content: `${label} 完成` }
    }
    return null
  }

  if (msg.type === 'tool_call') {
    const tool = String(msg.tool || '')
    const target = String(msg.target || '')
    if (tool === 'Agent' || tool === 'SendMessage') {
      const targetLabel = agentLabel(target)
      return {
        id, timestamp, type: 'harness_decision',
        agent: 'team-lead', target: matchAgent(target),
        content: `分配任务给 ${targetLabel}`,
      }
    }
    return { id, timestamp, type: 'tool_call', content: `调用 ${target || tool}` }
  }

  if (msg.type === 'score_update') {
    const scores = msg.scores as ScoreResult
    const passed = scores?.passed
    const total = scores?.total || 0
    return {
      id, timestamp, type: 'score',
      agent: 'quality-reviewer',
      content: passed ? `评分 ${total}/10 — 通过` : `评分 ${total}/10 — 未通过，需要返工`,
      scores,
    }
  }

  if (msg.type === 'agent_message') {
    const from = matchAgent(String(msg.from || msg.agent || ''))
    const to = matchAgent(String(msg.to || msg.target || ''))
    return {
      id, timestamp, type: 'agent_message',
      agent: from, target: to,
      content: String(msg.content || ''),
    }
  }

  if (msg.type === 'rework_cycle') {
    return {
      id, timestamp, type: 'rework_request',
      agent: 'quality-reviewer',
      content: `第 ${msg.round}/${msg.max} 轮: ${String(msg.reviewer_notes || '需要返工')}`,
      round: Number(msg.round),
    }
  }

  if (msg.type === 'team_complete') {
    return { id, timestamp, type: 'complete', content: '处理完成' }
  }

  return null
}

export function deriveTeamState(messages: WSMessage[]): TeamState {
  const members: Record<string, MemberState> = {
    'team-lead': { role: 'team-lead', label: 'Team Lead', status: 'inactive' },
    'content-generator': { role: 'content-generator', label: '内容生成器', status: 'inactive' },
    'content-editor': { role: 'content-editor', label: '内容编辑', status: 'inactive' },
    'format-designer': { role: 'format-designer', label: '格式设计师', status: 'inactive' },
    'quality-reviewer': { role: 'quality-reviewer', label: '质量审核员', status: 'inactive' },
  }

  const activities: ActivityEntry[] = []
  let latestScores: ScoreResult | null = null
  const scoreHistory: number[] = []
  let round = 1
  let phase: TeamState['phase'] = 'idle'

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const entry = messageToActivity(msg, i)
    if (entry) activities.push(entry)

    // Update member states
    if (msg.type === 'team_status') {
      const status = String(msg.status || '')
      if (status === 'started') {
        members['team-lead'].status = 'active'
        phase = 'working'
      }
      if (status === 'failed') phase = 'failed'
    }

    if (msg.type === 'agent_status') {
      const agent = String(msg.agent || '')
      const status = String(msg.status || '')
      for (const key of Object.keys(members)) {
        if (agent.includes(key) || agent.includes(members[key].label)) {
          if (status === 'working') members[key].status = 'active'
          else if (status === 'completed') members[key].status = 'completed'
        }
      }
    }

    if (msg.type === 'tool_call') {
      const tool = String(msg.tool || '')
      const target = String(msg.target || '')
      if (tool === 'Agent' || tool === 'SendMessage') {
        const role = matchAgent(target)
        if (role && members[role]) members[role].status = 'active'
      }
    }

    if (msg.type === 'score_update') {
      latestScores = msg.scores as ScoreResult
      if (latestScores && typeof latestScores.total === 'number') {
        scoreHistory.push(latestScores.total)
      }
      if (latestScores && !latestScores.passed && scoreHistory.length === round) {
        round++
        members['content-editor'].status = 'active'
      }
    }

    if (msg.type === 'agent_message') {
      const from = matchAgent(String(msg.from || msg.agent || ''))
      const to = matchAgent(String(msg.to || msg.target || ''))
      if (from && members[from]) members[from].status = 'active'
      if (to && members[to]) members[to].status = 'active'
    }

    if (msg.type === 'rework_cycle') {
      round = Number(msg.round) || round + 1
      members['content-editor'].status = 'active'
      activities.push({
        id: `round-${round}`,
        timestamp: Date.now(),
        type: 'round_start',
        content: `第 ${round} 轮`,
        round,
      })
    }

    if (msg.type === 'team_complete') {
      phase = 'completed'
      members['team-lead'].status = 'completed'
    }
  }

  return { members, activities, latestScores, round, scoreHistory, phase }
}
