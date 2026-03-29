import { useMemo } from 'react'
import type { AgentState, WSMessage, ScoreResult } from '../types'

interface Props {
  messages: WSMessage[]
}

const AGENT_LABELS: Record<string, string> = {
  'content-generator': '内容生成器',
  'content-editor': '内容编辑',
  'format-designer': '格式设计师',
  'quality-reviewer': '质量审核员',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#9ca3af',
  working: '#f59e0b',
  idle: '#6366f1',
  completed: '#22c55e',
  failed: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '等待中',
  working: '工作中',
  idle: '空闲',
  completed: '已完成',
  failed: '失败',
}

export function AgentPanel({ messages }: Props) {
  const { agents, scores, logs, pipelineStatus } = useMemo(() => {
    const agentMap: Record<string, AgentState> = {
      'content-generator': { role: 'content-generator', label: '内容生成器', status: 'pending' },
      'content-editor': { role: 'content-editor', label: '内容编辑', status: 'pending' },
      'format-designer': { role: 'format-designer', label: '格式设计师', status: 'pending' },
      'quality-reviewer': { role: 'quality-reviewer', label: '质量审核员', status: 'pending' },
    }
    let latestScores: ScoreResult | null = null
    const logEntries: string[] = []
    let status = 'pending'

    for (const msg of messages) {
      if (msg.type === 'agent_status') {
        const agent = String(msg.agent || '')
        const agentStatus = String(msg.status || '')
        // 匹配 agent 角色
        for (const key of Object.keys(agentMap)) {
          if (agent.includes(key) || agent.includes(AGENT_LABELS[key])) {
            agentMap[key].status = agentStatus as AgentState['status']
          }
        }
        logEntries.push(`[${key(agentStatus)}] ${agent}`)
      } else if (msg.type === 'score_update') {
        latestScores = msg.scores as ScoreResult
      } else if (msg.type === 'pipeline_status') {
        status = String(msg.status || 'pending')
      } else if (msg.type === 'pipeline_complete') {
        status = 'completed'
      } else if (msg.type === 'tool_call') {
        logEntries.push(`[工具] ${msg.tool} → ${msg.target || ''}`)
      }
    }

    return {
      agents: Object.values(agentMap),
      scores: latestScores,
      logs: logEntries.slice(-20),
      pipelineStatus: status,
    }
  }, [messages])

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Agent 状态面板 */}
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827' }}>AI 精修团队</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agents.map((agent) => (
            <div
              key={agent.role}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                borderLeft: `4px solid ${STATUS_COLORS[agent.status]}`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: STATUS_COLORS[agent.status],
                  animation: agent.status === 'working' ? 'pulse 1.5s infinite' : 'none',
                }}
              />
              <span style={{ flex: 1, fontWeight: 500 }}>{agent.label}</span>
              <span style={{ color: STATUS_COLORS[agent.status], fontSize: 13 }}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>
          ))}
        </div>

        {/* 评分雷达 (简化版: 数字展示) */}
        {scores && (
          <div style={{ marginTop: 20, padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 12px' }}>
              质量评分: {scores.total}/10 {scores.passed ? ' PASS' : ' 未通过'}
            </h4>
            {Object.entries(scores).filter(([k]) => !['total', 'passed'].includes(k)).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 100, fontSize: 13, color: '#6b7280' }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                  <div style={{
                    width: `${(val as number) * 10}%`,
                    height: '100%',
                    background: (val as number) >= 8 ? '#22c55e' : (val as number) >= 5 ? '#f59e0b' : '#ef4444',
                    borderRadius: 3,
                  }} />
                </div>
                <span style={{ width: 30, fontSize: 13, textAlign: 'right' }}>{val as number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 活动日志 */}
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827' }}>活动日志</h3>
        <div style={{
          background: '#111827',
          color: '#d1d5db',
          borderRadius: 8,
          padding: 16,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          maxHeight: 400,
          overflowY: 'auto',
        }}>
          {messages.length === 0 ? (
            <span style={{ color: '#6b7280' }}>等待管线启动...</span>
          ) : (
            messages.map((msg, i) => (
              <div key={i} style={{ color: msg.type === 'pipeline_complete' ? '#22c55e' : '#d1d5db' }}>
                <span style={{ color: '#6b7280' }}>[{msg.type}]</span>{' '}
                {JSON.stringify(
                  Object.fromEntries(Object.entries(msg).filter(([k]) => k !== 'type')),
                  null, 0
                ).slice(0, 120)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function key(s: string) {
  return STATUS_LABELS[s] || s
}
