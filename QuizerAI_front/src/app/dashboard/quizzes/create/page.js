'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Eye,
  Save,
  BookOpen,
  CheckCircle,
  X,
  Upload,
  FileText,
  Link as LinkIcon,
  Mic,
  Video,
  Image as ImageIcon,
  PenTool,
  Play,
  Settings,
  Brain,
  Zap,
  Target,
  Clock,
  Users,
  Youtube,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { useQuizStore } from '@/store/quizStore'
import useUIStore from '@/store/uiStore'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'
import axios from 'axios'
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/components/auth/AuthProvider'
import createAuthAxios from '@/utils/api/quizApi' // This should now use the teacher endpoints
const CreateQuizPage = () => {
  const router = useRouter()
  const { generateQuiz, isLoading } = useQuizStore()
  const { addToast } = useUIStore()
  const { user } = useAuth() // Get current user
  const isTeacher = user?.role === 'teacher'


  // Add these new state variables
  const [showQuizLibrary, setShowQuizLibrary] = useState(false)
  const [savedQuizId, setSavedQuizId] = useState(null)
  const [step, setStep] = useState(1)
  const [contentType, setContentType] = useState('')
  const [generatedContent, setGeneratedContent] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null,
    url: '',
    youtubeUrl: '',
    youtubeQuery: '',
    topRanker: '5',
    action: 'quiz', // quiz, summary, content
    quiz_type: 'mcq',
    difficulty_level: 'medium',
    num_questions: '10',
    language: 'English',
    no_of_words: '400',
    timeLimit: 30,
    isPublic: false,
    allowRetakes: true
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  const contentTypes = [
    {
      id: 'file',
      title: 'Upload File',
      description: 'PDF, PPTX (POWERPOINT), PNG, JPG, JPEG files (Max 50MB)',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'url',
      title: 'Web Page',
      description: 'Generate content from any web page URL',
      icon: LinkIcon,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'youtube_url',
      title: 'YouTube URL',
      description: 'Direct YouTube video URL',
      icon: Youtube,
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'youtube_search',
      title: 'YouTube Search',
      description: 'Search and select from top YouTube results',
      icon: Search,
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const actionTypes = [
    { id: 'quiz', label: 'Generate Quiz', description: 'Create interactive quiz questions' },
    { id: 'summary', label: 'Generate Summary', description: 'Create content summary' },
    { id: 'content', label: 'Extract Content', description: 'Get raw content extraction (YouTube only)' }
  ]

  const quizTypes = [
    { id: 'mcq', label: 'Multiple Choice Questions' },
    { id: 'short', label: 'Short Answer Questions' },
    { id: 'long', label: 'Long Answer Questions' }
  ]

  const difficulties = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' }
  ]

  const languages = [
    'English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean'
  ]

  const questionCounts = ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50']
  const topRankerOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const wordCounts = ['400', '800', '1000', '1500', '2000', '3000', '4000']


  const saveQuizToLibrary = async (quizData, metadata = {}) => {
    try {
      const quizPayload = {
        title: metadata.title || formData.title || 'Generated Quiz',
        description: metadata.description || formData.description || 'AI Generated Quiz',
        subject: metadata.subject || formData.subject || 'General',
        difficulty_level: formData.difficulty_level || 'medium',
        source: contentType,
        is_public: false,
        is_template: false,

        // Quiz settings
        timer_type: 'no_limit',
        shuffle_questions: formData.shuffle_questions || false,
        show_results_immediately: true,
        max_attempts: 1,
        passing_score: 70.0,

        // Questions data
        questions: quizData.map((q, index) => ({
          question_text: q.question,
          question_type: q.type || 'mcq',
          order_index: index,
          points: 1.0,
          options: q.options || [],
          correct_answer: q.answer || q.correct_answer,
          explanation: q.explanation || null,
          is_required: true,
          estimated_time_seconds: 90
        }))
      }

      const api = createAuthAxios()
      const response = await api.post('/teacher/quizzes/', quizPayload)

      return response.data
    } catch (error) {
      console.error('Error saving quiz:', error)
      throw error
    }
  }


  // Helper function to extract and parse quiz data from backend response
  const parseQuizData = (rawData) => {
    try {
      // The actual quiz data is in index 1 as mentioned
      const quiz_data = rawData[1]

      if (quiz_data && quiz_data.answer) {
        // Extract JSON from the malformed response
        let jsonStr = quiz_data.answer

        // Clean up the JSON string
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '')
        }

        // Find the actual JSON array start
        const arrayStart = jsonStr.indexOf('[')
        if (arrayStart !== -1) {
          jsonStr = jsonStr.substring(arrayStart)
        }

        // Try to parse the JSON
        const parsed = JSON.parse(jsonStr.trim())
        return Array.isArray(parsed) ? parsed : [parsed]
      }

      return []
    } catch (error) {
      console.error('Error parsing quiz data:', error)
      return []
    }
  }

  // Helper function to extract summary data
  const parseSummaryData = (rawData) => {
    try {
      // For summary, the actual content might be in different index or structure
      // Based on your description, summary comes as direct string
      if (typeof rawData === 'string') {
        return rawData
      }

      // If it's an array, try to find the summary content
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Try index 1 first (like quiz), then fallback to index 0
        return rawData[1] || rawData[0] || ''
      }

      return rawData
    } catch (error) {
      console.error('Error parsing summary data:', error)
      return rawData
    }
  }

  // Helper function to extract YouTube content data
  const parseYouTubeContent = (rawData) => {
    try {
      if (typeof rawData === 'string') {
        return JSON.parse(rawData)
      }
      return rawData
    } catch (error) {
      console.error('Error parsing YouTube content:', error)
      return rawData
    }
  }

  // Loading simulation for better UX
  const simulateLoadingProgress = () => {
    setProgress(0)
    const stages = [
      { stage: 'Analyzing content...', duration: 2000, progress: 25 },
      { stage: 'Processing with AI...', duration: 3000, progress: 50 },
      { stage: 'Generating questions...', duration: 2500, progress: 75 },
      { stage: 'Finalizing results...', duration: 1500, progress: 90 }
    ]

    let currentStage = 0
    const progressInterval = setInterval(() => {
      if (currentStage < stages.length) {
        setLoadingStage(stages[currentStage].stage)
        setProgress(stages[currentStage].progress)
        currentStage++
      } else {
        clearInterval(progressInterval)
        setProgress(100)
        setLoadingStage('Almost ready...')
      }
    }, 2000)

    return () => clearInterval(progressInterval)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const maxSize = 50 * 1024 * 1024 // 50MB
      const validTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',]

      if (file.size > maxSize) {
        toast.error('File size exceeds 50MB limit.')
        return
      }

      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, PPTX (POWERPOINT) , PNG, JPG, JPEG allowed.')
        return
      }

      setFormData(prev => ({ ...prev, file }))
    }
  }

  const validateStep1 = () => {
    if (!contentType) return false

    switch (contentType) {
      case 'file':
        return formData.file !== null
      case 'url':
        return formData.url.trim() !== ''
      case 'youtube_url':
        return formData.youtubeUrl.trim() !== ''
      case 'youtube_search':
        return formData.youtubeQuery.trim() !== ''
      default:
        return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    simulateLoadingProgress()

    try {
      let result

      if (contentType === 'youtube_url' || contentType === 'youtube_search') {
        // Use YouTube API endpoint
        const youtubeFormData = new FormData()

        if (contentType === 'youtube_search') {
          youtubeFormData.append('query', formData.youtubeQuery)
          youtubeFormData.append('top_ranker', formData.topRanker)
        } else {
          youtubeFormData.append('youtube_url', formData.youtubeUrl)
        }

        youtubeFormData.append('action', formData.action)
        youtubeFormData.append('quiz_type', formData.quiz_type)
        youtubeFormData.append('language', formData.language)
        youtubeFormData.append('num_questions', formData.num_questions)
        youtubeFormData.append('difficulty_level', formData.difficulty_level)
        youtubeFormData.append('no_of_words', formData.no_of_words)

        result = await axios.post(`${API_BASE_URL}/api/you_tube_searcher`, youtubeFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 1200000, // 1 minute timeout
        })
      } else {
        // Use upload API endpoint
        const uploadFormData = new FormData()

        if (contentType === 'file') {
          uploadFormData.append('file', formData.file)
        } else if (contentType === 'url') {
          uploadFormData.append('url', formData.url)
        }

        uploadFormData.append('action', formData.action)
        uploadFormData.append('quiz_type', formData.quiz_type)
        uploadFormData.append('difficulty_level', formData.difficulty_level)
        uploadFormData.append('num_questions', formData.num_questions)
        uploadFormData.append('language', formData.language)
        uploadFormData.append('no_of_words', formData.no_of_words)

        result = await axios.post(`${API_BASE_URL}/api/upload`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minute timeout
        })
      }

      // console.log('API Response:', result.data)

      if (result.data && result.data.result) {
        const resultType = result.data.result
        const data = result.data.data
        const quiz_data = result.data.data[1]
        // console.log('Raw data:', quiz_data)
        // console.log('Quiz data at index 1:', quiz_data)

        // Process the data based on type using our helper functions
        let processedData
        // if (resultType === 'quiz') {
        //   processedData = parseQuizData(data)
        //   console.log('Processed Quiz Data:', processedData)
        // } else if (resultType === 'summary') {
        //   processedData = parseSummaryData(data)
        //   console.log('Processed Summary Data:', processedData)
        // } else if (resultType === 'you_tube_content') {
        //   processedData = parseYouTubeContent(data)
        //   console.log('Processed YouTube Content:', processedData)
        // }

        if (resultType === 'quiz') {
          // Parse quiz data using your existing logic
          const quizData = data
          // console.log(' Quiz Data:', quizData)

          if (quizData && quizData.length > 0) {


            // Store the generated content in state
            setGeneratedContent({
              type: resultType,
              data: quizData,
              rawData: quizData, // Keep raw data for debugging
              formConfig: { ...formData }
            })

            // Move to results step
            setStep(4)

            // Navigate to quiz page
            // router.push(`/quiz/${quizId}`)

          } else {
            throw new Error('No valid questions generated')
          }

        } else if (resultType === 'summary') {
          // Handle summary display (your existing logic)
          const processedData = parseSummaryData(data)
          setGeneratedContent({
            type: resultType,
            data: processedData,
            rawData: data,
            formConfig: { ...formData }
          })
          setStep(4)

        } else if (resultType === 'you_tube_content') {
          // Handle YouTube content display (your existing logic)
          const processedData = parseYouTubeContent(data)
          setGeneratedContent({
            type: resultType,
            data: processedData,
            rawData: data,
            formConfig: { ...formData }
          })
          setStep(4)
        }

        toast.success(`${resultType.charAt(0).toUpperCase() + resultType.slice(1)} generated successfully!`, {
          position: "top-right",
          autoClose: 3000,
        })

      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('API Error:', error)

      let errorMessage = 'Failed to generate content'

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid request. Please check your input.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      } else if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else if (error.response.data.detail.message) {
          errorMessage = error.response.data.detail.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      // Show user-friendly error
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 8000
      })

      // Also show in UI store if needed
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: errorMessage
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="w-full px-4 py-6 pt-20 sm:pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
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

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 overflow-x-auto"
          >
            <div className="flex items-center justify-start sm:justify-center space-x-4 sm:space-x-8 min-w-max px-2">
              {[
                { number: 1, label: 'Content Source', icon: Upload },
                { number: 2, label: 'Configuration', icon: Settings },
                { number: 3, label: 'Generate', icon: Brain },
                { number: 4, label: 'Results', icon: Target }
              ].map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step >= stepItem.number
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                      }`}>
                      <stepItem.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={`mt-1 sm:mt-2 font-medium text-xs sm:text-sm text-center ${step >= stepItem.number ? 'text-slate-800' : 'text-slate-500'
                      }`}>
                      {stepItem.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-6 sm:w-8 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${step > stepItem.number ? 'bg-blue-600' : 'bg-slate-300'
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
              {/* Loading Overlay */}
              {isGenerating && (
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
                    className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full"
                  >
                    <div className="text-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <motion.div
                          className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute inset-2 sm:inset-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                        {formData.action === 'quiz' ? 'Generating Quiz' :
                          formData.action === 'summary' ? 'Creating Summary' :
                            'Extracting Content'}
                      </h3>

                      <p className="text-slate-600 mb-4 text-sm sm:text-base">{loadingStage}</p>

                      <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        />
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500">
                        {progress}% complete • This may take a few moments
                      </p>

                      {/* AI Processing Animation */}
                      <div className="flex justify-center items-center mt-4 sm:mt-6 space-x-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-blue-600 rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2
                            }}
                          />
                        ))}
                      </div>
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
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Choose Content Source</h2>
                    <p className="text-base sm:text-lg text-slate-600">Select how you want to provide content</p>
                    {/* <p className="text-sm sm:text-base md:text-lg font-medium text-amber-700 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-md"
                    >ℹ️ Tip: Upload only the specific pages you want questions from. When too many pages are provided, most questions are generated from the first 5–10 pages. This ensures your quiz matches your exact requirement.</p> */}
                  </div>




                  {contentType && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl"
                    >
                      {contentType === 'file' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Upload File (PDF, PPTX (POWERPOINT) , PNG, JPG, JPEG)
                          </label>
                          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 text-center">
                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-4" />
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg"
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
                            >
                              Click to upload or drag and drop
                            </label>
                            <p className="text-xs sm:text-sm text-slate-500 mt-2">Supported: PDF, PPTX (POWERPOINT) PNG, JPG, JPEG </p>
                            {formData.file && (
                              <p className="text-xs sm:text-sm text-green-600 mt-2 break-all">
                                Selected: {formData.file.name}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {contentType === 'url' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Web Page URL
                          </label>
                          <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                            className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                            placeholder="https://example.com/article"
                          />
                        </div>
                      )}

                      {contentType === 'youtube_url' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            YouTube Video URL
                          </label>
                          <input
                            type="url"
                            value={formData.youtubeUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                            className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                      )}

                      {contentType === 'youtube_search' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                              Search Query
                            </label>
                            <input
                              type="text"
                              value={formData.youtubeQuery}
                              onChange={(e) => setFormData(prev => ({ ...prev, youtubeQuery: e.target.value }))}
                              className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                              placeholder="Enter search terms (e.g., 'machine learning tutorial')"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                              Number of Top Results
                            </label>
                            <select
                              value={formData.topRanker}
                              onChange={(e) => setFormData(prev => ({ ...prev, topRanker: e.target.value }))}
                              className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                            >
                              {topRankerOptions.map(num => (
                                <option key={num} value={num}>Top {num} results</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="flex justify-end mt-6 my-6 sm:mt-8">
                    <motion.button
                      onClick={() => setStep(2)}
                      disabled={!validateStep1()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Continue to Configuration
                    </motion.button>
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {contentTypes.map((type) => (
                      <motion.button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left ${contentType === type.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-medium hover:scale-102'
                          }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${type.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
                          <type.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">{type.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-600">{type.description}</p>
                      </motion.button>
                    ))}
                  </div>



                </motion.div>
              )}

              {/* Step 4: Results Display */}
              {step === 4 && generatedContent && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">
                      🎉 {generatedContent.type === 'quiz' ? 'Quiz Generated!' :
                        generatedContent.type === 'summary' ? 'Summary Generated!' :
                          'Content Extracted!'}
                    </h2>
                    <p className="text-base sm:text-lg text-slate-600">Review your generated content below</p>
                  </div>

                  {/* Quiz Results Display */}
                  {generatedContent.type === 'quiz' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <span className="font-semibold text-slate-800 text-sm sm:text-base">
                            {Array.isArray(generatedContent.rawData) ? generatedContent.rawData.length : 0} Questions Generated
                          </span>
                        </div>

                        {/* Teacher vs Student Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {isTeacher ? (
                            // Teacher Actions
                            <>
                              <button
                                onClick={() => {
                                  // Preview mode for teachers
                                  const quizId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                                  const quizData = {
                                    questions: generatedContent.rawData,
                                    metadata: {
                                      title: formData.title || 'Generated Quiz Preview',
                                      description: 'Preview Mode - Not Saved',
                                      isPreview: true
                                    }
                                  }
                                  localStorage.setItem(`quiz_${quizId}`, JSON.stringify(quizData.questions))
                                  window.open(`/quiz/${quizId}`, '_blank')
                                }}
                                className="border-2 border-blue-600 text-blue-600 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                              >
                                <Eye className="w-4 h-4" />
                                Preview Quiz
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    setIsGenerating(true)
                                    const result = await saveQuizToLibrary(generatedContent.rawData, {
                                      title: formData.title || 'Generated Quiz',
                                      description: formData.description || 'AI Generated Quiz'
                                    })

                                    setSavedQuizId(result.id)
                                    toast.success('Quiz saved to your library!')
                                    addToast({
                                      type: 'success',
                                      title: 'Quiz Saved!',
                                      message: 'Quiz has been saved to your library.'
                                    })
                                  } catch (error) {
                                    const errorMsg = error.response?.data?.detail || 'Failed to save quiz'
                                    toast.error(errorMsg)
                                    addToast({
                                      type: 'error',
                                      title: 'Save Failed',
                                      message: errorMsg
                                    })
                                  } finally {
                                    setIsGenerating(false)
                                  }
                                }}
                                disabled={isGenerating}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                Save to Library
                              </button>

                              {savedQuizId && (
                                <button
                                  onClick={() => setShowQuizLibrary(true)}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  View Library
                                </button>
                              )}
                            </>
                          ) : (
                            // Student Actions (existing)
                            <button
                              onClick={() => {
                                const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                                const quizData = {
                                  questions: generatedContent.rawData,
                                  metadata: {
                                    title: formData.title || 'Generated Quiz',
                                    description: formData.description || 'AI Generated Quiz',
                                    difficulty: formData.difficulty_level || 'medium',
                                    subject: formData.subject || 'General',
                                    language: formData.language || 'English',
                                    source: contentType,
                                    createdAt: new Date().toISOString(),
                                    totalQuestions: generatedContent.rawData.length
                                  }
                                }
                                localStorage.setItem(`quiz_${quizId}`, JSON.stringify(quizData.questions))
                                router.push(`/quiz/${quizId}`)
                              }}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                              <Play className="w-4 h-4" />
                              Take Quiz
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Success message for teachers after saving */}
                      {isTeacher && savedQuizId && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-800">Quiz Saved Successfully!</h4>
                              <p className="text-green-600 text-sm">
                                Your quiz has been saved to your library. You can now assign it to classrooms.
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => router.push('/teacher_dashboard')}
                              className="text-green-700 hover:text-green-800 text-sm font-medium"
                            >
                              Go to Dashboard →
                            </button>
                            <span className="text-green-400">|</span>
                            <button
                              onClick={() => {
                                // You can implement quiz library view here
                                setShowQuizLibrary(true)
                              }}
                              className="text-green-700 hover:text-green-800 text-sm font-medium"
                            >
                              View Quiz Library →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quiz Questions Display */}
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {Array.isArray(generatedContent.rawData) && generatedContent.rawData.length > 0 ? (
                          generatedContent.rawData.map((question, index) => (
                            <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full flex-shrink-0">
                                  Q{index + 1}
                                </span>
                                <div className="flex-1 w-full min-w-0">
                                  <h4 className="text-slate-800 font-semibold mb-4 text-base sm:text-lg break-words">
                                    {question.question}
                                  </h4>

                                  {question.options && Array.isArray(question.options) && (
                                    <div className="space-y-3 mb-4">
                                      {question.options.map((option, optIndex) => {
                                        const isCorrect = question.answer === option || question.correct_answer === option
                                        return (
                                          <div
                                            key={optIndex}
                                            className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${isCorrect
                                              ? 'bg-green-100 border-2 border-green-300'
                                              : 'bg-white border border-slate-200 hover:border-slate-300'
                                              }`}
                                          >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect
                                              ? 'border-green-600 bg-green-600'
                                              : 'border-slate-300'
                                              }`}>
                                              {isCorrect && (
                                                <span className="text-white text-xs font-bold">✓</span>
                                              )}
                                            </div>
                                            <span className={`text-sm break-words ${isCorrect ? 'text-green-800 font-semibold' : 'text-slate-700'
                                              }`}>
                                              {option}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}

                                  {question.explanation && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                                      <p className="text-sm text-blue-800 break-words">
                                        <strong className="text-blue-900">Explanation:</strong> {question.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-amber-600 text-2xl">⚠️</span>
                            </div>
                            <p className="text-amber-800 font-medium mb-2">Unable to parse quiz questions</p>
                            <p className="text-amber-600 text-sm mb-4">The data format may need adjustment</p>
                            <details className="text-left">
                              <summary className="text-amber-700 cursor-pointer hover:text-amber-800">View Raw Data</summary>
                              <pre className="text-xs bg-amber-100 p-4 rounded-lg mt-2 overflow-auto text-amber-900 break-all">
                                {JSON.stringify(generatedContent.rawData, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Results Display */}
                  {generatedContent.type === 'summary' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <span className="font-semibold text-slate-800 text-sm sm:text-base">Summary Generated</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={(event) => {
                              const originalText = event.target.textContent
                              event.target.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 inline-block mr-2"></div>Copying...'

                              navigator.clipboard.writeText(generatedContent.data).then(() => {
                                setTimeout(() => {
                                  event.target.textContent = originalText
                                  addToast({
                                    type: 'success',
                                    title: 'Copied!',
                                    message: 'Summary copied to clipboard.'
                                  })
                                }, 800)
                              })
                            }}
                            className="border-2 border-green-600 text-green-600 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-all duration-300 text-sm sm:text-base"
                          >
                            Copy Summary
                          </button>
                          {/* <button
                            onClick={(event) => {
                              const originalText = event.target.textContent
                              event.target.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>Saving...'

                              setTimeout(() => {
                                event.target.textContent = originalText
                                addToast({
                                  type: 'success',
                                  title: 'Saved!',
                                  message: 'Summary has been saved.'
                                })
                              }, 1200)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                          >
                            Save Summary
                          </button> */}
                        </div>
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
                            {generatedContent.data}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YouTube Content Results Display */}
                  {generatedContent.type === 'you_tube_content' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <span className="font-semibold text-slate-800 text-sm sm:text-base">Content Extracted Successfully</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={(event) => {
                              const originalText = event.target.textContent
                              event.target.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 inline-block mr-2"></div>Copying...'

                              const contentToCopy = Array.isArray(generatedContent.data)
                                ? generatedContent.data.map(item => `**${item.channel || 'Unknown Channel'}**\n\n${item.content || 'No content available'}`).join('\n\n---\n\n')
                                : JSON.stringify(generatedContent.data, null, 2)

                              navigator.clipboard.writeText(contentToCopy).then(() => {
                                setTimeout(() => {
                                  event.target.textContent = originalText
                                  addToast({
                                    type: 'success',
                                    title: 'Copied!',
                                    message: 'Content copied to clipboard.'
                                  })
                                }, 800)
                              })
                            }}
                            className="border-2 border-green-600 text-green-600 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-all duration-300 text-sm sm:text-base"
                          >
                            Copy All Content
                          </button>
                          <button
                            onClick={(event) => {
                              const originalText = event.target.textContent
                              event.target.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>Saving...'

                              setTimeout(() => {
                                event.target.textContent = originalText
                                addToast({
                                  type: 'success',
                                  title: 'Saved!',
                                  message: 'Content has been saved.'
                                })
                              }, 1200)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                          >
                            Save Content
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 sm:space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-slate-100">
                        {Array.isArray(generatedContent.data) ? (
                          generatedContent.data.map((item, index) => (
                            <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 sm:p-6 border border-red-100 shadow-sm">
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="bg-red-500 text-white p-2 sm:p-3 rounded-lg flex-shrink-0 shadow-md">
                                  <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 sm:mb-4">
                                    <h4 className="font-bold text-base sm:text-lg text-slate-800 break-words">
                                      {item.channel || 'Unknown Channel'}
                                    </h4>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium self-start">
                                      Video {index + 1}
                                    </span>
                                  </div>

                                  <div className="prose prose-xs sm:prose-sm max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeHighlight]}
                                      components={{
                                        h1: ({ children }) => (
                                          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-red-200 break-words">
                                            {children}
                                          </h1>
                                        ),
                                        h2: ({ children }) => (
                                          <h2 className="text-base sm:text-lg font-semibold text-red-800 mt-4 sm:mt-6 mb-2 sm:mb-3 flex items-start break-words">
                                            <span className="w-1.5 h-3 sm:h-4 bg-red-600 rounded-full mr-2 flex-shrink-0 mt-1"></span>
                                            <span>{children}</span>
                                          </h2>
                                        ),
                                        h3: ({ children }) => (
                                          <h3 className="text-sm sm:text-base font-semibold text-orange-700 mt-3 sm:mt-4 mb-1 sm:mb-2 break-words">
                                            {children}
                                          </h3>
                                        ),
                                        p: ({ children }) => (
                                          <p className="text-slate-700 leading-relaxed mb-2 sm:mb-3 text-xs sm:text-sm break-words">
                                            {children}
                                          </p>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="space-y-1 mb-2 sm:mb-3 ml-2 sm:ml-3">
                                            {children}
                                          </ul>
                                        ),
                                        ol: ({ children }) => (
                                          <ol className="space-y-1 mb-2 sm:mb-3 ml-2 sm:ml-3 list-decimal">
                                            {children}
                                          </ol>
                                        ),
                                        li: ({ children }) => (
                                          <li className="text-slate-700 text-xs sm:text-sm flex items-start">
                                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full mr-1 sm:mr-2 mt-1.5 sm:mt-2 flex-shrink-0"></span>
                                            <span className="break-words">{children}</span>
                                          </li>
                                        ),
                                        strong: ({ children }) => (
                                          <strong className="font-semibold text-slate-900 bg-yellow-100 px-1 rounded break-words">
                                            {children}
                                          </strong>
                                        ),
                                        em: ({ children }) => (
                                          <em className="italic text-red-700 break-words">
                                            {children}
                                          </em>
                                        ),
                                        code: ({ children }) => (
                                          <code className="bg-gray-100 text-red-600 px-1 sm:px-1.5 py-0.5 rounded text-xs font-mono break-all">
                                            {children}
                                          </code>
                                        ),
                                        pre: ({ children }) => (
                                          <pre className="bg-gray-900 text-green-400 p-2 sm:p-3 rounded-lg overflow-x-auto mb-2 sm:mb-3 text-xs">
                                            {children}
                                          </pre>
                                        ),
                                        blockquote: ({ children }) => (
                                          <blockquote className="border-l-2 sm:border-l-3 border-red-500 pl-2 sm:pl-3 py-1 bg-red-50 rounded-r-lg mb-2 sm:mb-3 italic text-xs sm:text-sm break-words">
                                            {children}
                                          </blockquote>
                                        ),
                                      }}
                                    >
                                      {item.content || 'No content available'}
                                    </ReactMarkdown>
                                  </div>

                                  {item.url && (
                                    <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-red-200">
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-colors break-all"
                                      >
                                        <Youtube className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span>Watch Original Video</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 sm:p-6 border border-amber-200">
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                              <div className="bg-amber-500 text-white p-2 sm:p-3 rounded-lg flex-shrink-0">
                                <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-amber-800 mb-3 sm:mb-4 text-sm sm:text-base">Raw Content Data</h4>
                                <div className="prose prose-xs sm:prose-sm max-w-none">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                      p: ({ children }) => (
                                        <p className="text-amber-700 leading-relaxed mb-2 sm:mb-3 text-xs sm:text-sm break-words">
                                          {children}
                                        </p>
                                      ),
                                      pre: ({ children }) => (
                                        <pre className="bg-amber-100 text-amber-900 p-3 sm:p-4 rounded-lg overflow-auto mb-2 sm:mb-3 text-xs max-h-64 break-all">
                                          {children}
                                        </pre>
                                      ),
                                      code: ({ children }) => (
                                        <code className="bg-amber-100 text-amber-800 px-1 sm:px-1.5 py-0.5 rounded text-xs font-mono break-all">
                                          {children}
                                        </code>
                                      ),
                                    }}
                                  >
                                    {typeof generatedContent.data === 'string' ? generatedContent.data : `\`\`\`json\n${JSON.stringify(generatedContent.data, null, 2)}\n\`\`\``}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                    <motion.button
                      onClick={() => {
                        setStep(1)
                        setGeneratedContent(null)
                        setProgress(0)
                        setLoadingStage('')
                      }}
                      className="flex-1 border-2 border-slate-300 text-slate-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Generate New Content
                    </motion.button>
                    <motion.button
                      onClick={() => router.push('/dashboard')}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back to Dashboard
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
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Configuration</h2>
                    <p className="text-base sm:text-lg text-slate-600">Customize your content generation settings</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Action Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Action Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {actionTypes.map((action) => (
                          <motion.button
                            key={action.id}
                            onClick={() => setFormData(prev => ({ ...prev, action: action.id }))}
                            className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left ${formData.action === action.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <h4 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">{action.label}</h4>
                            <p className="text-xs sm:text-sm text-slate-600">{action.description}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Quiz-specific settings */}
                    {formData.action === 'quiz' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                              Quiz Type
                            </label>
                            <select
                              value={formData.quiz_type}
                              onChange={(e) => setFormData(prev => ({ ...prev, quiz_type: e.target.value }))}
                              className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                            >
                              {quizTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                              Difficulty Level
                            </label>
                            <select
                              value={formData.difficulty_level}
                              onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                              className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                            >
                              {difficulties.map(diff => (
                                <option key={diff.id} value={diff.id}>{diff.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Number of Questions
                          </label>
                          <select
                            value={formData.num_questions}
                            onChange={(e) => setFormData(prev => ({ ...prev, num_questions: e.target.value }))}
                            className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                          >
                            {questionCounts.map(num => (
                              <option key={num} value={num}>{num} questions</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Summary-specific settings */}
                    {formData.action === 'summary' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Summary Length (words)
                        </label>
                        <select
                          value={formData.no_of_words}
                          onChange={(e) => setFormData(prev => ({ ...prev, no_of_words: e.target.value }))}
                          className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                        >
                          {wordCounts.map(count => (
                            <option key={count} value={count}>{count} words</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Language selection (for quiz and summary) */}
                    {(formData.action === 'quiz' || formData.action === 'summary') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Language
                        </label>
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                        >
                          {languages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-6 sm:mt-8">
                    <motion.button
                      onClick={() => setStep(1)}
                      className="flex-1 border-2 border-slate-300 text-slate-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Review & Generate
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
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Review & Generate</h2>
                    <p className="text-base sm:text-lg text-slate-600">Confirm your settings and generate AI-powered content</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                        <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Content Source</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-slate-600 text-sm">Type:</span>
                            <span className="font-medium text-slate-800 capitalize text-sm text-right">
                              {contentType.replace('_', ' ')}
                            </span>
                          </div>
                          {formData.file && (
                            <div className="flex justify-between items-start">
                              <span className="text-slate-600 text-sm">File:</span>
                              <span className="font-medium text-slate-800 text-sm text-right max-w-32 sm:max-w-40 truncate">
                                {formData.file.name}
                              </span>
                            </div>
                          )}
                          {formData.url && (
                            <div className="flex justify-between items-start">
                              <span className="text-slate-600 text-sm">URL:</span>
                              <span className="font-medium text-slate-800 text-sm text-right max-w-32 sm:max-w-40 truncate">
                                {formData.url}
                              </span>
                            </div>
                          )}
                          {formData.youtubeUrl && (
                            <div className="flex justify-between items-start">
                              <span className="text-slate-600 text-sm">YouTube:</span>
                              <span className="font-medium text-slate-800 text-sm text-right max-w-32 sm:max-w-40 truncate">
                                {formData.youtubeUrl}
                              </span>
                            </div>
                          )}
                          {formData.youtubeQuery && (
                            <>
                              <div className="flex justify-between items-start">
                                <span className="text-slate-600 text-sm">Query:</span>
                                <span className="font-medium text-slate-800 text-sm text-right max-w-32 sm:max-w-40 truncate">
                                  {formData.youtubeQuery}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-slate-600 text-sm">Top Results:</span>
                                <span className="font-medium text-slate-800 text-sm">
                                  {formData.topRanker}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                        <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Generation Settings</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-slate-600 text-sm">Action:</span>
                            <span className="font-medium text-slate-800 capitalize text-sm">{formData.action}</span>
                          </div>
                          {formData.action === 'quiz' && (
                            <>
                              <div className="flex justify-between items-start">
                                <span className="text-slate-600 text-sm">Questions:</span>
                                <span className="font-medium text-slate-800 text-sm">{formData.num_questions}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-slate-600 text-sm">Type:</span>
                                <span className="font-medium text-slate-800 capitalize text-sm">
                                  {formData.quiz_type.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-slate-600 text-sm">Difficulty:</span>
                                <span className="font-medium text-slate-800 capitalize text-sm">
                                  {formData.difficulty_level}
                                </span>
                              </div>
                            </>
                          )}
                          {formData.action === 'summary' && (
                            <div className="flex justify-between items-start">
                              <span className="text-slate-600 text-sm">Words:</span>
                              <span className="font-medium text-slate-800 text-sm">{formData.no_of_words}</span>
                            </div>
                          )}
                          {(formData.action === 'quiz' || formData.action === 'summary') && (
                            <div className="flex justify-between items-start">
                              <span className="text-slate-600 text-sm">Language:</span>
                              <span className="font-medium text-slate-800 text-sm">{formData.language}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm sm:text-base">AI Processing Pipeline</h3>
                          <p className="text-slate-600 text-xs sm:text-sm">
                            {formData.action === 'quiz' && 'Our AI will analyze your content and create tailored questions'}
                            {formData.action === 'summary' && 'Our AI will process your content and generate a comprehensive summary'}
                            {formData.action === 'content' && 'Our AI will extract and structure the raw content for you'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="text-slate-700">Content extraction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                          <span className="text-slate-700">AI processing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-slate-700">Quality optimization</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <motion.button
                      onClick={() => setStep(2)}
                      className="flex-1 border-2 border-slate-300 text-slate-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300 text-sm sm:text-base"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back to Edit
                    </motion.button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isGenerating}
                      className={`flex-1 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${isGenerating
                        ? 'bg-gradient-to-r from-blue-400 to-purple-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:from-blue-700 hover:to-purple-700'
                        }`}
                      whileHover={!isGenerating ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!isGenerating ? { scale: 0.98 } : {}}
                    >
                      {isGenerating ? (
                        <>
                          <div className="relative">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs sm:text-sm">{loadingStage}</span>
                            <div className="w-24 sm:w-32 h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                              <motion.div
                                className="h-full bg-white rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                          Generate {formData.action === 'quiz' ? 'Quiz' : formData.action === 'summary' ? 'Summary' : 'Content'}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}

export default CreateQuizPage