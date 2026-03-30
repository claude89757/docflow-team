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
  | 'user_input'

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

// === Token Tracking Types ===

export interface AgentTokenUsage {
  input_tokens: number
  output_tokens: number
}

export interface TokenState {
  agents: Record<string, AgentTokenUsage>
  total: AgentTokenUsage
}

export interface TaskUsageRecord {
  task_id: string
  mode: string
  started_at: string
  completed_at: string
  duration_seconds: number
  rounds: number
  final_score: number | null
  status: string
  agents: Record<string, AgentTokenUsage>
  total: AgentTokenUsage
}

export interface UsageSummary {
  total_tasks: number
  total_tokens: number
  success_rate: number
  avg_duration_seconds: number
}

// === Session Types ===

export interface SessionInfo {
  task_id: string
  mode: string
  status: string
  description: string | null
  source_file: string | null
  output_file: string | null
  final_score: number | null
  rounds: number
  resumed_count: number
  interrupted_at: string | null
  created_at: string
  updated_at: string
}

// === Conversation Types ===

export interface ConversationMessage {
  id: number
  agent: string
  role: 'system' | 'user' | 'assistant' | 'tool_use' | 'tool_result'
  content: string
  tool_name: string | null
  token_count: number
  created_at: string
}

// === File Preview Types ===

export interface FilePreviewData {
  text: string
  stats: Record<string, unknown>
  stage: string
}

// === Context Window Types ===

export interface ContextState {
  agents: Record<string, { context_used: number; context_max: number; percentage: number }>
}

// === Pricing Types ===

export interface PricingConfig {
  input_price_per_mtok: number
  output_price_per_mtok: number
  model_name: string
  context_window_max: number
}
