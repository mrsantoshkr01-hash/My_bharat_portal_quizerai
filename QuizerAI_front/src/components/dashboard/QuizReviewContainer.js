'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Target,
  BookOpen,
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  Award,
  BarChart3,
  Home,
  Trash2
} from 'lucide-react'

// Use the same API client from your existing analyticsApi.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error)
    throw error
  }
}

// Quiz Review API functions matching your backend
const quizReviewApi = {
  getUserSessions: async (userId, skip = 0, limit = 50) => {
    return await apiRequest(`/api/quiz-sessions/user/${userId}/sessions?skip=${skip}&limit=${limit}`)
  },

  getSessionDetails: async (sessionId) => {
    return await apiRequest(`/api/quiz-sessions/${sessionId}/detailed`)
  },

  deleteSession: async (sessionId) => {
    return await apiRequest(`/api/quiz-sessions/${sessionId}`, {
      method: 'DELETE'
    })
  }


}

// Hook to get current user ID (replace with your auth logic)
const useCurrentUser = () => {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    // Replace this with your actual user context/auth logic
    // For now, assuming user ID is stored in localStorage or context
    const getCurrentUserId = () => {
      if (typeof window !== 'undefined') {
        // You might get this from your auth context or JWT token
        const userDataStr = localStorage.getItem('userData')
        if (userDataStr) {
          const userData = JSON.parse(userDataStr)
          return userData.id
        }
        // Or decode from JWT token
        const token = localStorage.getItem('authToken')
        if (token) {
          // Decode JWT to get user ID (implement based on your token structure)
          return 1 // Placeholder - replace with actual user ID extraction
        }
      }
      return null
    }

    setUserId(getCurrentUserId())
  }, [])

  return userId
}

// Quiz Sessions List Component
const QuizSessionsList = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const currentUserId = useCurrentUser()

  useEffect(() => {
    if (currentUserId) {
      fetchSessions()
    }
  }, [currentUserId])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await quizReviewApi.getUserSessions(currentUserId)
      setSessions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' ||
      (filter === 'passed' && session.is_passed) ||
      (filter === 'failed' && !session.is_passed)

    const matchesSearch = session.quiz_title.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })


  const handleDeleteSession = async (sessionId, sessionTitle) => {
    if (window.confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      try {
        setDeleteLoading(sessionId)
        await quizReviewApi.deleteSession(sessionId)

        // Remove from local state
        setSessions(prevSessions =>
          prevSessions.filter(session => session.session_id !== sessionId)
        )

        // Show success message (you can use toast if available)
        alert('Quiz session deleted successfully!')

      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete quiz session. Please try again.')
      } finally {
        setDeleteLoading(null)
      }
    }
  }

  // this is for the delete configuration 
  const DeleteConfirmDialog = ({ session, onConfirm, onCancel }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Quiz Session</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to delete &quot;<strong>{session.quiz_title}</strong>&quot;?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )



  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!currentUserId) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Authentication Required</h3>
        <p className="text-gray-500">Please log in to view your quiz sessions</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Sessions</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Quiz Review</h1>
        <p className="text-gray-600">Review your attempted questions and track your progress</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-0 sm:min-w-[140px]"
            >
              <option value="all">All Sessions</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 text-center sm:text-right">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.map((session) => (
        <motion.div
          key={session.session_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onSelectSession(session.session_id)}
            >
              {/* Existing session content */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{session.quiz_title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(session.percentage_score)}`}>
                    {session.percentage_score}%
                  </span>
                  {session.is_passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(session.completion_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{session.time_taken_minutes}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 flex-shrink-0" />
                  <span>{session.questions_answered}/{session.total_questions} questions</span>
                </div>
              </div>
            </div>

            {/* ADD DELETE BUTTON AND ARROW */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteSession(session.session_id, session.quiz_title)
                }}
                disabled={deleteLoading === session.session_id}
                className={`p-2 rounded-lg transition-colors ${deleteLoading === session.session_id
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                  }`}
                title="Delete quiz session"
              >
                {deleteLoading === session.session_id ? (
                  <div className="w-4 h-4 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </button>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Detailed Quiz Review Component
const QuizReviewDetails = ({ sessionId, onBack }) => {
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showExplanations, setShowExplanations] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchSessionDetails()
  }, [sessionId])

  const fetchSessionDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await quizReviewApi.getSessionDetails(sessionId)
      setSessionData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Session</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Sessions
        </button>
      </div>
    )
  }

  const { session, questions_and_answers } = sessionData

  // Filter questions based on user selection
  const filteredQuestions = questions_and_answers.filter(qa => {
    switch (filterType) {
      case 'correct': return qa.is_correct
      case 'incorrect': return !qa.is_correct && !qa.was_skipped
      case 'skipped': return qa.was_skipped
      default: return true
    }
  })

  const currentQuestion = filteredQuestions[currentQuestionIndex]

  const getStatusIcon = (qa) => {
    if (qa.was_skipped) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    if (qa.is_correct) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = (qa) => {
    if (qa.was_skipped) return 'bg-yellow-100 text-yellow-700'
    if (qa.is_correct) return 'bg-green-100 text-green-700'
    return 'bg-red-100 text-red-700'
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-1 sm:mt-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{session.quiz_title}</h1>
          <p className="text-gray-600 text-sm sm:text-base">Review your answers and explanations</p>
        </div>
      </div>

      {/* Session Summary */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-800">{session.percentage_score}%</div>
            <div className="text-xs sm:text-sm text-gray-600">Final Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {questions_and_answers.filter(qa => qa.is_correct).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {questions_and_answers.filter(qa => !qa.is_correct && !qa.was_skipped).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Incorrect</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {questions_and_answers.filter(qa => qa.was_skipped).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Skipped</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Filter Questions:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All', count: questions_and_answers.length },
              { id: 'correct', label: 'Correct', count: questions_and_answers.filter(qa => qa.is_correct).length },
              { id: 'incorrect', label: 'Incorrect', count: questions_and_answers.filter(qa => !qa.is_correct && !qa.was_skipped).length },
              { id: 'skipped', label: 'Skipped', count: questions_and_answers.filter(qa => qa.was_skipped).length }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setFilterType(filter.id)
                  setCurrentQuestionIndex(0)
                }}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterType === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          <div className="pt-2 border-t">
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${showExplanations
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {showExplanations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </button>
          </div>
        </div>
      </div>

      {/* Question Review */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-sm border text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Questions Found</h3>
          <p className="text-gray-500">No questions match the current filter criteria</p>
        </div>
      ) : (
        <>
          {/* Current Question */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {getStatusIcon(currentQuestion)}
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(currentQuestion)}`}>
                  {currentQuestion.was_skipped ? 'Skipped' : currentQuestion.is_correct ? 'Correct' : 'Incorrect'}
                </span>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatTime(currentQuestion.time_taken_seconds)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 break-words">
              {currentQuestion.question_text}
            </h2>

            {/* Answer Display */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Your Answer:</h4>
                  <p className="text-blue-700 text-sm sm:text-base break-words">
                    {currentQuestion.was_skipped ? 'Question was skipped' : currentQuestion.user_answer}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Correct Answer:</h4>
                  <p className="text-green-700 text-sm sm:text-base break-words">{currentQuestion.correct_answer}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Points: </span>
                  <span className="text-gray-600">
                    {currentQuestion.points_earned} / {currentQuestion.points_possible}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Time: </span>
                  <span className="text-gray-600">{formatTime(currentQuestion.time_taken_seconds)}</span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            {showExplanations && currentQuestion.explanation && (
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Explanation:</h4>
                <p className="text-yellow-700 text-sm sm:text-base break-words">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="text-center flex-1 px-2">
              <div className="text-xs sm:text-sm text-gray-600">
                {currentQuestionIndex + 1} of {filteredQuestions.length}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === filteredQuestions.length - 1}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Main Quiz Review Container
const QuizReviewContainer = () => {
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  if (selectedSessionId) {
    return (
      <QuizReviewDetails
        sessionId={selectedSessionId}
        onBack={() => setSelectedSessionId(null)}
      />
    )
  }

  return (
    <QuizSessionsList
      onSelectSession={setSelectedSessionId}
    />
  )
}

export default QuizReviewContainer