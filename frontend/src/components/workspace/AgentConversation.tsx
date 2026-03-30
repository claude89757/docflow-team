import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { ConversationMessage } from '../../types'
import { fetchConversations } from '../../lib/api'

interface Props {
  taskId: string
  agent: string
}

const ROLE_STYLES: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
  system: { label: 'SYSTEM', color: 'var(--color-text-tertiary)', bg: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.1)' },
  user: { label: 'USER', color: 'var(--color-text-secondary)', bg: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.08)' },
  assistant: { label: 'ASSISTANT', color: '#007aff', bg: 'rgba(0,122,255,0.04)', borderColor: 'rgba(0,122,255,0.2)' },
  tool_use: { label: 'TOOL', color: '#ff9f0a', bg: 'rgba(255,159,10,0.04)', borderColor: 'rgba(255,159,10,0.2)' },
  tool_result: { label: 'RESULT', color: '#34c759', bg: 'rgba(48,209,88,0.04)', borderColor: 'rgba(48,209,88,0.2)' },
}

export function AgentConversation({ taskId, agent }: Props) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchConversations(taskId, agent)
      .then(data => { if (!cancelled) setMessages(data) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [taskId, agent])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <Loader2 className="h-3 w-3 animate-spin" /> 加载对话历史...
      </div>
    )
  }

  if (error) {
    return <div className="p-3 text-xs" style={{ color: 'var(--color-error)' }}>加载失败: {error}</div>
  }

  if (messages.length === 0) {
    return <div className="p-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>暂无对话记录</div>
  }

  return (
    <div className="space-y-1 p-2">
      {messages.map(msg => {
        const style = ROLE_STYLES[msg.role] || ROLE_STYLES.user
        return (
          <div
            key={msg.id}
            className="rounded-md p-2 text-xs"
            style={{ backgroundColor: style.bg, borderLeft: `2px solid ${style.borderColor}` }}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: style.color, fontSize: '10px' }}>{style.label}</span>
              {msg.tool_name && (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>{msg.tool_name}</span>
              )}
              {msg.token_count > 0 && (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '9px', marginLeft: 'auto' }}>
                  {msg.token_count} tokens
                </span>
              )}
            </div>
            <div className="mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--color-text-secondary)' }}>
              {msg.content.length > 500 ? msg.content.slice(0, 500) + '...' : msg.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
