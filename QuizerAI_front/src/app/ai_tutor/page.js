'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Upload,
  FileText,
  Target,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Settings,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Download,
  Sparkles,
  Calculator,
  Menu
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github.css'
import axios from 'axios'

const AITutorPage = () => {
  // State management
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `# Welcome to AI Tutor! 🎓

I'm your AI-powered learning assistant, ready to help you with your studies in multiple ways:

## Available Modes:
- **General Q&A**: Ask any academic question with or without reference material
- **Concept Explanation**: Get detailed explanations of specific concepts  
- **Problem Solving**: Step-by-step problem solving assistance
- **Study Guide**: Create comprehensive study materials *(requires content)*
- **Interactive Learning**: Interactive sessions with exercises *(requires content)*

## What I Can Process:
- **PDF files** (up to 2 pages)
- **Images with text** (OCR enabled)
- **Text files**
- **General knowledge questions** (no content needed)

How can I help you learn today?`,
      timestamp: new Date(),
      rating: null,
      tutorType: 'explanation'
    }
  ])
  
  // Input states
  const [input, setInput] = useState('')
  const [concept, setConcept] = useState('')
  const [problem, setProblem] = useState('')
  const [topic, setTopic] = useState('')
  const [learningGoal, setLearningGoal] = useState('')
  const [contentText, setContentText] = useState('')
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [tutorType, setTutorType] = useState('explanation')
  const [language, setLanguage] = useState('English')
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [recognition, setRecognition] = useState(null)
  
  // Mobile states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Refs
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)
  
  const { user } = useAuth()

  // Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB as per backend
  const SUPPORTED_FILE_TYPES = ['text/plain', 'application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

  // Data configurations
  const tutorTypes = [
    { 
      id: 'explanation', 
      name: 'General Q&A', 
      icon: HelpCircle, 
      description: 'Ask questions with or without reference material',
      color: 'bg-blue-500',
      placeholder: 'Ask me anything about your studies...',
      requiresContent: false
    },
    { 
      id: 'concept', 
      name: 'Concept Explanation', 
      icon: Lightbulb, 
      description: 'Get detailed explanations of specific concepts',
      color: 'bg-yellow-500',
      placeholder: 'Enter concept to explain (e.g., "Photosynthesis")',
      requiresContent: false
    },
    { 
      id: 'problem', 
      name: 'Problem Solving', 
      icon: Calculator, 
      description: 'Step-by-step problem solving assistance',
      color: 'bg-green-500',
      placeholder: 'Enter problem to solve (e.g., "Solve 2x + 5 = 15")',
      requiresContent: false
    },
    { 
      id: 'study_guide', 
      name: 'Study Guide', 
      icon: BookOpen, 
      description: 'Create comprehensive study materials',
      color: 'bg-purple-500',
      placeholder: 'Enter topic for study guide (e.g., "World War II")',
      requiresContent: true
    },
    { 
      id: 'interactive', 
      name: 'Interactive Learning', 
      icon: Target, 
      description: 'Interactive sessions with exercises',
      color: 'bg-red-500',
      placeholder: 'Enter learning goal (e.g., "Master quadratic equations")',
      requiresContent: true
    }
  ]

  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi', 'Arabic']
  const difficultyLevels = ['beginner', 'intermediate', 'advanced']

  const quickQuestions = [
    "Explain this topic in simple terms",
    "What are the key concepts here?", 
    "How does this work step by step?",
    "Can you give me examples?",
    "What should I focus on studying?"
  ]

  // Utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const validateFile = (file) => {
    if (!file) return { isValid: false, error: 'No file selected' }
    
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size must be less than 50MB' }
    }
    
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Unsupported file type. Please upload text, PDF, or image files.' }
    }
    
    return { isValid: true }
  }

  const getCurrentInputValue = () => {
    switch (tutorType) {
      case 'concept': return concept
      case 'problem': return problem
      case 'study_guide': return topic
      case 'interactive': return learningGoal
      default: return input
    }
  }

  const clearCurrentInput = () => {
    switch (tutorType) {
      case 'concept': setConcept(''); break
      case 'problem': setProblem(''); break
      case 'study_guide': setTopic(''); break
      case 'interactive': setLearningGoal(''); break
      default: setInput(''); break
    }
  }

  const getCurrentTutorType = () => tutorTypes.find(t => t.id === tutorType)

  const closeSidebarOnMobile = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  // Effects
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      document.body.classList.toggle('sidebar-open', isSidebarOpen)
    }
    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [isMobile, isSidebarOpen])

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      setRecognition(recognition)
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Event handlers
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    setUploadedFile(file)
    toast.success(`File "${file.name}" uploaded successfully`)

    // Preview text files
    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setContentText(e.target.result)
      }
      reader.onerror = () => {
        toast.error('Error reading file')
      }
      reader.readAsText(file)
    }
  }, [])

  const removeFile = useCallback(() => {
    setUploadedFile(null)
    setContentText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('File removed')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    closeSidebarOnMobile()
    
    // Validation
    const currentInput = getCurrentInputValue()
    const currentType = getCurrentTutorType()
    
    if (!currentInput?.trim()) {
      toast.error(`Please enter a ${currentType?.name.toLowerCase() || 'question'}`)
      return
    }

    // Check if content is required for this tutor type
    if (currentType?.requiresContent && !contentText && !uploadedFile) {
      toast.error(`${currentType.name} requires reference content. Please provide text or upload a file.`)
      return
    }

    // Create user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
      tutorType: tutorType,
      language: language,
      difficultyLevel: difficultyLevel,
      hasFile: !!uploadedFile,
      hasContent: !!(contentText || uploadedFile)
    }

    setMessages(prev => [...prev, userMessage])
    clearCurrentInput()
    setIsLoading(true)

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      // Prepare form data
      const formData = new FormData()
      
      // Add fields based on tutor type
      switch (tutorType) {
        case 'explanation':
          formData.append('query', currentInput.trim())
          break
        case 'concept':
          formData.append('concept', currentInput.trim())
          break
        case 'problem':
          formData.append('problem', currentInput.trim())
          break
        case 'study_guide':
          formData.append('topic', currentInput.trim())
          break
        case 'interactive':
          formData.append('learning_goal', currentInput.trim())
          break
      }

      // Add common fields
      formData.append('tutor_type', tutorType)
      formData.append('language', language)
      formData.append('difficulty_level', difficultyLevel)
      
      // Add content
      if (contentText) {
        formData.append('content', contentText)
      }
      
      // Add file if uploaded
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }

      // Make API call
      const response = await axios.post(
        `${API_BASE_URL}/ai_tutor/user_query_for_ai_tutor`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes
          signal: abortControllerRef.current.signal
        }
      )

      if (response.data.status === 'success') {
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.data.result,
          timestamp: new Date(),
          rating: null,
          tutorType: tutorType,
          metadata: response.data.metadata
        }

        setMessages(prev => [...prev, botResponse])
        toast.success('Response generated successfully')
      } else {
        throw new Error(response.data.message || 'Unknown error occurred')
      }

    } catch (error) {
      console.error('Error:', error)
      
      if (error.name === 'AbortError') {
        toast('Request cancelled', { icon: 'ℹ️' })
        return
      }
      
      let errorMessage = 'Sorry, I encountered an error while processing your request.'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again with shorter content.'
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.'
      }

      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: `## Error\n\n${errorMessage}`,
        timestamp: new Date(),
        rating: null,
        isError: true
      }

      setMessages(prev => [...prev, errorResponse])
      toast.error('Failed to get response')
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleQuickQuestion = useCallback((question) => {
    setInput(question)
    setTutorType('explanation')
  }, [])

  const handleVoiceInput = useCallback(() => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      return
    }

    setIsListening(true)
    
    recognition.onstart = () => {
      toast('Listening... Speak now', { icon: '🎤' })
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      const currentInput = getCurrentInputValue()
      
      switch (tutorType) {
        case 'concept': setConcept(currentInput + transcript); break
        case 'problem': setProblem(currentInput + transcript); break
        case 'study_guide': setTopic(currentInput + transcript); break
        case 'interactive': setLearningGoal(currentInput + transcript); break
        default: setInput(currentInput + transcript); break
      }
      
      setIsListening(false)
      toast.success('Speech converted to text')
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      toast.error(`Speech recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [recognition, isListening, tutorType, getCurrentInputValue])

  const rateMessage = useCallback((messageId, rating) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      )
    )
    toast.success(`Feedback recorded: ${rating === 'up' ? 'Helpful' : 'Not helpful'}`)
  }, [])

  const copyMessage = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  const clearChat = useCallback(() => {
    setMessages([{
      id: 1,
      type: 'bot',
      content: `# Chat Cleared! 🧹

Ready for a new learning session. Upload a document, provide content, or ask any general knowledge questions to get started.`,
      timestamp: new Date(),
      rating: null,
      tutorType: 'explanation'
    }])
    removeFile()
    setContentText('')
    clearCurrentInput()
    toast.success('Chat cleared')
  }, [removeFile])

  const exportChat = useCallback(() => {
    try {
      const chatData = {
        exportDate: new Date().toISOString(),
        totalMessages: messages.length,
        settings: { language, difficultyLevel },
        messages: messages.map(msg => ({
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp.toLocaleString(),
          tutorType: msg.tutorType,
          rating: msg.rating
        }))
      }
      
      const dataStr = JSON.stringify(chatData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `ai-tutor-chat-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      toast.success('Chat exported successfully')
    } catch (error) {
      toast.error('Failed to export chat')
    }
  }, [messages, language, difficultyLevel])

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      toast('Request cancelled', { icon: 'ℹ️' })
    }
  }, [])

  // Render helpers
  const renderInputField = () => {
    const currentType = getCurrentTutorType()
    const placeholder = currentType?.placeholder || "Enter your input..."

    const commonProps = {
      className: "w-full px-3 lg:px-4 py-2 lg:py-3 border border-slate-200 rounded-lg lg:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white text-sm lg:text-base",
      placeholder: placeholder
    }

    switch (tutorType) {
      case 'concept':
        return (
          <input
            {...commonProps}
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            maxLength={200}
          />
        )
      case 'problem':
        return (
          <textarea
            {...commonProps}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows="2"
            maxLength={1000}
            className={`${commonProps.className} resize-none`}
          />
        )
      case 'study_guide':
        return (
          <input
            {...commonProps}
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
          />
        )
      case 'interactive':
        return (
          <input
            {...commonProps}
            type="text"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            maxLength={200}
          />
        )
      default:
        return (
          <textarea
            {...commonProps}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows="1"
            maxLength={1000}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            className={`${commonProps.className} resize-none`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
        )
    }
  }

  const renderSidebarContent = () => (
    <>
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800">AI Tutor Settings</h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      )}

      {/* Content Upload */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl p-4 lg:p-6 shadow-soft border border-slate-200"
      >
        <h3 className="font-semibold text-slate-800 mb-4">Content Source</h3>
        <p className="text-xs text-slate-500 mb-4">Optional for General Q&A, Concept, and Problem modes</p>
        
        {/* File Upload */}
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-5 h-5 text-slate-500" />
            <div className="text-left">
              <div className="text-slate-600 font-medium text-sm lg:text-base">Upload Document</div>
              <div className="text-xs text-slate-500">PDF (2 pages), Images, Text</div>
            </div>
          </motion.button>

          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <FileText className="w-4 h-4 text-green-600" />
              <span className="flex-1 text-sm text-green-700 truncate">
                {uploadedFile.name}
              </span>
              <motion.button
                onClick={removeFile}
                className="text-green-600 hover:text-red-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Or paste content:
            </label>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Paste your study material here..."
              className="w-full h-20 lg:h-24 px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
              maxLength={10000}
            />
            <div className="text-xs text-slate-500 mt-1">
              {contentText.length}/10,000 characters
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tutor Type Selection */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 lg:p-6 shadow-soft border border-slate-200"
      >
        <h3 className="font-semibold text-slate-800 mb-4">Tutor Mode</h3>
        <div className="space-y-2">
          {tutorTypes.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setTutorType(type.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                tutorType === type.id
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                  : 'hover:bg-slate-50 text-slate-700 border-2 border-transparent'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center ${type.color} flex-shrink-0`}>
                <type.icon className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-xs lg:text-sm flex items-center gap-2">
                  {type.name}
                  {type.requiresContent && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                      Content Required
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-75 mt-1">{type.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 lg:p-6 shadow-soft border border-slate-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Settings</h3>
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-slate-100 rounded"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </motion.button>
        </div>
        
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  {difficultyLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Questions */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-4 lg:p-6 shadow-soft border border-slate-200"
      >
        <h3 className="font-semibold text-slate-800 mb-4">Quick Questions</h3>
        <div className="space-y-2">
          {quickQuestions.map((question, index) => (
            <motion.button
              key={index}
              onClick={() => {
                handleQuickQuestion(question)
                closeSidebarOnMobile()
              }}
              className="w-full text-left p-3 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {question}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Chat Actions */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-4 lg:p-6 shadow-soft border border-slate-200"
      >
        <h3 className="font-semibold text-slate-800 mb-4">Chat Actions</h3>
        <div className="space-y-2">
          <motion.button
            onClick={() => {
              clearChat()
              closeSidebarOnMobile()
            }}
            className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat</span>
          </motion.button>
          <motion.button
            onClick={exportChat}
            className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            <span>Export Chat</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-2 lg:px-4 py-4 lg:py-8 pt-20 lg:pt-24 pb-safe">
        <div className="max-w-6xl mx-auto">
          {/* Header - Hide on mobile when sidebar is open */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center mb-6 lg:mb-8 ${isMobile && isSidebarOpen ? 'hidden' : ''}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Assistant</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              AI Tutor
            </h1>
            <p className="text-lg lg:text-xl text-slate-600">
              Get instant help with your studies. Upload documents, ask questions, and learn with AI guidance.
            </p>
          </motion.div>

          <div className="relative lg:grid lg:grid-cols-4 gap-0 lg:gap-8">
            {/* Mobile Sidebar Toggle */}
            <motion.button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`${isMobile ? 'fixed' : 'hidden'} top-24 left-4 z-50 p-3 bg-white rounded-full shadow-lg border border-slate-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </motion.button>

            {/* Mobile Overlay */}
            <AnimatePresence>
              {isMobile && isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 z-40"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
              {(!isMobile || isSidebarOpen) && (
                <motion.div
                  initial={isMobile ? { x: -320 } : { opacity: 1 }}
                  animate={isMobile ? { x: 0 } : { opacity: 1 }}
                  exit={isMobile ? { x: -320 } : { opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`
                    ${isMobile 
                      ? 'fixed top-0 left-0 h-full w-80 bg-white z-50 border-r border-slate-200 overflow-y-auto'
                      : 'lg:col-span-1 relative'
                    } 
                  `}
                >
                  <div className={`space-y-4 lg:space-y-6 p-4 ${isMobile ? 'pt-20' : ''}`}>
                    {renderSidebarContent()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Interface */}
            <div className={`${isMobile ? 'w-full min-h-screen' : 'lg:col-span-3'}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white shadow-soft border border-slate-200 flex flex-col ${
                  isMobile ? 'min-h-[calc(100vh-80px)] rounded-none' : 'rounded-2xl h-[800px]'
                }`}
              >
                {/* Chat Header */}
                <div className="p-4 lg:p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Bot className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm lg:text-base">AI Tutor</h3>
                        <p className="text-xs lg:text-sm text-slate-600">
                          {getCurrentTutorType()?.name || 'Ready to help you learn'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs lg:text-sm text-slate-600">Online</span>
                      {isLoading && (
                        <motion.button
                          onClick={cancelRequest}
                          className="ml-2 px-3 py-1 text-xs bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancel
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div 
                  className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4"
                  onClick={closeSidebarOnMobile}
                >
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className={`flex gap-2 lg:gap-3 ${
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.type === 'bot' && (
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                          </div>
                        )}
                        
                        <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${message.type === 'user' ? 'order-2' : ''}`}>
                          <div className={`p-3 lg:p-4 rounded-2xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : message.isError
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            <div className="prose prose-sm max-w-none">
                              {message.type === 'bot' ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight]}
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="text-base lg:text-xl font-bold mb-2 lg:mb-3" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-sm lg:text-lg font-semibold mb-2" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-sm lg:text-base font-medium mb-2" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-2 leading-relaxed text-xs lg:text-sm" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 text-xs lg:text-sm" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 text-xs lg:text-sm" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                    code: ({node, inline, ...props}) => 
                                      inline ? (
                                        <code className="bg-slate-200 px-1 py-0.5 rounded text-xs" {...props} />
                                      ) : (
                                        <code className="block bg-slate-800 text-white p-2 lg:p-3 rounded-lg text-xs overflow-x-auto" {...props} />
                                      ),
                                    pre: ({node, ...props}) => <pre className="bg-slate-800 text-white p-2 lg:p-3 rounded-lg text-xs overflow-x-auto mb-2" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic mb-2 text-xs lg:text-sm" {...props} />,
                                    table: ({node, ...props}) => <table className="w-full border-collapse border border-slate-300 mb-2 text-xs" {...props} />,
                                    th: ({node, ...props}) => <th className="border border-slate-300 bg-slate-100 p-1 lg:p-2 text-left text-xs" {...props} />,
                                    td: ({node, ...props}) => <td className="border border-slate-300 p-1 lg:p-2 text-xs" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                                    em: ({node, ...props}) => <em className="italic" {...props} />
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              ) : (
                                <div className="whitespace-pre-wrap leading-relaxed text-white text-sm">
                                  {message.content}
                                </div>
                              )}
                            </div>
                            {message.metadata && (
                              <div className="mt-3 pt-3 border-t border-slate-200 text-xs opacity-75">
                                <div className="flex flex-wrap gap-2 lg:gap-3">
                                  <span>Content: {message.metadata.content_length} chars</span>
                                  {message.metadata.content_source && (
                                    <span>Source: {message.metadata.content_source.replace('_', ' ')}</span>
                                  )}
                                  {message.metadata.file_uploaded && (
                                    <span className="text-green-600">File processed</span>
                                  )}
                                  <span>Mode: {message.metadata.processing_mode?.replace('_', ' ')}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                              {message.tutorType && (
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                                  {tutorTypes.find(t => t.id === message.tutorType)?.name || message.tutorType}
                                </span>
                              )}
                              {message.hasContent && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                  With Content
                                </span>
                              )}
                            </div>
                            
                            {message.type === 'bot' && !message.isError && (
                              <div className="flex items-center gap-1">
                                <motion.button
                                  onClick={() => rateMessage(message.id, 'up')}
                                  className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                                    message.rating === 'up' ? 'text-green-600' : 'text-slate-400'
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Helpful"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </motion.button>
                                <motion.button
                                  onClick={() => rateMessage(message.id, 'down')}
                                  className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                                    message.rating === 'down' ? 'text-red-600' : 'text-slate-400'
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Not helpful"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </motion.button>
                                <motion.button
                                  onClick={() => copyMessage(message.content)}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Copy message"
                                >
                                  <Copy className="w-3 h-3" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>

                        {message.type === 'user' && (
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Loading Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 lg:gap-3 justify-start"
                    >
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Bot className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                      </div>
                      <div className="bg-slate-100 p-3 lg:p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-xs lg:text-sm text-slate-600">
                            AI is analyzing and generating response...
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Processing {uploadedFile ? `file: ${uploadedFile.name}` : 'your request'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-3 lg:p-6 border-t border-slate-200 bg-white">
                  <div className="space-y-2 lg:space-y-3">
                    <div className="flex items-end gap-2 lg:gap-4">
                      <div className="flex-1">
                        {renderInputField()}
                      </div>
                      
                      <motion.button
                        type="button"
                        onClick={handleVoiceInput}
                        disabled={!recognition}
                        className={`p-2 lg:p-3 rounded-xl transition-all duration-200 ${
                          isListening 
                            ? 'bg-red-500 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                        whileHover={{ scale: recognition && !isListening ? 1.05 : 1 }}
                        whileTap={{ scale: recognition && !isListening ? 0.95 : 1 }}
                        title={recognition ? (isListening ? 'Stop listening' : 'Start voice input') : 'Voice input not supported'}
                      >
                        {isListening ? <MicOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Mic className="w-4 h-4 lg:w-5 lg:h-5" />}
                      </motion.button>
                      
                      <motion.button
                        type="submit"
                        disabled={!getCurrentInputValue()?.trim() || isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 lg:p-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ 
                          scale: getCurrentInputValue()?.trim() && !isLoading ? 1.05 : 1 
                        }}
                        whileTap={{ 
                          scale: getCurrentInputValue()?.trim() && !isLoading ? 0.95 : 1 
                        }}
                        title={
                          !getCurrentInputValue()?.trim() ? 'Enter your input' :
                          getCurrentTutorType()?.requiresContent && !contentText && !uploadedFile ? 'Content required for this mode' :
                          isLoading ? 'Processing...' : 'Send message'
                        }
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <Send className="w-4 h-4 lg:w-5 lg:h-5" />}
                      </motion.button>
                    </div>
                    
                    {/* Helper text */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {tutorType === 'explanation' ? 'Press Enter to send, Shift+Enter for new line' : 'Press Enter to send'}
                      </span>
                      <div className="flex items-center gap-2">
                        {getCurrentTutorType()?.requiresContent && !contentText && !uploadedFile && (
                          <span className="text-orange-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Content required
                          </span>
                        )}
                        {(contentText || uploadedFile) && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Content ready
                          </span>
                        )}
                        {!getCurrentTutorType()?.requiresContent && !contentText && !uploadedFile && (
                          <span className="text-blue-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            General knowledge mode
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current settings display */}
                    <div className="flex items-center gap-2 lg:gap-4 text-xs text-slate-500 flex-wrap">
                      <span>Mode: {getCurrentTutorType()?.name}</span>
                      <span>•</span>
                      <span>Level: {difficultyLevel}</span>
                      <span>•</span>
                      <span>Language: {language}</span>
                      {uploadedFile && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 truncate max-w-32">File: {uploadedFile.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          body.sidebar-open {
            overflow: hidden;
          }
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .markdown-content {
          color: inherit;
        }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          color: inherit;
          margin-top: 0;
        }
        .markdown-content p {
          margin-top: 0;
        }
        .markdown-content pre {
          background-color: #1f2937 !important;
        }
        .markdown-content code {
          background-color: #f1f5f9;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .markdown-content blockquote {
          margin: 0;
        }
        .markdown-content table {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}

export default AITutorPage