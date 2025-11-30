'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Youtube,
  Search,
  Play,
  Clock,
  Eye,
  ThumbsUp,
  Calendar,
  User,
  Zap,
  FileText,
  Target,
  BookOpen,
  Brain,
  Check,
  AlertCircle,
  SettingsIcon,
  Book
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css' // or your preferred theme

const YoutubeProcessor = () => {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [inputType, setInputType] = useState('url')
  const [videoUrl, setVideoUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [topRanker, setTopRanker] = useState('5')
  const [action, setAction] = useState('quiz')
  const [quizType, setQuizType] = useState('mcq')
  const [language, setLanguage] = useState('English')
  const [numQuestions, setNumQuestions] = useState('10')
  const [difficultyLevel, setDifficultyLevel] = useState('medium')
  const [noOfWords, setNoOfWords] = useState('400')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  const validateInputs = () => {
    if (inputType === 'url') {
      if (!videoUrl.trim()) {
        toast.error('Please enter a YouTube URL')
        return false
      }
      if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        toast.error('Please enter a valid YouTube URL')
        return false
      }
    } else {
      if (!searchQuery.trim()) {
        toast.error('Please enter a search query')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateInputs()) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()

      if (inputType === 'url') {
        formData.append('youtube_url', videoUrl)
      } else {
        formData.append('query', searchQuery)
        formData.append('top_ranker', topRanker)
      }

      formData.append('action', action)
      formData.append('quiz_type', quizType)
      formData.append('language', language)
      formData.append('num_questions', numQuestions)
      formData.append('difficulty_level', difficultyLevel)
      formData.append('no_of_words', noOfWords)

      const response = await axios.post(`${API_BASE_URL}/api/you_tube_searcher`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      })

      if (response.data && response.data.result) {
        setResults(response.data)
        setStep(3)
        toast.success(`${action === 'quiz' ? 'Quiz' : action === 'summary' ? 'Summary' : 'Content'} generated successfully!`)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('API Error:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to process YouTube content')
      toast.error('Failed to process YouTube content')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderResults = () => {
    if (!results) return null

    if (action === 'quiz') {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-sm sm:text-base">
                {Array.isArray(results.data) ? results.data.length : 0} Questions Generated
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('currentQuiz', JSON.stringify(results.data))
                router.push('/quiz/take')
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
            >
              <Play className="w-4 h-4" />
              Take Quiz
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2">
            {Array.isArray(results.data) ? (
              results.data.map((question, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 lg:p-6 border border-blue-100">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 self-start">
                      Q{index + 1}
                    </span>
                    <div className="flex-1 w-full min-w-0">
                      <h4 className="text-slate-800 font-semibold mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg break-words">
                        {question.question}
                      </h4>

                      {question.options && (
                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                          {question.options.map((option, optIndex) => {
                            const isCorrect = question.answer === option || question.correct_answer === option
                            return (
                              <div
                                key={optIndex}
                                className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 ${isCorrect
                                  ? 'bg-green-100 border-2 border-green-300'
                                  : 'bg-white border border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect
                                  ? 'border-green-600 bg-green-600'
                                  : 'border-slate-300'
                                  }`}>
                                  {isCorrect && <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />}
                                </div>
                                <span className={`text-xs sm:text-sm break-words ${isCorrect ? 'text-green-800 font-semibold' : 'text-slate-700'
                                  }`}>
                                  {option}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-3">
                          <p className="text-xs sm:text-sm text-blue-800 break-words">
                            <strong className="text-blue-900">Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 bg-amber-50 rounded-xl border border-amber-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
                </div>
                <p className="text-amber-800 font-medium mb-2 text-sm sm:text-base">Unable to parse quiz questions</p>
                <p className="text-amber-600 text-xs sm:text-sm mb-3 sm:mb-4">The data format may need adjustment</p>
                <details className="text-left">
                  <summary className="text-amber-700 cursor-pointer hover:text-amber-800 text-xs sm:text-sm">View Raw Data</summary>
                  <pre className="text-xs bg-amber-100 p-2 sm:p-4 rounded-lg mt-2 overflow-auto text-amber-900 break-all">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (action === 'summary') {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-sm sm:text-base">Summary Generated</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(results.data)
                toast.success('Summary copied to clipboard!')
              }}
              className="border-2 border-blue-600 text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-50 transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
            >
              Copy Summary
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 lg:p-8 border border-blue-100">
            <div className="prose prose-sm sm:prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6 pb-3 border-b-2 border-blue-200 break-words">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl sm:text-2xl font-semibold text-blue-800 mt-6 sm:mt-8 mb-3 sm:mb-4 flex items-start break-words">
                      <span className="w-2 h-4 sm:h-6 bg-blue-600 rounded-full mr-2 sm:mr-3 flex-shrink-0 mt-1"></span>
                      <span>{children}</span>
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg sm:text-xl font-semibold text-purple-700 mt-4 sm:mt-6 mb-2 sm:mb-3 break-words">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-slate-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base break-words">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 ml-3 sm:ml-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 ml-3 sm:ml-4 list-decimal">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-slate-700 flex items-start text-sm sm:text-base">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-2 flex-shrink-0"></span>
                      <span className="break-words">{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900 bg-yellow-100 px-1 rounded break-words">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-blue-700 break-words">
                      {children}
                    </em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono break-all">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg overflow-x-auto mb-3 sm:mb-4 text-xs sm:text-sm">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 bg-blue-50 rounded-r-lg mb-3 sm:mb-4 italic break-words">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-3 sm:mb-4 -mx-2 sm:mx-0">
                      <table className="min-w-full border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 px-2 sm:px-4 py-1 sm:py-2 bg-blue-100 font-semibold text-left text-xs sm:text-sm break-words">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm break-words">
                      {children}
                    </td>
                  ),
                }}
              >
                {results.data}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )
    }

    if (action === 'content') {
      let contentData = results.data
      try {
        if (typeof results.data === 'string') {
          contentData = JSON.parse(results.data)
        }
      } catch (e) {
        console.error('Error parsing content data:', e)
      }

      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-sm sm:text-base">Content Extracted Successfully</span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2">
            {Array.isArray(contentData) ? (
              contentData.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 sm:p-4 lg:p-6 border border-red-100">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="bg-red-500 text-white p-2 rounded-lg flex-shrink-0">
                      <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 w-full min-w-0">
                      <h4 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base break-words">
                        Source: {item.channel || 'Unknown Channel'}
                      </h4>

                      <div className="prose prose-xs sm:prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h4 className="text-sm sm:text-base font-semibold text-slate-800 mb-2 break-words">
                                {children}
                              </h4>
                            ),
                            h2: ({ children }) => (
                              <h5 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 break-words">
                                {children}
                              </h5>
                            ),
                            h3: ({ children }) => (
                              <h6 className="text-xs sm:text-sm font-medium text-slate-600 mb-1 break-words">
                                {children}
                              </h6>
                            ),
                            p: ({ children }) => (
                              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm break-words mb-2">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-1 mb-2 ml-3">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-slate-600 flex items-start text-xs sm:text-sm">
                                <span className="w-1 h-1 bg-slate-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                                <span className="break-words">{children}</span>
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-slate-700 break-words">
                                {children}
                              </strong>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-200 text-red-600 px-1 py-0.5 rounded text-xs font-mono break-all">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {item.content || 'No content available'}
                        </ReactMarkdown>
                      </div>

                      {/* Removed the "Read More" button and truncation logic */}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 mb-3 sm:mb-4 text-sm sm:text-base">Raw content data:</p>
                <pre className="text-xs bg-amber-100 p-3 sm:p-4 rounded-lg text-left overflow-auto text-amber-900 break-all">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-20 sm:pt-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 sm:mb-8"
          >
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 overflow-x-auto"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-8 min-w-max px-2">
              {[
                { number: 1, label: 'YouTube Input', icon: Youtube },
                { number: 2, label: 'Configuration', icon: Book },
                { number: 3, label: 'Results', icon: FileText }
              ].map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center w-full sm:w-auto">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step >= stepItem.number
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                      }`}>
                      <stepItem.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={`ml-2 sm:ml-3 font-medium text-xs sm:text-sm lg:text-base ${step >= stepItem.number ? 'text-slate-800' : 'text-slate-500'
                      }`}>
                      {stepItem.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-6 h-0.5 sm:w-8 sm:h-0.5 mx-2 sm:mx-4 transition-all duration-300 hidden sm:block ${step > stepItem.number ? 'bg-red-600' : 'bg-slate-300'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-slate-200"
          >
            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl max-w-sm sm:max-w-md w-full mx-4"
                  >
                    <div className="text-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6">
                        <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
                        <motion.div
                          className="absolute inset-0 border-4 border-transparent border-t-red-600 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute inset-2 sm:inset-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center">
                          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                        {action === 'quiz' ? 'Generating Quiz' :
                          action === 'summary' ? 'Creating Summary' :
                            'Extracting Content'}
                      </h3>

                      <p className="text-slate-600 mb-4 text-sm sm:text-base">Processing YouTube content...</p>

                      <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-600 to-pink-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '80%' }}
                          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                        />
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500">
                        This may take a few moments
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">YouTube Content Processor</h2>
                    <p className="text-sm sm:text-lg text-slate-600">Enter a YouTube URL or search for content to process</p>
                  </div>

                  <div className="flex justify-center mb-6 sm:mb-8">
                    <div className="inline-flex bg-slate-100 rounded-xl p-1 w-full sm:w-auto">
                      <button
                        onClick={() => setInputType('url')}
                        className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-lg font-medium transition-all duration-300 text-xs sm:text-base ${inputType === 'url'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                          }`}
                      >
                        YouTube URL
                      </button>
                      <button
                        onClick={() => setInputType('search')}
                        className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-lg font-medium transition-all duration-300 text-xs sm:text-base ${inputType === 'search'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                          }`}
                      >
                        Search YouTube
                      </button>
                    </div>
                  </div>

                  {inputType === 'url' && (
                    <div className="max-w-full sm:max-w-2xl mx-auto">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        YouTube Video URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Youtube className="w-5 h-5 text-slate-400" />
                          </div>
                          <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full pl-10 pr-4 py-3 sm:py-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {inputType === 'search' && (
                    <div className="max-w-full sm:max-w-2xl mx-auto space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Search Query
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Enter topic or keywords (e.g., 'machine learning tutorial')"
                              className="w-full pl-10 pr-4 py-3 sm:py-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-lg"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Number of Top Results
                        </label>
                        <select
                          value={topRanker}
                          onChange={(e) => setTopRanker(e.target.value)}
                          className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-base"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num.toString()}>Top {num} results</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-6 sm:mt-8">
                    <motion.button
                      onClick={() => setStep(2)}
                      disabled={
                        (inputType === 'url' && !videoUrl.trim()) ||
                        (inputType === 'search' && !searchQuery.trim())
                      }
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Continue to Configuration
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Processing Configuration</h2>
                    <p className="text-sm sm:text-lg text-slate-600">Select how you want to process the YouTube content</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Processing Action
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <motion.button
                          onClick={() => setAction('quiz')}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left ${action === 'quiz'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">Generate Quiz</h4>
                          <p className="text-xs sm:text-sm text-slate-600">Create interactive quiz questions</p>
                        </motion.button>
                        <motion.button
                          onClick={() => setAction('summary')}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left ${action === 'summary'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">Generate Summary</h4>
                          <p className="text-xs sm:text-sm text-slate-600">Create concise content summary</p>
                        </motion.button>
                        <motion.button
                          onClick={() => setAction('content')}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left ${action === 'content'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">Extract Content</h4>
                          <p className="text-xs sm:text-sm text-slate-600">Get raw content extraction</p>
                        </motion.button>
                      </div>
                    </div>

                    {action === 'quiz' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Quiz Type
                          </label>
                          <select
                            value={quizType}
                            onChange={(e) => setQuizType(e.target.value)}
                            className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-base"
                          >
                            <option value="mcq">Multiple Choice</option>
                            <option value="short">Short Answer</option>
                            <option value="long">Long Answer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Difficulty Level
                          </label>
                          <select
                            value={difficultyLevel}
                            onChange={(e) => setDifficultyLevel(e.target.value)}
                            className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-base"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Number of Questions
                          </label>
                          <select
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(e.target.value)}
                            className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-base"
                          >
                            {[5, 10, 15, 20, 25, 30].map(num => (
                              <option key={num} value={num.toString()}>{num}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {action === 'summary' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Summary Length (words)
                        </label>
                        <select
                          value={noOfWords}
                          onChange={(e) => setNoOfWords(e.target.value)}
                          className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-base"
                        >
                          {[200, 300, 400, 500, 600, 800, 1000].map(num => (
                            <option key={num} value={num.toString()}>{num}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(action === 'quiz' || action === 'summary') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Language
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 text-sm sm:text-base"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Hindi">Hindi</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                    <motion.button
                      onClick={() => setStep(1)}
                      className="flex-1 border-2 border-slate-300 text-slate-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className={`flex-1 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${isProcessing
                        ? 'bg-gradient-to-r from-red-400 to-pink-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-lg hover:from-red-700 hover:to-pink-700'
                        }`}
                      whileHover={!isProcessing ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!isProcessing ? { scale: 0.98 } : {}}
                    >
                      {isProcessing ? (
                        <>
                          <div className="relative">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                          </div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                          Generate {action === 'quiz' ? 'Quiz' : action === 'summary' ? 'Summary' : 'Content'}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {error ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2 sm:mb-3">Processing Error</h3>
                      <p className="text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base break-words">{error}</p>
                      <button
                        onClick={() => {
                          setStep(1)
                          setError(null)
                        }}
                        className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">
                          {action === 'quiz' ? 'Quiz Generated!' :
                            action === 'summary' ? 'Summary Generated!' :
                              'Content Extracted!'}
                        </h2>
                        <p className="text-sm sm:text-lg text-slate-600">Here are your results from the YouTube content</p>
                      </div>

                      {renderResults()}

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                        <motion.button
                          onClick={() => {
                            setStep(1)
                            setResults(null)
                          }}
                          className="flex-1 border-2 border-slate-300 text-slate-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 text-sm sm:text-base"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Process Another
                        </motion.button>
                        <motion.button
                          onClick={() => router.push('/dashboard')}
                          className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Back to Dashboard
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default YoutubeProcessor