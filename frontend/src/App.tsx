import { useState, useCallback, useMemo } from 'react'
import { AppShell } from './components/AppShell'
import { HeroSection } from './components/landing/HeroSection'
import { FeatureCards } from './components/landing/FeatureCards'
import { UnifiedInput } from './components/landing/UnifiedInput'
import { TeamWorkspace } from './components/workspace/TeamWorkspace'
import { ResultsPanel } from './components/results/ResultsPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { UsageDashboard } from './components/usage/UsageDashboard'

type Page = 'home' | 'usage'

function App() {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [page, setPage] = useState<Page>('home')
  const { messages, connected } = useWebSocket(taskId)

  const teamComplete = useMemo(() => messages.some(m => m.type === 'team_complete'), [messages])
  const teamFailed = useMemo(() => messages.some(m => m.type === 'team_status' && m.status === 'failed'), [messages])

  const handleTask = useCallback((id: string) => {
    setTaskId(id)
    setPage('home')
  }, [])

  const handleReset = useCallback(() => {
    setTaskId(null)
  }, [])

  const handleNavigate = useCallback((p: Page) => {
    setPage(p)
  }, [])

  return (
    <AppShell
      taskId={taskId}
      connected={connected}
      onReset={handleReset}
      onNavigate={handleNavigate}
      currentPage={page}
    >
      {/* Landing */}
      {!taskId && page === 'home' && (
        <div className="animate-fade-in">
          <HeroSection />
          <FeatureCards />
          <div className="mx-auto max-w-xl">
            <UnifiedInput onTask={handleTask} />
          </div>
        </div>
      )}

      {/* Usage Dashboard */}
      {!taskId && page === 'usage' && <UsageDashboard />}

      {/* Processing */}
      {taskId && (
        <>
          <TeamWorkspace messages={messages} connected={connected} />
          {(teamComplete || teamFailed) && (
            <ResultsPanel taskId={taskId} messages={messages} onReset={handleReset} />
          )}
        </>
      )}
    </AppShell>
  )
}

export default App
