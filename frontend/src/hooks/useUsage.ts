import { useState, useEffect } from 'react'
import type { UsageSummary, TaskUsageRecord } from '../types'
import { API_URL } from '../lib/api'

export function useUsage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [history, setHistory] = useState<TaskUsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/usage/summary`),
          fetch(`${API_URL}/api/usage/history?page=1&size=50`),
        ])
        if (sumRes.ok) setSummary(await sumRes.json())
        if (histRes.ok) {
          const data = await histRes.json()
          setHistory(data.items || [])
        }
        if (!sumRes.ok && !histRes.ok) {
          setError('无法加载用量数据')
        }
      } catch {
        setError('网络错误，无法连接服务')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { summary, history, loading, error }
}
