import { useEffect, useRef, useState, useCallback } from 'react'
import type { WSMessage, TokenState } from '../types'
import { MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY, MAX_RECONNECT_DELAY } from '../lib/api'

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

export function useWebSocket(taskId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [tokenState, setTokenState] = useState<TokenState>({ agents: {}, total: { input_tokens: 0, output_tokens: 0 } })
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset state when taskId changes (React-recommended "adjust state during render" pattern)
  const [prevTaskId, setPrevTaskId] = useState(taskId)
  if (taskId !== prevTaskId) {
    setPrevTaskId(taskId)
    setMessages([])
    setConnected(false)
    setTokenState({ agents: {}, total: { input_tokens: 0, output_tokens: 0 } })
  }

  useEffect(() => {
    if (!taskId) return

    function cleanup() {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current)
        heartbeatTimer.current = null
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }

    function connect() {
      cleanup()

      const ws = new WebSocket(`${WS_URL}/ws/${taskId}`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectAttempt.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)
          if (msg.type === 'token_update') {
            const agent = msg.agent as string
            const inputTokens = (msg.input_tokens as number) || 0
            const outputTokens = (msg.output_tokens as number) || 0
            setTokenState(prev => {
              const agents = { ...prev.agents, [agent]: { input_tokens: inputTokens, output_tokens: outputTokens } }
              const totalIn = Object.values(agents).reduce((s, a) => s + a.input_tokens, 0)
              const totalOut = Object.values(agents).reduce((s, a) => s + a.output_tokens, 0)
              return { agents, total: { input_tokens: totalIn, output_tokens: totalOut } }
            })
          } else {
            setMessages(prev => [...prev, msg])
          }
        } catch {
          // ignore non-JSON (pong etc)
        }
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current)
          heartbeatTimer.current = null
        }
        if (reconnectAttempt.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempt.current), MAX_RECONNECT_DELAY)
          reconnectAttempt.current++
          reconnectTimer.current = setTimeout(connect, delay)
        }
      }

      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 30000)
    }

    connect()
    return cleanup
  }, [taskId])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, connected, clearMessages, tokenState }
}
