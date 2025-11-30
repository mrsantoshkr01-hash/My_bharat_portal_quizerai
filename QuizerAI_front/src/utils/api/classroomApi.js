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

// Classroom API functions
export const classroomApi = {
  // Teacher functions
  createClassroom: async (classroomData) => {
    const api = createAuthAxios()
    const response = await api.post('/classrooms/', classroomData)
    return response.data
  },

  getMyClassrooms: async (params = {}) => {
    const api = createAuthAxios()
    const response = await api.get('/classrooms/my-classrooms', { params })
    return response.data
  },

  getClassroom: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}`)
    return response.data
  },

  updateClassroom: async (classroomId, updateData) => {
    const api = createAuthAxios()
    const response = await api.put(`/classrooms/${classroomId}`, updateData)
    return response.data
  },

  getClassroomAnalytics: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/analytics`)
    return response.data
  },

  getClassroomStudents: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/students`)
    return response.data
  },

  removeStudent: async (classroomId, studentId) => {
    const api = createAuthAxios()
    const response = await api.delete(`/classrooms/${classroomId}/students/${studentId}`)
    return response.data
  },

  getClassroomAssignments: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/assignments`)
    return response.data
  },

  assignQuizToClassroom: async (classroomId, assignmentData) => {
    const api = createAuthAxios()
    const response = await api.post(`/classrooms/${classroomId}/assignments`, assignmentData)
    console.log(response)
    console.log(response.data)
    return response.data
  },



  // Student functions  
  joinClassroom: async (joinCode) => {
    const api = createAuthAxios()
    const response = await api.post('/classrooms/join', { join_code: joinCode })
    return response.data
  },

  getEnrolledClassrooms: async () => {
    const api = createAuthAxios()
    const response = await api.get('/classrooms/enrolled')
    return response.data
  },

  leaveClassroom: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.post(`/classrooms/${classroomId}/leave`)
    return response.data
  },

  // Permanently delete classroom (IRREVERSIBLE - only for archived classrooms)
  permanentlyDeleteClassroom: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.delete(`/classrooms/${classroomId}/permanent`)
    return response.data
  },

  // Archive classroom (soft delete - changes status to ARCHIVED)
  archiveClassroom: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.delete(`/classrooms/${classroomId}`)
    return response.data
  },

  // Restore archived classroom back to ACTIVE status
  restoreClassroom: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.put(`/classrooms/${classroomId}/restore`)
    return response.data
  },

  // Get archived classrooms
  getArchivedClassrooms: async (params = {}) => {
    const api = createAuthAxios()
    const response = await api.get('/classrooms/archived', { params })
    return response.data
  },

  // Get classroom details for student view
  getStudentClassroomView: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/student-view`)
    return response.data
  },

  // Get classroom assignments (automatically includes student data if student)
  getClassroomAssignments: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/assignments`)
    return response.data
  },

  // Get specific assignment details for taking
  getAssignmentDetails: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/assignments/${assignmentId}/student-view`)
    return response.data
  },

  // Start assignment session
  startAssignment: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.post(`/assignments/${assignmentId}/start`)
    return response.data
  },


  // Submit assignment
  submitAssignment: async (assignmentId, submissionData) => {
    const api = createAuthAxios()
    const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData)
    return response.data
  },

  // Get assignment results
  getAssignmentResultsId: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/assignments/${assignmentId}/results`)
    return response.data
  },



  getAssignmentResults: async (classroomId, assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/assignments/${assignmentId}/results`)
    return response.data
  },

  // Export assignment results to Excel
  exportAssignmentExcel: async (classroomId, assignmentId, exportFilter = 'all') => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/assignments/${assignmentId}/export-excel`, {
      params: { export_filter: exportFilter },
      responseType: 'blob'
    })
    return response.data
  },

  // Delete assignment
  deleteAssignment: async (classroomId, assignmentId) => {
    const api = createAuthAxios()
    const response = await api.delete(`/classrooms/${classroomId}/assignments/${assignmentId}`)
    return response.data
  },

  // Update assignment
  updateAssignment: async (classroomId, assignmentId, updateData) => {
    const api = createAuthAxios()
    const response = await api.put(`/classrooms/${classroomId}/assignments/${assignmentId}`, updateData)
    return response.data
  },




  // Get assignment details for student
  getAssignmentForStudent: async (assignmentId) => {
    const api = createAuthAxios()
    const response = await api.get(`/assignments/${assignmentId}/student-view`)
    return response.data
  },

  // Get all assignments for a student (across all classrooms)
  getStudentAssignments: async () => {
    const api = createAuthAxios()
    const response = await api.get('/assignments/student')
    return response.data
  },

  // to download the excel file

  exportClassroomExcel: async (classroomId) => {
    const api = createAuthAxios()
    const response = await api.get(`/classrooms/${classroomId}/export-classroom-excel`, {
      responseType: 'blob'
    })
    return response.data
  },


}



// Quiz API functions (for assignment creation)
export const quizApi = {
  getMyQuizzes: async (params = {}) => {
    const api = createAuthAxios()
    const response = await api.get('/quizzes/my-quizzes', { params })
    return response.data
  }
}


// Notification API functions
export const notificationApi = {
  // Get all notifications
  getNotifications: async (unreadOnly = false, limit = 50) => {
    const api = createAuthAxios()
    const response = await api.get('/notifications/', {
      params: { unread_only: unreadOnly, limit }
    })
    return response.data
  },

  // Get unread count
  getUnreadCount: async () => {
    const api = createAuthAxios()
    const response = await api.get('/notifications/unread-count')
    return response.data
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const api = createAuthAxios()
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const api = createAuthAxios()
    const response = await api.put('/notifications/mark-all-read')
    return response.data
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const api = createAuthAxios()
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  }
}

// Custom hooks for notifications
export const useNotifications = (unreadOnly = false) => {
  const [data, setData] = useState({ notifications: [], unread_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const result = await notificationApi.getNotifications(unreadOnly)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [unreadOnly])

  return { data, loading, error, refetch: fetchNotifications }
}

export const useUnreadCount = () => {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = async () => {
    try {
      const result = await notificationApi.getUnreadCount()
      setCount(result.unread_count)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCount()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return { count, loading, refetch: fetchCount }
}

export const useNotificationActions = () => {
  const [loading, setLoading] = useState(false)

  const markAsRead = async (notificationId) => {
    try {
      setLoading(true)
      await notificationApi.markAsRead(notificationId)
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to mark as read')
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      await notificationApi.markAllAsRead()
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to mark all as read')
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      setLoading(true)
      await notificationApi.deleteNotification(notificationId)
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to delete notification')
    } finally {
      setLoading(false)
    }
  }

  return { markAsRead, markAllAsRead, deleteNotification, loading }
}



// Custom hooks
export const useMyClassrooms = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      const result = await classroomApi.getMyClassrooms()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch classrooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassrooms()
  }, [])

  return { data, loading, error, refetch: fetchClassrooms }
}

export const useEnrolledClassrooms = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      const result = await classroomApi.getEnrolledClassrooms()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch enrolled classrooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassrooms()
  }, [])

  return { data, loading, error, refetch: fetchClassrooms }
}

export const useClassroomAnalytics = (classroomId) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = async () => {
    if (!classroomId) return

    try {
      setLoading(true)
      const result = await classroomApi.getClassroomAnalytics(classroomId)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [classroomId])

  return { data, loading, error, refetch: fetchAnalytics }
}

export const useClassroomStudents = (classroomId) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStudents = async () => {
    if (!classroomId) return

    try {
      setLoading(true)
      const result = await classroomApi.getClassroomStudents(classroomId)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [classroomId])

  return { data, loading, error, refetch: fetchStudents }
}


// Custom hook for classroom actions
export const useClassroomActions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const archiveClassroom = async (classroomId) => {
    try {
      setLoading(true)
      setError(null)
      const result = await classroomApi.archiveClassroom(classroomId)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to archive classroom'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const restoreClassroom = async (classroomId) => {
    try {
      setLoading(true)
      setError(null)
      const result = await classroomApi.restoreClassroom(classroomId)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to restore classroom'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const permanentlyDelete = async (classroomId) => {
    try {
      setLoading(true)
      setError(null)
      const result = await classroomApi.permanentlyDeleteClassroom(classroomId)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to permanently delete classroom'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    archiveClassroom,
    restoreClassroom,
    permanentlyDelete,
    loading,
    error,
    clearError
  }
}



// hooks for the assignmnet (deletion ,restults, and update )

// Custom hook for assignment actions
export const useAssignmentActions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteAssignment = async (classroomId, assignmentId) => {
    try {
      setLoading(true)
      setError(null)
      const result = await classroomApi.deleteAssignment(classroomId, assignmentId)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete assignment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateAssignment = async (classroomId, assignmentId, updateData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await classroomApi.updateAssignment(classroomId, assignmentId, updateData)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to update assignment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getResults = async (classroomId, assignmentId) => {
    try {
      setLoading(true)
      setError(null)
      const result = await classroomApi.getAssignmentResults(classroomId, assignmentId)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to get results'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    deleteAssignment,
    updateAssignment,
    getResults,
    loading,
    error,
    clearError
  }
}