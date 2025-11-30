'use client'
import axios from 'axios'
import { useState, useEffect } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Axios instance with auth
const createAuthAxios = () => {
  const token = localStorage.getItem('authToken')
  return axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  })
}

export default createAuthAxios

// Teacher Quiz API functions
export const quizApi = {
  // TEACHER QUIZ MANAGEMENT
  
  // Get teacher's own quizzes (for assignment creation)
  getMyQuizzes: async (params = {}) => {
    const api = createAuthAxios()
    const response = await api.get('/teacher/quizzes/my-quizzes', { params })
    return response.data
  },

  // Get specific teacher quiz by ID
  getQuizById: async (quizId, includeQuestions = false) => {
    const api = createAuthAxios()
    const response = await api.get(`/teacher/quizzes/${quizId}`, {
      params: { include_questions: includeQuestions }
    })
    return response.data
  },

  // Create new quiz (for teachers)
  createQuiz: async (quizData) => {
    const api = createAuthAxios()
    const response = await api.post('/teacher/quizzes/', quizData)
    return response.data
  },

  // Update existing quiz
  updateQuiz: async (quizId, quizData) => {
    const api = createAuthAxios()
    const response = await api.put(`/teacher/quizzes/${quizId}`, quizData)
    return response.data
  },

  // Delete quiz (soft delete)
  deleteQuiz: async (quizId) => {
    const api = createAuthAxios()
    const response = await api.delete(`/teacher/quizzes/${quizId}`)
    return response.data
  },

  // Add question to quiz
  addQuestionToQuiz: async (quizId, questionData) => {
    const api = createAuthAxios()
    const response = await api.post(`/teacher/quizzes/${quizId}/questions`, questionData)
    return response.data
  },

  // Get quiz analytics (for teachers)
  getQuizAnalytics: async (quizId) => {
    const api = createAuthAxios()
    const response = await api.get(`/teacher/quizzes/${quizId}/analytics`)
    return response.data
  },

  // STUDENT ASSIGNMENT FUNCTIONS

  // Get assigned quizzes for students (across all classrooms)
  getAssignedQuizzes: async (statusFilter = null) => {
    const api = createAuthAxios()
    const params = statusFilter ? { status_filter: statusFilter } : {}
    const response = await api.get('/assignments/student', { params })
    return response.data
  },

  // Get assignment details for student (to take the quiz)
  getAssignmentForStudent: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/assignments/${assignmentId}/student-view`)
    return response.data
  },

  // Start assignment session
  startAssignmentSession: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.post(`/assignments/${assignmentId}/start`)
    return response.data
  },

  // Submit assignment answers
  submitAssignmentAnswers: async (assignmentId, submissionData) => {
    const api = createAuthAxios()
    const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData)
    return response.data
  },

  // Get assignment results for student
  getAssignmentResults: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/assignments/${assignmentId}/results`)
    return response.data
  },

  // Get assignment status for student
  getAssignmentStatus: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/assignments/${assignmentId}/status`)
    return response.data
  },

  // STUDENT AI QUIZ FUNCTIONS (existing functionality)

  // Save AI-generated quiz session
  saveQuizSession: async (sessionData) => {
    const api = createAuthAxios()
    const response = await api.post('/quiz/sessions/save', sessionData)
    return response.data
  },

  // Get AI quiz by external ID
  getAIQuizById: async (externalQuizId, includeQuestions = false) => {
    const api = createAuthAxios()
    const response = await api.get(`/quiz/${externalQuizId}`, {
      params: { include_questions: includeQuestions }
    })
    return response.data
  },

  // Get user's AI quiz sessions
  getUserQuizSessions: async (quizType = null, contextType = null) => {
    const api = createAuthAxios()
    const params = {}
    if (quizType) params.quiz_type = quizType
    if (contextType) params.context_type = contextType
    
    const response = await api.get('/quiz-sessions/user/${userId}/sessions', { params })
    return response.data
  },

  // Get detailed session results
  getSessionDetails: async (sessionId, includeAnswers = true) => {
    const api = createAuthAxios()
    const response = await api.get(`/quiz-sessions/${sessionId}/detailed`, {
      params: { include_answers: includeAnswers }
    })
    return response.data
  },

  // Get user quiz statistics
  getUserQuizStats: async () => {
    const api = createAuthAxios()
    const response = await api.get('/quiz/user/stats')
    return response.data
  }
}

// Custom hooks for teachers
export const useMyQuizzes = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const result = await quizApi.getMyQuizzes()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching quizzes:', err)
      setError(err.response?.data?.detail || 'Failed to fetch quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  return { data, loading, error, refetch: fetchQuizzes }
}

// Custom hooks for students
export const useAssignedQuizzes = (statusFilter = null) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const result = await quizApi.getAssignedQuizzes(statusFilter)
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching assigned quizzes:', err)
      setError(err.response?.data?.detail || 'Failed to fetch assigned quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [statusFilter])

  return { data, loading, error, refetch: fetchQuizzes }
}

export const useQuizAnalytics = (quizId) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = async () => {
    if (!quizId) return

    try {
      setLoading(true)
      const result = await quizApi.getQuizAnalytics(quizId)
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching quiz analytics:', err)
      setError(err.response?.data?.detail || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [quizId])

  return { data, loading, error, refetch: fetchAnalytics }
}

export const useAssignmentDetails = (assignmentId) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAssignment = async () => {
    if (!assignmentId) return

    try {
      setLoading(true)
      const result = await quizApi.getAssignmentForStudent(assignmentId)
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching assignment:', err)
      setError(err.response?.data?.detail || 'Failed to fetch assignment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  return { data, loading, error, refetch: fetchAssignment }
}

// Assignment submission hook
export const useAssignmentSubmission = () => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submitAssignment = async (assignmentId, submissionData) => {
    try {
      setSubmitting(true)
      setError(null)
      const result = await quizApi.submitAssignmentAnswers(assignmentId, submissionData)
      return result
    } catch (err) {
      console.error('Error submitting assignment:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to submit assignment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return { submitAssignment, submitting, error }
}

// Assignment status hook
export const useAssignmentStatus = (assignmentId, refreshInterval = null) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    if (!assignmentId) return

    try {
      const result = await quizApi.getAssignmentStatus(assignmentId)
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching assignment status:', err)
      setError(err.response?.data?.detail || 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Set up polling if refreshInterval is provided
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [assignmentId, refreshInterval])

  return { data, loading, error, refetch: fetchStatus }
}

