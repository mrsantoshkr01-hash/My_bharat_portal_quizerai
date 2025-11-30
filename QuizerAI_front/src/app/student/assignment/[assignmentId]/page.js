'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Play, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { StudentGuard } from '@/components/auth/RoleGuard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { classroomApi } from '@/utils/api/classroomApi'
import { quizApi } from '@/utils/api/quizApi'
import toast from 'react-hot-toast'
import QuizPage from '@/app/quiz/[id]/page' // Your existing QuizPage component

const StudentAssignmentPage = () => {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizSession, setQuizSession] = useState(null)

  const assignmentId = params.assignmentId

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData()
    }
  }, [assignmentId])

  const fetchAssignmentData = async () => {
    try {
      setLoading(true)
      // This would be a new API endpoint to get assignment details for students
      const assignmentData = await classroomApi.getAssignmentForStudent(assignmentId)
      setAssignment(assignmentData.assignment)
      setQuiz(assignmentData.quiz)
    } catch (error) {
      toast.error('Failed to load assignment')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = async () => {
    try {
      const sessionData = await quizApi.startQuizSession(assignmentId)
      setQuizSession(sessionData)
      
      // Transform quiz data for your QuizPage component
      const transformedQuiz = {
        id: quiz.id,
        title: assignment.title,
        description: assignment.description || quiz.description,
        questions: quiz.questions.map((q, index) => ({
          id: index + 1,
          type: 'mcq',
          text: q.question_text || q.text,
          options: q.options || [],
          correctAnswer: q.correct_option_index || q.correctAnswer,
          points: q.points || 10,
          explanation: q.explanation || null
        })),
        totalPoints: quiz.questions.length * 10,
        passingScore: 70,
        difficulty: quiz.difficulty || 'medium'
      }
      
      // Store the quiz data temporarily for QuizPage
      localStorage.setItem(`assignment_quiz_${assignmentId}`, JSON.stringify(transformedQuiz.questions))
      
      setShowQuiz(true)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to start quiz'
      toast.error(errorMessage)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const isOverdue = assignment?.due_date && new Date(assignment.due_date) < new Date()
  const canTakeQuiz = assignment?.status !== 'completed' && (assignment?.allow_late_submission || !isOverdue)

  if (loading) {
    return (
      <StudentGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-slate-200 rounded w-64"></div>
                <div className="bg-white rounded-2xl p-8">
                  <div className="h-12 bg-slate-200 rounded w-96 mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </StudentGuard>
    )
  }

  if (showQuiz) {
    return (
      <QuizPage 
        quizId={`assignment_${assignmentId}`}
        onNavigate={(path) => router.push(path)}
        isAssignment={true}
        assignmentData={assignment}
        onQuizComplete={(results) => {
          // Handle quiz completion for assignments
          // Submit to backend, update assignment status, etc.
          setShowQuiz(false)
        }}
      />
    )
  }

  return (
    <StudentGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            
            {/* Assignment Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800">{assignment?.title}</h1>
                      <p className="text-slate-600">{assignment?.classroom_name}</p>
                    </div>
                  </div>
                  
                  {assignment?.description && (
                    <p className="text-slate-700 mb-4">{assignment.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{assignment?.teacher_name}</span>
                    </div>
                    {assignment?.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                    )}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment?.status)}`}>
                      {assignment?.status || 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quiz Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Quiz Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800">{quiz?.total_questions}</div>
                  <div className="text-sm text-slate-600">Questions</div>
                </div>
                {assignment?.time_limit_minutes && (
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-800">{assignment.time_limit_minutes}</div>
                    <div className="text-sm text-slate-600">Minutes</div>
                  </div>
                )}
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800">{assignment?.max_attempts || 1}</div>
                  <div className="text-sm text-slate-600">Attempt{assignment?.max_attempts !== 1 ? 's' : ''}</div>
                </div>
              </div>
              
              {assignment?.instructions && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">Special Instructions:</h4>
                  <p className="text-blue-700">{assignment.instructions}</p>
                </div>
              )}
              
              {/* Status Messages */}
              {isOverdue && !assignment?.allow_late_submission && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">This assignment is overdue and no longer accepts submissions.</span>
                  </div>
                </div>
              )}
              
              {isOverdue && assignment?.allow_late_submission && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 mb-6">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">This assignment is overdue but still accepts late submissions.</span>
                  </div>
                </div>
              )}
              
              {assignment?.status === 'completed' && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">You have already completed this assignment.</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-4"
            >
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </button>
              
              {canTakeQuiz && (
                <motion.button
                  onClick={handleStartQuiz}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" />
                  {assignment?.status === 'in_progress' ? 'Continue Quiz' : 'Start Quiz'}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
        
        <Footer />
      </div>
    </StudentGuard>
  )
}

export default StudentAssignmentPage