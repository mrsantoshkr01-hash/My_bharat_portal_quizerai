'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Calendar,
  User,
  BookOpen,
  Target,
  Loader2
} from 'lucide-react'
import { classroomApi } from '@/utils/api/classroomApi'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

const AssignmentResults = () => {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resultsData, setResultsData] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const assignmentId = params.id

  useEffect(() => {
    if (isAuthenticated && assignmentId) {
      fetchResults()
    }
  }, [isAuthenticated, assignmentId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await classroomApi.getAssignmentResultsId(assignmentId)
      setResultsData(data)
    } catch (err) {
      console.error('Error fetching assignment results:', err)
      setError(err.response?.data?.detail || 'Failed to load assignment results')
      if (err.response?.status === 404) {
        toast.error('Assignment results not found')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    if (resultsData?.assignment?.classroom_id) {
      router.push(`/student/classroom/${resultsData.assignment.classroom_id}`)
    } else {
      router.back()
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100'
    if (percentage >= 70) return 'bg-blue-100'
    if (percentage >= 50) return 'bg-orange-100'
    return 'bg-red-100'
  }

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
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading Results</h2>
              <p className="text-slate-600">Please wait while we load your assignment results...</p>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

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
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Unable to Load Results</h2>
              <p className="text-slate-600 mb-8">{error}</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </motion.button>
                <motion.button
                  onClick={fetchResults}
                  className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-slate-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!resultsData?.results_available) {
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
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Results Pending</h2>
              <p className="text-slate-600 mb-8">
                Your assignment has been submitted successfully! Results will be available after your teacher has reviewed and graded your submission.
              </p>
              <motion.button
                onClick={handleGoBack}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Classroom
              </motion.button>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const { assignment, quiz, latest_submission, all_attempts, answers } = resultsData
  const score = latest_submission.score_percentage || 0
  const isPassed = latest_submission.is_passed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <motion.button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -2 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classroom
          </motion.button>

          {/* Results Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Assignment Results</h1>
              <h2 className="text-xl text-slate-600 mb-4">{assignment.title}</h2>
              
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold mb-6 ${
                isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isPassed ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Passed
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6" />
                    Not Passed
                  </>
                )}
              </div>

              {/* Score Display */}
              <div className="text-6xl font-bold mb-4">
                <span className={getScoreColor(score)}>
                  {score}%
                </span>
              </div>
              <p className="text-xl text-slate-600">
                You scored {latest_submission.questions_correct} out of {latest_submission.questions_total} questions correctly
              </p>
            </div>

            {/* Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-800">Submitted</div>
                <div className="text-sm text-slate-600">{formatDate(latest_submission.submitted_at)}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-800">Time Taken</div>
                <div className="text-sm text-slate-600">{latest_submission.time_taken_minutes} minutes</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="font-semibold text-slate-800">Attempt</div>
                <div className="text-sm text-slate-600">{latest_submission.attempt_number} of {assignment.max_attempts}</div>
              </div>
            </div>

            {/* Late Submission Warning */}
            {latest_submission.is_late && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Late Submission</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  This assignment was submitted after the due date.
                </p>
              </div>
            )}

            {/* Grade Comments */}
            {latest_submission.grade_comments && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Teacher Feedback</span>
                </div>
                <p className="text-blue-700">{latest_submission.grade_comments}</p>
              </div>
            )}
          </motion.div>

          {/* All Attempts */}
          {all_attempts && all_attempts.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">All Attempts</h3>
              <div className="space-y-3">
                {all_attempts.map((attempt) => (
                  <div key={attempt.attempt_number} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-600">#{attempt.attempt_number}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{formatDate(attempt.submitted_at)}</div>
                        {attempt.is_late && (
                          <span className="text-xs text-orange-600">Late submission</span>
                        )}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(attempt.score_percentage)}`}>
                      {attempt.score_percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Detailed Results */}
          {answers && answers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Question Review</h3>
                <motion.button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </motion.button>
              </div>

              {showAnswers && (
                <div className="space-y-6">
                  {answers.map((answer, index) => (
                    <motion.div
                      key={answer.question_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-slate-200 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          answer.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Q{index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 mb-2">{answer.question_text}</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-slate-600">Your Answer:</span>
                              <div className={`mt-1 p-3 rounded-lg border-2 ${
                                answer.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {answer.is_correct ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                  <span className={answer.is_correct ? 'text-green-800' : 'text-red-800'}>
                                    {answer.user_answer}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!answer.is_correct && answer.correct_answer && (
                              <div>
                                <span className="text-sm font-medium text-slate-600">Correct Answer:</span>
                                <div className="mt-1 p-3 rounded-lg border-2 border-green-300 bg-green-50">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-800">{answer.correct_answer}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {answer.explanation && (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Explanation</span>
                                </div>
                                <p className="text-sm text-blue-700">{answer.explanation}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                            <div className="text-sm text-slate-600">
                              Points: <span className="font-medium">{answer.points_earned} / {answer.max_points}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              answer.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {answer.is_correct ? 'Correct' : 'Incorrect'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default AssignmentResults