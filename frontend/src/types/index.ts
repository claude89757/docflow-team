export type AgentRole = 'content-generator' | 'content-editor' | 'format-designer' | 'quality-reviewer'

export type AgentStatus = 'pending' | 'working' | 'idle' | 'completed' | 'failed'

export interface AgentState {
  role: AgentRole
  label: string
  status: AgentStatus
}

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

export interface DiffEntry {
  location: string
  original: string
  modified: string
  reason: string
  agent: AgentRole
}
