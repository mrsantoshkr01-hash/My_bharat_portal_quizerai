'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Clock, 
  Trophy,
  Users,
  AlertCircle,
  CheckCircle,
  Play,
  Eye,
  Calendar,
  BarChart3,
  FileText,
  ArrowLeft
} from 'lucide-react'
import { classroomApi } from '@/utils/api/classroomApi'
import { quizApi } from '@/utils/api/quizApi'
import { useAuthStore } from '@/store/authStore'
import Header from '@/components/layout/Header'
import Link from 'next/link'

const StudentClassroomView = () => {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [classroom, setClassroom] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchClassroomData()
  }, [params.id])

  const fetchClassroomData = async () => {
    try {
      setLoading(true)
      
      // Fetch classroom details and assignments in parallel
      const [classroomResponse, assignmentsResponse] = await Promise.all([
        classroomApi.getClassroom(params.id),
        classroomApi.getClassroomAssignments(params.id)
      ])
      
      setClassroom(classroomResponse)
      setAssignments(assignmentsResponse)
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load classroom data')
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStatus = (assignment) => {
    const now = new Date()
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    const hasSubmission = assignment.student_submission
    
    if (hasSubmission) {
      return 'completed'
    } else if (dueDate && now > dueDate) {
      return 'overdue'
    } else {
      return 'pending'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleTakeAssignment = (assignmentId) => {
    router.push(`/assignment/${assignmentId}/take`)
  }

  const handleViewResults = (assignmentId) => {
    router.push(`/assignment/${assignmentId}/results`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            {/* Loading skeleton */}
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
                <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Classroom</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pendingAssignments = assignments.filter(a => getAssignmentStatus(a) === 'pending')
  const completedAssignments = assignments.filter(a => getAssignmentStatus(a) === 'completed')
  const overdueAssignments = assignments.filter(a => getAssignmentStatus(a) === 'overdue')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
            whileHover={{ x: -2 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Classrooms
          </motion.button>

          {/* Classroom Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">{classroom.name}</h1>
                  <p className="text-lg text-slate-600">{classroom.subject}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {classroom.teacher_name}
                    </span>
                    <span>•</span>
                    <span>{classroom.student_count} students</span>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{pendingAssignments.length}</div>
                  <div className="text-sm text-slate-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedAssignments.length}</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{overdueAssignments.length}</div>
                  <div className="text-sm text-slate-600">Overdue</div>
                </div>
              </div>
            </div>

            {classroom.description && (
              <p className="text-slate-600 mt-4 pt-4 border-t border-slate-200">
                {classroom.description}
              </p>
            )}
          </motion.div>

          {/* Assignments Section */}
          <div className="space-y-6">
            {/* Pending Assignments */}
            {pendingAssignments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Pending Assignments ({pendingAssignments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingAssignments.map((assignment, index) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onTake={handleTakeAssignment}
                      onViewResults={handleViewResults}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Overdue Assignments */}
            {overdueAssignments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Overdue Assignments ({overdueAssignments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {overdueAssignments.map((assignment, index) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onTake={handleTakeAssignment}
                      onViewResults={handleViewResults}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Completed Assignments */}
            {completedAssignments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed Assignments ({completedAssignments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedAssignments.map((assignment, index) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onTake={handleTakeAssignment}
                      onViewResults={handleViewResults}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* No Assignments */}
            {assignments.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No Assignments Yet</h3>
                <p className="text-slate-500">Your teacher hasn&apos;t assigned any quizzes yet. Check back later!</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const AssignmentCard = ({ assignment, onTake, onViewResults, delay = 0 }) => {
  const status = getAssignmentStatus(assignment)
  const statusColor = getStatusColor(status)
  const StatusIcon = getStatusIcon(status)

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 line-clamp-1">{assignment.title}</h3>
            <p className="text-sm text-slate-500">{assignment.quiz.total_questions} questions</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor}`}>
          {StatusIcon}
          {status}
        </span>
      </div>

      {assignment.description && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{assignment.description}</p>
      )}

      <div className="space-y-2 mb-4 text-sm text-slate-500">
        <div className="flex items-center justify-between">
          <span>Due Date:</span>
          <span className="font-medium">{formatDate(assignment.due_date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Time Limit:</span>
          <span className="font-medium">{assignment.time_limit_minutes || assignment.quiz.estimated_time_minutes || 'No limit'} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Points:</span>
          <span className="font-medium">{assignment.quiz.total_points}</span>
        </div>
        {assignment.student_submission && (
          <div className="flex items-center justify-between">
            <span>Score:</span>
            <span className="font-medium text-green-600">{assignment.student_submission.score_percentage}%</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {status === 'completed' ? (
          <button
            onClick={() => onViewResults(assignment.id)}
            className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Results
          </button>
        ) : (
          <button
            onClick={() => onTake(assignment.id)}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              status === 'overdue' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Play className="w-4 h-4" />
            {status === 'overdue' ? 'Take (Late)' : 'Take Assignment'}
          </button>
        )}
        
        {assignment.student_submission && (
          <button
            onClick={() => onViewResults(assignment.id)}
            className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            View Previous Results
          </button>
        )}
      </div>
    </motion.div>
  )
}

const getAssignmentStatus = (assignment) => {
  const now = new Date()
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
  const hasSubmission = assignment.student_submission
  
  if (hasSubmission) {
    return 'completed'
  } else if (dueDate && now > dueDate) {
    return 'overdue'
  } else {
    return 'pending'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100'
    case 'overdue': return 'text-red-600 bg-red-100'
    case 'pending': return 'text-orange-600 bg-orange-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-4 h-4" />
    case 'overdue': return <AlertCircle className="w-4 h-4" />
    case 'pending': return <Clock className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}

export default StudentClassroomView