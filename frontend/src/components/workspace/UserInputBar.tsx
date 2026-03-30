import { useState, useCallback } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function UserInputBar({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }, [value, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="输入补充要求... (⌘+Enter 发送)"
        className="glass flex-1 px-3 py-2 text-sm outline-none"
        style={{ color: 'var(--color-text-primary)' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
