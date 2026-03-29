import { useState, useCallback } from 'react'
import { AppShell } from './components/AppShell'
import { UploadCard } from './components/landing/UploadCard'
import { GenerateCard } from './components/landing/GenerateCard'
import { TeamWorkspace } from './components/workspace/TeamWorkspace'
import { ResultsPanel } from './components/results/ResultsPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { Users, Upload, Sparkles } from 'lucide-react'

function App() {
  const [taskId, setTaskId] = useState<string | null>(null)
  const { messages, connected } = useWebSocket(taskId)

  const pipelineComplete = messages.some(m => m.type === 'pipeline_complete')
  const pipelineFailed = messages.some(m => m.type === 'pipeline_status' && m.status === 'failed')

  const handleTask = useCallback((id: string) => {
    setTaskId(id)
  }, [])

  const handleReset = useCallback(() => {
    setTaskId(null)
  }, [])

  return (
    <AppShell taskId={taskId} connected={connected} onReset={handleReset}>
      {/* Landing: no task */}
      {!taskId && (
        <div className="animate-fade-in">
          {/* Hero */}
          <div className="mb-10 text-center">
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              AI 文档精修团队
            </h1>
            <p className="mx-auto max-w-lg text-base text-slate-500">
              由多位 AI 专家组成的自主团队，协作完成文档生成、内容编辑、排版设计和质量审核
            </p>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> 4 位 AI 专家
              </span>
              <span className="flex items-center gap-1.5">
                <Upload className="h-4 w-4" /> docx / pptx / xlsx / pdf
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> 自主协作
              </span>
            </div>
          </div>

          {/* Upload + Generate cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-500">上传已有文档</h3>
              <UploadCard onTask={handleTask} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-500">从描述生成</h3>
              <GenerateCard onTask={handleTask} />
            </div>
          </div>
        </div>
      )}

      {/* Processing: task active */}
      {taskId && (
        <>
          <TeamWorkspace messages={messages} />
          {(pipelineComplete || pipelineFailed) && (
            <ResultsPanel taskId={taskId} messages={messages} onReset={handleReset} />
          )}
        </>
      )}
    </AppShell>
  )
}

export default App
