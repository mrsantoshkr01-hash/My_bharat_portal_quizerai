'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2, ArrowLeft, Clock, Users } from 'lucide-react'
import QuizPage from '@/app/quiz/[id]/page'
import { classroomApi } from '@/utils/api/classroomApi'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'

export default function AssignmentTakePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assignmentData, setAssignmentData] = useState(null)

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return

    // Check authentication
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    // Validate assignment ID
    if (!params?.id || isNaN(params.id)) {
      setError('Invalid assignment ID')
      setLoading(false)
      return
    }

    // Check assignment access and load data
    checkAssignmentAccess()
  }, [params?.id, isAuthenticated, authLoading])

  const checkAssignmentAccess = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get assignment details to verify access
      const assignmentResponse = await classroomApi.getAssignmentDetails(params.id)
      console.log(assignmentResponse)

      // Check if assignment is accessible
      const now = new Date()
      const dueDate = assignmentResponse.assignment.due_date ?
        new Date(assignmentResponse.assignment.due_date) : null
      const isOverdue = dueDate && now > dueDate

      // Check if student can still take the assignment
      if (isOverdue && !assignmentResponse.assignment.allow_late_submission) {
        setError('This assignment is overdue and late submissions are not allowed.')
        setLoading(false)
        return
      }

      // Check attempts
      if (assignmentResponse.attempts_made >= assignmentResponse.assignment.max_attempts) {
        setError('You have reached the maximum number of attempts for this assignment.')
        setLoading(false)
        return
      }

      // Check if assignment is active
      if (assignmentResponse.assignment.status !== 'ACTIVE' && assignmentResponse.assignment.status !== 'active') {
        setError('This assignment is no longer available.')
        setLoading(false)
        return
      }

      setAssignmentData(assignmentResponse)
      setLoading(false)

    } catch (err) {
      console.error('Assignment access check failed:', err)

      if (err.response?.status === 403) {
        setError('You do not have access to this assignment.')
      } else if (err.response?.status === 404) {
        setError('Assignment not found.')
      } else {
        setError(err.response?.data?.detail || 'Failed to load assignment. Please try again.')
      }

      setLoading(false)
    }
  }

  const handleGoBack = () => {
    if (assignmentData?.classroom) {
      router.push(`/student/classroom/${assignmentData.classroom.id}`)
    } else {
      router.back()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading Assignment</h2>
              <p className="text-slate-600">
                Please wait while we prepare your assignment...
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Cannot Access Assignment</h2>
              <p className="text-slate-600 mb-8">{error}</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </motion.button>

                <motion.button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-slate-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - render QuizPage
  if (assignmentData) {
    return <QuizPage assignmentData={assignmentData} />
  }

  // Fallback (shouldn't reach here)
  return null
}
