import { useEffect, useRef, useState, useCallback } from 'react'
import type { WSMessage } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

export function useWebSocket(taskId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [connected, setConnected] = useState(false)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!taskId) {
      setMessages([])
      setConnected(false)
      return
    }

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/${taskId}`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectAttempt.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)
          setMessages(prev => [...prev, msg])
        } catch {
          // ignore non-JSON (pong etc)
        }
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        // Reconnect with exponential backoff (max 5 attempts)
        if (reconnectAttempt.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 15000)
          reconnectAttempt.current++
          reconnectTimer.current = setTimeout(connect, delay)
        }
      }

      // Heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 30000)

      return () => {
        clearInterval(heartbeat)
        ws.close()
      }
    }

    const cleanup = connect()

    return () => {
      cleanup?.()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [taskId])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, connected, clearMessages }
}
