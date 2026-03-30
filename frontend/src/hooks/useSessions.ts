import { useState, useEffect } from 'react'
import type { SessionInfo } from '../types'
import { fetchSessions } from '../lib/api'

export function useSessions(limit = 5) {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions(limit)
      .then(data => setSessions(data.items || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [limit])

  return { sessions, loading }
}
