/**
 * QuizPlayer Component
 * 
 * Purpose: Interactive quiz-taking interface with real-time progress tracking
 * Features:
 * - Multi-question type support (MCQ, short answer, fill-in-blank, true/false)
 * - Timer functionality with automatic submission
 * - Progress tracking and question navigation
 * - Auto-save functionality for incomplete sessions
 * - Accessibility features for screen readers
 * - Responsive design for mobile devices
 * 
 * Integration: Connects to quiz submission APIs and real-time progress tracking
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Flag,
  Save,
  Send,
  AlertTriangle,
  CheckCircle,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { quizAPI } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import toast from 'react-hot-toast'

const QuizPlayer = ({ quizId, onComplete, onExit }) => {
  const [quiz, setQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isTimerPaused, setIsTimerPaused] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const [savedProgress] = useLocalStorage(`quiz_progress_${quizId}`, {})
  
  const timerRef = useRef()
  const autoSaveRef = useRef()

  useEffect(() => {
    loadQuiz()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [quizId])

  useEffect(() => {
    if (quiz && quiz.timeLimit) {
      const savedTime = savedProgress.timeRemaining || quiz.timeLimit * 60
      setTimeRemaining(savedTime)
      startTimer()
    }
  }, [quiz])

  useEffect(() => {
    if (savedProgress.answers) {
      setAnswers(savedProgress.answers)
      setCurrentQuestionIndex(savedProgress.currentQuestionIndex || 0)
      setFlaggedQuestions(new Set(savedProgress.flaggedQuestions || []))
    }
  }, [savedProgress])

  useEffect(() => {
    scheduleAutoSave()
  }, [answers, currentQuestionIndex, flaggedQuestions, timeRemaining])

  const loadQuiz = async () => {
    try {
      const quizData = await quizAPI.getById(quizId)
      setQuiz(quizData)
    } catch (error) {
      toast.error('Failed to load quiz')
      onExit()
    }
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      if (!isTimerPaused) {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)
  }

  const handleTimeUp = () => {
    toast.warning('Time is up! Submitting your quiz automatically.')
    submitQuiz(true)
  }

  const scheduleAutoSave = () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    
    setAutoSaveStatus('saving')
    autoSaveRef.current = setTimeout(() => {
      saveProgress()
      setAutoSaveStatus('saved')
    }, 2000)
  }

  const saveProgress = () => {
    const progressData = {
      answers,
      currentQuestionIndex,
      flaggedQuestions: Array.from(flaggedQuestions),
      timeRemaining,
      lastSaved: Date.now()
    }
    
    localStorage.setItem(`quiz_progress_${quizId}`, JSON.stringify(progressData))
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (!timeRemaining || !quiz?.timeLimit) return 'text-slate-600'
    const percentRemaining = timeRemaining / (quiz.timeLimit * 60)
    if (percentRemaining > 0.5) return 'text-green-600'
    if (percentRemaining > 0.25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const getQuestionProgress = () => {
    const answered = Object.keys(answers).length
    const total = quiz?.questions?.length || 0
    return { answered, total, percentage: total > 0 ? (answered / total) * 100 : 0 }
  }

  const submitQuiz = async (isAutoSubmit = false) => {
    setIsSubmitting(true)
    
    try {
      const result = await quizAPI.submit(quizId, answers)
      
      // Clear saved progress
      localStorage.removeItem(`quiz_progress_${quizId}`)
      
      toast.success(isAutoSubmit ? 'Quiz auto-submitted' : 'Quiz submitted successfully!')
      onComplete(result)
    } catch (error) {
      toast.error('Failed to submit quiz')
      setIsSubmitting(false)
    }
  }

  const handleSubmit = () => {
    const progress = getQuestionProgress()
    const unanswered = progress.total - progress.answered
    
    if (unanswered > 0) {
      setShowSubmitModal(true)
    } else {
      submitQuiz()
    }
  }

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.id] || ''
    
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.label
                key={index}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentAnswer === index 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={index}
                  checked={currentAnswer === index}
                  onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  currentAnswer === index ? 'border-blue-500' : 'border-slate-300'
                }`}>
                  {currentAnswer === index && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <span className="text-slate-800">{option}</span>
              </motion.label>
            ))}
          </div>
        )

      case 'short_answer':
        return (
          <textarea
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
            placeholder="Enter your answer here..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        )

      case 'long_answer':
        return (
          <textarea
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="6"
            placeholder="Write your detailed answer here..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        )

      case 'fill_blank':
        return (
          <div className="space-y-4">
            {question.blanks.map((blank, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-slate-800">{blank.prefix}</span>
                <input
                  type="text"
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-32"
                  placeholder="Fill in the blank"
                  value={currentAnswer[index] || ''}
                  onChange={(e) => {
                    const newAnswer = { ...currentAnswer }
                    newAnswer[index] = e.target.value
                    handleAnswerChange(question.id, newAnswer)
                  }}
                />
                <span className="text-slate-800">{blank.suffix}</span>
              </div>
            ))}
          </div>
        )

      case 'true_false':
        return (
          <div className="flex gap-4">
            {['True', 'False'].map((option, index) => (
              <motion.label
                key={option}
                className={`flex items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 flex-1 ${
                  currentAnswer === index 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={index}
                  checked={currentAnswer === index}
                  onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                  className="sr-only"
                />
                <span className="text-lg font-medium text-slate-800">{option}</span>
              </motion.label>
            ))}
          </div>
        )

      default:
        return <div>Unsupported question type</div>
    }
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = getQuestionProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Quiz Info */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-slate-800">{quiz.title}</h1>
              <div className="text-sm text-slate-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </div>
            </div>

            {/* Timer and Controls */}
            <div className="flex items-center gap-4">
              {/* Auto-save Status */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' ? (
                  <Save className="w-4 h-4 text-orange-500 animate-pulse" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="text-slate-600">
                  {autoSaveStatus === 'saving' ? 'Saving...' : 'Saved'}
                </span>
              </div>

              {/* Timer */}
              {quiz.timeLimit && (
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${getTimeColor()}`} />
                  <span className={`text-lg font-mono font-semibold ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </span>
                  <button
                    onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Exit Button */}
              <Button variant="outline" onClick={onExit}>
                Exit Quiz
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progress: {progress.answered}/{progress.total} answered</span>
              <span>{Math.round(progress.percentage)}% complete</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Question Navigation Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h3 className="font-semibold text-slate-800 mb-4">Questions</h3>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {quiz.questions.map((_, index) => {
                    const isAnswered = answers[quiz.questions[index].id] !== undefined
                    const isFlagged = flaggedQuestions.has(quiz.questions[index].id)
                    const isCurrent = index === currentQuestionIndex
                    
                    return (
                      <motion.button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`relative w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200 ${
                          isCurrent 
                            ? 'bg-blue-600 text-white' 
                            : isAnswered
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {index + 1}
                        {isFlagged && (
                          <Flag className="absolute -top-1 -right-1 w-3 h-3 text-orange-500 fill-current" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded"></div>
                    <span>Not answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-orange-500" />
                    <span>Flagged</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Question Area */}
            <div className="lg:col-span-3">
              <Card className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            Question {currentQuestionIndex + 1}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full capitalize">
                            {currentQuestion.type.replace('_', ' ')}
                          </span>
                          {currentQuestion.difficulty && (
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {currentQuestion.difficulty}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800 leading-relaxed">
                          {currentQuestion.question}
                        </h2>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFlag(currentQuestion.id)}
                        className={flaggedQuestions.has(currentQuestion.id) ? 'text-orange-600' : 'text-slate-400'}
                      >
                        <Flag className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Question Content */}
                    <div className="mb-8">
                      {renderQuestion(currentQuestion)}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                        icon={ChevronLeft}
                      >
                        Previous
                      </Button>

                      <div className="flex gap-3">
                        {currentQuestionIndex === quiz.questions.length - 1 ? (
                          <Button
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            icon={Send}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Submit Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={goToNext}
                            icon={ChevronRight}
                            iconPosition="right"
                          >
                            Next
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Quiz?"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <div className="font-medium text-orange-800">Incomplete Answers</div>
              <div className="text-sm text-orange-700">
                You have {progress.total - progress.answered} unanswered questions.
              </div>
            </div>
          </div>

          <p className="text-slate-600">
            Are you sure you want to submit your quiz? You will not be able to change your answers after submission.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              className="flex-1"
            >
              Continue Quiz
            </Button>
            <Button
              onClick={() => {
                setShowSubmitModal(false)
                submitQuiz()
              }}
              loading={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Submit Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default QuizPlayer