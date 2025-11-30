'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown,
  Lightbulb,
  Bug,
  Zap,
  Users,
  BookOpen,
  Smartphone,
  Monitor,
  Tablet,
  Star,
  MessageSquare,
  Heart,
  Upload,
  X,
  Award,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import axios from 'axios'
import toast from 'react-hot-toast'

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    overallRating: 0,
    feedbackType: '',
    websiteWorking: '',
    expectations: '',
    suggestions: '',
    improvements: '',
    missingFeatures: '',
    userExperience: '',
    performance: '',
    additionalComments: '',
    deviceType: '',
    allowContact: false,
    screenshots: []
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  

  const API_BASE_URL=process.env.NEXT_PUBLIC_API_BASE_URL 

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files) => {
    if (!files) return
    
    setFormData(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, ...Array.from(files)]
    }))
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }))
  }

  const uploadScreenshots = async (files) => {
    try {
      if (!files || files.length === 0) {
        return []
      }

      const formDataUpload = new FormData()
      Array.from(files).forEach(file => {
        formDataUpload.append('files', file)
      })

      const response = await axios.post(`${API_BASE_URL}/api/feedback/upload-screenshots`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for file uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
          console.log(`Upload progress: ${percentCompleted}%`)
        },
      })

      return response.data.file_paths || []
    } catch (error) {
      console.error('Error uploading screenshots:', error)
      throw new Error(
        error.response?.data?.detail || 
        'Failed to upload screenshots. Please try again.'
      )
    }
  }

  const submitFeedback = async (feedbackData) => {
    try {
      console.log('Submitting feedback:', feedbackData)
      
      const response = await axios.post(`${API_BASE_URL}/api/feedback/`, {
        name: feedbackData.name || null,
        email: feedbackData.email || null,
        overall_rating: feedbackData.overallRating,
        user_type: feedbackData.userType || null,
        usage_frequency: feedbackData.usageFrequency || null,
        primary_use_case: feedbackData.primaryUseCase || null,
        device_type: feedbackData.deviceType || null,
        browser_type: feedbackData.browserType || null,
        feedback_type: feedbackData.feedbackType || null,
        website_working: feedbackData.websiteWorking || null,
        expectations: feedbackData.expectations || null,
        suggestions: feedbackData.suggestions || null,
        improvements: feedbackData.improvements || null,
        missing_features: feedbackData.missingFeatures || null,
        user_experience: feedbackData.userExperience || null,
        performance: feedbackData.performance || null,
        additional_comments: feedbackData.additionalComments || null,
        allow_contact: feedbackData.allowContact || false,
        screenshots: feedbackData.screenshotPaths || []
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })
      
      return response.data
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw new Error(
        error.response?.data?.detail || 
        'Failed to submit feedback. Please try again.'
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setUploadProgress(0)
    
    try {
      // Validate required fields
      if (!formData.overallRating) {
        throw new Error('Please provide an overall rating')
      }

      let screenshotPaths = []
      
      // Upload files first if any
      if (formData.screenshots && formData.screenshots.length > 0) {
        try {
          screenshotPaths = await uploadScreenshots(formData.screenshots)
          toast.success('Screenshots uploaded successfully!')
        } catch (uploadError) {
          // Continue without screenshots if upload fails
          console.warn('Screenshot upload failed, continuing without screenshots:', uploadError)
          toast.warning('Screenshots upload failed, but feedback will be submitted without them.')
        }
      }
      
      // Add screenshot paths to feedback data
      const feedbackWithScreenshots = {
        ...formData,
        screenshotPaths
      }
      
      // Submit feedback
      const result = await submitFeedback(feedbackWithScreenshots)
      
      console.log('Feedback submitted successfully:', result)
      toast.success('Feedback submitted successfully! Thank you for your input.')
      setIsSubmitted(true)
    } catch (error) {
      console.error('Submission error:', error)
      
      let errorMessage = 'Failed to submit feedback. Please try again.'
      
      // Handle different types of errors
      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data
        
        switch (status) {
          case 400:
            errorMessage = errorData?.detail || 'Invalid request. Please check your input.'
            break
          case 422:
            // Handle validation errors
            if (errorData?.errors) {
              if (Array.isArray(errorData.errors)) {
                errorMessage = errorData.errors.join(', ')
              } else if (typeof errorData.errors === 'object') {
                const errorMessages = Object.values(errorData.errors).flat()
                errorMessage = errorMessages.join(', ')
              } else {
                errorMessage = errorData.message || 'Please check your input.'
              }
            } else {
              errorMessage = errorData?.detail || errorData?.message || 'Invalid input data.'
            }
            break
          case 429:
            errorMessage = 'Too many requests. Please try again later.'
            break
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Server error. Please try again later.'
            break
          default:
            errorMessage = errorData?.detail || errorData?.message || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The server is taking too long to respond.'
      } else {
        errorMessage = error.message || errorMessage
      }
      
      setSubmitError(errorMessage)
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const StarRating = ({ rating, onRatingChange }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="w-8 h-8 transition-all duration-200 hover:scale-110 focus:outline-none"
            aria-label={`Rate ${star} star`}
          >
            <Star 
              className={`w-full h-full ${
                star <= rating 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'from-red-500 to-red-600' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'from-blue-500 to-blue-600' },
    { value: 'improvement', label: 'Improvement Suggestion', icon: Zap, color: 'from-green-500 to-green-600' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'from-purple-500 to-purple-600' }
  ]

  const deviceTypes = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'laptop', label: 'Laptop', icon: Monitor },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'mobile', label: 'Mobile', icon: Smartphone }
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="w-20 h-20 md:w-24 md:h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Thank You!</h1>
            <p className="text-lg md:text-xl text-slate-600 mb-6">
              Your feedback has been submitted successfully. We truly appreciate you taking the time to help us improve QuizerAI.
            </p>
            
            <div className="bg-blue-50 rounded-2xl p-4 md:p-6 mb-8">
              <Award className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-md md:text-lg font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-blue-700 space-y-2 text-left text-sm md:text-base">
                <li>• Our team will review your feedback within 24-48 hours</li>
                <li>• We&lsquoll prioritize your suggestions for future updates</li>
                <li>• You&lsquoll receive updates if you opted for contact</li>
                <li>• Your input helps shape the future of QuizerAI</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setSubmitError('')
                  setFormData({
                    name: '',
                    email: '',
                    overallRating: 0,
                    feedbackType: '',
                    websiteWorking: '',
                    expectations: '',
                    suggestions: '',
                    improvements: '',
                    missingFeatures: '',
                    userExperience: '',
                    performance: '',
                    additionalComments: '',
                    deviceType: '',
                    allowContact: false,
                    screenshots: []
                  })
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 md:px-8 md:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Submit Another Feedback
              </button>
              <a
                href="/dashboard"
                className="bg-slate-100 text-slate-700 px-6 py-3 md:px-8 md:py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 text-center"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div>
      <Header></Header>
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="py-8 md:py-12 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Share Your Feedback
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Help us improve QuizerAI by sharing your thoughts, suggestions, and experience. 
            Your feedback drives our innovation and helps us build a better learning platform.
          </p>
        </motion.div>
      </div>

      {/* Feedback Form */}
      <div className="px-4 pb-8 md:pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-12"
          >
            {/* Error Message */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-semibold">Submission Error</h4>
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              </motion.div>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-blue-800 font-semibold">Uploading screenshots... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="name" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Overall Rating */}
              <div className="text-center bg-slate-50 rounded-2xl p-4 md:p-6">
                <label className="block text-md md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">
                  How would you rate your overall experience with QuizerAI? <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center mb-2 md:mb-3">
                  <StarRating 
                    rating={formData.overallRating}
                    onRatingChange={(rating) => handleInputChange('overallRating', rating)}
                  />
                </div>
                <div className="text-sm text-slate-600">
                  {formData.overallRating === 1 && "Poor - Needs significant improvement"}
                  {formData.overallRating === 2 && "Fair - Has potential but issues exist"}
                  {formData.overallRating === 3 && "Good - Generally satisfied"}
                  {formData.overallRating === 4 && "Great - Very pleased with the experience"}
                  {formData.overallRating === 5 && "Excellent - Exceeds expectations"}
                </div>
              </div>

              {/* Feedback Type */}
              <div>
                <label className="block text-md md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">
                  What type of feedback is this?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('feedbackType', type.value)}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.feedbackType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      aria-label={`Select ${type.label} feedback type`}
                    >
                      <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                        <type.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div className="font-semibold text-slate-800 text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Feedback Sections */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* How is the website working */}
                <div>
                  <label htmlFor="websiteWorking" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    How is our website working for you?
                  </label>
                  <textarea
                    id="websiteWorking"
                    value={formData.websiteWorking}
                    onChange={(e) => handleInputChange('websiteWorking', e.target.value)}
                    placeholder="Tell us about your experience using QuizerAI - what is working well, what is not working, any issues you have encountered..."
                    rows={4}
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  />
                </div>

                {/* Expectations vs Reality */}
                <div>
                  <label htmlFor="expectations" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    What were your expectations vs. reality?
                  </label>
                  <textarea
                    id="expectations"
                    value={formData.expectations}
                    onChange={(e) => handleInputChange('expectations', e.target.value)}
                    placeholder="What did you expect from QuizerAI when you first started using it? How does the reality compare to your expectations?"
                    rows={4}
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Suggestions for improvement */}
                <div>
                  <label htmlFor="suggestions" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    What suggestions do you have for improvement?
                  </label>
                  <textarea
                    id="suggestions"
                    value={formData.suggestions}
                    onChange={(e) => handleInputChange('suggestions', e.target.value)}
                    placeholder="Share your ideas on how we can make QuizerAI better - new features, design changes, functionality improvements..."
                    rows={4}
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  />
                </div>

                {/* User Experience */}
                <div>
                  <label htmlFor="userExperience" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    How was your user experience?
                  </label>
                  <textarea
                    id="userExperience"
                    value={formData.userExperience}
                    onChange={(e) => handleInputChange('userExperience', e.target.value)}
                    placeholder="Tell us about your journey using our platform - was it intuitive, confusing, enjoyable? What stood out to you?"
                    rows={4}
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Missing Features */}
                <div>
                  <label htmlFor="missingFeatures" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    What features are you missing?
                  </label>
                  <textarea
                    id="missingFeatures"
                    value={formData.missingFeatures}
                    onChange={(e) => handleInputChange('missingFeatures', e.target.value)}
                    placeholder="What features would you like to see that we do not currently offer? What would make your learning experience even better?"
                    rows={3}
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  />
                </div>

                {/* Performance Feedback */}
                <div>
                  <label htmlFor="performance" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                    How is the website performance?
                  </label>
                  <textarea
                    id="performance"
                    value={formData.performance}
                    onChange={(e) => handleInputChange('performance', e.target.value)}
                    placeholder="How fast does the website load? Any lag or slowness? Does everything respond quickly to your actions?"
                    rows={3}
                    className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Additional Comments */}
              <div>
                <label htmlFor="additionalComments" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                  Any additional thoughts or comments?
                </label>
                <textarea
                  id="additionalComments"
                  value={formData.additionalComments}
                  onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                  placeholder="Anything else you would like us to know? Compliments, concerns, or ideas you have not mentioned yet..."
                  rows={3}
                  className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                />
              </div>

              {/* Device Type */}
              <div>
                <label className="block text-md md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">
                  Which device are you primarily using?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {deviceTypes.map((device) => (
                    <button
                      key={device.value}
                      type="button"
                      onClick={() => handleInputChange('deviceType', device.value)}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        formData.deviceType === device.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      aria-label={`Select ${device.label} device type`}
                    >
                      <device.icon className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mx-auto mb-2" />
                      <span className="font-semibold text-slate-800 text-sm md:text-base">{device.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file-upload" className="block text-md md:text-lg font-semibold text-slate-800 mb-2 md:mb-3">
                  Screenshots or Images (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 md:p-6 text-center hover:border-blue-400 transition-colors duration-200">
                  <Upload className="w-10 h-10 md:w-12 md:h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 mb-2 text-sm md:text-base">
                    Add screenshots to help us understand your feedback better
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors duration-200 inline-block text-sm md:text-base"
                  >
                    Choose Files
                  </label>
                </div>
                
                {formData.screenshots.length > 0 && (
                  <div className="mt-3 md:mt-4 space-y-2">
                    {formData.screenshots.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-100 rounded-lg p-2 md:p-3">
                        <span className="text-xs md:text-sm text-slate-700 truncate max-w-[180px] md:max-w-none">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Permission */}
              <div className="bg-blue-50 rounded-2xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allow-contact"
                    checked={formData.allowContact}
                    onChange={(e) => handleInputChange('allowContact', e.target.checked)}
                    className="mt-1 w-4 h-4 md:w-5 md:h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="allow-contact" className="font-semibold text-slate-800 cursor-pointer text-sm md:text-base">
                      Allow us to contact you about this feedback
                    </label>
                    <p className="text-xs md:text-sm text-slate-600 mt-1">
                      We may reach out for clarification or to update you on improvements based on your feedback.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4 md:pt-6">
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !formData.overallRating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 md:px-12 md:py-4 rounded-xl font-semibold text-base md:text-lg flex items-center justify-center gap-3 mx-auto hover:shadow-lg transition-all duration-200 disabled:opacity-70 min-w-[180px] md:min-w-[200px]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </motion.button>
                
                {!formData.overallRating && (
                  <p className="text-red-500 text-sm mt-2">* Overall rating is required</p>
                )}
              </div>
            </form>
          </motion.div>

          {/* Bottom Info Cards */}
          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 text-center">
              <Heart className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Your Voice Matters</h3>
              <p className="text-slate-600 text-xs md:text-sm">
                Every piece of feedback helps us build a better learning experience for everyone.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 text-center">
              <Zap className="w-10 h-10 md:w-12 md:h-12 text-blue-500 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Quick Response</h3>
              <p className="text-slate-600 text-xs md:text-sm">
                We review all feedback within 24-48 hours and prioritize improvements accordingly.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 text-center">
              <Award className="w-10 h-10 md:w-12 md:h-12 text-green-500 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Recognition</h3>
              <p className="text-slate-600 text-xs md:text-sm">
                Top contributors get special recognition and early access to new features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer></Footer>
    </div>
  )
}

export default FeedbackPage








