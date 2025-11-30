import { create } from 'zustand'
import { API_BASE_URL } from '@/lib/constants'

export const useQuizStore = create((set, get) => ({
  // State
  quizzes: [],
  currentQuiz: null,
  quizResults: [],
  isLoading: false,
  error: null,

  // Actions
  setQuizzes: (quizzes) => set({ quizzes }),
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Fetch user's quizzes
  fetchQuizzes: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        set({ quizzes: data.quizzes, isLoading: false })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to fetch quizzes', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Create new quiz
  createQuiz: async (quizData) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      })

      const data = await response.json()

      if (response.ok) {
        const currentQuizzes = get().quizzes
        set({ 
          quizzes: [data.quiz, ...currentQuizzes], 
          isLoading: false 
        })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to create quiz', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Generate quiz from content
  generateQuiz: async (contentData) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const formData = new FormData()
      
      // Handle different content types
      if (contentData.file) {
        formData.append('file', contentData.file)
      }
      if (contentData.text) {
        formData.append('text', contentData.text)
      }
      if (contentData.url) {
        formData.append('url', contentData.url)
      }
      
      formData.append('quiz_type', contentData.quizType || 'mcq')
      formData.append('difficulty', contentData.difficulty || 'medium')
      formData.append('num_questions', contentData.numQuestions || 10)

      const response = await fetch(`${API_BASE_URL}/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        set({ currentQuiz: data.quiz, isLoading: false })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to generate quiz', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Submit quiz attempt
  submitQuizAttempt: async (quizId, answers) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      })

      const data = await response.json()

      if (response.ok) {
        const currentResults = get().quizResults
        set({ 
          quizResults: [data.result, ...currentResults], 
          isLoading: false 
        })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to submit quiz', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Get quiz by ID
  getQuizById: async (quizId) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        set({ currentQuiz: data.quiz, isLoading: false })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to fetch quiz', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Delete quiz
  deleteQuiz: async (quizId) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const currentQuizzes = get().quizzes
        set({ 
          quizzes: currentQuizzes.filter(quiz => quiz.id !== quizId), 
          isLoading: false 
        })
        return { success: true }
      } else {
        const data = await response.json()
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to delete quiz', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Clear all quizzes (for logout)
  clearQuizzes: () => set({ 
    quizzes: [], 
    currentQuiz: null, 
    quizResults: [], 
    error: null 
  }),
}))