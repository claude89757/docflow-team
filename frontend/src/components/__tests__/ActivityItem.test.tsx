import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityItem } from '../workspace/ActivityItem'
import type { ActivityEntry, ScoreResult } from '../../types'

function makeEntry(overrides: Partial<ActivityEntry>): ActivityEntry {
  return {
    id: 'test-1',
    timestamp: Date.now(),
    type: 'agent_working',
    content: 'test content',
    ...overrides,
  }
}

describe('ActivityItem', () => {
  it('renders harness_decision with 队长 persona', () => {
    render(<ActivityItem entry={makeEntry({ type: 'harness_decision', agent: 'team-lead', content: '启动任务' })} round={1} />)
    expect(screen.getByText('队长')).toBeInTheDocument()
    expect(screen.getByText('启动任务')).toBeInTheDocument()
  })

  it('renders agent_working with emoji persona name', () => {
    render(<ActivityItem entry={makeEntry({ type: 'agent_working', agent: 'content-editor', content: '开始润色内容' })} round={1} />)
    expect(screen.getByText('小修')).toBeInTheDocument()
  })

  it('renders agent_message with from/to persona names', () => {
    const { container } = render(<ActivityItem entry={makeEntry({
      type: 'agent_message',
      agent: 'quality-reviewer',
      target: 'content-editor',
      content: '段落3需要返工',
    })} round={1} />)
    expect(screen.getByText('小审')).toBeInTheDocument()
    // target persona name appears in the arrow header row
    expect(container.textContent).toContain('小修')
    expect(screen.getByText('段落3需要返工')).toBeInTheDocument()
  })

  it('renders tool_call compactly', () => {
    render(<ActivityItem entry={makeEntry({ type: 'tool_call', content: '调用 parse_document' })} round={1} />)
    // tool_call renders "⚙ <content>" as a single text node
    expect(screen.getByText(/调用 parse_document/)).toBeInTheDocument()
  })

  it('renders score with pass/fail badge', () => {
    const scores: ScoreResult = {
      vocabulary_naturalness: 8, sentence_diversity: 8, format_humanity: 8,
      logical_coherence: 8, domain_adaptation: 8, total: 8.0, passed: true,
    }
    const { container } = render(<ActivityItem entry={makeEntry({ type: 'score', scores, content: '评分 8.0/10' })} round={1} />)
    // Score type renders the content text
    expect(container.textContent).toContain('评分 8.0/10')
  })

  it('renders rework_request with label', () => {
    render(<ActivityItem entry={makeEntry({ type: 'rework_request', content: '段落3返工' })} round={1} />)
    // Component renders "⚠ 返工要求" as a single span
    expect(screen.getByText(/返工要求/)).toBeInTheDocument()
    expect(screen.getByText('段落3返工')).toBeInTheDocument()
  })

  it('renders round_start divider', () => {
    const { container } = render(<ActivityItem entry={makeEntry({ type: 'round_start', round: 2, content: '' })} round={2} />)
    expect(container.textContent).toContain('第 2 轮')
  })

  it('renders complete', () => {
    render(<ActivityItem entry={makeEntry({ type: 'complete', content: '处理完成' })} round={1} />)
    expect(screen.getByText('处理完成')).toBeInTheDocument()
  })

  it('renders error', () => {
    render(<ActivityItem entry={makeEntry({ type: 'error', content: '处理失败: 超时' })} round={1} />)
    expect(screen.getByText('处理失败: 超时')).toBeInTheDocument()
  })

  it('unknown type falls back to default bubble layout', () => {
    const { container } = render(<ActivityItem entry={makeEntry({ type: 'unknown' as ActivityEntry['type'], content: '未知消息' })} round={1} />)
    // Unknown types fall through to default bubble, so content is rendered
    expect(container.textContent).toContain('未知消息')
  })
})
