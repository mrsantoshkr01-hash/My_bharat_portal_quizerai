'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2,
  Home,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import QuizPage from '@/app/quiz/[id]/page'
import axios from 'axios'

// Quiz integration utilities
const quizIntegration = {
  // Fetch question paper from backend
  async fetchQuestionPaper(paperId) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/question-papers/${paperId}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('not found')
      } else if (error.response?.status === 403) {
        throw new Error('access denied')
      } else if (error.response?.status === 202) {
        throw new Error('not ready')
      } else {
        throw new Error(error.response?.data?.detail || 'Failed to fetch question paper')
      }
    }
  },

  // Transform question paper to quiz format
  transformQuestionPaperToQuiz(questionPaper) {
    try {
      return {
        id: questionPaper.paper_id,
        title: questionPaper.title,
        description: questionPaper.metadata?.instructions || 'Question Paper Quiz',
        difficulty: questionPaper.metadata?.difficulty || 'medium',
        subject: questionPaper.metadata?.subject || 'General',
        questions: questionPaper.questions.map((q, index) => ({
          id: index + 1,
          text: q.question,
          type: q.type || 'mcq',
          options: q.options || [],
          correctAnswer: q.type === 'mcq' ? 
            (q.options ? q.options.findIndex(opt => opt === q.answer) : 0) : 
            q.answer,
          points: q.points || 10,
          explanation: q.explanation || null
        })),
        totalPoints: questionPaper.total_points || (questionPaper.questions.length * 10),
        passingScore: 70,
        timeLimit: questionPaper.metadata?.time_limit || 180
      }
    } catch (error) {
      console.error('Error transforming question paper:', error)
      throw new Error('Failed to process question paper data')
    }
  },

  // Store quiz in localStorage for session continuity
  storeQuizForSession(quiz) {
    try {
      const quizData = quiz.questions.map(q => ({
        question: q.text,
        options: q.options,
        answer: q.correctAnswer,
        explanation: q.explanation,
        type: q.type
      }))
      
      localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quizData))
      
      // Also store metadata
      localStorage.setItem(`quiz_meta_${quiz.id}`, JSON.stringify({
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        subject: quiz.subject,
        timeLimit: quiz.timeLimit
      }))
      
      return true
    } catch (error) {
      console.error('Error storing quiz for session:', error)
      return false
    }
  },

  // Load quiz from localStorage
  loadQuizFromSession(quizId) {
    try {
      const quizData = localStorage.getItem(`quiz_${quizId}`)
      const metaData = localStorage.getItem(`quiz_meta_${quizId}`)
      
      if (quizData) {
        const questions = JSON.parse(quizData)
        const meta = metaData ? JSON.parse(metaData) : {}
        
        return {
          id: quizId,
          title: meta.title || 'Quiz',
          description: meta.description || 'Quiz',
          difficulty: meta.difficulty || 'medium',
          subject: meta.subject || 'General',
          timeLimit: meta.timeLimit || 180,
          questions: questions.map((q, index) => ({
            id: index + 1,
            text: q.question,
            type: q.type || 'mcq',
            options: q.options || [],
            correctAnswer: q.type === 'mcq' ? 
              (q.options ? q.options.findIndex(opt => opt === q.answer) : 0) : 
              q.answer,
            points: 10,
            explanation: q.explanation || null
          })),
          totalPoints: questions.length * 10,
          passingScore: 70
        }
      }
      
      return null
    } catch (error) {
      console.error('Error loading quiz from session:', error)
      return null
    }
  },

  // Validate question paper data
  validateQuestionPaper(questionPaper) {
    const errors = []
    
    if (!questionPaper) {
      errors.push('Question paper data is missing')
      return errors
    }
    
    if (!questionPaper.paper_id) {
      errors.push('Paper ID is missing')
    }
    
    if (!questionPaper.title) {
      errors.push('Paper title is missing')
    }
    
    if (!questionPaper.questions || !Array.isArray(questionPaper.questions)) {
      errors.push('Questions array is missing or invalid')
    } else if (questionPaper.questions.length === 0) {
      errors.push('No questions found in the paper')
    }
    
    // Validate individual questions
    questionPaper.questions?.forEach((q, index) => {
      if (!q.question || q.question.trim() === '') {
        errors.push(`Question ${index + 1} text is missing`)
      }
      
      if (!q.answer) {
        errors.push(`Question ${index + 1} answer is missing`)
      }
      
      if (q.type === 'mcq' && (!q.options || !Array.isArray(q.options) || q.options.length === 0)) {
        errors.push(`Question ${index + 1} options are missing or invalid`)
      }
    })
    
    return errors
  },

  // Handle quiz errors
  handleQuizError(error, router) {
    console.error('Quiz error:', error)
    
    if (error.message === 'not found') {
      // Redirect to 404 or question papers page
      router.push('/dashboard/question-papers?error=not_found')
    } else if (error.message === 'access denied') {
      router.push('/dashboard/question-papers?error=access_denied')
    } else if (error.message === 'not ready') {
      // Show processing message or redirect
      router.push('/dashboard/question-papers?error=processing')
    } else {
      // Generic error
      router.push('/dashboard/question-papers?error=generic')
    }
  }
}

const QuizPageWrapper = () => {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId

  const [quiz, setQuiz] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('Loading quiz...')

  useEffect(() => {
    if (quizId) {
      loadQuizData()
    }
  }, [quizId])

  const loadQuizData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setLoadingMessage('Loading quiz data...')

      // First try to load from session storage (for AI-generated quizzes and temporary quizzes)
      try {
        const sessionQuiz = quizIntegration.loadQuizFromSession(quizId)
        if (sessionQuiz && sessionQuiz.questions && sessionQuiz.questions.length > 0) {
          console.log('Loaded quiz from session storage:', sessionQuiz)
          setQuiz(sessionQuiz)
          setIsLoading(false)
          return
        }
      } catch (sessionError) {
        console.log('No session data found, fetching from API...', sessionError)
      }

      // If not in session, try to fetch from API (for saved question papers)
      setLoadingMessage('Fetching question paper...')
      
      try {
        const questionPaper = await quizIntegration.fetchQuestionPaper(quizId)
        console.log('Fetched question paper from API:', questionPaper)
        
        // Validate question paper data
        const validationErrors = quizIntegration.validateQuestionPaper(questionPaper)
        if (validationErrors.length > 0) {
          throw new Error(`Invalid question paper: ${validationErrors.join(', ')}`)
        }

        setLoadingMessage('Processing questions...')
        
        // Transform to quiz format
        const transformedQuiz = quizIntegration.transformQuestionPaperToQuiz(questionPaper)
        console.log('Transformed quiz:', transformedQuiz)
        
        // Store for session continuity
        quizIntegration.storeQuizForSession(transformedQuiz)
        
        setQuiz(transformedQuiz)
        
      } catch (apiError) {
        console.error('API Error:', apiError)
        
        if (apiError.message === 'not found') {
          throw new Error('Quiz not found. The quiz may have been deleted or the link is invalid.')
        } else if (apiError.message === 'access denied') {
          throw new Error('Access denied. You do not have permission to access this quiz.')
        } else if (apiError.message === 'not ready') {
          throw new Error('Quiz is still being processed. Please try again in a few minutes.')
        }
        throw apiError
      }

    } catch (error) {
      console.error('Error loading quiz:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    loadQuizData()
  }

  const handleNavigateHome = () => {
    router.push('/dashboard')
  }

  const handleNavigateToQuestionPapers = () => {
    router.push('/dashboard/question-papers')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>

              <h1 className="text-3xl font-bold text-slate-800 mb-4">
                {loadingMessage}
              </h1>
              
              <p className="text-lg text-slate-600 mb-8">
                Please wait while we prepare your quiz experience
              </p>

              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>

              <div className="mt-8 text-sm text-slate-500">
                <p>Loading: {quizId}</p>
              </div>
            </motion.div>
          </div>
        </div>
        
        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200"
            >
              {/* Back Button */}
              <div className="flex justify-start mb-6">
                <Link href="/dashboard/question-papers" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Question Papers</span>
                </Link>
              </div>

              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-slate-800 mb-4">
                Unable to Load Quiz
              </h1>
              
              <p className="text-lg text-slate-600 mb-8">
                {error}
              </p>

              {/* Error-specific guidance */}
              <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left">
                <h3 className="font-semibold text-slate-800 mb-2">Troubleshooting:</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Check if the quiz link is correct</li>
                  <li>• Make sure you have permission to access this quiz</li>
                  <li>• If the quiz was just uploaded, it might still be processing</li>
                  <li>• Try refreshing the page or uploading the paper again</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </motion.button>

                <motion.button
                  onClick={handleNavigateToQuestionPapers}
                  className="flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Question Papers
                </motion.button>

                <motion.button
                  onClick={handleNavigateHome}
                  className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
        
        <Footer />
      </div>
    )
  }

  // Render quiz if data is loaded successfully
  if (quiz) {
    console.log('Rendering quiz with data:', quiz)
    return (
      <QuizPage 
        quizId={quizId}
        quiz={quiz}
        onNavigate={(path) => router.push(path)}
        onError={(error) => quizIntegration.handleQuizError(error, router)}
      />
    )
  }

  // Fallback state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              Quiz Not Available
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              The requested quiz could not be loaded.
            </p>
            <motion.button
              onClick={handleNavigateToQuestionPapers}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Question Papers
            </motion.button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default QuizPageWrapper