import { create } from 'zustand'
import { API_BASE_URL } from '@/lib/constants'

export const useClassroomStore = create((set, get) => ({
  // State
  classrooms: [],
  currentClassroom: null,
  classroomMembers: [],
  classroomQuizzes: [],
  isLoading: false,
  error: null,

  // Actions
  setClassrooms: (classrooms) => set({ classrooms }),
  setCurrentClassroom: (classroom) => set({ currentClassroom: classroom }),
  setClassroomMembers: (members) => set({ classroomMembers: members }),
  setClassroomQuizzes: (quizzes) => set({ classroomQuizzes: quizzes }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Fetch user's classrooms
  fetchClassrooms: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/classrooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        set({ classrooms: data.classrooms, isLoading: false })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to fetch classrooms', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Create new classroom
  createClassroom: async (classroomData) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(classroomData),
      })

      const data = await response.json()

      if (response.ok) {
        const currentClassrooms = get().classrooms
        set({ 
          classrooms: [data.classroom, ...currentClassrooms], 
          isLoading: false 
        })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to create classroom', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Join classroom by code
  joinClassroom: async (classroomCode) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/classrooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: classroomCode }),
      })

      const data = await response.json()

      if (response.ok) {
        const currentClassrooms = get().classrooms
        set({ 
          classrooms: [data.classroom, ...currentClassrooms], 
          isLoading: false 
        })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to join classroom', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Get classroom by ID
  getClassroomById: async (classroomId) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        set({ 
          currentClassroom: data.classroom, 
          classroomMembers: data.members || [],
          classroomQuizzes: data.quizzes || [],
          isLoading: false 
        })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to fetch classroom', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Leave classroom
  leaveClassroom: async (classroomId) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const currentClassrooms = get().classrooms
        set({ 
          classrooms: currentClassrooms.filter(classroom => classroom.id !== classroomId), 
          isLoading: false 
        })
        return { success: true }
      } else {
        const data = await response.json()
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to leave classroom', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Share quiz to classroom
  shareQuizToClassroom: async (classroomId, quizId) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quiz_id: quizId }),
      })

      const data = await response.json()

      if (response.ok) {
        const currentQuizzes = get().classroomQuizzes
        set({ 
          classroomQuizzes: [data.quiz, ...currentQuizzes], 
          isLoading: false 
        })
        return { success: true, data }
      } else {
        set({ error: data.message, isLoading: false })
        return { success: false, error: data.message }
      }
    } catch (error) {
      set({ error: 'Failed to share quiz', isLoading: false })
      return { success: false, error: 'Network error' }
    }
  },

  // Clear all classrooms (for logout)
  clearClassrooms: () => set({ 
    classrooms: [], 
    currentClassroom: null, 
    classroomMembers: [],
    classroomQuizzes: [],
    error: null 
  }),
}))