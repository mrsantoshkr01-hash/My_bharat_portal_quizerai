// utils/api/analyticsApi.js
import axios from 'axios'

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
// Add this to your API client for debugging
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    console.log('Token from localStorage:', token ? 'exists' : 'missing')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('No access token found in localStorage')
    }
  }
  return config
})

// Handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || 'Request failed'
    throw new Error(message)
  }
)

// API Functions
export const analyticsApi = {
  getFullAnalytics: async () => {
    const response = await apiClient.get('/api/dashboard/analytics')
    return response.data
  },

  getOverviewStats: async () => {
    return await apiClient.get('/api/dashboard/overview')
  },

  getPerformanceTrends: async (days = 30) => {
    return await apiClient.get(`/api/dashboard/performance-trends?days=${days}`)
  },

  getSubjectAnalytics: async () => {
    return await apiClient.get('/api/dashboard/subjects')
  },

  getRecentActivity: async (limit = 10) => {
    const response = await apiClient.get(`/api/dashboard/recent-activity?limit=${limit}`)
    return response.activities
  },

  saveQuizSession: async (sessionData) => {
    return await apiClient.post('/api/quiz-sessions/save', sessionData)
  },

  exportAnalytics: async (format = 'json') => {
    return await apiClient.get(`/api/dashboard/export?format=${format}`)
  }
}

// Main Analytics Hook
import { useState, useEffect, useCallback } from 'react'

export const useAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    // Skip on server-side rendering
    if (typeof window === 'undefined') return

    try {
      setLoading(true)
      setError(null)
      const analyticsData = await analyticsApi.getFullAnalytics()
      setData(analyticsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { data, loading, error, refetch: fetchAnalytics }
}

// Quiz Save Hook
export const useQuizSessionSave = () => {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const saveSession = useCallback(async (sessionData) => {
    try {
      setSaving(true)
      setError(null)
      const response = await analyticsApi.saveQuizSession(sessionData)
      setSaved(true)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSaving(false)
    setSaved(false)
    setError(null)
  }, [])

  return { saveSession, saving, saved, error, reset }
}

// Utility formatters
export const formatters = {
  formatDuration: (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  },

  formatPercentage: (value) => `${Number(value).toFixed(1)}%`,

  getScoreColor: (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  },

  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}