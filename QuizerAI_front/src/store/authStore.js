import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { API_BASE_URL } from '@/lib/constants'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => {
        set({ token })
        if (token) {
          Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'strict' })
        } else {
          Cookies.remove('auth_token')
        }
      },

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })

          const data = await response.json()

          if (response.ok) {
            get().setToken(data.access_token)
            get().setUser(data.user)
            set({ isLoading: false })
            return { success: true, data }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.message || 'Login failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          })

          const data = await response.json()

          if (response.ok) {
            get().setToken(data.access_token)
            get().setUser(data.user)
            set({ isLoading: false })
            return { success: true, data }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.message || 'Registration failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },

      logout: () => {
        get().setToken(null)
        get().setUser(null)
        set({ isAuthenticated: false })
        // Clear other stores if needed
        useQuizStore.getState().clearQuizzes()
        useClassroomStore.getState().clearClassrooms()
      },

      refreshToken: async () => {
        const token = get().token
        if (!token) return false

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          const data = await response.json()

          if (response.ok) {
            get().setToken(data.access_token)
            return true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          get().logout()
          return false
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`,
            },
            body: JSON.stringify(profileData),
          })

          const data = await response.json()

          if (response.ok) {
            get().setUser(data.user)
            set({ isLoading: false })
            return { success: true, data }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.message || 'Profile update failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },

      // Initialize auth state from cookies
      initializeAuth: async () => {
        const token = Cookies.get('auth_token')
        if (token) {
          set({ token })
          try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const userData = await response.json()
              get().setUser(userData)
            } else {
              get().logout()
            }
          } catch (error) {
            get().logout()
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
