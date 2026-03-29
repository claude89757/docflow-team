export const API_URL = import.meta.env.VITE_API_URL || ''

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_DESCRIPTION_LENGTH = 2000
export const MAX_ROUNDS = 3
export const MAX_RECONNECT_ATTEMPTS = 5
export const BASE_RECONNECT_DELAY = 1000
export const MAX_RECONNECT_DELAY = 15000

export const SUPPORTED_EXTENSIONS = ['.docx', '.pptx', '.xlsx', '.pdf'] as const
