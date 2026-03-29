import { GlassCard } from '../ui/GlassCard'

const FEATURES = [
  {
    icon: '🤝',
    title: '多专家协作',
    description: '4 位 AI 专家各司其职，像真实编辑团队一样自主协作',
  },
  {
    icon: '🔄',
    title: '质量自驱迭代',
    description: '5 维度评分，不达标自动返工，最多 3 轮打磨到位',
  },
  {
    icon: '📄',
    title: '格式零损耗',
    description: '直接处理 docx/pptx/xlsx/pdf，排版样式原样保留',
  },
]

export function FeatureCards() {
  return (
    <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
      {FEATURES.map((f) => (
        <GlassCard key={f.title} className="p-5 text-center">
          <div className="mb-3 text-3xl">{f.icon}</div>
          <h3 className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {f.title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {f.description}
          </p>
        </GlassCard>
      ))}
    </div>
  )
}
