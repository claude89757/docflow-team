import { Loader2, FileText } from 'lucide-react'
import type { FilePreviewData } from '../../types'

interface Props {
  preview: FilePreviewData | null
  stage: string
  loading: boolean
  availableStages: string[]
  onStageChange: (stage: string) => void
}

const STAGE_LABELS: Record<string, string> = {
  original: '原始',
  draft: '初稿',
  edited: '编辑中',
  formatted: '格式化',
  output: '最终',
}

export function FilePreview({ preview, stage, loading, availableStages, onStageChange }: Props) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col xl:flex">
      <div className="sticky top-20 flex max-h-[calc(100vh-120px)] flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            <FileText className="h-3.5 w-3.5" /> 文件预览
          </h3>
          <span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: 'rgba(0,122,255,0.08)', color: 'var(--color-primary)' }}>
            实时
          </span>
        </div>

        {availableStages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {availableStages.map(s => (
              <button
                key={s}
                onClick={() => onStageChange(s)}
                className="rounded-full px-2 py-0.5 text-[10px] transition-colors"
                style={{
                  backgroundColor: s === stage ? 'rgba(0,122,255,0.12)' : 'rgba(0,0,0,0.03)',
                  color: s === stage ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                  fontWeight: s === stage ? 600 : 400,
                }}
              >
                {STAGE_LABELS[s] || s}
              </button>
            ))}
          </div>
        )}

        <div className="glass flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <Loader2 className="h-3 w-3 animate-spin" /> 加载中...
            </div>
          ) : preview ? (
            <div className="whitespace-pre-wrap text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {preview.text || '(空文件)'}
            </div>
          ) : (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              暂无预览
            </div>
          )}
        </div>

        {preview?.stats && (
          <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {preview.stats.char_count !== undefined && <span>{preview.stats.char_count as number} 字</span>}
            {preview.stats.paragraph_count !== undefined && <span>{preview.stats.paragraph_count as number} 段</span>}
          </div>
        )}
      </div>
    </aside>
  )
}
