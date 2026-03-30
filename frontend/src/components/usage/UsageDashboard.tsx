import { Loader2, AlertCircle } from 'lucide-react'
import { useUsage } from '../../hooks/useUsage'
import { StatCard } from './StatCard'
import { TokenChart } from './TokenChart'
import { TokenDistribution } from './TokenDistribution'
import { TaskHistory } from './TaskHistory'

export function UsageDashboard() {
  const { summary, history, loading, error } = useUsage()

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-20">
        <AlertCircle className="h-8 w-8" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>用量统计</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard icon="📄" label="总任务数" value={summary?.total_tasks || 0} />
        <StatCard icon="🔤" label="总 Token 消耗" value={summary?.total_tokens || 0} />
        <StatCard icon="✅" label="成功率" value={`${summary?.success_rate || 0}%`} />
        <StatCard
          icon="⏱"
          label="平均耗时"
          value={summary?.avg_duration_seconds ? `${Math.round(summary.avg_duration_seconds)}s` : '0s'}
        />
        <StatCard
          icon="💰"
          label="预估总费用"
          value={summary && history.length > 0
            ? `$${history.reduce((sum, h) => {
                const inT = h.total?.input_tokens || 0
                const outT = h.total?.output_tokens || 0
                return sum + (inT / 1_000_000 * 3 + outT / 1_000_000 * 15)
              }, 0).toFixed(2)}`
            : '$0'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <TokenDistribution history={history} />
        <TokenChart history={history} />
      </div>

      {/* History */}
      <TaskHistory history={history} />
    </div>
  )
}
