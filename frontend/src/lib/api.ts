export const API_URL = import.meta.env.VITE_API_URL || ''

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_DESCRIPTION_LENGTH = 2000
export const MAX_ROUNDS = 3
export const MAX_RECONNECT_ATTEMPTS = 5
export const BASE_RECONNECT_DELAY = 1000
export const MAX_RECONNECT_DELAY = 15000

export const SUPPORTED_EXTENSIONS = ['.docx', '.pptx', '.xlsx', '.pdf'] as const

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
