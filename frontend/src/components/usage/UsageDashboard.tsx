import { Loader2 } from 'lucide-react'
import { useUsage } from '../../hooks/useUsage'
import { StatCard } from './StatCard'
import { TokenChart } from './TokenChart'
import { TaskHistory } from './TaskHistory'

export function UsageDashboard() {
  const { summary, history, loading } = useUsage()

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        加载中...
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>用量统计</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon="📄" label="总任务数" value={summary?.total_tasks || 0} />
        <StatCard icon="🔤" label="总 Token 消耗" value={summary?.total_tokens || 0} />
        <StatCard icon="✅" label="成功率" value={`${summary?.success_rate || 0}%`} />
        <StatCard
          icon="⏱"
          label="平均耗时"
          value={summary?.avg_duration_seconds ? `${Math.round(summary.avg_duration_seconds)}s` : '0s'}
        />
      </div>

      {/* Chart */}
      <TokenChart history={history} />

      {/* History */}
      <TaskHistory history={history} />
    </div>
  )
}
