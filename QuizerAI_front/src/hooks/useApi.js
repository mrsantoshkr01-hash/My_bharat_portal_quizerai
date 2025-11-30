'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { API_BASE_URL } from '@/lib/constants'
import toast from 'react-hot-toast'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const getAuthHeaders = useCallback(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1]

    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }, [])

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
        ...options
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  const get = useCallback((endpoint) => {
    return apiCall(endpoint, { method: 'GET' })
  }, [apiCall])

  const post = useCallback((endpoint, data) => {
    return apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }, [apiCall])

  const put = useCallback((endpoint, data) => {
    return apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }, [apiCall])

  const patch = useCallback((endpoint, data) => {
    return apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }, [apiCall])

  const del = useCallback((endpoint) => {
    return apiCall(endpoint, { method: 'DELETE' })
  }, [apiCall])

  const uploadFile = useCallback(async (endpoint, file, onProgress) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      const xhr = new XMLHttpRequest()

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100
            onProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          setLoading(false)
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve({ data, error: null })
            } catch (err) {
              resolve({ data: xhr.responseText, error: null })
            }
          } else {
            const errorMessage = `Upload failed: ${xhr.status}`
            setError(errorMessage)
            reject(new Error(errorMessage))
          }
        })

        xhr.addEventListener('error', () => {
          setLoading(false)
          const errorMessage = 'Upload failed: Network error'
          setError(errorMessage)
          reject(new Error(errorMessage))
        })

        xhr.open('POST', `${API_BASE_URL}${endpoint}`)
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.send(formData)
      })
    } catch (err) {
      setLoading(false)
      const errorMessage = err.message || 'Upload failed'
      setError(errorMessage)
      toast.error(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [])

  return {
    loading,
    error,
    get,
    post,
    put,
    patch,
    delete: del,
    uploadFile,
    apiCall
  }
}