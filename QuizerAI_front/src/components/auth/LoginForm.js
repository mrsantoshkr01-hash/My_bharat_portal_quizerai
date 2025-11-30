'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { oauthService, endpoints } from '@/lib/api'
import axios from 'axios'
import toast from 'react-hot-toast'

const LoginForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [pendingOAuthData, setPendingOAuthData] = useState(null)
  const [focusedField, setFocusedField] = useState('')
  const { login: authLogin } = useAuth()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

    // Client-side validation
    if (!formData.email.trim()) {
      toast.error('Email is required', {
        position: "top-right",
        autoClose: 3000
      })
      return
    }

    if (!formData.password.trim()) {
      toast.error('Password is required', {
        position: "top-right",
        autoClose: 3000
      })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address', {
        position: "top-right",
        autoClose: 3000
      })
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long', {
        position: "top-right",
        autoClose: 3000,
      })
      return
    }

    setLoading(true)

    try {
      // Clean the data before sending as JSON
      const cleanedData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        remember_me: formData.rememberMe
      }

      // Make API call with JSON data
      const response = await axios.post(`${API_BASE_URL}/auth_auth/login`, cleanedData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000,
      })

      // Handle successful login
      if (response.data.access_token || response.status === 200) {
        // Check if MFA is required
        if (response.data.mfa_required) {
          toast.info('MFA verification required', {
            position: "top-right",
            autoClose: 4000,
          })
          // Store temporary token and redirect to MFA page
          if (response.data.access_token) {
            localStorage.setItem('tempAuthToken', response.data.access_token)
          }
          // Handle MFA flow here (redirect to MFA page)
          return
        }

        // Normal login success
        const userRole = response.data.user?.role
        const userName = response.data.user?.full_name || response.data.user?.username

        toast.success(`Welcome back${userName ? ', ' + userName.split(' ')[0] : ''}!`, {
          position: "top-right",
          autoClose: 3000,
        })

        // Store authentication data
        if (response.data.access_token) {
          localStorage.setItem('authToken', response.data.access_token)

          // Set token expiry if remember me is checked
          if (formData.rememberMe) {
            const expiryDate = new Date()
            expiryDate.setDate(expiryDate.getDate() + 30) // 30 days
            localStorage.setItem('tokenExpiry', expiryDate.toISOString())
          } else {
            // Set shorter expiry for session-only login
            const expiryDate = new Date()
            expiryDate.setHours(expiryDate.getHours() + 24) // 24 hours
            localStorage.setItem('tokenExpiry', expiryDate.toISOString())
          }
        }

        // Store refresh token if provided
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token)
        }

        // Store user data if provided
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user))
        }

        // Call auth provider login method
        if (authLogin) {
          try {
            await authLogin(formData.email, formData.password)
          } catch (authError) {
            console.warn('Auth provider login failed, but token login succeeded:', authError)
          }
        }

        // Reset form
        setFormData({
          email: '',
          password: '',
          rememberMe: false
        })

        // Role-based redirection
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect')

        if (redirectUrl) {
          // If there's a redirect URL, use it
          router.push(decodeURIComponent(redirectUrl))
        } else {
          // Default role-based redirection
          switch (userRole) {
            case 'teacher':
              router.push('/teacher_dashboard')
              break
            case 'student':
              router.push('/dashboard')
              break
            case 'admin':
              router.push('/admin_dashboard')
              break
            case 'institution':
              router.push('/institution_dashboard')
              break
            default:
              // Fallback for any other roles or undefined role
              router.push('/dashboard')
          }
        }
      }
    } catch (error) {
      console.error('Login error details:', error)

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const errorData = error.response.data

        let errorMessage = 'Login failed. Please try again.'

        // Handle specific error statuses
        switch (status) {
          case 400:
            errorMessage = errorData?.detail || 'Invalid request. Please check your input.'
            break
          case 401:
            errorMessage = 'Invalid email or password. Please check your credentials.'
            break
          case 403:
            errorMessage = 'Account is disabled or suspended. Please contact support.'
            break
          case 404:
            errorMessage = 'Login service not found. Please try again later.'
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
            errorMessage = 'Too many login attempts. Please try again later.'
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

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        })

      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request)
        toast.error('Network error. Please check your internet connection and try again.', {
          position: "top-right",
          autoClose: 4000,
        })
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        toast.error('Request timeout. The server is taking too long to respond.', {
          position: "top-right",
          autoClose: 4000,
        })
      } else {
        // Other error
        console.error('Unexpected error:', error.message)
        toast.error('An unexpected error occurred. Please try again.', {
          position: "top-right",
          autoClose: 4000,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Updated handleGoogleLogin function with better error handling
  const handleGoogleLogin = async () => {
    if (oauthLoading) return

    // console.log('Starting Google OAuth flow...')
    setOauthLoading(true)

    // Simulate loading


    let popup = null
    let cleanupMonitor = null

    try {
      // Get Google OAuth URL from backend
      // console.log('Requesting OAuth URL...')
      const response = await oauthService.initiateGoogleLogin()
      // console.log('OAuth response:', response)

      if (response.auth_url) {
        // console.log('Opening OAuth popup with URL:', response.auth_url)

        // Open OAuth popup
        popup = oauthService.openOAuthPopup(response.auth_url, 'google-oauth')

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.')
        }

        // Monitor popup for closure
        cleanupMonitor = oauthService.monitorPopupStatus(popup, () => {
          // console.log('Popup closed by user')
          setOauthLoading(false)
          toast.error('OAuth cancelled or popup closed', {
            position: "top-right",
            autoClose: 3000,
          })
        })

        // Listen for OAuth result
        // console.log('Waiting for OAuth result...')
        const result = await oauthService.listenForOAuthMessage()
        // console.log('OAuth result received:', result)

        // Cleanup and close popup
        if (cleanupMonitor) cleanupMonitor()
        if (popup && !popup.closed) popup.close()

        if (result) {
          // Check if this is a new user needing role selection
          if (result.needs_role_selection && result.temp_token) {
            // console.log('New user needs role selection')
            setPendingOAuthData({
              temp_token: result.temp_token,
              user_info: result.user_info,
              is_new_user: true
            })
            setShowRoleSelection(true)
            setOauthLoading(false)
            return
          }

          // Existing user - complete login immediately
          if (result.access_token) {
            // console.log('Existing user - completing login...')
            await completeOAuthLogin(result)
          } else {
            throw new Error('No access token received from OAuth')
          }
        } else {
          throw new Error('No result received from OAuth')
        }

      } else {
        throw new Error('No OAuth URL received from server')
      }

    } catch (error) {
      console.error('Google OAuth error:', error)

      // Cleanup
      if (cleanupMonitor) cleanupMonitor()
      if (popup && !popup.closed) popup.close()

      let errorMessage = 'Google sign-in failed. Please try again.'

      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 400:
            errorMessage = errorData?.detail || 'Invalid OAuth request'
            break
          case 401:
            errorMessage = 'OAuth authentication failed'
            break
          case 403:
            errorMessage = 'OAuth access denied'
            break
          case 429:
            errorMessage = 'Too many OAuth attempts. Please try again later.'
            break
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'OAuth service temporarily unavailable'
            break
          default:
            errorMessage = errorData?.detail || errorData?.message || errorMessage
        }
      } else if (error.message) {
        if (error.message.includes('Popup blocked')) {
          errorMessage = 'Popup blocked. Please allow popups and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'OAuth authentication timed out. Please try again.'
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.'
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      })
    } finally {
      setOauthLoading(false)
    }
  }

  const completeOAuthLogin = async (result) => {
    try {
      // Handle successful OAuth login
      const userRole = result.user?.role
      const userName = result.user?.full_name || result.user?.username

      toast.success(`Welcome${userName ? ', ' + userName.split(' ')[0] : ''}!`, {
        position: "top-right",
        autoClose: 3000,
      })

      // Store authentication data
      localStorage.setItem('authToken', result.access_token)

      if (result.refresh_token) {
        localStorage.setItem('refreshToken', result.refresh_token)
      }

      if (result.user) {
        localStorage.setItem('userData', JSON.stringify(result.user))
      }

      // Set token expiry (30 days for OAuth)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      localStorage.setItem('tokenExpiry', expiryDate.toISOString())

      // Call auth provider login method if available
      if (authLogin) {
        try {
          await authLogin(result.user.email, null, { isOAuth: true })
        } catch (authError) {
          console.warn('Auth provider login failed, but OAuth login succeeded:', authError)
        }
      }

      // Role-based redirection
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect')

      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl))
      } else {
        switch (userRole) {
          case 'teacher':
            router.push('/teacher_dashboard')
            break
          case 'student':
            router.push('/dashboard')
            break
          case 'admin':
            router.push('/admin_dashboard')
            break
          case 'institution':
            router.push('/institution_dashboard')
            break
          default:
            router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error completing OAuth login:', error)
      throw error
    }
  }

  const handleRoleSelection = async (selectedRole) => {
    if (!pendingOAuthData || !pendingOAuthData.temp_token) return

    setOauthLoading(true)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

      // Send role selection to backend
      const response = await axios.post(`${API_BASE_URL}/oauth/complete-registration`, {
        temp_token: pendingOAuthData.temp_token,
        role: selectedRole
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000,
      })

      if (response.data.access_token) {
        // Complete login with role assigned
        await completeOAuthLogin(response.data)

        // Reset states
        setShowRoleSelection(false)
        setPendingOAuthData(null)
      } else {
        throw new Error('Failed to complete registration with role selection')
      }

    } catch (error) {
      console.error('Role selection error:', error)

      let errorMessage = 'Failed to complete registration. Please try again.'

      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 400:
            if (errorData?.detail?.includes('expired')) {
              errorMessage = 'Registration session expired. Please sign in again with Google.'
              // Reset the flow
              setShowRoleSelection(false)
              setPendingOAuthData(null)
            } else {
              errorMessage = errorData?.detail || 'Invalid role selection'
            }
            break
          case 401:
            errorMessage = 'Registration session expired. Please sign in again.'
            setShowRoleSelection(false)
            setPendingOAuthData(null)
            break
          case 422:
            errorMessage = errorData?.detail || 'Invalid registration data'
            break
          case 500:
            errorMessage = 'Server error. Please try again later.'
            break
          default:
            errorMessage = errorData?.detail || errorData?.message || errorMessage
        }
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      })

      // Reset on error if session expired
      if (errorMessage.includes('expired') || errorMessage.includes('session')) {
        setShowRoleSelection(false)
        setPendingOAuthData(null)
      }
    } finally {
      setOauthLoading(false)
    }
  }

  // Rest of your component code remains the same...
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const getInputClasses = (fieldName, hasValue) => {
    const isFocused = focusedField === fieldName
    return `
      w-full pl-12 pr-4 py-4 
      border-2 rounded-xl
      bg-white/70 backdrop-blur-sm
      text-gray-800 placeholder-gray-400
      transition-all duration-300 ease-in-out
      focus:outline-none focus:ring-0
      shadow-sm hover:shadow-md
      ${isFocused
        ? 'border-blue-500 shadow-lg shadow-blue-500/25 bg-white'
        : 'border-gray-200 hover:border-gray-300'
      }
      ${hasValue
        ? 'border-green-300 bg-green-50/50'
        : ''
      }
    `
  }

  const getPasswordInputClasses = (fieldName, hasValue) => {
    const isFocused = focusedField === fieldName
    return `
      w-full pl-12 pr-12 py-4 
      border-2 rounded-xl
      bg-white/70 backdrop-blur-sm
      text-gray-800 placeholder-gray-400
      transition-all duration-300 ease-in-out
      focus:outline-none focus:ring-0
      shadow-sm hover:shadow-md
      ${isFocused
        ? 'border-blue-500 shadow-lg shadow-blue-500/25 bg-white'
        : 'border-gray-200 hover:border-gray-300'
      }
      ${hasValue
        ? 'border-green-300 bg-green-50/50'
        : ''
      }
    `
  }

  const RoleSelectionModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && setShowRoleSelection(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="text-center mb-6">
          {pendingOAuthData?.user_info && (
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                {pendingOAuthData.user_info.profile_picture ? (
                  <img
                    src={pendingOAuthData.user_info.profile_picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <span className="text-blue-600 text-xl font-bold">
                    {pendingOAuthData.user_info.full_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Welcome, {pendingOAuthData.user_info.full_name?.split(' ')[0] || 'there'}!
              </h3>
              <p className="text-slate-600 text-sm">{pendingOAuthData.user_info.email}</p>
            </div>
          )}
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Choose Your Role</h3>
          <p className="text-slate-600">Select your role to complete your registration</p>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={() => handleRoleSelection('student')}
            disabled={oauthLoading}
            className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: oauthLoading ? 1 : 1.02 }}
            whileTap={{ scale: oauthLoading ? 1 : 0.98 }}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Student</h4>
                <p className="text-sm text-slate-600">Take quizzes and track your progress</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => handleRoleSelection('teacher')}
            disabled={oauthLoading}
            className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-green-500 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: oauthLoading ? 1 : 1.02 }}
            whileTap={{ scale: oauthLoading ? 1 : 0.98 }}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Teacher</h4>
                <p className="text-sm text-slate-600">Create quizzes and manage classrooms</p>
              </div>
            </div>
          </motion.button>

          {/* Only show admin option if needed */}
          {process.env.NODE_ENV === 'development' && (
            <motion.button
              onClick={() => handleRoleSelection('admin')}
              disabled={oauthLoading}
              className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: oauthLoading ? 1 : 1.02 }}
              whileTap={{ scale: oauthLoading ? 1 : 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Administrator</h4>
                  <p className="text-sm text-slate-600">Manage platform settings</p>
                </div>
              </div>
            </motion.button>
          )}
        </div>

        {oauthLoading && (
          <div className="mt-6 text-center">
            <div className="loading-dots">
              <div style={{ '--i': 0 }}></div>
              <div style={{ '--i': 1 }}></div>
              <div style={{ '--i': 2 }}></div>
            </div>
            <p className="text-slate-600 mt-2">Creating your account...</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setShowRoleSelection(false)
              setPendingOAuthData(null)
            }}
            disabled={oauthLoading}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <>
      {showRoleSelection && <RoleSelectionModal />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md mx-auto"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-600">Sign in to your QuizerAI account</p>
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' || formData.email ? 'text-blue-500' : 'text-gray-400'
                }`}>
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required
                autoComplete="email"
                className={getInputClasses('email', formData.email)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' || formData.password ? 'text-blue-500' : 'text-gray-400'
                }`}>
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required
                minLength={6}
                autoComplete="current-password"
                className={getPasswordInputClasses('password', formData.password)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors duration-200" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors duration-200" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              /> */}
              {/* <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-700">
                Remember me for 30 days
              </label> */}
            </div>
            {/* <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Forgot password?
            </Link> */}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <div className="loading-dots">
                <div style={{ '--i': 0 }}></div>
                <div style={{ '--i': 1 }}></div>
                <div style={{ '--i': 2 }}></div>
              </div>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Sign Up Link */}
        <motion.div variants={itemVariants} className="text-center mt-6">
          <p className="text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
            >
              Sign up for free
            </Link>
          </p>
        </motion.div>

        {/* Social Login */}
        {/* Enhanced Social Login */}
        <motion.div variants={itemVariants} className="mt-8">
          {/* Enhanced Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-600 font-medium rounded-full border border-blue-100 shadow-sm">
                Or continue with
              </span>
            </div>
          </div>

          {/* Enhanced Google Button */}
          <div className="mt-8 flex justify-center">
            <motion.button
              type="button"
              disabled={oauthLoading || loading}
              className="group relative w-full max-w-sm inline-flex justify-center items-center py-4 px-6 
                 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl
                 transform transition-all duration-300 ease-out
                 hover:scale-105 active:scale-95
                 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                 border border-blue-500/20"
              whileHover={{ scale: (oauthLoading || loading) ? 1 : 1.05 }}
              whileTap={{ scale: (oauthLoading || loading) ? 1 : 0.95 }}
              onClick={handleGoogleLogin}
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />

              {/* Button Content */}
              <div className="relative flex items-center">
                {oauthLoading ? (
                  <>
                    <div className="flex space-x-1 mr-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-lg">Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google Icon with enhanced styling */}
                    <div className="mr-3 p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Continue with Google</span>

                    {/* Arrow Icon */}
                    <ArrowRight className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </div>
            </motion.button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Secure authentication powered by Google</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

export default LoginForm