import { useEffect, useRef, useState, useCallback } from 'react'
import type { WSMessage } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function useWebSocket(taskId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!taskId) return

    const ws = new WebSocket(`${WS_URL}/ws/${taskId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        setMessages(prev => [...prev, msg])
      } catch {
        // ignore non-JSON
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    // 心跳
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      ws.close()
    }
  }, [taskId])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, connected, clearMessages }
}
