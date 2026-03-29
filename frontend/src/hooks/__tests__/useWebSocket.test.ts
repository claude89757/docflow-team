import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  static instances: MockWebSocket[] = []

  url: string
  readyState = MockWebSocket.OPEN
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null

  sent: string[] = []
  closed = false

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.closed = true
    this.readyState = MockWebSocket.CLOSED
  }

  // Test helpers
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({} as CloseEvent)
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns empty state when taskId is null', () => {
    const { result } = renderHook(() => useWebSocket(null))
    expect(result.current.messages).toEqual([])
    expect(result.current.connected).toBe(false)
  })

  it('connects when taskId is provided', () => {
    renderHook(() => useWebSocket('task-123'))
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].url).toContain('/ws/task-123')
  })

  it('sets connected to true on open', () => {
    const { result } = renderHook(() => useWebSocket('task-123'))
    act(() => {
      MockWebSocket.instances[0].simulateOpen()
    })
    expect(result.current.connected).toBe(true)
  })

  it('accumulates parsed messages', () => {
    const { result } = renderHook(() => useWebSocket('task-123'))
    act(() => {
      MockWebSocket.instances[0].simulateOpen()
      MockWebSocket.instances[0].simulateMessage({ type: 'pipeline_status', status: 'started' })
    })
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].type).toBe('pipeline_status')

    act(() => {
      MockWebSocket.instances[0].simulateMessage({ type: 'agent_status', agent: 'editor', status: 'working' })
    })
    expect(result.current.messages).toHaveLength(2)
  })

  it('ignores non-JSON messages', () => {
    const { result } = renderHook(() => useWebSocket('task-123'))
    act(() => {
      MockWebSocket.instances[0].simulateOpen()
      // Send raw string (not JSON) - simulate by calling onmessage directly
      MockWebSocket.instances[0].onmessage?.(new MessageEvent('message', { data: 'pong' }))
    })
    expect(result.current.messages).toHaveLength(0)
  })

  it('resets messages when taskId changes', () => {
    const { result, rerender } = renderHook(
      ({ taskId }) => useWebSocket(taskId),
      { initialProps: { taskId: 'task-1' as string | null } },
    )
    act(() => {
      MockWebSocket.instances[0].simulateOpen()
      MockWebSocket.instances[0].simulateMessage({ type: 'pipeline_status', status: 'started' })
    })
    expect(result.current.messages).toHaveLength(1)

    // Change taskId
    rerender({ taskId: 'task-2' })
    expect(result.current.messages).toHaveLength(0)
    expect(result.current.connected).toBe(false)
  })

  it('closes old connection on taskId change', () => {
    const { rerender } = renderHook(
      ({ taskId }) => useWebSocket(taskId),
      { initialProps: { taskId: 'task-1' as string | null } },
    )
    const oldWs = MockWebSocket.instances[0]

    rerender({ taskId: 'task-2' })
    expect(oldWs.closed).toBe(true)
    expect(MockWebSocket.instances.length).toBeGreaterThan(1)
  })

  it('clearMessages resets messages array', () => {
    const { result } = renderHook(() => useWebSocket('task-123'))
    act(() => {
      MockWebSocket.instances[0].simulateOpen()
      MockWebSocket.instances[0].simulateMessage({ type: 'pipeline_status', status: 'started' })
    })
    expect(result.current.messages).toHaveLength(1)

    act(() => {
      result.current.clearMessages()
    })
    expect(result.current.messages).toHaveLength(0)
  })

  it('cleans up WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('task-123'))
    const ws = MockWebSocket.instances[0]

    unmount()
    expect(ws.closed).toBe(true)
  })

  it('sends heartbeat ping every 30 seconds', () => {
    renderHook(() => useWebSocket('task-123'))
    const ws = MockWebSocket.instances[0]
    act(() => ws.simulateOpen())

    expect(ws.sent).toHaveLength(0)

    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(ws.sent).toContain('ping')
  })

  it('attempts reconnection on close with backoff', () => {
    renderHook(() => useWebSocket('task-123'))
    const ws = MockWebSocket.instances[0]

    act(() => ws.simulateClose())

    // First reconnect after 1s
    act(() => vi.advanceTimersByTime(1000))
    expect(MockWebSocket.instances).toHaveLength(2)
  })

  it('sets connected to false on error', () => {
    const { result } = renderHook(() => useWebSocket('task-123'))
    act(() => {
      MockWebSocket.instances[0].simulateOpen()
    })
    expect(result.current.connected).toBe(true)

    act(() => {
      MockWebSocket.instances[0].simulateError()
    })
    expect(result.current.connected).toBe(false)
  })
})
