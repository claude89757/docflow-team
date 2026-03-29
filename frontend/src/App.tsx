import { useState, useCallback } from 'react'
import { UploadZone } from './components/UploadZone'
import { AgentPanel } from './components/AgentPanel'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const [taskId, setTaskId] = useState<string | null>(null)
  const { messages, connected } = useWebSocket(taskId)

  const pipelineComplete = messages.some(m => m.type === 'pipeline_complete')
  const pipelineResult = messages.find(m => m.type === 'pipeline_complete')

  const handleTask = useCallback((id: string) => {
    setTaskId(id)
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
          docflow-team
        </h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
          AI 文档精修团队 — 生成、编辑、排版、审核，全程可视化
        </p>
        {taskId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              Task: {taskId}
            </span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
            }} />
            <span style={{ fontSize: 12, color: connected ? '#22c55e' : '#ef4444' }}>
              {connected ? 'WebSocket 已连接' : '未连接'}
            </span>
          </div>
        )}
      </header>

      {/* 未开始: 显示上传/生成区 */}
      {!taskId && (
        <UploadZone onUploaded={handleTask} onGenerate={handleTask} />
      )}

      {/* 进行中: 显示 Agent 面板 */}
      {taskId && (
        <>
          <AgentPanel messages={messages} />

          {/* 完成: 显示结果 */}
          {pipelineComplete && (
            <div style={{
              marginTop: 24,
              padding: 20,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
            }}>
              <h3 style={{ margin: '0 0 12px', color: '#166534' }}>处理完成</h3>
              <p style={{ color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {String(pipelineResult?.result || '').slice(0, 500)}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => {
                    setTaskId(null)
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  处理新文档
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export default App
