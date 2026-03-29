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
