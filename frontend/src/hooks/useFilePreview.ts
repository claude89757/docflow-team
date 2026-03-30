import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FilePreviewData, WSMessage } from '../types'
import { fetchFilePreview } from '../lib/api'

export function useFilePreview(taskId: string | null, messages: WSMessage[]) {
  const [preview, setPreview] = useState<FilePreviewData | null>(null)
  const [stage, setStage] = useState('output')
  const [loading, setLoading] = useState(false)
  const [availableStages, setAvailableStages] = useState<string[]>([])

  const fileUpdateCount = useMemo(
    () => messages.filter(m => m.type === 'file_update').length,
    [messages],
  )

  // Track available stages from file_update messages
  useEffect(() => {
    const stages = new Set<string>()
    for (const m of messages) {
      if (m.type === 'file_update' && m.file_stage) {
        stages.add(String(m.file_stage))
      }
    }
    if (stages.size > 0 || messages.some(m => m.type === 'team_status' && m.status === 'started')) {
      stages.add('original')
    }
    setAvailableStages([...stages])
  }, [messages])

  const loadPreview = useCallback(async (s: string) => {
    if (!taskId) return
    setLoading(true)
    setStage(s)
    try {
      const data = await fetchFilePreview(taskId, s)
      setPreview(data)
    } catch {
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  // Auto-load when file_update arrives
  useEffect(() => {
    const fileUpdates = messages.filter(m => m.type === 'file_update')
    const lastFileUpdate = fileUpdates[fileUpdates.length - 1]
    if (lastFileUpdate?.file_stage) {
      loadPreview(String(lastFileUpdate.file_stage))
    }
  }, [fileUpdateCount, loadPreview]) // eslint-disable-line react-hooks/exhaustive-deps

  return { preview, stage, loading, availableStages, loadPreview }
}
