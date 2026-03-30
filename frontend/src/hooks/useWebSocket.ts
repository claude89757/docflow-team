import { useEffect, useRef, useState, useCallback } from 'react'
import type { WSMessage, TokenState, ContextState } from '../types'
import { MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY, MAX_RECONNECT_DELAY, fetchMessages } from '../lib/api'

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

export function useWebSocket(taskId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [tokenState, setTokenState] = useState<TokenState>({ agents: {}, total: { input_tokens: 0, output_tokens: 0 } })
  const [contextState, setContextState] = useState<ContextState>({ agents: {} })
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
    setContextState({ agents: {} })
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
        // 加载历史消息（首次连接时）
        if (taskId) {
          fetchMessages(taskId).then(history => {
            if (history.length > 0) {
              setMessages(prev => prev.length === 0 ? history : prev)
            }
          }).catch(() => {})
        }
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
          } else if (msg.type === 'context_update') {
            const agent = msg.agent as string
            setContextState(prev => ({
              agents: {
                ...prev.agents,
                [agent]: {
                  context_used: (msg.context_used as number) || 0,
                  context_max: (msg.context_max as number) || 200000,
                  percentage: (msg.percentage as number) || 0,
                },
              },
            }))
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

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_input',
        content,
        timestamp: Date.now(),
      }))
    }
  }, [])

  return { messages, connected, clearMessages, tokenState, contextState, sendMessage }
}
