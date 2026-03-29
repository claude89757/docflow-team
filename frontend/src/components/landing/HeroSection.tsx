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
