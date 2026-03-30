import { useState, useCallback, useMemo } from 'react'
import { AppShell } from './components/AppShell'
import { HeroSection } from './components/landing/HeroSection'
import { FeatureCards } from './components/landing/FeatureCards'
import { UnifiedInput } from './components/landing/UnifiedInput'
import { SessionList } from './components/landing/SessionList'
import { TeamWorkspace } from './components/workspace/TeamWorkspace'
import { ResultsPanel } from './components/results/ResultsPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { UsageDashboard } from './components/usage/UsageDashboard'

type Page = 'home' | 'usage'

function App() {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [page, setPage] = useState<Page>('home')
  const { messages, connected, tokenState, contextState, sendMessage } = useWebSocket(taskId)

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
        <div>
          <HeroSection />
          <div className="mx-auto mb-8 max-w-3xl animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}>
            <UnifiedInput onTask={handleTask} />
          </div>
          <div className="mx-auto mt-4 max-w-3xl animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
            <FeatureCards />
          </div>
          <div className="mx-auto mt-6 max-w-3xl animate-slide-up" style={{ animationDelay: '0.45s', animationFillMode: 'backwards' }}>
            <SessionList onSelectTask={handleTask} />
          </div>
        </div>
      )}

      {/* Usage Dashboard */}
      {!taskId && page === 'usage' && <UsageDashboard />}

      {/* Processing */}
      {taskId && (
        <>
          <TeamWorkspace
            messages={messages}
            connected={connected}
            tokenState={tokenState}
            contextState={contextState}
            taskId={taskId || undefined}
            onSendMessage={sendMessage}
          />
          {(teamComplete || teamFailed) && (
            <ResultsPanel taskId={taskId} messages={messages} onReset={handleReset} />
          )}
        </>
      )}
    </AppShell>
  )
}

export default App
