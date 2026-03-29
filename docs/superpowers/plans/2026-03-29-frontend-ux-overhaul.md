# 前端交互设计全面改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 DocFlow 前端从当前的 Tailwind slate/indigo 风格全面改造为 macOS Sonoma 浅色毛玻璃设计，同时升级 Agent 形象、Landing 页、协作工作区，并新增 Usage 仪表盘。

**Architecture:** 先建立视觉系统基底（CSS 变量 + GlassCard 组件），然后逐层改造各页面组件。后端新增 token 追踪 hook 和 3 个 Usage API。前端新增 recharts 依赖用于趋势图。

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, recharts, Vite, Vitest

---

## File Structure

### 新建文件
| File | Responsibility |
|------|---------------|
| `frontend/src/theme.css` | CSS 变量、毛玻璃类、新动画 |
| `frontend/src/components/ui/GlassCard.tsx` | 通用毛玻璃面板组件 |
| `frontend/src/components/landing/FeatureCards.tsx` | 三大亮点卡片 |
| `frontend/src/components/landing/StarterCards.tsx` | 4 个场景快速启动卡片 |
| `frontend/src/components/landing/HeroSection.tsx` | Hero 区域（标题 + Agent 头像展示） |
| `frontend/src/components/landing/UnifiedInput.tsx` | 统一输入区（Tab 切换上传/生成） |
| `frontend/src/components/workspace/ChatBubble.tsx` | 气泡式消息组件 |
| `frontend/src/components/workspace/AgentArrow.tsx` | Agent 间传递箭头组件 |
| `frontend/src/components/usage/UsageDashboard.tsx` | Usage 仪表盘主页 |
| `frontend/src/components/usage/StatCard.tsx` | 概览统计卡片 |
| `frontend/src/components/usage/TokenChart.tsx` | Token 趋势折线图 |
| `frontend/src/components/usage/TaskHistory.tsx` | 任务历史列表 |
| `frontend/src/hooks/useUsage.ts` | Usage API 数据获取 hook |
| `frontend/src/lib/agents.ts` | Agent 形象常量（Emoji、昵称、颜色） |
| `backend/api/routes/usage.py` | Usage API 路由（3 个 endpoint） |
| `backend/services/usage_tracker.py` | Token 追踪和持久化服务 |

### 修改文件
| File | Changes |
|------|---------|
| `frontend/src/index.css` | 引入 theme.css，更新 body 样式 |
| `frontend/src/App.tsx` | 新增路由逻辑（landing/processing/usage），替换 Landing 组件 |
| `frontend/src/components/AppShell.tsx` | 毛玻璃导航栏，新增 Usage 入口按钮 |
| `frontend/src/components/workspace/TeamWorkspace.tsx` | 传递 tokenState 给子组件 |
| `frontend/src/components/workspace/TeamSidebar.tsx` | 使用新 Agent 形象，显示实时 token |
| `frontend/src/components/workspace/AgentAvatar.tsx` | 重写为 Emoji 人设 + 毛玻璃样式 |
| `frontend/src/components/workspace/ActivityStream.tsx` | 使用 ChatBubble 替代 ActivityItem |
| `frontend/src/components/workspace/ActivityItem.tsx` | 重写为气泡式消息 |
| `frontend/src/components/workspace/ScoreCard.tsx` | 毛玻璃样式 + 内嵌评分色块 |
| `frontend/src/components/workspace/QualityTracker.tsx` | 圆形 badge 连线样式 |
| `frontend/src/components/results/ResultsPanel.tsx` | 毛玻璃大卡片 + token 汇总 |
| `frontend/src/types/index.ts` | 新增 TokenState、UsageSummary 等类型 |
| `frontend/src/lib/api.ts` | 新增 STARTER_SCENARIOS 常量 |
| `frontend/src/lib/formatActivity.ts` | 处理 token_update 消息类型 |
| `frontend/src/hooks/useWebSocket.ts` | 解析 token_update，维护 tokenState |
| `frontend/package.json` | 添加 recharts 依赖 |
| `backend/main.py` | 注册 usage 路由 |
| `backend/models/schemas.py` | 新增 UsageSummary、TaskUsage schema |
| `backend/services/orchestrator/team.py` | 在 hooks 中追踪 token 消耗 |

---

## Task 1: 视觉系统基底 — CSS 变量和主题

**Files:**
- Create: `frontend/src/theme.css`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: 创建 theme.css**

```css
/* frontend/src/theme.css */

/* === macOS Sonoma Design Tokens === */
:root {
  /* Colors - Primary */
  --color-primary: #007aff;
  --color-primary-hover: #0066d6;

  /* Colors - Agent */
  --color-agent-generator: #5e5ce6;
  --color-agent-editor: #007aff;
  --color-agent-designer: #ff9f0a;
  --color-agent-reviewer: #30d158;

  /* Colors - Semantic */
  --color-success: #34c759;
  --color-warning: #ff9f0a;
  --color-error: #ff3b30;

  /* Colors - Text */
  --color-text-primary: rgba(0, 0, 0, 0.85);
  --color-text-secondary: rgba(0, 0, 0, 0.5);
  --color-text-tertiary: rgba(0, 0, 0, 0.35);

  /* Colors - Surface */
  --color-bg: #f5f5f7;
  --color-glass: rgba(255, 255, 255, 0.65);
  --color-glass-hover: rgba(255, 255, 255, 0.8);
  --color-glass-border: rgba(0, 0, 0, 0.04);

  /* Glass */
  --glass-blur: 20px;
  --glass-border: 0.5px solid var(--color-glass-border);
  --glass-radius: 12px;
  --glass-radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);

  /* Button */
  --btn-radius: 980px;
}

/* === Glass Panel === */
.glass {
  background: var(--color-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
}

.glass-lg {
  background: var(--color-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius-lg);
}

/* === New Animation: fade-blur-in === */
@keyframes fade-blur-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }
}

.animate-fade-blur-in {
  animation: fade-blur-in 0.4s ease-out;
}

/* === Color Blobs === */
.bg-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.bg-blob-purple {
  background: rgba(94, 92, 230, 0.06);
}

.bg-blob-blue {
  background: rgba(0, 122, 255, 0.05);
}

.bg-blob-green {
  background: rgba(48, 209, 88, 0.04);
}
```

- [ ] **Step 2: 更新 index.css 引入 theme.css**

Replace the full content of `frontend/src/index.css` with:

```css
@import "tailwindcss";
@import "./theme.css";

/* === Base === */
body {
  @apply m-0 antialiased;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

/* === Animations === */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.3); }
  50% { box-shadow: 0 0 12px 4px rgba(0, 122, 255, 0.15); }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bar-fill {
  from { width: 0; }
}

@keyframes check-pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}

.animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
.animate-dot-pulse { animation: dot-pulse 1.5s ease-in-out infinite; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-fade-in { animation: fade-in 0.4s ease-out; }
.animate-bar-fill { animation: bar-fill 0.8s ease-out; }
.animate-check-pop { animation: check-pop 0.4s ease-out; }
```

- [ ] **Step 3: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译，无错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/theme.css frontend/src/index.css
git commit -m "feat(frontend): 添加 macOS Sonoma 视觉系统基底（CSS 变量 + 毛玻璃类 + 色斑）"
```

---

## Task 2: GlassCard 通用组件 + Agent 形象常量

**Files:**
- Create: `frontend/src/components/ui/GlassCard.tsx`
- Create: `frontend/src/lib/agents.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: 创建 GlassCard 组件**

```tsx
// frontend/src/components/ui/GlassCard.tsx
interface Props {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = false }: Props) {
  return (
    <div
      className={`glass ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: 创建 Agent 形象常量**

```tsx
// frontend/src/lib/agents.ts
export interface AgentPersona {
  key: string
  emoji: string
  name: string
  role: string
  color: string
  bgGradient: string
  borderColor: string
}

export const AGENT_PERSONAS: Record<string, AgentPersona> = {
  'content-generator': {
    key: 'content-generator',
    emoji: '🤖',
    name: '小创',
    role: '内容生成',
    color: '#5e5ce6',
    bgGradient: 'linear-gradient(180deg, #f0edff, #e0dbff)',
    borderColor: 'rgba(94, 92, 230, 0.12)',
  },
  'content-editor': {
    key: 'content-editor',
    emoji: '✍️',
    name: '小修',
    role: '内容编辑',
    color: '#007aff',
    bgGradient: 'linear-gradient(180deg, #e8f4ff, #d4ebff)',
    borderColor: 'rgba(0, 122, 255, 0.12)',
  },
  'format-designer': {
    key: 'format-designer',
    emoji: '🎨',
    name: '小美',
    role: '格式设计',
    color: '#ff9f0a',
    bgGradient: 'linear-gradient(180deg, #fff2e5, #ffe8d4)',
    borderColor: 'rgba(255, 159, 10, 0.12)',
  },
  'quality-reviewer': {
    key: 'quality-reviewer',
    emoji: '🧐',
    name: '小审',
    role: '质量评审',
    color: '#30d158',
    bgGradient: 'linear-gradient(180deg, #e5f9ed, #d4f5e0)',
    borderColor: 'rgba(48, 209, 88, 0.12)',
  },
  'team-lead': {
    key: 'team-lead',
    emoji: '👑',
    name: '队长',
    role: 'Team Lead',
    color: '#007aff',
    bgGradient: 'linear-gradient(180deg, #e8f4ff, #d4ebff)',
    borderColor: 'rgba(0, 122, 255, 0.12)',
  },
}

export function getPersona(agentKey: string): AgentPersona {
  return AGENT_PERSONAS[agentKey] || AGENT_PERSONAS['team-lead']
}
```

- [ ] **Step 3: 更新 types/index.ts 添加新类型**

在 `frontend/src/types/index.ts` 末尾追加:

```typescript
// === Token Tracking Types ===

export interface AgentTokenUsage {
  input_tokens: number
  output_tokens: number
}

export interface TokenState {
  agents: Record<string, AgentTokenUsage>
  total: AgentTokenUsage
}

export interface TaskUsageRecord {
  task_id: string
  mode: string
  started_at: string
  completed_at: string
  duration_seconds: number
  rounds: number
  final_score: number | null
  status: string
  agents: Record<string, AgentTokenUsage>
  total: AgentTokenUsage
}

export interface UsageSummary {
  total_tasks: number
  total_tokens: number
  success_rate: number
  avg_duration_seconds: number
}
```

- [ ] **Step 4: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/GlassCard.tsx frontend/src/lib/agents.ts frontend/src/types/index.ts
git commit -m "feat(frontend): 添加 GlassCard 组件 + Agent 形象常量 + Token 类型定义"
```

---

## Task 3: 导航栏改造 (AppShell)

**Files:**
- Modify: `frontend/src/components/AppShell.tsx`

- [ ] **Step 1: 重写 AppShell.tsx**

Replace the full content of `frontend/src/components/AppShell.tsx`:

```tsx
import { useState } from 'react'
import { ExternalLink, ArrowLeft, Copy, Check, BarChart3 } from 'lucide-react'

interface Props {
  taskId: string | null
  connected: boolean
  onReset?: () => void
  onNavigate?: (page: 'home' | 'usage') => void
  currentPage?: string
  children: React.ReactNode
}

export function AppShell({ taskId, connected, onReset, onNavigate, currentPage, children }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyTaskId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!taskId) return
    navigator.clipboard.writeText(taskId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background blobs */}
      <div className="bg-blob bg-blob-purple" style={{ width: 300, height: 300, top: -50, left: '10%' }} />
      <div className="bg-blob bg-blob-blue" style={{ width: 250, height: 250, top: '40%', right: '5%' }} />
      <div className="bg-blob bg-blob-green" style={{ width: 200, height: 200, bottom: '10%', left: '30%' }} />

      {/* Nav */}
      <header className="sticky top-0 z-50 glass" style={{ borderRadius: 0, borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {taskId && onReset ? (
              <button
                onClick={onReset}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">返回</span>
              </button>
            ) : currentPage === 'usage' && onNavigate ? (
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">返回</span>
              </button>
            ) : null}
            <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              DocFlow
            </span>
          </div>

          <div className="flex items-center gap-3">
            {taskId && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleCopyTaskId}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono transition-colors hover:bg-black/5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  title="点击复制 Task ID"
                >
                  {taskId.slice(0, 8)}
                  {copied ? (
                    <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Connection indicator */}
            {taskId && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${connected ? 'animate-dot-pulse' : ''}`}
                  style={{ backgroundColor: connected ? 'var(--color-success)' : 'var(--color-error)' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {connected ? '已连接' : '未连接'}
                </span>
              </div>
            )}

            {/* Usage button */}
            {!taskId && onNavigate && currentPage !== 'usage' && (
              <button
                onClick={() => onNavigate('usage')}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-black/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <BarChart3 className="h-4 w-4" />
                用量
              </button>
            )}

            <a
              href="https://github.com/claude89757/docflow-team"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="rounded-lg p-1 transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 可能有 TS 错误因为 App.tsx 还没传新 props，先忽略

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AppShell.tsx
git commit -m "feat(frontend): 改造导航栏为毛玻璃样式 + 新增 Usage 入口和背景色斑"
```

---

## Task 4: Landing 页 — HeroSection + FeatureCards

**Files:**
- Create: `frontend/src/components/landing/HeroSection.tsx`
- Create: `frontend/src/components/landing/FeatureCards.tsx`

- [ ] **Step 1: 创建 HeroSection**

```tsx
// frontend/src/components/landing/HeroSection.tsx
import { AGENT_PERSONAS } from '../../lib/agents'

const DISPLAY_AGENTS = ['content-generator', 'content-editor', 'format-designer', 'quality-reviewer']

export function HeroSection() {
  return (
    <div className="mb-10 text-center">
      <h1
        className="mb-3 text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
      >
        AI 文档精修团队
      </h1>
      <p className="mx-auto max-w-lg text-base" style={{ color: 'var(--color-text-secondary)' }}>
        四位 AI 专家组成的自主团队，为你的文档精雕细琢
      </p>

      {/* Agent avatars */}
      <div className="mt-6 flex justify-center gap-4">
        {DISPLAY_AGENTS.map((key) => {
          const agent = AGENT_PERSONAS[key]
          return (
            <div
              key={key}
              className="glass group flex flex-col items-center gap-2 px-4 py-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              title={`${agent.name} — ${agent.role}`}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                style={{ background: agent.bgGradient, border: `0.5px solid ${agent.borderColor}` }}
              >
                {agent.emoji}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: agent.color }}>{agent.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{agent.role}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 FeatureCards**

```tsx
// frontend/src/components/landing/FeatureCards.tsx
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
```

- [ ] **Step 3: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功（组件尚未被引用，所以不会有错）

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/HeroSection.tsx frontend/src/components/landing/FeatureCards.tsx
git commit -m "feat(frontend): 添加 Hero 区域（Agent 头像展示）+ 三大亮点卡片"
```

---

## Task 5: Landing 页 — StarterCards + UnifiedInput

**Files:**
- Create: `frontend/src/components/landing/StarterCards.tsx`
- Create: `frontend/src/components/landing/UnifiedInput.tsx`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: 在 api.ts 中添加 Starter 场景常量**

在 `frontend/src/lib/api.ts` 末尾追加:

```typescript
export const STARTER_SCENARIOS = [
  {
    icon: '📝',
    label: '学术论文润色',
    description: '请帮我润色一篇学术论文，优化学术用语、改善句式多样性、规范格式排版，使其更加专业严谨。',
  },
  {
    icon: '💼',
    label: '商务文档优化',
    description: '请帮我优化一份商务文档，提升用词的专业性和正式感，优化段落结构和排版，使其更具商务气质。',
  },
  {
    icon: '📊',
    label: '技术报告规范化',
    description: '请帮我规范化一份技术报告，统一术语使用、优化图表说明、改善逻辑连贯性，使其更加清晰易读。',
  },
  {
    icon: '📧',
    label: '公文邮件打磨',
    description: '请帮我打磨一份公文或正式邮件，优化措辞的正式程度、调整格式规范、提升整体的专业感。',
  },
] as const
```

- [ ] **Step 2: 创建 StarterCards**

```tsx
// frontend/src/components/landing/StarterCards.tsx
import { STARTER_SCENARIOS } from '../../lib/api'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  onSelect: (description: string) => void
}

export function StarterCards({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STARTER_SCENARIOS.map((s) => (
        <GlassCard key={s.label} hover className="cursor-pointer p-3" >
          <button
            onClick={() => onSelect(s.description)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {s.label}
            </span>
          </button>
        </GlassCard>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: 创建 UnifiedInput**

```tsx
// frontend/src/components/landing/UnifiedInput.tsx
import { useState, useCallback, useEffect } from 'react'
import { Upload, Loader2, AlertCircle, ChevronDown, Sparkles } from 'lucide-react'
import { API_URL, MAX_FILE_SIZE, MAX_DESCRIPTION_LENGTH, SUPPORTED_EXTENSIONS } from '../../lib/api'
import { GlassCard } from '../ui/GlassCard'
import { StarterCards } from './StarterCards'

const FORMATS = [
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'pptx', label: 'PPT (.pptx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
]

type Tab = 'upload' | 'generate'

interface Props {
  onTask: (taskId: string) => void
}

export function UnifiedInput({ onTask }: Props) {
  const [tab, setTab] = useState<Tab>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('docx')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleUpload = useCallback(async (file: File) => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number])) {
      setError(`不支持的格式：${ext}`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 10MB`)
      return
    }
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: '上传失败' }))
        setError(err.detail || '上传失败')
        return
      }
      const data = await res.json()
      const processRes = await fetch(`${API_URL}/api/process/${data.task_id}`, { method: 'POST' })
      if (!processRes.ok) {
        setError('处理启动失败')
        return
      }
      onTask(data.task_id)
    } catch {
      setError('网络错误')
    } finally {
      setUploading(false)
    }
  }, [onTask])

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), format }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: '生成失败' }))
        setError(err.detail || '生成失败')
        return
      }
      const data = await res.json()
      onTask(data.task_id)
    } catch {
      setError('网络错误')
    } finally {
      setGenerating(false)
    }
  }, [description, format, onTask])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const openFilePicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = SUPPORTED_EXTENSIONS.join(',')
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleUpload(file)
      input.remove()
    }
    input.click()
  }

  const handleDemoClick = useCallback(async () => {
    setUploading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: '生成一份关于人工智能在教育领域应用的研究报告，包含现状分析、案例研究和未来展望三个章节。',
          format: 'docx',
        }),
      })
      if (!res.ok) {
        setError('体验启动失败')
        return
      }
      const data = await res.json()
      onTask(data.task_id)
    } catch {
      setError('网络错误')
    } finally {
      setUploading(false)
    }
  }, [onTask])

  return (
    <div>
      <GlassCard className="overflow-hidden p-0">
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'upload' ? 'border-b-2' : ''
            }`}
            style={{
              color: tab === 'upload' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              borderColor: tab === 'upload' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            上传文档
          </button>
          <button
            onClick={() => setTab('generate')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'generate' ? 'border-b-2' : ''
            }`}
            style={{
              color: tab === 'generate' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              borderColor: tab === 'generate' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            从描述生成
          </button>
        </div>

        <div className="p-6">
          {/* Upload Tab */}
          {tab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={!uploading ? openFilePicker : undefined}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) { e.preventDefault(); openFilePicker() } }}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
                uploading ? 'cursor-wait' : 'cursor-pointer'
              } ${dragging ? 'border-[var(--color-primary)] bg-blue-50/30' : 'border-[rgba(0,0,0,0.08)] hover:border-[var(--color-primary)] hover:bg-blue-50/20'}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>上传中...</p>
                </div>
              ) : (
                <>
                  <Upload className="mb-4 h-10 w-10" style={{ color: 'var(--color-text-tertiary)' }} />
                  <p className="mb-1 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    拖拽文件到此处
                  </p>
                  <p className="mb-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    或点击选择文件 · 支持 docx / pptx / xlsx / pdf · 最大 10MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {tab === 'generate' && (
            <div className="space-y-4">
              <StarterCards onSelect={(desc) => setDescription(desc)} />

              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                  placeholder="描述你需要的文档内容..."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className="w-full resize-none rounded-xl p-4 text-sm transition-colors focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    border: '0.5px solid rgba(0,0,0,0.06)',
                    color: 'var(--color-text-primary)',
                  }}
                  rows={4}
                />
                <span className="absolute bottom-2 right-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="glass appearance-none py-2.5 pl-3 pr-8 text-sm focus:outline-none"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !description.trim()}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 'var(--btn-radius)',
                  }}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? '生成中...' : '生成文档'}
                </button>
              </div>

              <p className="text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Ctrl+Enter 快速生成
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(255,59,48,0.06)', color: 'var(--color-error)' }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Demo button */}
      <div className="mt-4 text-center">
        <button
          onClick={handleDemoClick}
          disabled={uploading || generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-40"
          style={{
            color: 'var(--color-primary)',
            borderRadius: 'var(--btn-radius)',
            border: '0.5px solid rgba(0,122,255,0.2)',
          }}
        >
          <Sparkles className="h-4 w-4" />
          一键体验
        </button>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          用示例文档体验完整流程
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/landing/StarterCards.tsx frontend/src/components/landing/UnifiedInput.tsx frontend/src/lib/api.ts
git commit -m "feat(frontend): 添加 Starter 场景卡片 + 统一输入区（Tab 切换上传/生成）+ 一键体验"
```

---

## Task 6: App.tsx 整合 Landing 页 + 路由

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 重写 App.tsx**

Replace the full content of `frontend/src/App.tsx`:

```tsx
import { useState, useCallback, useMemo } from 'react'
import { AppShell } from './components/AppShell'
import { HeroSection } from './components/landing/HeroSection'
import { FeatureCards } from './components/landing/FeatureCards'
import { UnifiedInput } from './components/landing/UnifiedInput'
import { TeamWorkspace } from './components/workspace/TeamWorkspace'
import { ResultsPanel } from './components/results/ResultsPanel'
import { useWebSocket } from './hooks/useWebSocket'

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

      {/* Usage Dashboard (lazy load later) */}
      {!taskId && page === 'usage' && (
        <div className="animate-fade-in py-10 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          用量仪表盘（将在 Task 11 实现）
        </div>
      )}

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
```

- [ ] **Step 2: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译

- [ ] **Step 3: 手动测试 Landing 页**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run dev`

在浏览器打开 http://localhost:5173，验证:
- 浅灰背景 + 背景色斑可见
- 毛玻璃导航栏
- Hero 区域 + 4 个 Agent 头像卡片
- 3 个亮点卡片
- Tab 切换上传/生成
- Starter 场景卡片点击填入描述
- 一键体验按钮

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): 整合 Landing 页新组件 + 简单路由（home/usage）"
```

---

## Task 7: AgentAvatar 重写为 Emoji 人设 + 毛玻璃

**Files:**
- Modify: `frontend/src/components/workspace/AgentAvatar.tsx`
- Modify: `frontend/src/components/workspace/TeamSidebar.tsx`

- [ ] **Step 1: 重写 AgentAvatar**

Replace the full content of `frontend/src/components/workspace/AgentAvatar.tsx`:

```tsx
import type { MemberStatus } from '../../types'
import { getPersona } from '../../lib/agents'

interface Props {
  role: string
  label: string
  status: MemberStatus
  tokens?: number
}

export function AgentAvatar({ role, status, tokens }: Props) {
  const persona = getPersona(role)
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const isInactive = status === 'inactive'

  return (
    <div
      className={`glass flex items-center gap-3 px-3 py-2.5 transition-all duration-300 ${
        isActive ? 'animate-glow-pulse' : ''
      } ${isInactive ? 'opacity-45' : ''}`}
      style={isActive ? { borderColor: `${persona.color}20`, boxShadow: `0 0 12px ${persona.color}15` } : undefined}
    >
      {/* Emoji avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
      >
        {persona.emoji}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: isInactive ? 'var(--color-text-tertiary)' : persona.color }}>
          {persona.name}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isActive ? 'animate-dot-pulse' : ''}`}
            style={{
              backgroundColor: isActive ? persona.color : isCompleted ? 'var(--color-success)' : 'rgba(0,0,0,0.15)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {isActive ? '工作中' : isCompleted ? '完成' : '待命'}
          </span>
        </div>
        {typeof tokens === 'number' && tokens > 0 && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {tokens.toLocaleString()} tokens
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 重写 TeamSidebar**

Replace the full content of `frontend/src/components/workspace/TeamSidebar.tsx`:

```tsx
import type { MemberState, TokenState } from '../../types'
import { AgentAvatar } from './AgentAvatar'
import { MAX_ROUNDS } from '../../lib/api'

interface Props {
  members: Record<string, MemberState>
  round: number
  tokenState?: TokenState
}

export function TeamSidebar({ members, round, tokenState }: Props) {
  const displayMembers = Object.values(members).filter(m => m.role !== 'team-lead')

  return (
    <aside className="w-full shrink-0 md:w-56">
      <div className="sticky top-20">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            AI 团队
          </h3>
          {round > 0 && (
            <span className="glass px-2 py-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              第 {round} 轮 / 最多 {MAX_ROUNDS} 轮
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {displayMembers.map((m) => (
            <AgentAvatar
              key={m.role}
              role={m.role}
              label={m.label}
              status={m.status}
              tokens={tokenState?.agents[m.role] ? tokenState.agents[m.role].input_tokens + tokenState.agents[m.role].output_tokens : undefined}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 可能有 TS 错误因为 TeamWorkspace 还没传 round/tokenState，下一个 Task 会修

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/workspace/AgentAvatar.tsx frontend/src/components/workspace/TeamSidebar.tsx
git commit -m "feat(frontend): 重写 Agent 头像为 Emoji 人设 + 毛玻璃卡片 + 实时 token 展示"
```

---

## Task 8: ActivityItem 重写为气泡式 + TeamWorkspace 更新

**Files:**
- Modify: `frontend/src/components/workspace/ActivityItem.tsx`
- Modify: `frontend/src/components/workspace/ScoreCard.tsx`
- Modify: `frontend/src/components/workspace/QualityTracker.tsx`
- Modify: `frontend/src/components/workspace/ActivityStream.tsx`
- Modify: `frontend/src/components/workspace/TeamWorkspace.tsx`

- [ ] **Step 1: 重写 ActivityItem 为气泡式消息**

Replace the full content of `frontend/src/components/workspace/ActivityItem.tsx`:

```tsx
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ActivityEntry } from '../../types'
import { getPersona } from '../../lib/agents'
import { SCORE_LABELS } from '../../types'
import type { ScoreResult } from '../../types'

function timeStr(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

interface Props {
  entry: ActivityEntry
  round: number
}

export function ActivityItem({ entry }: Props) {
  const { type, agent, target, content, scores, timestamp } = entry

  const persona = agent ? getPersona(agent) : getPersona('team-lead')
  const targetPersona = target ? getPersona(target) : null

  // Round start separator
  if (type === 'round_start') {
    return (
      <div className="animate-slide-up flex items-center gap-3 py-2">
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          <RefreshCw className="h-3 w-3" /> 第 {entry.round} 轮
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
      </div>
    )
  }

  // Complete
  if (type === 'complete') {
    return (
      <div className="animate-slide-up glass flex items-center gap-3 p-4" style={{ borderColor: 'rgba(52,199,89,0.15)' }}>
        <CheckCircle2 className="h-6 w-6 animate-check-pop" style={{ color: 'var(--color-success)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>{content}</span>
      </div>
    )
  }

  // Error
  if (type === 'error') {
    return (
      <div className="animate-slide-up glass flex items-center gap-3 p-4" style={{ borderColor: 'rgba(255,59,48,0.15)' }}>
        <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{content}</span>
      </div>
    )
  }

  // Tool call (minimal)
  if (type === 'tool_call') {
    return (
      <div className="animate-slide-up flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>⚙ {content}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
      </div>
    )
  }

  // Agent message arrow
  if (type === 'agent_message' && targetPersona) {
    return (
      <div className="animate-slide-up space-y-1">
        {/* Arrow */}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {persona.emoji} {persona.name}
          </span>
          <span className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {targetPersona.emoji} {targetPersona.name}
          </span>
        </div>
        {/* Bubble */}
        <div className="flex gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
          >
            {persona.emoji}
          </div>
          <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0 }}>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold" style={{ color: persona.color }}>{persona.name}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
            </div>
            <p className="mt-0.5 break-words text-sm" style={{ color: 'var(--color-text-secondary)' }}>{content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Score with inline dimensions
  if (type === 'score' && scores) {
    return (
      <div className="animate-slide-up flex gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
        >
          {persona.emoji}
        </div>
        <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0 }}>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold" style={{ color: persona.color }}>{persona.name}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{content}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(SCORE_LABELS).map(([key, label]) => {
              const val = (scores as ScoreResult)[key as keyof ScoreResult] as number
              const color = val >= 8 ? 'var(--color-success)' : 'var(--color-warning)'
              return (
                <span
                  key={key}
                  className="rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${color}10`, color }}
                >
                  {label} {val}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Rework request
  if (type === 'rework_request') {
    return (
      <div className="animate-slide-up flex gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
        >
          {persona.emoji}
        </div>
        <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0, borderColor: 'rgba(255,159,10,0.15)' }}>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>⚠ 返工要求</span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
          </div>
          <p className="mt-0.5 break-words text-sm" style={{ color: 'var(--color-warning)' }}>{content}</p>
        </div>
      </div>
    )
  }

  // Default: harness_decision, agent_working
  return (
    <div className="animate-slide-up flex gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
        style={{ background: persona.bgGradient, border: `0.5px solid ${persona.borderColor}` }}
      >
        {persona.emoji}
      </div>
      <div className="glass min-w-0 flex-1 p-3" style={{ borderTopLeftRadius: 0 }}>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: persona.color }}>{persona.name}</span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeStr(timestamp)}</span>
        </div>
        <p className="mt-0.5 break-words text-sm" style={{ color: 'var(--color-text-secondary)' }}>{content}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新 ScoreCard 为毛玻璃样式**

Replace the full content of `frontend/src/components/workspace/ScoreCard.tsx`:

```tsx
import { CheckCircle2, XCircle } from 'lucide-react'
import type { ScoreResult } from '../../types'
import { SCORE_LABELS } from '../../types'

interface Props {
  scores: ScoreResult
  round?: number
}

export function ScoreCard({ scores, round }: Props) {
  const dims = Object.entries(SCORE_LABELS)

  return (
    <div className="glass p-4">
      {round && (
        <p className="mb-3 text-center text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          ── 第 {round} 轮评分 ──
        </p>
      )}

      <div className="space-y-2">
        {dims.map(([key, label]) => {
          const val = scores[key as keyof ScoreResult] as number
          const color = val >= 8 ? 'var(--color-success)' : val >= 5 ? 'var(--color-warning)' : 'var(--color-error)'
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                <div
                  className="h-full rounded-full animate-bar-fill"
                  style={{ width: `${val * 10}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          总分: {scores.total}/10
        </span>
        {scores.passed ? (
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-success)' }}>
            <CheckCircle2 className="h-4 w-4" /> 通过
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
            <XCircle className="h-4 w-4" /> 未通过
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 更新 QualityTracker 为毛玻璃 + 圆形 badge**

Replace the full content of `frontend/src/components/workspace/QualityTracker.tsx`:

```tsx
import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { MAX_ROUNDS } from '../../lib/api'

interface Props {
  scoreHistory: number[]
  round: number
  passed: boolean
}

export function QualityTracker({ scoreHistory, round, passed }: Props) {
  if (scoreHistory.length === 0) return null

  return (
    <div className="animate-slide-up glass mt-4 flex items-center gap-4 px-5 py-3">
      <TrendingUp className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
      <span className="shrink-0 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
        质量轨迹
      </span>

      <div className="flex items-center gap-2 overflow-x-auto">
        {scoreHistory.map((score, i) => (
          <span key={i} className="flex shrink-0 items-center gap-1">
            {i > 0 && (
              <span className="w-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
            )}
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                backgroundColor: score >= 8 ? 'rgba(52,199,89,0.1)' : 'rgba(255,159,10,0.1)',
                color: score >= 8 ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              {score}
            </span>
          </span>
        ))}
      </div>

      <span className="shrink-0 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        第 {round} 轮 / 最多 {MAX_ROUNDS} 轮
      </span>

      {passed && (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
          <CheckCircle2 className="h-3.5 w-3.5" /> 达标
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 更新 TeamWorkspace 传递新 props**

Replace the full content of `frontend/src/components/workspace/TeamWorkspace.tsx`:

```tsx
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import type { WSMessage } from '../../types'
import { deriveTeamState } from '../../lib/formatActivity'
import { TeamSidebar } from './TeamSidebar'
import { ActivityStream } from './ActivityStream'
import { QualityTracker } from './QualityTracker'

interface Props {
  messages: WSMessage[]
  connected: boolean
}

export function TeamWorkspace({ messages, connected }: Props) {
  const teamState = useMemo(() => deriveTeamState(messages), [messages])

  if (!connected && messages.length === 0) {
    return (
      <div className="animate-fade-in flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        连接中...
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6 md:flex-row">
        <TeamSidebar members={teamState.members} round={teamState.round} />
        <ActivityStream activities={teamState.activities} round={teamState.round} />
      </div>
      <QualityTracker
        scoreHistory={teamState.scoreHistory}
        round={teamState.round}
        passed={teamState.latestScores?.passed || false}
      />
    </div>
  )
}
```

- [ ] **Step 5: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/workspace/
git commit -m "feat(frontend): 重写协作工作区为气泡式对话 + 毛玻璃面板 + Emoji Agent"
```

---

## Task 9: ResultsPanel 改造

**Files:**
- Modify: `frontend/src/components/results/ResultsPanel.tsx`

- [ ] **Step 1: 重写 ResultsPanel**

Replace the full content of `frontend/src/components/results/ResultsPanel.tsx`:

```tsx
import { useState } from 'react'
import { CheckCircle2, Download, FileText, FileBarChart2, AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import type { WSMessage, ScoreResult } from '../../types'
import { SCORE_LABELS } from '../../types'
import { API_URL } from '../../lib/api'

interface Props {
  taskId: string
  messages: WSMessage[]
  onReset: () => void
}

export function ResultsPanel({ taskId, messages, onReset }: Props) {
  const [expanded, setExpanded] = useState(false)
  const completeMsg = messages.find(m => m.type === 'team_complete')
  const failedMsg = messages.find(m => m.type === 'team_status' && m.status === 'failed')
  const scoreMsg = [...messages].reverse().find(m => m.type === 'score_update')
  const scores = scoreMsg?.scores as ScoreResult | undefined

  if (failedMsg) {
    return (
      <div className="animate-fade-in glass-lg mt-6 p-6" style={{ borderColor: 'rgba(255,59,48,0.15)' }}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-error)' }}>处理失败</h3>
        </div>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {String(failedMsg.error || '未知错误')}
        </p>
        <button
          onClick={onReset}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--btn-radius)' }}
        >
          <RotateCcw className="h-4 w-4" />
          重试
        </button>
      </div>
    )
  }

  if (!completeMsg) return null

  const result = String(completeMsg.result || '')
  const truncated = result.length > 500

  return (
    <div className="animate-fade-in glass-lg mt-6 p-6" style={{ borderColor: 'rgba(52,199,89,0.15)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 animate-check-pop" style={{ color: 'var(--color-success)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>处理完成</h3>
        {scores && (
          <span
            className="ml-auto text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {scores.total}<span className="text-sm font-normal" style={{ color: 'var(--color-text-tertiary)' }}>/10</span>
          </span>
        )}
      </div>

      {/* Score dimensions */}
      {scores && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(SCORE_LABELS).map(([key, label]) => {
            const val = scores[key as keyof ScoreResult] as number
            const color = val >= 8 ? 'var(--color-success)' : 'var(--color-warning)'
            return (
              <span
                key={key}
                className="rounded-md px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${color}10`, color }}
              >
                {label} {val}
              </span>
            )
          })}
        </div>
      )}

      {/* Result text */}
      {result && (
        <div className="mt-4">
          <p
            className={`${expanded ? '' : 'max-h-40'} overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed`}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {expanded || !truncated ? result : result.slice(0, 500) + '...'}
          </p>
          {truncated && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? '收起' : `展开（${result.length} 字符）`}
            </button>
          )}
        </div>
      )}

      {/* Download buttons */}
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`${API_URL}/api/download/${taskId}`}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--btn-radius)' }}
        >
          <Download className="h-4 w-4" />
          下载精修版
        </a>
        <a
          href={`${API_URL}/api/download/${taskId}/report`}
          className="glass flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
          style={{ color: 'var(--color-primary)', borderRadius: 'var(--btn-radius)' }}
        >
          <FileBarChart2 className="h-4 w-4" />
          处理报告
        </a>
        <a
          href={`${API_URL}/api/download/${taskId}/original`}
          className="glass flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)', borderRadius: 'var(--btn-radius)' }}
        >
          <FileText className="h-4 w-4" />
          原始版
        </a>
      </div>

      {/* Reset */}
      <div className="mt-4 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <RotateCcw className="h-4 w-4" />
          处理新文档
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/results/ResultsPanel.tsx
git commit -m "feat(frontend): 改造结果页为毛玻璃大卡片 + 胶囊按钮 + 评分色块"
```

---

## Task 10: 后端 — Token 追踪 + Usage API

**Files:**
- Create: `backend/services/usage_tracker.py`
- Create: `backend/api/routes/usage.py`
- Modify: `backend/services/orchestrator/team.py`
- Modify: `backend/models/schemas.py`
- Modify: `backend/main.py`

- [ ] **Step 1: 创建 usage_tracker.py**

```python
# backend/services/usage_tracker.py
"""Token 用量追踪和持久化"""

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

logger = logging.getLogger("docflow.usage")


class UsageTracker:
    """追踪单次任务的 token 消耗"""

    def __init__(self, task_id: str, task_dir: str, mode: str):
        self.task_id = task_id
        self.task_dir = task_dir
        self.mode = mode
        self.started_at = datetime.now(UTC).isoformat()
        self.agents: dict[str, dict[str, int]] = {}
        self.rounds = 1
        self.final_score: float | None = None
        self.status = "processing"

    def add_tokens(self, agent_key: str, input_tokens: int, output_tokens: int) -> dict:
        """累加 agent 的 token 消耗，返回当前 agent 累计值"""
        if agent_key not in self.agents:
            self.agents[agent_key] = {"input_tokens": 0, "output_tokens": 0}
        self.agents[agent_key]["input_tokens"] += input_tokens
        self.agents[agent_key]["output_tokens"] += output_tokens
        return self.agents[agent_key]

    def get_total(self) -> dict[str, int]:
        total_in = sum(a["input_tokens"] for a in self.agents.values())
        total_out = sum(a["output_tokens"] for a in self.agents.values())
        return {"input_tokens": total_in, "output_tokens": total_out}

    def save(self) -> None:
        """持久化到 usage.json"""
        total = self.get_total()
        completed_at = datetime.now(UTC).isoformat()

        data = {
            "task_id": self.task_id,
            "mode": self.mode,
            "started_at": self.started_at,
            "completed_at": completed_at,
            "rounds": self.rounds,
            "final_score": self.final_score,
            "status": self.status,
            "agents": self.agents,
            "total": total,
        }

        path = Path(self.task_dir) / "usage.json"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
        logger.info("usage saved task=%s total_tokens=%d", self.task_id, total["input_tokens"] + total["output_tokens"])


def load_all_usage(uploads_dir: str) -> list[dict]:
    """扫描所有任务目录，收集 usage.json"""
    results = []
    uploads = Path(uploads_dir)
    if not uploads.exists():
        return results
    for task_dir in uploads.iterdir():
        if not task_dir.is_dir():
            continue
        usage_file = task_dir / "usage.json"
        if usage_file.exists():
            try:
                data = json.loads(usage_file.read_text())
                results.append(data)
            except (json.JSONDecodeError, OSError):
                continue
    return results
```

- [ ] **Step 2: 创建 usage API 路由**

```python
# backend/api/routes/usage.py
"""Usage API — token 消耗统计"""

from pathlib import Path

from fastapi import APIRouter

from backend.services.usage_tracker import load_all_usage

router = APIRouter(prefix="/api/usage", tags=["usage"])

UPLOADS_DIR = str(Path(__file__).resolve().parent.parent.parent / "uploads")


@router.get("/summary")
async def usage_summary():
    records = load_all_usage(UPLOADS_DIR)
    if not records:
        return {"total_tasks": 0, "total_tokens": 0, "success_rate": 0, "avg_duration_seconds": 0}

    total_tasks = len(records)
    total_tokens = sum(
        r.get("total", {}).get("input_tokens", 0) + r.get("total", {}).get("output_tokens", 0)
        for r in records
    )
    success_count = sum(1 for r in records if r.get("status") == "completed")
    success_rate = round(success_count / total_tasks * 100, 1) if total_tasks > 0 else 0

    durations = []
    for r in records:
        started = r.get("started_at", "")
        completed = r.get("completed_at", "")
        if started and completed:
            from datetime import datetime, UTC
            try:
                s = datetime.fromisoformat(started)
                c = datetime.fromisoformat(completed)
                durations.append((c - s).total_seconds())
            except ValueError:
                pass

    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0

    return {
        "total_tasks": total_tasks,
        "total_tokens": total_tokens,
        "success_rate": success_rate,
        "avg_duration_seconds": avg_duration,
    }


@router.get("/history")
async def usage_history(page: int = 1, size: int = 20):
    records = load_all_usage(UPLOADS_DIR)
    records.sort(key=lambda r: r.get("started_at", ""), reverse=True)

    start = (page - 1) * size
    end = start + size
    return {
        "total": len(records),
        "page": page,
        "size": size,
        "items": records[start:end],
    }


@router.get("/{task_id}")
async def usage_detail(task_id: str):
    task_dir = Path(UPLOADS_DIR) / task_id
    usage_file = task_dir / "usage.json"
    if not usage_file.exists():
        return {"error": "not found"}
    import json
    return json.loads(usage_file.read_text())
```

- [ ] **Step 3: 在 team.py 中集成 token 追踪**

在 `backend/services/orchestrator/team.py` 的 `run_team` 函数中，在 `rework_state = {"round": 1}` 之后添加:

```python
    # Token 追踪
    from backend.services.usage_tracker import UsageTracker
    usage_tracker = UsageTracker(
        task_id=task_id,
        task_dir=task_dir,
        mode="generation" if description else "refinement",
    )
```

在 `on_subagent_stop` 函数中，在 `return {}` 之前添加 token 推送逻辑:

```python
        # 尝试从 input_data 提取 token usage
        usage = input_data.get("usage", {})
        if usage:
            input_t = int(usage.get("input_tokens", 0))
            output_t = int(usage.get("output_tokens", 0))
            if input_t or output_t:
                agent_usage = usage_tracker.add_tokens(agent_key, input_t, output_t)
                await ws_manager.send(
                    task_id,
                    {
                        "type": "token_update",
                        "agent": agent_key,
                        "input_tokens": agent_usage["input_tokens"],
                        "output_tokens": agent_usage["output_tokens"],
                        "total_tokens": agent_usage["input_tokens"] + agent_usage["output_tokens"],
                    },
                )
```

在 `team_complete` 发送之前添加:

```python
                        # 持久化 usage
                        usage_tracker.status = "completed"
                        usage_tracker.rounds = rework_state["round"]
                        if score_sent["count"] > 0:
                            scores_file = Path(task_dir) / "scores.json"
                            if scores_file.exists():
                                import json as _json
                                _scores = _json.loads(scores_file.read_text())
                                usage_tracker.final_score = _scores.get("total")
                        usage_tracker.save()
```

在 `except TimeoutError` 和 `except Exception` 块中分别添加:

```python
        usage_tracker.status = "failed"
        usage_tracker.save()
```

- [ ] **Step 4: 注册 usage 路由**

在 `backend/main.py` 中添加:

```python
from backend.api.routes.usage import router as usage_router
app.include_router(usage_router)
```

- [ ] **Step 5: 验证后端启动**

Run: `cd /Users/claude/github/docflow-team && python -c "from backend.api.routes.usage import router; print('OK')"`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add backend/services/usage_tracker.py backend/api/routes/usage.py backend/services/orchestrator/team.py backend/main.py
git commit -m "feat(backend): 添加 token 追踪 + Usage API（summary/history/detail）"
```

---

## Task 11: 前端 — Usage 仪表盘

**Files:**
- Create: `frontend/src/components/usage/UsageDashboard.tsx`
- Create: `frontend/src/components/usage/StatCard.tsx`
- Create: `frontend/src/components/usage/TokenChart.tsx`
- Create: `frontend/src/components/usage/TaskHistory.tsx`
- Create: `frontend/src/hooks/useUsage.ts`
- Modify: `frontend/package.json` (添加 recharts)
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 安装 recharts**

Run: `cd /Users/claude/github/docflow-team/frontend && npm install recharts`

- [ ] **Step 2: 创建 useUsage hook**

```tsx
// frontend/src/hooks/useUsage.ts
import { useState, useEffect } from 'react'
import type { UsageSummary, TaskUsageRecord } from '../types'
import { API_URL } from '../lib/api'

export function useUsage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [history, setHistory] = useState<TaskUsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/usage/summary`),
          fetch(`${API_URL}/api/usage/history?page=1&size=50`),
        ])
        if (sumRes.ok) setSummary(await sumRes.json())
        if (histRes.ok) {
          const data = await histRes.json()
          setHistory(data.items || [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { summary, history, loading }
}
```

- [ ] **Step 3: 创建 StatCard**

```tsx
// frontend/src/components/usage/StatCard.tsx
import { GlassCard } from '../ui/GlassCard'

interface Props {
  icon: string
  label: string
  value: string | number
}

export function StatCard({ icon, label, value }: Props) {
  return (
    <GlassCard className="p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
    </GlassCard>
  )
}
```

- [ ] **Step 4: 创建 TokenChart**

```tsx
// frontend/src/components/usage/TokenChart.tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { TaskUsageRecord } from '../../types'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  history: TaskUsageRecord[]
}

export function TokenChart({ history }: Props) {
  const data = history
    .filter(h => h.started_at)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .map(h => ({
      date: h.started_at.slice(0, 10),
      tokens: (h.total?.input_tokens || 0) + (h.total?.output_tokens || 0),
    }))

  // Aggregate by date
  const byDate = new Map<string, number>()
  for (const d of data) {
    byDate.set(d.date, (byDate.get(d.date) || 0) + d.tokens)
  }
  const chartData = [...byDate.entries()].map(([date, tokens]) => ({ date, tokens }))

  if (chartData.length === 0) return null

  return (
    <GlassCard className="p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        Token 消耗趋势
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="var(--color-primary)"
            fill="url(#tokenGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

- [ ] **Step 5: 创建 TaskHistory**

```tsx
// frontend/src/components/usage/TaskHistory.tsx
import type { TaskUsageRecord } from '../../types'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  history: TaskUsageRecord[]
}

export function TaskHistory({ history }: Props) {
  if (history.length === 0) return null

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-4 py-3" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          任务历史
        </h3>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        {history.map((h) => {
          const totalTokens = (h.total?.input_tokens || 0) + (h.total?.output_tokens || 0)
          return (
            <div key={h.task_id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {h.task_id.slice(0, 8)}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: h.mode === 'generation' ? 'rgba(94,92,230,0.08)' : 'rgba(0,122,255,0.08)',
                  color: h.mode === 'generation' ? 'var(--color-agent-generator)' : 'var(--color-primary)',
                }}
              >
                {h.mode === 'generation' ? '生成' : '润色'}
              </span>
              {h.final_score && (
                <span className="text-xs font-semibold" style={{ color: h.final_score >= 8 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {h.final_score}/10
                </span>
              )}
              <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {totalTokens.toLocaleString()} tokens
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {h.started_at?.slice(0, 10)}
              </span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
```

- [ ] **Step 6: 创建 UsageDashboard**

```tsx
// frontend/src/components/usage/UsageDashboard.tsx
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
```

- [ ] **Step 7: 在 App.tsx 中替换 Usage 占位**

在 `frontend/src/App.tsx` 中，替换 usage 占位符:

将:
```tsx
      {/* Usage Dashboard (lazy load later) */}
      {!taskId && page === 'usage' && (
        <div className="animate-fade-in py-10 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          用量仪表盘（将在 Task 11 实现）
        </div>
      )}
```

替换为:
```tsx
      {/* Usage Dashboard */}
      {!taskId && page === 'usage' && <UsageDashboard />}
```

并在文件顶部添加 import:
```tsx
import { UsageDashboard } from './components/usage/UsageDashboard'
```

- [ ] **Step 8: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/usage/ frontend/src/hooks/useUsage.ts frontend/src/App.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): 添加 Usage 仪表盘（概览卡片 + Token 趋势图 + 任务历史）"
```

---

## Task 12: 清理旧组件 + 最终集成测试

**Files:**
- Delete: `frontend/src/components/landing/UploadCard.tsx` (functionality moved to UnifiedInput)
- Delete: `frontend/src/components/landing/GenerateCard.tsx` (functionality moved to UnifiedInput)

- [ ] **Step 1: 删除旧 Landing 组件**

```bash
rm frontend/src/components/landing/UploadCard.tsx
rm frontend/src/components/landing/GenerateCard.tsx
```

- [ ] **Step 2: 检查是否有残留 import**

Run: `cd /Users/claude/github/docflow-team/frontend && grep -r "UploadCard\|GenerateCard" src/ --include="*.tsx" --include="*.ts"`
Expected: 无结果（App.tsx 已不再引用这两个组件）

- [ ] **Step 3: 验证构建**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run build`
Expected: 成功编译，无错误

- [ ] **Step 4: 运行现有测试**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run test`
Expected: 部分测试可能因为组件变化而失败，记录哪些需要更新

- [ ] **Step 5: 更新失败的测试**

根据 Step 4 的输出，更新 `frontend/src/components/__tests__/` 中的测试文件，使其匹配新的组件结构和类名。

- [ ] **Step 6: 运行测试确认全部通过**

Run: `cd /Users/claude/github/docflow-team/frontend && npm run test`
Expected: 全部 PASS

- [ ] **Step 7: 完整手动测试**

Run: `cd /Users/claude/github/docflow-team && make dev-backend` (终端 1)
Run: `cd /Users/claude/github/docflow-team && make dev-frontend` (终端 2)

验证清单:
- [ ] Landing 页: 毛玻璃导航栏 + 背景色斑
- [ ] Landing 页: Hero 区域 + 4 个 Emoji Agent 头像
- [ ] Landing 页: 3 个亮点卡片
- [ ] Landing 页: Tab 切换上传/生成
- [ ] Landing 页: Starter 场景卡片点击填入
- [ ] Landing 页: 一键体验按钮
- [ ] Landing 页: Usage 入口按钮
- [ ] 协作区: Agent 毛玻璃卡片 + Emoji + 昵称 + 状态
- [ ] 协作区: 气泡式消息 + Agent 间箭头
- [ ] 协作区: 评分内嵌色块
- [ ] 协作区: 质量追踪条圆形 badge
- [ ] 结果页: 毛玻璃大卡片 + 胶囊下载按钮
- [ ] Usage: 4 个概览卡片
- [ ] Usage: Token 趋势图
- [ ] Usage: 任务历史列表

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(frontend): 清理旧组件 + 更新测试 + 最终集成验证"
```
