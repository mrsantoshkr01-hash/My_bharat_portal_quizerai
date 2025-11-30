

"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  BookOpen,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertTriangle,
  Trophy,
  RotateCcw,
  Share2,
  Download,
  Home,
  Settings,
  Play,
  Pause,
  SkipForward,
  X,
  Timer,
  Target,
  Eye,
  Save,
  Check,
  Loader2,
  Twitter,
  Linkedin,
  Copy,
  MessageCircle,
  Mail,
  XCircle,
  ArrowLeft,
  MapPin
} from 'lucide-react'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useRouter } from 'next/navigation'
import AITutorPage from '@/app/ai_tutor/page'
import { useQuizSessionSave } from '@/utils/api/analyticsApi'
import { classroomApi } from '@/utils/api/classroomApi'
import StudentLocationTracker from '@/components/QuizSecurity/StudentLocationTracker';
import AntiCheatingMonitor from '@/components/QuizSecurity/AntiCheatingMonitor'
import toast from 'react-hot-toast'
import { quizSecurityApi } from '@/utils/api/quizSecurityApi';



// Simple confetti effect using CSS animations
const triggerConfetti = () => {
  const confettiContainer = document.createElement('div')
  confettiContainer.className = 'confetti-container'
  confettiContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div')
    confetti.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]};
      left: ${Math.random() * 100}%;
      animation: confetti-fall 3s linear forwards;
      transform: rotate(${Math.random() * 360}deg);
    `
    confettiContainer.appendChild(confetti)
  }

  document.body.appendChild(confettiContainer)
  setTimeout(() => document.body.removeChild(confettiContainer), 3000)
}

// Embedded Service Functions
const saveQuizSession = async (sessionData) => {
  try {
    // Simulate API call for demo
    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
      success: true,
      sessionId: `session_${Date.now()}`,
      shareableUrl: `${window.location.origin}/quiz/shared/${Date.now()}`,
      message: 'Quiz session saved successfully!'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to save quiz session'
    }
  }
}

const formatQuizSessionData = (quiz, answers, score, quizConfig, questionTimes) => {
  const questionsData = quiz.questions.map((question, index) => {
    const userAnswer = answers[index]
    const timeSpent = questionTimes[index] || 0
    const isCorrect = userAnswer !== undefined && userAnswer === question.correctAnswer
    const wasSkipped = userAnswer === undefined

    return {
      question_index: index,
      question_text: question.text,
      question_type: question.type,
      user_answer: userAnswer,
      correct_answer: question.correctAnswer,
      is_correct: isCorrect,
      points_earned: isCorrect ? question.points : 0,
      time_taken_seconds: timeSpent,
      was_skipped: wasSkipped,
      answer_attempts: 1
    }
  })

  return {
    quiz_external_id: quiz.id,
    quiz_metadata: {
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      subject: quiz.subject || 'General',
      language: 'English',
      source: 'ai_generated'
    },
    questions_data: questionsData,
    quiz_config: quizConfig,
    score_summary: score,
    time_tracking: questionTimes
  }
}

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (err) {
    return false
  }
}

const openShareWindow = (url, title = 'Share') => {
  const width = 600
  const height = 400
  const left = (window.innerWidth / 2) - (width / 2)
  const top = (window.innerHeight / 2) - (height / 2)

  window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  )
}

// Embedded QuizReview Component
const QuizReview = ({
  quiz,
  answers,
  score,
  questionTimes,
  onClose,
  onRetake
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showExplanations, setShowExplanations] = useState(true)
  const [filterType, setFilterType] = useState('all')


  // this state for to send the question in which user will have doubt 
  const [showAITutorPage, setShowAITutorPage] = useState(false)
  const [selectedQuestionForTutor, setSelectedQuestionForTutor] = useState(null)

  const reviewQuestions = quiz.questions.map((question, index) => {
    const userAnswer = answers[index]
    const timeSpent = questionTimes[index] || 0
    const isCorrect = userAnswer !== undefined && userAnswer === question.correctAnswer
    const wasSkipped = userAnswer === undefined

    return {
      ...question,
      questionIndex: index,
      userAnswer,
      isCorrect,
      wasSkipped,
      timeSpent,
      status: wasSkipped ? 'skipped' : isCorrect ? 'correct' : 'incorrect'
    }
  })

  const filteredQuestions = reviewQuestions.filter(q => {
    if (filterType === 'all') return true
    return q.status === filterType
  })

  const currentQuestion = filteredQuestions[currentQuestionIndex] || reviewQuestions[0]

  const analytics = {
    totalQuestions: reviewQuestions.length,
    correctCount: reviewQuestions.filter(q => q.isCorrect).length,
    incorrectCount: reviewQuestions.filter(q => !q.isCorrect && !q.wasSkipped).length,
    skippedCount: reviewQuestions.filter(q => q.wasSkipped).length,
    totalTime: Object.values(questionTimes).reduce((sum, time) => sum + time, 0)
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct': return 'text-green-600 bg-green-100'
      case 'incorrect': return 'text-red-600 bg-red-100'
      case 'skipped': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct': return <CheckCircle className="w-5 h-5" />
      case 'incorrect': return <XCircle className="w-5 h-5" />
      case 'skipped': return <AlertTriangle className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Quiz Review</h1>
                <p className="text-lg text-slate-600">{quiz.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{analytics.correctCount}</div>
                <div className="text-sm text-green-700">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{analytics.incorrectCount}</div>
                <div className="text-sm text-red-700">Incorrect</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <div className="text-2xl font-bold text-yellow-600">{analytics.skippedCount}</div>
                <div className="text-sm text-yellow-700">Skipped</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{formatTime(analytics.totalTime)}</div>
                <div className="text-sm text-blue-700">Total Time</div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Questions', count: analytics.totalQuestions },
                { id: 'correct', label: 'Correct', count: analytics.correctCount },
                { id: 'incorrect', label: 'Incorrect', count: analytics.incorrectCount },
                { id: 'skipped', label: 'Skipped', count: analytics.skippedCount }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setFilterType(filter.id)
                    setCurrentQuestionIndex(0)
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterType === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </motion.div>

          {/* Question Review */}
          <motion.div
            key={currentQuestion?.questionIndex || 0}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(currentQuestion?.status || 'skipped')}`}>
                  {getStatusIcon(currentQuestion?.status || 'skipped')}
                  <span className="font-medium capitalize">{currentQuestion?.status || 'skipped'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(currentQuestion?.timeSpent || 0)}</span>
                </div>
                <div className="text-sm text-slate-600">
                  Question {(currentQuestion?.questionIndex || 0) + 1} of {analytics.totalQuestions}
                </div>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-xl font-semibold text-slate-800 mb-6">
              {currentQuestion?.text || 'No question available'}
            </h2>

            {/* Answer Options (for MCQ) */}
            {currentQuestion?.type === 'mcq' && currentQuestion?.options && (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => {
                  const isUserAnswer = currentQuestion.userAnswer === index
                  const isCorrectAnswer = currentQuestion.correctAnswer === index

                  let optionStyle = 'border-slate-200'
                  if (isCorrectAnswer) {
                    optionStyle = 'border-green-500 bg-green-50'
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    optionStyle = 'border-red-500 bg-red-50'
                  }

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <span className={`font-medium ${isCorrectAnswer ? 'text-green-700' :
                          isUserAnswer && !isCorrectAnswer ? 'text-red-700' :
                            'text-slate-700'
                          }`}>
                          {option}
                        </span>
                        <div className="ml-auto flex items-center gap-2 text-sm">
                          {isUserAnswer && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              Your Answer
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Explanation */}
            {showExplanations && currentQuestion?.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-blue-50 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Explanation:</h4>
                </div>
                <p className="text-blue-700">{currentQuestion.explanation}</p>
              </motion.div>
            )}


            {/* Add this button after the explanation section */}
            <motion.button
              onClick={() => {
                setSelectedQuestionForTutor(currentQuestion) // This sets the question data
                setShowAITutorPage(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors mt-4"
            >
              <MessageCircle className="w-4 h-4" />
              Ask AI Tutor about this question
            </motion.button>
          </motion.div>

          {/* Navigation */}
          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mb-8"
          >
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-xs sm:text-base text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="text-center order-first sm:order-none">
              <div className="text-xs sm:text-sm text-slate-600 mb-1">
                Viewing {currentQuestionIndex + 1} of {filteredQuestions.length} {filterType} questions
              </div>
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${showExplanations
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {showExplanations ? 'Hide' : 'Show'} Explanations
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === filteredQuestions.length - 1}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-xs sm:text-base text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={onRetake}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-5 h-5" />
              Retake Quiz
            </motion.button>

            <motion.button
              onClick={onClose}
              className="flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-5 h-5" />
              Back to Results
            </motion.button>
          </motion.div>
        </div>
        {/* Add this before the closing </div> of your QuizReview component */}
        {showAITutorPage && selectedQuestionForTutor && (
          <AITutorPage
            isOpen={showAITutorPage}
            onClose={() => {
              setShowAITutorPage(false)
              setSelectedQuestionForTutor(null)
            }}
            questionData={{
              text: selectedQuestionForTutor.text,
              options: selectedQuestionForTutor.options,
              explanation: selectedQuestionForTutor.explanation,
              type: selectedQuestionForTutor.type
            }}
            quizContext={{
              userAnswer: selectedQuestionForTutor.userAnswer,
              correctAnswer: selectedQuestionForTutor.correctAnswer,
              isCorrect: selectedQuestionForTutor.isCorrect,
              wasSkipped: selectedQuestionForTutor.wasSkipped,
              questionIndex: selectedQuestionForTutor.questionIndex
            }}
          />
        )}
      </div>
      <Footer />
    </div>
  )
}


const timerOptions = [
  {
    id: 'no_limit',
    title: 'No Time Limit',
    description: 'Take as much time as you need',
    icon: Target,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'total_quiz',
    title: 'Total Quiz Timer',
    description: 'Set overall time limit for entire quiz',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'per_question',
    title: 'Per Question Timer',
    description: 'Set time limit for each question',
    icon: Timer,
    color: 'from-purple-500 to-pink-500'
  }
]

// Quizconfig modal is where we are doing all setting for the quizes this is diffeent for the teacher adn student
const QuizConfigModal = ({
  quiz,
  isOpen,
  onClose,
  onStart,
  totalQuestions,
  isAssignmentMode = false,
  assignmentData = null,
  classroomInfo = null,
  securityConfig = null
}) => {
  const [config, setConfig] = useState({
    timerType: 'total_quiz',
    totalTimeMinutes: 30,
    perQuestionTimeSeconds: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultsImmediately: true,
    allowReview: true,
    maxAttempts: 1,
    skipQuestions: true,
    negativeMarking: false // Add this new option
  })
  // For assignments, create config from teacher settings
  const getAssignmentConfig = () => {
    if (!isAssignmentMode || !assignmentData) return config

    return {
      timerType: assignmentData.time_limit_minutes ? 'total_quiz' : 'no_limit',
      totalTimeMinutes: assignmentData.time_limit_minutes || 30,
      perQuestionTimeSeconds: 60,
      shuffleQuestions: assignmentData.shuffle_questions || false,
      shuffleOptions: false,
      showResultsImmediately: assignmentData.show_results_immediately,
      allowReview: true,
      maxAttempts: assignmentData.max_attempts,
      skipQuestions: true,
      negativeMarking: assignmentData.negative_marking || false // ADD THIS LINE
    }
  }

  const handleStart = () => {
    const finalConfig = isAssignmentMode ? getAssignmentConfig() : config
    onStart(finalConfig)
  }

  if (!isOpen) return null

  // Assignment Start Screen
  if (isAssignmentMode) {
    const assignmentConfig = getAssignmentConfig()
    console.log(assignmentConfig)
    const formatDate = (dateString) => {
      if (!dateString) return 'No due date set'
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Header />
          <motion.div
            className="absolute inset-0 bg-white bg-opacity-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-2xl mx-4 pt-12 bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            {/* Assignment Header */}
            <div className="relative p-6 border-b border-slate-200">
              <button
                onClick={() => window.history.back()}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Start Assignment</h2>
                  <p className="text-slate-600">{assignmentData?.title || 'Assignment'}</p>
                  {classroomInfo && (
                    <p className="text-sm text-slate-500">{classroomInfo.name} • {classroomInfo.teacher_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="p-6 space-y-6">

              {/* Instructions */}
              {assignmentData?.instructions && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
                  <p className="text-blue-700">{assignmentData.instructions}</p>
                </div>
              )}

              {/* Assignment Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">{totalQuestions}</div>
                  <div className="text-sm text-slate-600">Questions</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">{assignmentData?.max_attempts || 1}</div>
                  <div className="text-sm text-slate-600">Max Attempts</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">{quiz?.totalPoints || totalQuestions * 10}</div>
                  <div className="text-sm text-slate-600">Total Points</div>
                </div>
              </div>

              {/* Assignment Settings (Read-only) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Assignment Settings</h3>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">Time Limit</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {assignmentData?.time_limit_minutes ? `${assignmentData.time_limit_minutes} minutes` : 'No limit'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">Due Date</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {formatDate(assignmentData?.due_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">Question Order</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {assignmentConfig.shuffleQuestions ? 'Randomized' : 'Fixed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">Results</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {assignmentConfig.showResultsImmediately ? 'Show immediately' : 'Show after review'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">Late Submission</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {assignmentData?.allow_late_submission ? 'Allowed' : 'Not allowed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">Negative Marking</span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {assignmentConfig.negativeMarking ? 'Enabled (-1 for wrong answers)' : 'Disabled'}
                    </span>
                  </div>


                </div>
              </div>

              {/* Anti-Cheating Measures */}
              {(securityConfig?.prevent_tab_switching ||
                securityConfig?.prevent_copy_paste ||
                securityConfig?.prevent_right_click ||
                securityConfig?.prevent_keyboard_shortcuts) && (
                  <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <div>
                        <span className="font-medium text-orange-800">Anti-Cheating Measures Active</span>
                        <div className="text-sm text-orange-700">
                          Security monitoring is enabled for this assignment
                        </div>
                      </div>
                    </div>
                    <span className="text-orange-700 font-medium">Enforced</span>
                  </div>
                )}


              {assignmentData?.geofencing_enabled && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="font-medium text-red-800">Location Restrictions</span>
                      <div className="text-sm text-red-700">
                        You must stay within {assignmentData?.allowed_radius || 100}m of the designated location
                      </div>
                    </div>
                  </div>
                  <span className="text-red-700 font-medium">Required</span>
                </div>
              )}

              {/* Important Notes */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Important Notes:</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• All settings have been configured by your teacher</li>
                      <li>• Make sure you have a stable internet connection</li>
                      <li>• Your progress will be automatically saved</li>

                      {assignmentData?.time_limit_minutes && (
                        <li>• The timer will start as soon as you begin</li>
                      )}

                      {assignmentConfig.negativeMarking && (
                        <li>• Incorrect answers will deduct 1 point from your score</li>
                      )}

                      {/* Geofencing warnings */}
                      {assignmentData?.geofencing_enabled && (
                        <>
                          <li className="text-red-700 font-medium">• Location tracking is required for this assignment</li>
                          <li className="text-red-700">• You must remain within the designated area throughout the quiz</li>
                          <li className="text-red-700">• Moving outside the allowed area will result in automatic submission</li>
                        </>
                      )}

                      {/* Anti-Cheating warnings */}
                      {securityConfig?.prevent_tab_switching && (
                        <>
                          <li className="text-orange-700 font-medium">• Do not switch tabs or minimize the window during the quiz</li>
                          <li className="text-orange-700">• You will receive warnings for leaving the quiz window</li>
                          <li className="text-orange-700">• Repeated violations will result in automatic submission</li>
                        </>
                      )}

                      {securityConfig?.prevent_copy_paste && (
                        <li className="text-orange-700">• Copy and paste functions are disabled</li>
                      )}

                      {securityConfig?.prevent_right_click && (
                        <li className="text-orange-700">• Right-click is disabled during the quiz</li>
                      )}

                      {securityConfig?.prevent_keyboard_shortcuts && (
                        <li className="text-orange-700">• Keyboard shortcuts (Ctrl+C, Ctrl+V, etc.) are blocked</li>
                      )}

                      {(securityConfig?.prevent_tab_switching ||
                        securityConfig?.prevent_copy_paste ||
                        securityConfig?.prevent_right_click ||
                        securityConfig?.prevent_keyboard_shortcuts) && (
                          <li className="text-orange-700 font-medium">• Maximum {securityConfig?.violation_warnings_allowed || 2} warnings allowed before quiz termination</li>
                        )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
              <div className="flex items-center justify-between">
                <div className="sm:text-sm text-[10px] text-slate-600">
                  Ready to start your assignment?
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                  >
                    Go Back
                  </button>
                  <motion.button
                    onClick={handleStart}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-4 h-4" />
                    Start Assignment
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Original Self-Quiz Configuration (existing code)
  // Original Self-Quiz Configuration (existing code)
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Header />
        <motion.div
          className="absolute inset-0 bg-white bg-opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-2xl mx-4 pt-12 bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className="relative p-6 border-b border-slate-200">
            <button
              onClick={() => window.history.back()}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Quiz Settings</h2>
                <p className="text-slate-600">{quiz?.title || 'Configure your quiz preferences'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{totalQuestions}</div>
                <div className="text-sm text-slate-600">Questions</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{quiz?.difficulty || 'Mixed'}</div>
                <div className="text-sm text-slate-600">Difficulty</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{quiz?.totalPoints || totalQuestions * 10}</div>
                <div className="text-sm text-slate-600">Total Points</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Timer Settings</h3>
              <div className="grid grid-cols-1 gap-3">
                {timerOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${config.timerType === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                    onClick={() => setConfig(prev => ({ ...prev, timerType: option.id }))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center`}>
                        <option.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{option.title}</h4>
                        <p className="text-sm text-slate-600">{option.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${config.timerType === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                        }`}>
                        {config.timerType === option.id && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {config.timerType === 'total_quiz' && (
                <motion.div
                  className="mt-4 p-4 bg-blue-50 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Total Quiz Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={config.totalTimeMinutes}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      totalTimeMinutes: parseInt(e.target.value) || 30
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </motion.div>
              )}

              {config.timerType === 'per_question' && (
                <motion.div
                  className="mt-4 p-4 bg-purple-50 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Time per Question (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={config.perQuestionTimeSeconds}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      perQuestionTimeSeconds: parseInt(e.target.value) || 60
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </motion.div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Quiz Behavior</h3>
              <div className="space-y-4">
                {[
                  {
                    key: 'shuffleQuestions',
                    title: 'Shuffle Questions',
                    description: 'Randomize the order of questions',
                    icon: RotateCcw
                  },
                  {
                    key: 'shuffleOptions',
                    title: 'Shuffle Answer Options',
                    description: 'Randomize the order of multiple choice options',
                    icon: RotateCcw
                  },
                  {
                    key: 'negativeMarking', // Add this new option
                    title: 'Negative Marking',
                    description: 'Deduct 1 point for each incorrect answer',
                    icon: AlertTriangle
                  },
                  {
                    key: 'showResultsImmediately',
                    title: 'Show Results Immediately',
                    description: 'Display results right after quiz completion',
                    icon: Eye
                  },
                  {
                    key: 'allowReview',
                    title: 'Allow Review',
                    description: 'Let users review answers before submission',
                    icon: Eye
                  },
                  {
                    key: 'skipQuestions',
                    title: 'Allow Skip Questions',
                    description: 'Users can skip questions and return later',
                    icon: Target
                  }
                ].map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <setting.icon className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="font-medium text-slate-800">{setting.title}</div>
                        <div className="text-sm text-slate-600">{setting.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        [setting.key]: !prev[setting.key]
                      }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${config[setting.key] ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        animate={{ x: config[setting.key] ? 26 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Ready to start your quiz with these settings?
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-4 h-4" />
                  Start Quiz
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Main QuizPage Component
const QuizPage = ({ quizId = 'demo-quiz', onNavigate = () => { }, assignmentDataProp = null }) => {




  // for the assignment and quiz assigned by the teacher 

  const [isAssignmentMode, setIsAssignmentMode] = useState(false)
  const [assignmentId, setAssignmentId] = useState(null)
  const [assignmentData, setAssignmentData] = useState(null)
  const [classroomInfo, setClassroomInfo] = useState(null)

  // Quiz State
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [quizConfig, setQuizConfig] = useState(null)
  const [showConfigModal, setShowConfigModal] = useState(true)
  const router = useRouter()

  // Timer State
  const [timeLeft, setTimeLeft] = useState(null)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [isTimerPaused, setIsTimerPaused] = useState(false)

  // Quiz Flow State
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(null)
  const [questionTimes, setQuestionTimes] = useState({})

  // Enhanced Features State
  const [showReview, setShowReview] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [copySuccess, setCopySuccess] = useState('')
  const { saveSession, saving, saved, error } = useQuizSessionSave()
  const [showLocationTracker, setShowLocationTracker] = useState(false);
  const [securitySessionId, setSecuritySessionId] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('prompt');
  const [geofencingEnabled, setGeofencingEnabled] = useState(false);
  const [allowedLocation, setAllowedLocation] = useState(null);
  const [isLocationViolation, setIsLocationViolation] = useState(false);
  const [securityConfig, setSecurityConfig] = useState(false)



  const handleSaveToDatabase = async () => {
    if (isAssignmentMode) {
      // Assignment submission
      await handleAssignmentSubmission()
    } else {
      // Original self-quiz saving
      await handleSelfQuizSave()
    }
  }

  // Updated assignment submission function
  const handleAssignmentSubmission = async () => {
    try {
      setIsSaving(true)
      const submissionData = {
        assignment_id: assignmentId,
        session_id: sessionId,
        answers: quiz.questions.map((question, index) => ({
          question_id: question.id,
          user_answer: answers[index] !== undefined ? question.options[answers[index]] : null,
          is_correct: answers[index] === question.correctAnswer,
          points_earned: answers[index] === question.correctAnswer ?
            question.points :
            (quiz.negativeMarking ? -question.points : 0),
          confidence_level: null
        })),
        score_summary: {
          total_marks_scored: score.points, // Can be negative
          max_possible_marks: score.maxPoints,
          correct_answers: score.correctCount,
          incorrect_answers: score.incorrectCount,
          skipped_answers: score.totalQuestions - score.answeredCount,
          negative_marking_enabled: quiz.negativeMarking
        },
        total_time_seconds: Object.values(questionTimes).reduce((sum, time) => sum + time, 0),
        completed_at: new Date().toISOString()
      }

      const result = await classroomApi.submitAssignment(assignmentId, submissionData)
      if (result) {
        setIsSaved(true)
        toast.success("Assignment submitted successfully!")
      }
    } catch (error) {
      console.error('Assignment submission failed:', error)
      toast.error("Failed to submit assignment")
      setSaveError(error.response?.data?.detail || 'Submission failed')
    } finally {
      setIsSaving(false)
    }
  }

  // Updated self-quiz save function
  const handleSelfQuizSave = async () => {
    const sessionData = {
      quiz_external_id: quiz.id,
      quiz_metadata: {
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty || 'medium',
        subject: quiz.subject || 'General',
        language: 'English',
        source: 'ai_generated',
        negative_marking: quiz.negativeMarking // Add this
      },
      questions_data: quiz.questions.map((question, index) => ({
        question_index: index,
        question_text: question.text,
        question_type: question.type || 'mcq',
        user_answer: answers[index] !== undefined ? question.options[answers[index]] : null,
        correct_answer: question.options[question.correctAnswer],
        is_correct: answers[index] === question.correctAnswer,
        points_earned: answers[index] === question.correctAnswer ?
          question.points :
          (quiz.negativeMarking ? -question.points : 0), // Updated for negative marking
        time_taken_seconds: questionTimes[index] || 0,
        was_skipped: answers[index] === undefined,
        answer_attempts: 1
      })),
      quiz_config: quizConfig,
      score_summary: {
        total_marks_scored: score.points, // Can be negative
        max_possible_marks: score.maxPoints,
        correct_answers: score.correctCount,
        incorrect_answers: score.incorrectCount,
        skipped_answers: score.totalQuestions - score.answeredCount,
        negative_marking_enabled: quiz.negativeMarking,
        // Keep legacy fields for compatibility
        points: score.points,
        maxPoints: score.maxPoints,
        percentage: Math.round((score.points / score.maxPoints) * 100),
        correctCount: score.correctCount,
        totalQuestions: score.totalQuestions,
        answeredCount: score.answeredCount,
        isPassed: score.isPassed
      },
      time_tracking: questionTimes
    }

    try {
      const response = await saveSession(sessionData)
      if (response.status == 'completed') {
        toast.success("Quiz Saved To Dashboard Successfully")
        setIsSaved(true)
      }
    } catch (err) {
      console.error('Quiz save failed:', err)
      toast.error("Quiz Failed To Save")
      setSaveError(err.message || 'Save failed')
    }
  }
  // Load demo quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      try {


        // /////////////////////// froom here we are using to set the assginment givent by the teacher and also if he want to do 

        // Detect if this is assignment mode
        const urlPath = window.location.pathname
        const isAssignment = urlPath.includes('/assignment/') && urlPath.includes('/take')

        setIsAssignmentMode(isAssignment)

        if (isAssignment) {
          // Extract assignment ID from URL: /assignment/123/take
          const assignmentIdMatch = urlPath.match(/\/assignment\/(\d+)\/take/)
          if (assignmentIdMatch) {
            const assignmentId = parseInt(assignmentIdMatch[1])
            setAssignmentId(assignmentId)

            // Load assignment data instead of localStorage
            await loadAssignmentData(assignmentId)
          }
        } else {
          // Original self-quiz logic
          const quizId = urlPath.split('/quiz/')[1]
          const storedQuizData = localStorage.getItem(`quiz_${quizId}`)

          if (storedQuizData) {
            const rawData = JSON.parse(storedQuizData)
            const transformedQuiz = transformSelfQuizData(rawData, quizId)
            setQuiz(transformedQuiz)
          }
        }
      } catch (error) {
        console.error('Error loading quiz:', error)
        setError('Failed to load quiz data')
      }
    }

    loadQuizData()
  }, [quizId])

  // Timer effect
  useEffect(() => {
    if (!isStarted || isTimerPaused || !quizConfig) return

    let interval = null

    if (quizConfig.timerType === 'total_quiz' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCompleteQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (quizConfig.timerType === 'per_question' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion()
            return quizConfig.perQuestionTimeSeconds
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeLeft, isStarted, isTimerPaused, quizConfig])

  // Question start time tracking
  useEffect(() => {
    if (isStarted && !isTimerPaused) {
      setQuestionStartTime(Date.now())
    }
  }, [currentQuestion, isStarted, isTimerPaused])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }




  // from here for the asssignment 

  const loadAssignmentData = async (assignmentId) => {
    try {
      const assignmentResponse = await classroomApi.getAssignmentDetails(assignmentId);

      console.log('Full assignment response:', assignmentResponse); // Debug log

      setAssignmentData({
        ...assignmentResponse.assignment,
        // Make sure geofencing fields are properly set
        geofencing_enabled: assignmentResponse.assignment.geofencing_enabled || false,
        allowed_latitude: assignmentResponse.assignment.allowed_latitude,
        allowed_longitude: assignmentResponse.assignment.allowed_longitude,
        allowed_radius: assignmentResponse.assignment.allowed_radius || 100,

        // there is quiz id in this we need that
        quiz_id: assignmentResponse.quiz.id,
        status: assignmentResponse.assignment.status

      });

      setClassroomInfo(assignmentResponse.classroom);

      if (assignmentResponse.quiz.id) {
        try {
          const secConfig = await quizSecurityApi.getSecurityConfig(assignmentResponse.quiz.id);
          setSecurityConfig(secConfig);
        } catch (error) {
          console.log('No security config found, using defaults');
          setSecurityConfig({
            prevent_tab_switching: true,
            prevent_copy_paste: true,
            prevent_right_click: true,
            prevent_keyboard_shortcuts: true,
            violation_warnings_allowed: 2
          });
        }
      }

      // Transform assignment data to quiz format
      const transformedQuiz = {
        id: `assignment_${assignmentId}`,
        title: assignmentResponse.assignment.title,
        description: assignmentResponse.assignment.description || assignmentResponse.quiz.description,
        questions: assignmentResponse.questions.map((q, index) => ({
          id: q.id,
          type: 'mcq',
          text: q.question_text,
          options: q.options,
          correctAnswer: q.options.findIndex(opt => opt === q.correct_answer),
          points: q.points,
          explanation: q.explanation || null
        })),
        totalPoints: assignmentResponse.quiz.total_points,
        passingScore: assignmentResponse.quiz.passing_score,
        difficulty: 'assigned',
        negativeMarking: assignmentResponse.assignment.negative_marking,
        // ADD GEOFENCING INFO TO QUIZ OBJECT
        geofencingEnabled: assignmentResponse.assignment.geofencing_enabled || false,
        // allowedLocation: assignmentResponse.assignment.geofencing_enabled ? {
        //   latitude: assignmentResponse.assignment.allowed_latitude,
        //   longitude: assignmentResponse.assignment.allowed_longitude,
        //   radius: assignmentResponse.assignment.allowed_radius || 100
        // } : null
      };

      setQuiz(transformedQuiz);
    } catch (error) {
      console.error('Error loading assignment:', error);
      setError(error.response?.data?.detail || 'Failed to load assignment');
    }
  };

  // Add helper function for self-quiz transformation
  const transformSelfQuizData = (rawData, quizId) => {
    return {
      id: quizId,
      title: "Generated Quiz",
      description: "AI Generated Quiz",
      questions: rawData.map((q, index) => ({
        id: index + 1,
        type: 'mcq',
        text: q.question,
        options: q.options,
        correctAnswer: q.options.findIndex(opt => opt === q.answer),
        points: 10,
        explanation: q.explanation || null
      })),
      totalPoints: rawData.length * 10,
      passingScore: 70,
      difficulty: 'medium'
    }
  }




  // /////////new
  const handleConfigStart = async (config) => {
    if (isAssignmentMode) {
      try {
        // 1. Create assignment session
        const sessionResponse = await classroomApi.startAssignment(assignmentId);
        setSessionId(sessionResponse.session_id);

        // 2. Check if geofencing is enabled for this assignment
        console.log('Checking geofencing:', {
          geofencing_enabled: assignmentData?.geofencing_enabled,
          allowed_latitude: assignmentData?.allowed_latitude,
          allowed_longitude: assignmentData?.allowed_longitude
        });
        console.log(assignmentData)

        if (assignmentData?.geofencing_enabled &&
          assignmentData?.allowed_latitude &&
          assignmentData?.allowed_longitude) {

          const locationConfig = {
            latitude: assignmentData.allowed_latitude,
            longitude: assignmentData.allowed_longitude,
            radius: assignmentData.allowed_radius || 100
          };

          setGeofencingEnabled(true);
          setAllowedLocation({
            locationConfig
          });

          console.log('Set allowedLocation to:', {
            latitude: assignmentData.allowed_latitude,
            longitude: assignmentData.allowed_longitude,
            radius: assignmentData.allowed_radius || 100
          });

          // 3. Create security session with device fingerprint
          const deviceFingerprint = generateDeviceFingerprint();
          console.log('Generated fingerprint:', typeof deviceFingerprint, deviceFingerprint);

          try {
            const securitySession = await quizSecurityApi.startSession({
              quiz_id: assignmentData?.quiz?.id || assignmentData.quiz_id,
              status: assignmentData?.status,
              // quiz_id: quiz.questions[0]?.id ? quiz.id.replace('assignment_', '') : assignmentData.quiz_id,
              device_fingerprint: deviceFingerprint,
              initial_location: null, // Will be set after permission
              ip_address: null,
              user_agent: navigator.userAgent
            });


            // Add this debug log BEFORE the API call:
            console.log('About to send to security API:', {
              quiz_id: assignmentData?.quiz?.id || assignmentData.quiz_id,
              assignmentData_quiz_id: assignmentData?.quiz_id,
              assignmentData_quiz: assignmentData?.quiz
            });



            setSecuritySessionId(securitySession.session_id || securitySession.id);
          } catch (securityError) {
            console.error('Failed to create security session:', securityError);
            // Continue without security session but still track location
          }

          // 4. Request location permission
          const permissionStatus = await requestLocationPermission();
          if (permissionStatus !== 'granted') {
            toast.error('Location permission is required for this assignment');
            return;
          }

          // 5. Verify initial location
          // 5. Verify initial location using the direct data
          const initialLocationCheck = await verifyInitialLocationWithConfig(locationConfig);
          if (!initialLocationCheck.allowed) {
            toast.error(`You must be within ${assignmentData.allowed_radius}m of the designated location to start this assignment`);
            return;
          }

          setShowLocationTracker(true);
          toast.success('Location verified! You can now start the assignment.');
        }



        if (assignmentData?.quiz_id) {
          try {
            const secConfig = await quizSecurityApi.getSecurityConfig(assignmentData.quiz_id);
            setSecurityConfig(secConfig);
          } catch (error) {
            console.log('No security config found, using defaults');
            setSecurityConfig({
              prevent_tab_switching: true,
              prevent_copy_paste: true,
              prevent_right_click: true,
              prevent_keyboard_shortcuts: true,
              violation_warnings_allowed: 2
            });
          }
        }


      } catch (error) {
        console.error('Failed to start assignment:', error);
        toast.error('Failed to start assignment. Please try again.');
        return;
      }
    }

    setQuizConfig(config);
    setIsStarted(true);
    setShowConfigModal(false);
    setQuiz(prev => ({ ...prev, negativeMarking: config.negativeMarking }));

    if (config.shuffleQuestions && quiz) {
      const shuffledQuestions = [...quiz.questions].sort(() => Math.random() - 0.5);
      setQuiz(prev => ({ ...prev, questions: shuffledQuestions }));
    }

    if (config.timerType === 'total_quiz') {
      setTimeLeft(config.totalTimeMinutes * 60);
    } else if (config.timerType === 'per_question') {
      setTimeLeft(config.perQuestionTimeSeconds);
    }
  };

  const handleCheatingViolation = async (violationData) => {
    console.log('Cheating violation:', violationData);
    setCheatingViolations(prev => prev + 1);

    if (violationData.action === 'terminate') {
      toast.error('Quiz terminated due to repeated violations');
      await handleCompleteQuiz();
    }
  };

  const handleCheatingWarning = (warningData) => {
    console.log('Cheating warning:', warningData);
  };

  const handleAnswerChange = (answer) => {
    if (questionStartTime) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestion]: timeSpent
      }))
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)

      if (quizConfig?.timerType === 'per_question') {
        setTimeLeft(quizConfig.perQuestionTimeSeconds)
      }
    } else {
      handleCompleteQuiz()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)

      if (quizConfig?.timerType === 'per_question') {
        setTimeLeft(quizConfig.perQuestionTimeSeconds)
      }
    }
  }

  const handleSkipQuestion = () => {
    if (quizConfig?.skipQuestions) {
      handleNextQuestion()
    }
  }

  const handleCompleteQuiz = async () => {
    setIsCompleted(true);
    setIsTimerPaused(true);

    // Terminate security session if it exists
    if (securitySessionId) {
      try {
        await quizSecurityApi.terminateSession(securitySessionId, 'quiz_completed');
      } catch (error) {
        console.error('Failed to terminate security session:', error);
      }
    }

    const results = calculateScore();
    setScore(results);

    if (results.percentage >= 80) {
      triggerConfetti();
    }

    setTimeout(() => setShowResults(true), 1000);
  };


  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationPermissionStatus('granted');
            resolve('granted');
          },
          (error) => {
            console.error('Location permission denied:', error);
            setLocationPermissionStatus('denied');
            resolve('denied');
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermissionStatus('denied');
      return 'denied';
    }
  };

  const verifyInitialLocationWithConfig = async (locationConfig) => {
    try {
      if (!locationConfig) {
        console.error('locationConfig is not provided');
        return { allowed: false, error: 'Location configuration not provided' };
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Location obtained:', latitude, longitude);
            console.log('Using location config:', locationConfig);

            const distance = calculateDistance(
              latitude,
              longitude,
              locationConfig.latitude,
              locationConfig.longitude
            );
            console.log('Distance from allowed location:', distance);

            const isWithinBounds = distance <= locationConfig.radius;
            console.log('Is within bounds:', isWithinBounds);

            resolve({
              allowed: isWithinBounds,
              distance,
              currentLocation: { latitude, longitude }
            });
          },
          (error) => {
            console.error('Location verification failed:', error);
            resolve({ allowed: false, error: error.message });
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
        );
      });
    } catch (error) {
      console.error('Initial location verification error:', error);
      return { allowed: false, error: error.message };
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleLocationViolation = async (violationData) => {
    console.log('Location violation detected:', violationData);
    setIsLocationViolation(true);

    // Show warning to student
    toast.error(`Location violation: You are outside the allowed area. Quiz will be submitted automatically if you don't return.`);

    // Auto-submit quiz if violation is severe
    if (!violationData.can_continue) {
      toast.error('Quiz terminated due to location violation');
      await handleCompleteQuiz();
    }
  };

  const handleLocationUpdate = async (locationData) => {
    console.log('Location updated:', locationData);

    if (geofencingEnabled && allowedLocation && securitySessionId) {
      // Update location in security system
      await quizSecurityApi.updateLocation(securitySessionId, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date().toISOString()
      });

      // Check if still within geofence
      const distance = calculateDistance(
        locationData.latitude,
        locationData.longitude,
        allowedLocation.latitude,
        allowedLocation.longitude
      );

      const wasViolation = isLocationViolation;
      const isViolation = distance > allowedLocation.radius;

      if (isViolation && !wasViolation) {
        // New violation
        await handleLocationViolation({
          violation_type: 'location_violation',
          can_continue: distance <= allowedLocation.radius * 1.5, // Grace period
          distance,
          allowed_radius: allowedLocation.radius
        });
      } else if (!isViolation && wasViolation) {
        // Violation resolved
        setIsLocationViolation(false);
        toast.success('Back in allowed area. Quiz continues.');
      }
    }
  };

  // Add this function anywhere in your component
  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 200), // Truncate user agent
      // Instead of full canvas data, just get a hash
      canvasHash: btoa(canvas.toDataURL()).substring(0, 100), // Truncated hash
      timestamp: Date.now()
    };

    // Create a shorter base64 encoded fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    return btoa(fingerprintString).substring(0, 500); // Limit to 500 chars
  }






  const renderQuizHeader = () => {
    // Safety check - return null if quiz isn't loaded yet
    if (!quiz) {
      return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2 w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{quiz.title}</h1>
            <p className="text-slate-600">Question {currentQuestion + 1} of {quiz.questions.length}</p>
            {isAssignmentMode && classroomInfo && (
              <p className="text-sm text-slate-500">
                {classroomInfo.name} • {classroomInfo.teacher_name}
              </p>
            )}
          </div>

          {/* Assignment-specific timer or regular timer */}
          {quizConfig?.timerType !== 'no_limit' && timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft <= 30 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{formatTime(timeLeft)}</span>
              {isAssignmentMode && (
                <span className="text-xs opacity-75">Assignment</span>
              )}
            </div>
          )}
        </div>

        {/* Show assignment instructions if available */}
        {isAssignmentMode && assignmentData?.instructions && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">Instructions:</p>
            <p className="text-sm text-blue-700">{assignmentData.instructions}</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    )
  }

  const renderResultsScreen = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Success notification */}
        <AnimatePresence>
          {copySuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {copySuccess}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add confetti CSS */}
        <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="text-3xl font-bold text-slate-800 mb-4">
                {isAssignmentMode ? 'Assignment Completed!' : 'Quiz Completed!'}
              </h1>

              {/* Assignment-specific info */}
              {isAssignmentMode && classroomInfo && (
                <p className="text-lg text-slate-600 mb-4">
                  {classroomInfo.name} • {classroomInfo.teacher_name}
                </p>
              )}

              {/* Updated Score Display - Show Marks Instead of Percentage */}
              <div className="text-6xl font-bold mb-4">
                <span className={`${score.points >= (score.maxPoints * (quiz.passingScore || 70) / 100)
                  ? 'text-green-600'
                  : score.points < 0
                    ? 'text-red-600'
                    : 'text-orange-600'
                  }`}>
                  {score.points}/{score.maxPoints}
                </span>
              </div>

              <p className="text-xl text-slate-600 mb-4">
                {score.points < 0 ? (
                  <span className="text-red-600 font-semibold">
                    Negative Score Due to Negative Marking
                  </span>
                ) : (
                  `You scored ${score.points} out of ${score.maxPoints} marks`
                )}
              </p>

              {/* Show negative marking info if enabled */}
              {quiz.negativeMarking && (
                <p className="text-sm text-slate-500 mb-6">
                  Negative marking was applied: -1 mark for each incorrect answer
                </p>
              )}

              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold mb-8 ${score.points >= (score.maxPoints * (quiz.passingScore || 70) / 100)
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
                }`}>
                {score.points >= (score.maxPoints * (quiz.passingScore || 70) / 100) ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Passed
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6" />
                    Needs Improvement
                  </>
                )}
              </div>

              {/* Updated Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8 text-sm">
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="font-bold text-green-800">{score.correctCount}</div>
                  <div className="text-green-600">Correct</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="font-bold text-red-800">{score.incorrectCount}</div>
                  <div className="text-red-600">Incorrect</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="font-bold text-slate-800">{score.totalQuestions - score.answeredCount}</div>
                  <div className="text-slate-600">Skipped</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="font-bold text-blue-800">{Math.round(Object.values(questionTimes).reduce((a, b) => a + b, 0) / 60)}m</div>
                  <div className="text-blue-600">Time</div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 mb-8">
                <h3 className="font-semibold text-slate-800 mb-3">Score Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Correct answers (+{score.correctCount} marks):</span>
                    <span className="text-green-600 font-semibold">+{score.correctCount}</span>
                  </div>
                  {quiz.negativeMarking && score.incorrectCount > 0 && (
                    <div className="flex justify-between">
                      <span>Incorrect answers (-{score.incorrectCount} marks):</span>
                      <span className="text-red-600 font-semibold">-{score.incorrectCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Skipped questions:</span>
                    <span className="text-slate-500">0</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between font-semibold">
                    <span>Final Score:</span>
                    <span className={score.points < 0 ? 'text-red-600' : 'text-slate-800'}>
                      {score.points}/{score.maxPoints}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="space-y-4">
                {/* Primary Actions Row */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl font-medium sm:font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 w-full sm:w-auto">
                  {/* Review Answers */}
                  <motion.button
                    onClick={() => setShowReview(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="w-5 h-5" />
                    Review Answers
                  </motion.button>

                  {/* Conditional Share Results - only for self-quizzes */}
                  {!isAssignmentMode && (
                    <div className="relative">
                      <motion.button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Share2 className="w-5 h-5" />
                        Share Results
                      </motion.button>

                      {/* Enhanced Share Dropdown */}
                      <AnimatePresence>
                        {showShareMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-48 z-50"
                          >
                            <button
                              onClick={() => handleShare('twitter')}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                            >
                              <Twitter className="w-4 h-4 text-blue-500" />
                              Share on Twitter
                            </button>

                            <button
                              onClick={() => handleShare('linkedin')}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                            >
                              <Linkedin className="w-4 h-4 text-blue-700" />
                              Share on LinkedIn
                            </button>

                            <button
                              onClick={() => handleShare('whatsapp')}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 rounded-lg transition-colors text-left"
                            >
                              <MessageCircle className="w-4 h-4 text-green-600" />
                              Share on WhatsApp
                            </button>

                            <button
                              onClick={() => handleShare('copy')}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                            >
                              <Copy className="w-4 h-4 text-slate-600" />
                              Copy Link
                            </button>

                            <button
                              onClick={() => handleShare('challenge')}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-yellow-50 rounded-lg transition-colors text-left"
                            >
                              <Trophy className="w-4 h-4 text-yellow-600" />
                              Challenge Friends
                            </button>

                            <button
                              onClick={() => handleShare('email')}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                            >
                              <Mail className="w-4 h-4 text-slate-600" />
                              Email Results
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Assignment-specific button */}
                  {isAssignmentMode && classroomInfo && (
                    <motion.button
                      onClick={() => router.push(`/student/classroom/${classroomInfo.id}`)}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back to Classroom
                    </motion.button>
                  )}
                </div>

                {/* Secondary Actions Row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Save/Submit Button */}
                  <motion.button
                    onClick={handleSaveToDatabase}
                    disabled={isSaving || isSaved}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${isSaved
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : isSaving
                        ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                        : 'border-2 border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    whileHover={!isSaving && !isSaved ? { scale: 1.05 } : {}}
                    whileTap={!isSaving && !isSaved ? { scale: 0.95 } : {}}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isAssignmentMode ? 'Submitting...' : 'Saving...'}
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="w-5 h-5" />
                        {isAssignmentMode ? 'Submitted to Teacher' : 'Saved to Dashboard'}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {isAssignmentMode ? 'Submit Assignment' : 'Save to Dashboard'}
                      </>
                    )}
                  </motion.button>

                  {/* Conditional Retake - only if assignment allows multiple attempts or self-quiz */}
                  {(!isAssignmentMode || (assignmentData?.max_attempts > 1)) && (
                    <motion.button
                      onClick={retakeQuiz}
                      className="flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw className="w-5 h-5" />
                      {isAssignmentMode ? 'Retake Assignment' : 'Retake Quiz'}
                    </motion.button>
                  )}
                </div>

                {/* Tertiary Actions */}
                <div className="flex justify-center pt-4">
                  <motion.button
                    onClick={() => {
                      if (isAssignmentMode && classroomInfo) {
                        router.push(`/student/classroom/${classroomInfo.id}`)
                      } else {
                        router.push('/dashboard')
                      }
                    }}
                    className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 px-6 py-2 rounded-lg font-medium transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Home className="w-5 h-5" />
                    {isAssignmentMode ? 'Back to Classroom' : 'Back to Dashboard'}
                  </motion.button>
                </div>
              </div>

              {/* Save Error Display */}
              {saveError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {saveError}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    )
  }

  const calculateScore = () => {
    let totalScore = 0
    let maxScore = 0
    let correctCount = 0
    let incorrectCount = 0

    quiz.questions.forEach((question, index) => {
      maxScore += question.points
      const userAnswer = answers[index]

      if (userAnswer !== undefined) {
        if (userAnswer === question.correctAnswer) {
          totalScore += question.points
          correctCount++
        } else {
          // Apply negative marking if enabled
          if (quiz.negativeMarking) {
            totalScore -= question.points // Deduct same points for wrong answer
          }
          incorrectCount++
        }
      }
    })

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    return {
      points: totalScore, // Can be negative now
      maxPoints: maxScore,
      percentage, // Can be negative percentage
      correctCount,
      incorrectCount,
      totalQuestions: quiz.questions.length,
      answeredCount: Object.keys(answers).length,
      timeSpent: questionTimes,
      isPassed: totalScore >= (maxScore * (quiz.passingScore / 100)) // Use actual marks for passing
    }
  }


  // Enhanced: Sharing Functions
  const handleShare = async (platform) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const quizUrl = `${baseUrl}/quiz/${quiz.id}`
    const shareText = `I just scored ${score.percentage}% on "${quiz.title}"! 🎉 Can you beat my score?`

    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(quizUrl)}&hashtags=quiz,challenge,learning`
        openShareWindow(twitterUrl, 'Share on Twitter')
        break

      case 'linkedin':
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}`
        openShareWindow(linkedinUrl, 'Share on LinkedIn')
        break

      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\nTake the quiz: ${quizUrl}`)}`
        openShareWindow(whatsappUrl, 'Share on WhatsApp')
        break

      case 'copy':
        const copyText = `${shareText}\n${quizUrl}`
        const success = await copyToClipboard(copyText)
        if (success) {
          setCopySuccess('Link copied to clipboard!')
          setTimeout(() => setCopySuccess(''), 3000)
        }
        break

      case 'email':
        const emailSubject = `Quiz Challenge: ${quiz.title}`
        const emailBody = `Hi!\n\nI just took a quiz on "${quiz.title}" and scored ${score.percentage}%!\n\nThink you can do better? Take the challenge: ${quizUrl}\n\nGood luck! 🍀`
        const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
        window.location.href = emailUrl
        break

      case 'challenge':
        const challengeText = `🎯 Quiz Challenge!\n\nI scored ${score.percentage}% on "${quiz.title}"\nCan you beat my score of ${score.correctCount}/${score.totalQuestions}?\n\nTake the quiz: ${quizUrl}`
        const success2 = await copyToClipboard(challengeText)
        if (success2) {
          setCopySuccess('Challenge message copied! Send it to your friends!')
          setTimeout(() => setCopySuccess(''), 3000)
        }
        break
    }

    setShowShareMenu(false)
  }

  const retakeQuiz = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setIsCompleted(false)
    setShowResults(false)
    setShowReview(false)
    setScore(null)
    setQuestionTimes({})
    setShowConfigModal(true)
    setIsStarted(false)
    setIsTimerPaused(false)
    setIsSaved(false)
    setSessionId(null)
    setSaveError(null)
  }

  const renderMCQQuestion = () => {
    const currentQ = quiz.questions[currentQuestion]
    const shuffledOptions = quizConfig?.shuffleOptions
      ? [...currentQ.options].sort(() => Math.random() - 0.5)
      : currentQ.options

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">
          {currentQ.text}
        </h2>

        <div className="space-y-3">
          {shuffledOptions.map((option, index) => {
            const originalIndex = currentQ.options.indexOf(option)
            const isSelected = answers[currentQuestion] === originalIndex

            return (
              <motion.button
                key={index}
                onClick={() => handleAnswerChange(originalIndex)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300'
                    }`}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (showConfigModal) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />

          {/* ADD ANTI-CHEATING MONITOR */}
          {isAssignmentMode && securityConfig && (
            <AntiCheatingMonitor
              sessionId={securitySessionId}
              isActive={isStarted && !isCompleted}
              securityConfig={securityConfig}
              onViolation={handleCheatingViolation}
              onWarning={handleCheatingWarning}
            />
          )}



          {showLocationTracker && geofencingEnabled && allowedLocation && (
            <StudentLocationTracker
              sessionId={securitySessionId || `temp_${assignmentId}`} // Fallback ID
              quizId={assignmentId}
              allowedLocation={allowedLocation}
              onViolation={handleLocationViolation}
              onLocationUpdate={handleLocationUpdate}
              isActive={isStarted && !isCompleted}
            />
          )}


          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Settings className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                  {quiz.title}
                </h1>
                <p className="text-lg text-slate-600 mb-8">
                  Configure your quiz settings before starting
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-800">{quiz.questions.length}</div>
                    <div className="text-sm text-slate-600">Questions</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-800">{quiz.difficulty}</div>
                    <div className="text-sm text-slate-600">Difficulty</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-800">{quiz.totalPoints}</div>
                    <div className="text-sm text-slate-600">Points</div>
                  </div>
                </div>

                <motion.button
                  onClick={() => setShowConfigModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-5 h-5" />
                  Configure & Start
                </motion.button>
              </motion.div>
            </div>
          </div>
          <Footer />
        </div>

        <QuizConfigModal
          quiz={quiz}
          totalQuestions={quiz.questions.length}
          isOpen={showConfigModal}
          onClose={() => onNavigate('/dashboard')}
          onStart={handleConfigStart}
          isAssignmentMode={isAssignmentMode}  // ADD THIS
          assignmentData={assignmentData}      // ADD THIS
          classroomInfo={classroomInfo}
          securityConfig={securityConfig}      // ADD THIS
        />
      </>
    )
  }

  // Show Review Component
  if (showReview) {
    return (
      <QuizReview
        quiz={quiz}
        answers={answers}
        score={score}
        questionTimes={questionTimes}
        onClose={() => setShowReview(false)}
        onRetake={retakeQuiz}
      />
    )
  }

  if (showResults) {
    return renderResultsScreen()
  }

  // Main Quiz Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">

          {/* Quiz Header */}
          {renderQuizHeader()}

          {/* Question Card */}
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8"
          >
            {renderMCQQuestion()}
          </motion.div>

          {/* Navigation Controls */}
          {/* Navigation Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0"
          >
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <motion.button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-xs sm:text-base text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center"
                whileHover={{ scale: currentQuestion === 0 ? 1 : 1.05 }}
                whileTap={{ scale: currentQuestion === 0 ? 1 : 0.95 }}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </motion.button>

              {quizConfig?.skipQuestions && (
                <motion.button
                  onClick={handleSkipQuestion}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-2 border-yellow-300 text-yellow-700 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-xs sm:text-base hover:bg-yellow-50 transition-colors flex-1 sm:flex-none justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                  Skip
                </motion.button>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {currentQuestion === quiz.questions.length - 1 ? (
                <motion.button
                  onClick={handleCompleteQuiz}
                  className="flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl font-medium sm:font-semibold text-xs sm:text-base hover:shadow-lg transition-all duration-300 flex-1 sm:flex-none justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Finish Quiz</span>
                  <span className="sm:hidden">Finish</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl font-medium sm:font-semibold text-xs sm:text-base hover:shadow-lg transition-all duration-300 flex-1 sm:flex-none justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Question Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Question Overview</h3>
            <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-15 gap-1 sm:gap-2">
              {quiz.questions.map((_, index) => {
                const isAnswered = answers[index] !== undefined
                const isCurrent = index === currentQuestion

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-colors ${isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span className="text-slate-600">Answered ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-100 rounded"></div>
                <span className="text-slate-600">Unanswered ({quiz.questions.length - Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-slate-600">Current</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default QuizPage

