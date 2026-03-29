import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreCard } from '../workspace/ScoreCard'
import type { ScoreResult } from '../../types'

const passedScores: ScoreResult = {
  vocabulary_naturalness: 9.0,
  sentence_diversity: 8.5,
  format_humanity: 8.0,
  logical_coherence: 9.2,
  domain_adaptation: 8.8,
  total: 8.7,
  passed: true,
}

const failedScores: ScoreResult = {
  vocabulary_naturalness: 6.0,
  sentence_diversity: 5.5,
  format_humanity: 4.0,
  logical_coherence: 6.5,
  domain_adaptation: 5.2,
  total: 5.4,
  passed: false,
}

describe('ScoreCard', () => {
  it('renders all 5 score dimensions', () => {
    render(<ScoreCard scores={passedScores} />)
    expect(screen.getByText('词汇自然度')).toBeInTheDocument()
    expect(screen.getByText('句式多样性')).toBeInTheDocument()
    expect(screen.getByText('格式人类感')).toBeInTheDocument()
    expect(screen.getByText('逻辑连贯性')).toBeInTheDocument()
    expect(screen.getByText('领域适配度')).toBeInTheDocument()
  })

  it('displays total score', () => {
    const { container } = render(<ScoreCard scores={passedScores} />)
    expect(container.textContent).toContain('8.7/10')
  })

  it('shows pass text when passed', () => {
    const { container } = render(<ScoreCard scores={passedScores} />)
    expect(container.textContent).toContain('通过')
  })

  it('shows fail text when not passed', () => {
    const { container } = render(<ScoreCard scores={failedScores} />)
    expect(container.textContent).toContain('未通过')
  })

  it('shows round label when provided', () => {
    const { container } = render(<ScoreCard scores={passedScores} round={2} />)
    expect(container.textContent).toContain('第 2 轮评分')
  })

  it('does not show round label when not provided', () => {
    const { container } = render(<ScoreCard scores={passedScores} />)
    expect(container.textContent).not.toContain('轮评分')
  })

  it('displays individual score values', () => {
    const { container } = render(<ScoreCard scores={passedScores} />)
    expect(container.textContent).toContain('8.5')
    expect(container.textContent).toContain('9.2')
  })
})
