import { z } from 'zod'

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'teacher', 'institution']),
  institution: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Quiz validations
export const quizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  subject: z.string().min(1, 'Subject is required'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  duration: z.number().min(5, 'Duration must be at least 5 minutes').max(300, 'Duration cannot exceed 5 hours'),
  questionTypes: z.array(z.enum(['mcq', 'short_answer', 'long_answer', 'fill_blank', 'true_false'])).min(1, 'At least one question type is required'),
  isPublic: z.boolean().default(false)
})

export const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  type: z.enum(['mcq', 'short_answer', 'long_answer', 'fill_blank', 'true_false']),
  points: z.number().min(1, 'Points must be at least 1').default(1),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  options: z.array(z.object({
    text: z.string().min(1, 'Option text is required'),
    isCorrect: z.boolean().default(false)
  })).optional(),
  correctAnswer: z.string().optional()
})

// Classroom validations
export const classroomSchema = z.object({
  name: z.string().min(1, 'Classroom name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  subject: z.string().min(1, 'Subject is required'),
  privacy: z.enum(['public', 'private']).default('public'),
  maxMembers: z.number().min(2, 'Minimum 2 members required').max(500, 'Maximum 500 members allowed').default(50),
  settings: z.object({
    allowMemberInvites: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    enableChat: z.boolean().default(true),
    enableScreenShare: z.boolean().default(true),
    recordSessions: z.boolean().default(false)
  }).optional()
})

// File upload validations
export const fileUploadSchema = z.object({
  file: z.instanceof(File, 'Please select a file'),
  type: z.enum(['document', 'image', 'video', 'audio']),
  purpose: z.enum(['quiz_generation', 'question_paper', 'study_material']).optional()
})

// YouTube processing validation
export const youtubeSchema = z.object({
  url: z.string().url('Please enter a valid YouTube URL').refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    'Please enter a valid YouTube URL'
  ),
  generateQuiz: z.boolean().default(true),
  generateNotes: z.boolean().default(true),
  generateSummary: z.boolean().default(true),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium')
})

// Profile update validation
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  institution: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  preferences: z.object({
    emailNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    weeklyReports: z.boolean().default(true),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    language: z.string().default('en')
  }).optional()
})