import { API_BASE_URL } from './constants'
import { authService } from './auth'

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)

      // Handle authentication errors
      if (response.status === 401) {
        authService.removeToken()
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // HTTP Methods
  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${endpoint}?${query}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // File upload
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve(data)
          } catch (error) {
            resolve(xhr.responseText)
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'))
      })

      xhr.open('POST', `${this.baseURL}${endpoint}`)

      // Add auth headers
      const authHeaders = authService.getAuthHeaders()
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(formData)
    })
  }
}

export const apiClient = new ApiClient()

// OAuth Service
// Updated OAuth Service for handling Google OAuth
export const oauthService = {
  // Initiate Google OAuth login
  async initiateGoogleLogin() {
    try {
      const response = await apiClient.get(`${endpoints.oauth.google}?popup=true`)
      return response
    } catch (error) {
      console.error('Error initiating Google OAuth:', error)
      throw error
    }
  },

  // Open OAuth popup window
  openOAuthPopup(url, windowName = 'oauth') {
    if (!url) {
      throw new Error('OAuth URL is required')
    }

    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      url,
      windowName,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.')
    }

    return popup
  },

  // Enhanced message listener with debugging
  listenForOAuthMessage() {
    return new Promise((resolve, reject) => {
      console.log('Setting up OAuth message listener...')
      console.log('Expected origin:', window.location.origin)

      const handleMessage = (event) => {
        console.log('Received message:', {
          origin: event.origin,
          expectedOrigin: window.location.origin,
          data: event.data,
          type: event.data?.type
        })

        // Accept messages from our frontend origin
        // if (event.origin !== window.location.origin) {
        //   console.warn('Ignored message from different origin:', event.origin)
        //   return
        // }


        const allowedOrigins = [
          window.location.origin, // http://localhost:3000
          'http://localhost:8000',
          'https://bulkblast.in'  // your backend
        ]

        // const allowedOrigins = [
        //   window.location.origin, // https://quizerai.com
        //   'https://bulkblast.in'  // your backend domain
        // ]

        if (!allowedOrigins.includes(event.origin)) {
          console.warn('Ignored message from unauthorized origin:', event.origin)
          return
        }

        if (event.data && event.data.type === 'OAUTH_SUCCESS') {
          console.log('OAuth success message received:', event.data.payload)
          window.removeEventListener('message', handleMessage)
          resolve(event.data.payload)
        } else if (event.data && event.data.type === 'OAUTH_ERROR') {
          console.log('OAuth error message received:', event.data.error)
          window.removeEventListener('message', handleMessage)
          reject(new Error(event.data.error || 'OAuth authentication failed'))
        } else if (event.data) {
          console.log('Received unrecognized message type:', event.data.type)
        }
      }

      window.addEventListener('message', handleMessage)
      console.log('OAuth message listener registered')

      // Cleanup listener after 5 minutes timeout
      const timeoutId = setTimeout(() => {
        console.log('OAuth message listener timeout')
        window.removeEventListener('message', handleMessage)
        reject(new Error('OAuth authentication timeout'))
      }, 300000)

      // Return cleanup function
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('message', handleMessage)
      }
    })
  },

  // Monitor popup with better error handling
  monitorPopupStatus(popup, onClose) {
    let checkCount = 0
    const maxChecks = 300 // 5 minutes worth of checks

    const checkClosed = setInterval(() => {
      try {
        checkCount++

        // Check if popup is closed
        if (popup.closed) {
          clearInterval(checkClosed)
          console.log('Popup window was closed by user or completed')
          if (onClose) onClose()
          return
        }

        // Timeout after maximum checks
        if (checkCount >= maxChecks) {
          clearInterval(checkClosed)
          console.log('Popup monitoring timeout')
          try {
            popup.close()
          } catch (e) {
            console.log('Could not close popup:', e)
          }
          if (onClose) onClose()
        }

      } catch (error) {
        // Handle cross-origin policy errors
        if (error.message.includes('Cross-Origin-Opener-Policy')) {
          // This is expected when the popup navigates to different origins
          // Don't log this as an error
          return
        }
        console.log('Error checking popup status:', error)
      }
    }, 1000)

    return () => clearInterval(checkClosed)
  }
}
// Updated endpoints with popup parameter support
export const endpoints = {
  // Auth
  auth: {
    login: '/auth_auth/login', // Fixed endpoint path
    register: '/auth_auth/register',
    logout: '/auth_auth/logout',
    refresh: '/auth_auth/refresh',
    me: '/auth_auth/me',
    forgotPassword: '/auth_auth/forgot-password',
    resetPassword: '/auth_auth/reset-password'
  },

  // OAuth - Fixed endpoint paths
  oauth: {
    google: '/oauth/google/login',
    googleCallback: '/oauth/google/callback',
    github: '/oauth_auth/github/login',
    githubCallback: '/oauth_auth/github/callback',
    completeRegistration: '/oauth_auth/complete-registration'
  },

  // Rest of your endpoints remain the same...
  quizzes: {
    list: '/quizzes',
    create: '/quizzes',
    get: (id) => `/quizzes/${id}`,
    update: (id) => `/quizzes/${id}`,
    delete: (id) => `/quizzes/${id}`,
    submit: (id) => `/quizzes/${id}/submit`,
    results: (id) => `/quizzes/${id}/results`,
    generate: '/quizzes/generate'
  },

  classrooms: {
    list: '/classrooms',
    create: '/classrooms',
    get: (id) => `/classrooms/${id}`,
    update: (id) => `/classrooms/${id}`,
    delete: (id) => `/classrooms/${id}`,
    join: (id) => `/classrooms/${id}/join`,
    leave: (id) => `/classrooms/${id}/leave`,
    members: (id) => `/classrooms/${id}/members`,
    quizzes: (id) => `/classrooms/${id}/quizzes`
  },

  analytics: {
    dashboard: '/analytics/dashboard',
    performance: '/analytics/performance',
    progress: '/analytics/progress',
    comparison: '/analytics/comparison'
  },

  files: {
    upload: '/files/upload',
    process: '/files/process',
    delete: (id) => `/files/${id}`
  },

  youtube: {
    process: '/youtube/process',
    search: '/youtube/search'
  }
}