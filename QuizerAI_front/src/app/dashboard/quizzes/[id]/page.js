'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2, 
  Play, 
  Users, 
  Clock, 
  Target,
  TrendingUp,
  Copy,
  MoreVertical,
  Download,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { useQuizStore } from '@/store/quizStore'
import Header from '@/components/layout/Header'

const QuizDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { currentQuiz, getQuizById, deleteQuiz, isLoading } = useQuizStore()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params.id) {
      getQuizById(params.id)
    }
  }, [params.id])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'questions', label: 'Questions' },
    { id: 'results', label: 'Results' },
    { id: 'analytics', label: 'Analytics' }
  ]

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      const result = await deleteQuiz(params.id)
      if (result.success) {
        router.push('/dashboard/quizzes')
      }
    }
  }

  if (isLoading || !currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
              <div className="h-64 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link href="/dashboard/quizzes" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Quizzes</span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200 mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">{currentQuiz.title}</h1>
                    <p className="text-slate-600">{currentQuiz.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{currentQuiz.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">
                      {currentQuiz.time_limit ? `${currentQuiz.time_limit} min` : 'No time limit'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{currentQuiz.attempt_count || 0} attempts</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/quiz/${currentQuiz.id}`}>
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-5 h-5" />
                    Take Quiz
                  </motion.button>
                </Link>
                
                <div className="flex gap-2">
                  <motion.button
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    onClick={handleDelete}
                    className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft border border-slate-200"
          >
            <div className="flex items-center border-b border-slate-200 px-6">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-4 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                  whileHover={{ y: -2 }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-blue-700">{currentQuiz.questions?.length || 0}</span>
                        </div>
                        <h3 className="font-semibold text-blue-800">Total Questions</h3>
                        <p className="text-sm text-blue-600">Mixed question types</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-green-700">{currentQuiz.attempt_count || 0}</span>
                        </div>
                        <h3 className="font-semibold text-green-800">Total Attempts</h3>
                        <p className="text-sm text-green-600">Unique participants</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-purple-700">{currentQuiz.average_score || 0}%</span>
                        </div>
                        <h3 className="font-semibold text-purple-800">Average Score</h3>
                        <p className="text-sm text-purple-600">Class performance</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="font-semibold text-slate-800 mb-4">Quiz Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Difficulty:</span>
                            <span className="font-medium text-slate-800 capitalize">{currentQuiz.difficulty || 'Medium'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Question Types:</span>
                            <span className="font-medium text-slate-800 capitalize">{currentQuiz.quiz_type || 'Mixed'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Time Limit:</span>
                            <span className="font-medium text-slate-800">
                              {currentQuiz.time_limit ? `${currentQuiz.time_limit} minutes` : 'No limit'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Public Quiz:</span>
                            <span className="font-medium text-slate-800">{currentQuiz.is_public ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Allow Retakes:</span>
                            <span className="font-medium text-slate-800">{currentQuiz.allow_retakes ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Created:</span>
                            <span className="font-medium text-slate-800">
                              {new Date(currentQuiz.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'questions' && (
                  <motion.div
                    key="questions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-6">
                      {(currentQuiz.questions || []).map((question, index) => (
                        <div key={question.id} className="bg-slate-50 rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  Question {index + 1}
                                </span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                                  {question.type}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-slate-800 mb-2">
                                {question.text}
                              </h4>
                            </div>
                            <div className="text-sm text-slate-600">
                              {question.points || 10} pts
                            </div>
                          </div>

                          {question.type === 'mcq' && (
                            <div className="space-y-2">
                              {question.options?.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className={`p-3 rounded-lg border ${
                                    optionIndex === question.correct_answer
                                      ? 'border-green-500 bg-green-50 text-green-800'
                                      : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                                  {option}
                                  {optionIndex === question.correct_answer && (
                                    <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'short_answer' && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <strong className="text-green-800">Sample Answer:</strong>
                              <p className="text-green-700 mt-1">{question.correct_answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default QuizDetailPage