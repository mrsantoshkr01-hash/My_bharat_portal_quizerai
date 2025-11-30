export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  QUIZZES: '/dashboard/quizzes',
  CLASSROOMS: '/dashboard/classrooms',
  ANALYTICS: '/dashboard/analytics',
  QUESTION_PAPERS: '/dashboard/question-papers',
  YOUTUBE: '/dashboard/youtube',
  AI_TUTOR: '/ai-tutor',
  PRICING: '/pricing'
}

export const QUIZ_TYPES = {
  MCQ: 'mcq',
  SHORT_ANSWER: 'short_answer',
  LONG_ANSWER: 'long_answer',
  FILL_BLANK: 'fill_blank',
  TRUE_FALSE: 'true_false'
}

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  ADAPTIVE: 'adaptive'
}

export const FILE_TYPES = {
  PDF: 'application/pdf',
  IMAGE: 'image/*',
  VIDEO: 'video/*',
  AUDIO: 'audio/*',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' }
]
