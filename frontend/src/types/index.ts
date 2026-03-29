export type AgentRole = 'content-generator' | 'content-editor' | 'format-designer' | 'quality-reviewer'

export type AgentStatus = 'pending' | 'working' | 'idle' | 'completed' | 'failed'

export interface WSMessage {
  type: string
  [key: string]: unknown
}

export interface ScoreResult {
  vocabulary_naturalness: number
  sentence_diversity: number
  format_humanity: number
  logical_coherence: number
  domain_adaptation: number
  total: number
  passed: boolean
}

// === Harness-Aware Types ===

export type ActivityType =
  | 'harness_decision'
  | 'agent_working'
  | 'agent_message'
  | 'tool_call'
  | 'score'
  | 'rework_request'
  | 'round_start'
  | 'complete'
  | 'error'

export interface ActivityEntry {
  id: string
  timestamp: number
  type: ActivityType
  agent?: string
  target?: string
  content: string
  scores?: ScoreResult
  round?: number
}

export type MemberStatus = 'inactive' | 'active' | 'completed'

export interface MemberState {
  role: string
  label: string
  status: MemberStatus
}

export interface TeamState {
  members: Record<string, MemberState>
  activities: ActivityEntry[]
  latestScores: ScoreResult | null
  round: number
  scoreHistory: number[]
  phase: 'idle' | 'working' | 'completed' | 'failed'
}

export const AGENT_LABELS: Record<string, string> = {
  'team-lead': 'Team Lead',
  'content-generator': '内容生成器',
  'content-editor': '内容编辑',
  'format-designer': '格式设计师',
  'quality-reviewer': '质量审核员',
}

export const SCORE_LABELS: Record<string, string> = {
  vocabulary_naturalness: '词汇自然度',
  sentence_diversity: '句式多样性',
  format_humanity: '格式人类感',
  logical_coherence: '逻辑连贯性',
  domain_adaptation: '领域适配度',
}
