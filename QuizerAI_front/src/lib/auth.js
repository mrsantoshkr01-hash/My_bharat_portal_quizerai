'use client'

import Cookies from 'js-cookie'
import { API_BASE_URL } from './constants'

export const authService = {
  // Get stored token
  getToken: () => {
    return Cookies.get('auth_token')
  },

  // Set token
  setToken: (token, remember = false) => {
    const options = remember 
      ? { expires: 30, secure: true, sameSite: 'strict' } 
      : { expires: 1, secure: true, sameSite: 'strict' }
    
    Cookies.set('auth_token', token, options)
  },

  // Remove token
  removeToken: () => {
    Cookies.remove('auth_token')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!authService.getToken()
  },

  // Get auth headers for API requests
  getAuthHeaders: () => {
    const token = authService.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const token = authService.getToken()
      if (!token) return false

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        authService.setToken(data.access_token)
        return true
      } else {
        authService.removeToken()
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      authService.removeToken()
      return false
    }
  },

  // Login with credentials
  login: async (email, password, remember = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        authService.setToken(data.access_token, remember)
        return { success: true, user: data.user, token: data.access_token }
      } else {
        return { success: false, error: data.message || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        authService.setToken(data.access_token)
        return { success: true, user: data.user, token: data.access_token }
      } else {
        return { success: false, error: data.message || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  },

  // Logout
  logout: async () => {
    try {
      const token = authService.getToken()
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: authService.getAuthHeaders()
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      authService.removeToken()
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const token = authService.getToken()
      if (!token) return null

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: authService.getAuthHeaders()
      })

      if (response.ok) {
        return await response.json()
      } else {
        authService.removeToken()
        return null
      }
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }
}