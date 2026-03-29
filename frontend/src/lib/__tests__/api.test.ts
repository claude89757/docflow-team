import { describe, it, expect } from 'vitest'
import {
  MAX_FILE_SIZE,
  MAX_DESCRIPTION_LENGTH,
  MAX_ROUNDS,
  MAX_RECONNECT_ATTEMPTS,
  BASE_RECONNECT_DELAY,
  MAX_RECONNECT_DELAY,
  SUPPORTED_EXTENSIONS,
} from '../api'

describe('api constants', () => {
  it('MAX_FILE_SIZE is 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
  })

  it('MAX_DESCRIPTION_LENGTH is 2000', () => {
    expect(MAX_DESCRIPTION_LENGTH).toBe(2000)
  })

  it('MAX_ROUNDS is 3', () => {
    expect(MAX_ROUNDS).toBe(3)
  })

  it('reconnect config is reasonable', () => {
    expect(MAX_RECONNECT_ATTEMPTS).toBe(5)
    expect(BASE_RECONNECT_DELAY).toBe(1000)
    expect(MAX_RECONNECT_DELAY).toBe(15000)
    expect(MAX_RECONNECT_DELAY).toBeGreaterThan(BASE_RECONNECT_DELAY)
  })

  it('SUPPORTED_EXTENSIONS includes all 4 formats', () => {
    expect(SUPPORTED_EXTENSIONS).toContain('.docx')
    expect(SUPPORTED_EXTENSIONS).toContain('.pptx')
    expect(SUPPORTED_EXTENSIONS).toContain('.xlsx')
    expect(SUPPORTED_EXTENSIONS).toContain('.pdf')
    expect(SUPPORTED_EXTENSIONS).toHaveLength(4)
  })
})
