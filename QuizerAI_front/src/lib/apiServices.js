import { apiClient, endpoints } from './api'

// Service for Quiz API operations
export const quizAPI = {
  // Get all quizzes with optional filtering
  getAll: (params = {}) => {
    return apiClient.get(endpoints.quizzes.list, params)
  },

  // Get a specific quiz by ID
  getById: (id) => {
    return apiClient.get(endpoints.quizzes.get(id))
  },

  // Create a new quiz
  create: (quizData) => {
    return apiClient.post(endpoints.quizzes.create, quizData)
  },

  // Update an existing quiz
  update: (id, quizData) => {
    return apiClient.put(endpoints.quizzes.update(id), quizData)
  },

  // Delete a quiz
  delete: (id) => {
    return apiClient.delete(endpoints.quizzes.delete(id))
  },

  // Submit quiz answers
  submit: (id, answers) => {
    return apiClient.post(endpoints.quizzes.submit(id), { answers })
  },

  // Get quiz results
  getResults: (id) => {
    return apiClient.get(endpoints.quizzes.results(id))
  },

  // Generate a quiz from content
  generate: (data) => {
    return apiClient.post(endpoints.quizzes.generate, data)
  },

  // Duplicate a quiz
  duplicate: (id) => {
    return apiClient.post(`${endpoints.quizzes.get(id)}/duplicate`)
  }
}

// Create other API services following the same pattern
export const classroomAPI = {
  getAll: (params = {}) => {
    return apiClient.get(endpoints.classrooms.list, params)
  },
  
  getById: (id) => {
    return apiClient.get(endpoints.classrooms.get(id))
  },
  
  create: (data) => {
    return apiClient.post(endpoints.classrooms.create, data)
  },
  
  update: (id, data) => {
    return apiClient.put(endpoints.classrooms.update(id), data)
  },
  
  delete: (id) => {
    return apiClient.delete(endpoints.classrooms.delete(id))
  },
  
  join: (id, data = {}) => {
    return apiClient.post(endpoints.classrooms.join(id), data)
  },
  
  leave: (id) => {
    return apiClient.post(endpoints.classrooms.leave(id))
  },
  
  getMembers: (id) => {
    return apiClient.get(endpoints.classrooms.members(id))
  },
  
  getQuizzes: (id) => {
    return apiClient.get(endpoints.classrooms.quizzes(id))
  }
}

// Export other API services as needed
export const analyticsAPI = {
  getDashboard: () => {
    return apiClient.get(endpoints.analytics.dashboard)
  },
  
  getPerformance: (params = {}) => {
    return apiClient.get(endpoints.analytics.performance, params)
  },
  
  getProgress: (params = {}) => {
    return apiClient.get(endpoints.analytics.progress, params)
  },
  
  getComparison: (params = {}) => {
    return apiClient.get(endpoints.analytics.comparison, params)
  }
}

export const fileAPI = {
  upload: (file, onProgress) => {
    return apiClient.uploadFile(endpoints.files.upload, file, onProgress)
  },
  
  process: (fileId, options = {}) => {
    return apiClient.post(endpoints.files.process, { fileId, ...options })
  },
  
  delete: (id) => {
    return apiClient.delete(endpoints.files.delete(id))
  }
}

export const youtubeAPI = {
  process: (url, options = {}) => {
    return apiClient.post(endpoints.youtube.process, { url, ...options })
  },
  
  search: (query, options = {}) => {
    return apiClient.get(endpoints.youtube.search, { query, ...options })
  }
}