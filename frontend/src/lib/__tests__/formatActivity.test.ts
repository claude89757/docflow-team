import { describe, it, expect } from 'vitest'
import { messageToActivity, deriveTeamState } from '../formatActivity'
import type { WSMessage, ScoreResult } from '../../types'

// --- agentLabel / matchAgent are private, tested indirectly through messageToActivity ---

describe('messageToActivity', () => {
  it('converts pipeline_status started to harness_decision', () => {
    const msg: WSMessage = { type: 'pipeline_status', status: 'started' }
    const entry = messageToActivity(msg, 0)
    expect(entry).not.toBeNull()
    expect(entry!.type).toBe('harness_decision')
    expect(entry!.agent).toBe('team-lead')
    expect(entry!.content).toContain('启动')
  })

  it('converts pipeline_status failed to error', () => {
    const msg: WSMessage = { type: 'pipeline_status', status: 'failed', error: '超时' }
    const entry = messageToActivity(msg, 1)
    expect(entry).not.toBeNull()
    expect(entry!.type).toBe('error')
    expect(entry!.content).toContain('超时')
  })

  it('converts pipeline_status failed with no error message', () => {
    const msg: WSMessage = { type: 'pipeline_status', status: 'failed' }
    const entry = messageToActivity(msg, 1)
    expect(entry!.content).toContain('处理失败')
  })

  it('returns null for unknown pipeline_status', () => {
    const msg: WSMessage = { type: 'pipeline_status', status: 'unknown_status' }
    expect(messageToActivity(msg, 0)).toBeNull()
  })

  it('converts agent_status working', () => {
    const msg: WSMessage = { type: 'agent_status', agent: 'content-editor', status: 'working' }
    const entry = messageToActivity(msg, 2)
    expect(entry!.type).toBe('agent_working')
    expect(entry!.agent).toBe('content-editor')
    expect(entry!.content).toContain('内容编辑')
    expect(entry!.content).toContain('开始工作')
  })

  it('converts agent_status completed', () => {
    const msg: WSMessage = { type: 'agent_status', agent: 'format-designer', status: 'completed' }
    const entry = messageToActivity(msg, 3)
    expect(entry!.type).toBe('agent_working')
    expect(entry!.content).toContain('格式设计师')
    expect(entry!.content).toContain('完成')
  })

  it('returns null for unknown agent_status', () => {
    const msg: WSMessage = { type: 'agent_status', agent: 'content-editor', status: 'idle' }
    expect(messageToActivity(msg, 0)).toBeNull()
  })

  it('converts tool_call with Agent tool to harness_decision', () => {
    const msg: WSMessage = { type: 'tool_call', tool: 'Agent', target: 'content-editor' }
    const entry = messageToActivity(msg, 4)
    expect(entry!.type).toBe('harness_decision')
    expect(entry!.agent).toBe('team-lead')
    expect(entry!.target).toBe('content-editor')
    expect(entry!.content).toContain('分配任务')
  })

  it('converts tool_call with SendMessage to harness_decision', () => {
    const msg: WSMessage = { type: 'tool_call', tool: 'SendMessage', target: 'quality-reviewer' }
    const entry = messageToActivity(msg, 5)
    expect(entry!.type).toBe('harness_decision')
    expect(entry!.target).toBe('quality-reviewer')
  })

  it('converts generic tool_call to tool_call type', () => {
    const msg: WSMessage = { type: 'tool_call', tool: 'parse_document', target: '' }
    const entry = messageToActivity(msg, 6)
    expect(entry!.type).toBe('tool_call')
    expect(entry!.content).toContain('parse_document')
  })

  it('converts score_update with passed scores', () => {
    const scores: ScoreResult = {
      vocabulary_naturalness: 8.5,
      sentence_diversity: 8.0,
      format_humanity: 8.2,
      logical_coherence: 8.8,
      domain_adaptation: 8.1,
      total: 8.3,
      passed: true,
    }
    const msg: WSMessage = { type: 'score_update', scores }
    const entry = messageToActivity(msg, 7)
    expect(entry!.type).toBe('score')
    expect(entry!.agent).toBe('quality-reviewer')
    expect(entry!.scores).toBe(scores)
    expect(entry!.content).toContain('8.3')
    expect(entry!.content).toContain('通过')
  })

  it('converts score_update with failed scores', () => {
    const scores: ScoreResult = {
      vocabulary_naturalness: 6.0,
      sentence_diversity: 5.5,
      format_humanity: 5.0,
      logical_coherence: 6.5,
      domain_adaptation: 5.2,
      total: 5.6,
      passed: false,
    }
    const msg: WSMessage = { type: 'score_update', scores }
    const entry = messageToActivity(msg, 8)
    expect(entry!.content).toContain('未通过')
    expect(entry!.content).toContain('返工')
  })

  it('converts pipeline_complete', () => {
    const msg: WSMessage = { type: 'pipeline_complete' }
    const entry = messageToActivity(msg, 9)
    expect(entry!.type).toBe('complete')
    expect(entry!.content).toContain('完成')
  })

  it('returns null for unknown message type', () => {
    const msg: WSMessage = { type: 'unknown_type' }
    expect(messageToActivity(msg, 0)).toBeNull()
  })

  it('generates deterministic IDs from index and type', () => {
    const msg: WSMessage = { type: 'pipeline_complete' }
    const e1 = messageToActivity(msg, 5)
    const e2 = messageToActivity(msg, 5)
    expect(e1!.id).toBe(e2!.id)
    expect(e1!.id).toBe('act-5-pipeline_complete')
  })
})

describe('deriveTeamState', () => {
  it('returns idle state for empty messages', () => {
    const state = deriveTeamState([])
    expect(state.phase).toBe('idle')
    expect(state.activities).toHaveLength(0)
    expect(state.round).toBe(1)
    expect(state.scoreHistory).toHaveLength(0)
    expect(state.latestScores).toBeNull()
    expect(Object.keys(state.members)).toHaveLength(5)
  })

  it('all members start as inactive', () => {
    const state = deriveTeamState([])
    for (const m of Object.values(state.members)) {
      expect(m.status).toBe('inactive')
    }
  })

  it('activates team-lead on pipeline start', () => {
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
    ]
    const state = deriveTeamState(messages)
    expect(state.members['team-lead'].status).toBe('active')
    expect(state.phase).toBe('working')
  })

  it('tracks agent status changes', () => {
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'agent_status', agent: 'content-editor', status: 'working' },
      { type: 'agent_status', agent: 'content-editor', status: 'completed' },
    ]
    const state = deriveTeamState(messages)
    expect(state.members['content-editor'].status).toBe('completed')
  })

  it('activates agent on tool_call delegation', () => {
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'tool_call', tool: 'Agent', target: 'format-designer' },
    ]
    const state = deriveTeamState(messages)
    expect(state.members['format-designer'].status).toBe('active')
  })

  it('records score history', () => {
    const scores: ScoreResult = {
      vocabulary_naturalness: 7, sentence_diversity: 7, format_humanity: 5,
      logical_coherence: 7, domain_adaptation: 7, total: 6.6, passed: false,
    }
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'score_update', scores },
    ]
    const state = deriveTeamState(messages)
    expect(state.scoreHistory).toEqual([6.6])
    expect(state.latestScores).toBe(scores)
  })

  it('increments round on failed score', () => {
    const failedScores: ScoreResult = {
      vocabulary_naturalness: 6, sentence_diversity: 6, format_humanity: 5,
      logical_coherence: 6, domain_adaptation: 6, total: 5.8, passed: false,
    }
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'score_update', scores: failedScores },
    ]
    const state = deriveTeamState(messages)
    expect(state.round).toBe(2)
    expect(state.members['content-editor'].status).toBe('active')
  })

  it('does not increment round on passed score', () => {
    const passedScores: ScoreResult = {
      vocabulary_naturalness: 9, sentence_diversity: 9, format_humanity: 8,
      logical_coherence: 9, domain_adaptation: 8, total: 8.6, passed: true,
    }
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'score_update', scores: passedScores },
    ]
    const state = deriveTeamState(messages)
    expect(state.round).toBe(1)
  })

  it('handles complete pipeline flow', () => {
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'agent_status', agent: 'content-editor', status: 'working' },
      { type: 'agent_status', agent: 'content-editor', status: 'completed' },
      { type: 'score_update', scores: { vocabulary_naturalness: 9, sentence_diversity: 9, format_humanity: 9, logical_coherence: 9, domain_adaptation: 9, total: 9.0, passed: true } },
      { type: 'pipeline_complete' },
    ]
    const state = deriveTeamState(messages)
    expect(state.phase).toBe('completed')
    expect(state.members['team-lead'].status).toBe('completed')
    expect(state.scoreHistory).toEqual([9.0])
    expect(state.activities).toHaveLength(5)
  })

  it('handles failed pipeline', () => {
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'pipeline_status', status: 'failed', error: 'timeout' },
    ]
    const state = deriveTeamState(messages)
    expect(state.phase).toBe('failed')
  })

  it('handles multi-round rework cycle', () => {
    const fail1: ScoreResult = { vocabulary_naturalness: 6, sentence_diversity: 6, format_humanity: 5, logical_coherence: 6, domain_adaptation: 6, total: 5.8, passed: false }
    const pass2: ScoreResult = { vocabulary_naturalness: 9, sentence_diversity: 8, format_humanity: 8, logical_coherence: 9, domain_adaptation: 8, total: 8.4, passed: true }
    const messages: WSMessage[] = [
      { type: 'pipeline_status', status: 'started' },
      { type: 'score_update', scores: fail1 },
      { type: 'agent_status', agent: 'content-editor', status: 'working' },
      { type: 'score_update', scores: pass2 },
      { type: 'pipeline_complete' },
    ]
    const state = deriveTeamState(messages)
    expect(state.round).toBe(2)
    expect(state.scoreHistory).toEqual([5.8, 8.4])
    expect(state.phase).toBe('completed')
  })
})
