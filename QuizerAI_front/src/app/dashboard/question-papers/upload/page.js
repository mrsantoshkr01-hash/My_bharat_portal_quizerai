'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon,
  CheckCircle,
  X,
  Eye,
  Zap,
  Settings,
  Clock,
  Target,
  AlertTriangle,
  Loader2,
  Download,
  Save,
  Play,
  Database,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'
import axios from 'axios'
import Footer from '@/components/layout/Footer'

const UploadQuestionPaperPage = () => {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedQuestions, setExtractedQuestions] = useState([])
  const [extractedMetadata, setExtractedMetadata] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedPaperId, setSavedPaperId] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    examType: '',
    year: new Date().getFullYear(),
    difficulty: 'medium',
    timeLimit: 180,
    instructions: '',
    isPublic: false,
    generateAnswers: true
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'History', 'Geography', 'Economics', 'Computer Science', 'General Studies'
  ]

  const examTypes = [
    'JEE Main', 'JEE Advanced', 'NEET', 'SAT', 'ACT', 'CBSE Board',
    'ICSE Board', 'UPSC', 'SSC', 'Bank PO', 'CAT', 'GATE', 'Other'
  ]

  const handleFileUpload = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = selectedFiles.filter(file => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum 50MB allowed.`)
        return false
      }
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid file type. Only PDF and images allowed.`)
        return false
      }
      
      return true
    })

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))])
  }, [])

  const removeFile = useCallback((id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const handleExtractQuestions = async (e) => {
    e.preventDefault()
    setIsProcessing(true)
    setStep(3) // Move to processing step

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.subject.trim()) {
        throw new Error('Subject is required')
      }
      if (files.length === 0) {
        throw new Error('At least one file is required')
      }

      // Create form data
      const uploadFormData = new FormData()
      
      // Add files
      files.forEach(fileObj => {
        uploadFormData.append('files', fileObj.file)
      })
      
      // Add form fields
      uploadFormData.append('title', formData.title.trim())
      uploadFormData.append('subject', formData.subject.trim())
      if (formData.examType) uploadFormData.append('exam_type', formData.examType)
      if (formData.year) uploadFormData.append('year', formData.year.toString())
      uploadFormData.append('difficulty', formData.difficulty)
      uploadFormData.append('time_limit', formData.timeLimit.toString())
      if (formData.instructions) uploadFormData.append('instructions', formData.instructions.trim())
      uploadFormData.append('is_public', formData.isPublic.toString())
      uploadFormData.append('generate_answers', formData.generateAnswers.toString())

      // Extract questions from question paper
      const response = await axios.post(`${API_BASE_URL}/api/question-papers/upload`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minutes timeout
      })
      
      if (response.data && response.data.result === 'quiz' && response.data.data) {
        console.log(response.data.data)
        setExtractedQuestions(response.data.data)
        setExtractedMetadata(response.data.metadata)
        setStep(4) // Move to review step
        toast.success(`Successfully extracted ${response.data.extracted_questions_count} questions!`)
      } else {
        throw new Error('Invalid response format from server')
      }
      
    } catch (error) {
      console.error('Error extracting questions:', error)
      toast.error(error.response?.data?.detail || error.message || 'Failed to extract questions')
      setStep(2) // Go back to configuration step
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (isSaving) return
    
    setIsSaving(true)
    
    try {
      const saveData = {
        questions: extractedQuestions,
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        exam_type: formData.examType || null,
        year: formData.year,
        difficulty: formData.difficulty,
        time_limit: formData.timeLimit,
        instructions: formData.instructions.trim() || null,
        is_public: formData.isPublic
      }

      const response = await axios.post(`${API_BASE_URL}/api/question-papers/save`, saveData)
      
      if (response.data && response.data.paper_id) {
        setSavedPaperId(response.data.paper_id)
        toast.success('Question paper saved successfully!')
      } else {
        throw new Error('Failed to save question paper')
      }
      
    } catch (error) {
      console.error('Error saving question paper:', error)
      toast.error(error.response?.data?.detail || 'Failed to save question paper')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTakeQuizDirectly = () => {
    // Generate temporary quiz ID and store questions in localStorage
    const tempQuizId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Transform questions to match quiz format
    const quizData = extractedQuestions.map(q => ({
      question: q.question,
      options: q.options || [],
      answer: q.answer,
      explanation: q.explanation,
      type: q.type
    }))
    
    // Store in localStorage
    localStorage.setItem(`quiz_${tempQuizId}`, JSON.stringify(quizData))
    
    // Navigate to quiz
    router.push(`/quiz/${tempQuizId}`)
  }

  const handleTakeSavedQuiz = () => {
    if (savedPaperId) {
      // Navigate to saved quiz
      router.push(`/quiz/${savedPaperId}`)
    }
  }

  const handleReset = () => {
    setStep(1)
    setFiles([])
    setIsProcessing(false)
    setExtractedQuestions([])
    setExtractedMetadata({})
    setIsSaving(false)
    setSavedPaperId(null)
    setFormData({
      title: '',
      subject: '',
      examType: '',
      year: new Date().getFullYear(),
      difficulty: 'medium',
      timeLimit: 180,
      instructions: '',
      isPublic: false,
      generateAnswers: true
    })
  }

  const renderStepIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-center space-x-8">
        {[
          { number: 1, label: 'Upload', icon: Upload },
          { number: 2, label: 'Configure', icon: Settings },
          { number: 3, label: 'Extract', icon: Zap },
          { number: 4, label: 'Review', icon: Eye }
        ].map((stepItem, index) => (
          <div key={stepItem.number} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              step >= stepItem.number 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                : 'bg-slate-200 text-slate-600'
            }`}>
              <stepItem.icon className="w-5 h-5" />
            </div>
            <span className={`ml-2 font-medium ${
              step >= stepItem.number ? 'text-slate-800' : 'text-slate-500'
            }`}>
              {stepItem.label}
            </span>
            {index < 3 && (
              <div className={`w-8 h-0.5 mx-4 transition-all duration-300 ${
                step > stepItem.number ? 'bg-blue-600' : 'bg-slate-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )

  const renderUploadStep = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Upload Question Paper</h2>
        <p className="text-lg text-slate-600">Upload PDF files or high-quality images of question papers</p>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center mb-8 hover:border-blue-400 transition-colors duration-200">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-slate-600 mb-6">
            Supports PDF, JPG, PNG files up to 50MB each
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            Choose Files
          </label>
        </div>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-slate-800">Uploaded Files ({files.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((fileObj) => (
              <motion.div
                key={fileObj.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  {fileObj.file.type === 'application/pdf' ? (
                    <FileText className="w-6 h-6 text-white" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{fileObj.file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {fileObj.preview && (
                  <button 
                    onClick={() => window.open(fileObj.preview)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                  </button>
                )}
                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <motion.button
          onClick={() => setStep(2)}
          disabled={files.length === 0}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: files.length > 0 ? 1.05 : 1, y: files.length > 0 ? -2 : 0 }}
          whileTap={{ scale: files.length > 0 ? 0.95 : 1 }}
        >
          Continue to Configuration
        </motion.button>
      </div>
    </div>
  )

  const renderConfigStep = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Configure Question Paper</h2>
        <p className="text-lg text-slate-600">Provide details about your question paper</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setStep(3) }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paper Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="e.g., JEE Main 2023 Physics Paper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject *
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
              className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="">Select subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exam Type
            </label>
            <select
              value={formData.examType}
              onChange={(e) => setFormData(prev => ({ ...prev, examType: e.target.value }))}
              className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="">Select exam type</option>
              {examTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Year
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              min="2000"
              max={new Date().getFullYear()}
              className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
              min="30"
              max="300"
              className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Instructions (Optional)
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
            rows="4"
            className="w-full p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="Any special instructions for students..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-800">Make Public</div>
              <div className="text-sm text-slate-600">Allow other users to discover and practice this paper</div>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.isPublic ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: formData.isPublic ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <motion.button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 border-2 border-slate-300 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
          <motion.button
            onClick={handleExtractQuestions}
            type="button"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Extract Questions
          </motion.button>
        </div>
      </form>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-4">
        Extracting Questions...
      </h2>

      <p className="text-lg text-slate-600 mb-8">
        Our AI is analyzing your question paper and extracting questions
      </p>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-8 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-slate-700">Reading uploaded files...</span>
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            <span className="text-slate-700">Extracting text content...</span>
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            <span className="text-slate-700">Identifying questions...</span>
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
            <span className="text-slate-700">Generating answers...</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        This may take a few minutes depending on the file size
      </p>
    </div>
  )

  const renderReviewStep = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Review Extracted Questions</h2>
        <p className="text-lg text-slate-600">
          {extractedQuestions.length} questions extracted successfully
        </p>
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">What would you like to do?</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            onClick={handleTakeQuizDirectly}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-5 h-5" />
            Take Quiz Immediately
          </motion.button>
          
          <motion.button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            whileHover={{ scale: !isSaving ? 1.02 : 1, y: !isSaving ? -2 : 0 }}
            whileTap={{ scale: !isSaving ? 0.98 : 1 }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Save to Database
              </>
            )}
          </motion.button>
        </div>

        {savedPaperId && (
          <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Saved Successfully!</span>
            </div>
            <p className="text-green-700 text-sm mb-3">
              Paper ID: {savedPaperId}
            </p>
            <motion.button
              onClick={handleTakeSavedQuiz}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Take Saved Quiz
            </motion.button>
          </div>
        )}
      </div>

      {/* Questions Preview */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Questions Preview</h3>
        <div className="max-h-96 overflow-y-auto space-y-4">
          {extractedQuestions.map((question, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full flex-shrink-0">
                  Q{index + 1}
                </span>
                <div className="flex-1">
                  <h4 className="text-slate-800 font-semibold mb-4">
                    {question.question}
                  </h4>

                  {question.options && Array.isArray(question.options) && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => {
                        const isCorrect = question.answer === option
                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg border ${
                              isCorrect
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                              <span className={`${
                                isCorrect ? 'text-green-800 font-semibold' : 'text-slate-700'
                              }`}>
                                {option}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <motion.button
          onClick={handleReset}
          className="flex-1 border-2 border-slate-300 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Upload New Paper
        </motion.button>
        <motion.button
          onClick={() => router.push('/dashboard/question-papers')}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          View All Papers
        </motion.button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link href="/dashboard/question-papers" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Question Papers</span>
            </Link>
          </motion.div>

          {renderStepIndicator()}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && renderUploadStep()}
                {step === 2 && renderConfigStep()}
                {step === 3 && renderProcessingStep()}
                {step === 4 && renderReviewStep()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default UploadQuestionPaperPage