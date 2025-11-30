// RegisterForm.js with Google OAuth
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { oauthService } from '@/lib/api'
import axios from 'axios'
import toast from 'react-hot-toast'

const RegisterForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpExpiry, setOtpExpiry] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  // OAuth States
  const [oauthLoading, setOauthLoading] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [pendingOAuthData, setPendingOAuthData] = useState(null)
  
  // UI States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  
  // Refs
  const submitTimeoutRef = useRef(null)
  const otpTimerRef = useRef(null)
  const resendTimerRef = useRef(null)
  const { register: authRegister, login: authLogin } = useAuth()

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
      if (otpTimerRef.current) clearInterval(otpTimerRef.current)
      if (resendTimerRef.current) clearInterval(resendTimerRef.current)
    }
  }, [])

  // OTP expiry timer
  useEffect(() => {
    if (otpExpiry > 0) {
      otpTimerRef.current = setInterval(() => {
        setOtpExpiry(prev => {
          if (prev <= 1) {
            clearInterval(otpTimerRef.current)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    }
  }, [otpExpiry])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(resendTimerRef.current)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current)
    }
  }, [resendCooldown])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtpCode(value)
  }

  const validatePassword = (password) => {
    const errors = []
    if (password.length < 6) errors.push('Password must be at least 6 characters long')
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number')
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password must contain at least one special character')
    return errors
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return ['Please enter a valid email address']
    return []
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const passwordErrors = validatePassword(formData.password)
    const emailErrors = validateEmail(formData.email)

    if (passwordErrors.length > 0) {
      passwordErrors.forEach(error => toast.error(error))
      return
    }

    if (emailErrors.length > 0) {
      emailErrors.forEach(error => toast.error(error))
      return
    }

    if (!formData.full_name.trim() || !formData.username.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...submitData } = formData
      const cleanedData = {
        full_name: submitData.full_name.trim(),
        username: submitData.username.trim(),
        email: submitData.email.trim().toLowerCase(),
        password: submitData.password,
        role: submitData.role,
      }

      const response = await axios.post(`${API_BASE_URL}/auth_auth/register/initiate`, cleanedData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      })

      if (response.data.requires_verification) {
        setOtpSent(true)
        setOtpExpiry(response.data.expires_in)
        setCanResend(false)
        setResendCooldown(120)
        toast.success('Registration successful! Please check your email for verification code.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()

    if (loading || !otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/auth_auth/register/complete`, {
        email: formData.email,
        otp_code: otpCode
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      })

      setRegistrationSuccess(true)
      toast.success('Email verified successfully! Welcome to QuizerAI!')

      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)

    } catch (error) {
      console.error('OTP verification error:', error)
      const errorMessage = error.response?.data?.detail || 'Invalid or expired verification code'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend || loading) return

    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/auth_auth/otp/resend`, {
        email: formData.email,
        otp_type: 'registration'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      })

      setOtpCode('')
      setOtpExpiry(response.data.expires_in)
      setCanResend(false)
      setResendCooldown(response.data.can_resend_in || 120)
      toast.success('Verification code resent! Please check your email.')

    } catch (error) {
      console.error('Resend OTP error:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to resend code. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // OAuth Functions
  const handleGoogleRegister = async () => {
    if (oauthLoading) return

    setOauthLoading(true)

    let popup = null
    let cleanupMonitor = null

    try {
      const response = await oauthService.initiateGoogleLogin()

      if (response.auth_url) {
        popup = oauthService.openOAuthPopup(response.auth_url, 'google-oauth')

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.')
        }

        cleanupMonitor = oauthService.monitorPopupStatus(popup, () => {
          setOauthLoading(false)
          toast.error('OAuth cancelled or popup closed', {
            position: "top-right",
            autoClose: 3000,
          })
        })

        const result = await oauthService.listenForOAuthMessage()

        if (cleanupMonitor) cleanupMonitor()
        if (popup && !popup.closed) popup.close()

        if (result) {
          if (result.needs_role_selection && result.temp_token) {
            setPendingOAuthData({
              temp_token: result.temp_token,
              user_info: result.user_info,
              is_new_user: true
            })
            setShowRoleSelection(true)
            setOauthLoading(false)
            return
          }

          if (result.access_token) {
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
      const userRole = result.user?.role
      const userName = result.user?.full_name || result.user?.username

      toast.success(`Welcome${userName ? ', ' + userName.split(' ')[0] : ''}!`, {
        position: "top-right",
        autoClose: 3000,
      })

      localStorage.setItem('authToken', result.access_token)

      if (result.refresh_token) {
        localStorage.setItem('refreshToken', result.refresh_token)
      }

      if (result.user) {
        localStorage.setItem('userData', JSON.stringify(result.user))
      }

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      localStorage.setItem('tokenExpiry', expiryDate.toISOString())

      if (authLogin) {
        try {
          await authLogin(result.user.email, null, { isOAuth: true })
        } catch (authError) {
          console.warn('Auth provider login failed, but OAuth login succeeded:', authError)
        }
      }

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
        await completeOAuthLogin(response.data)
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

      if (errorMessage.includes('expired') || errorMessage.includes('session')) {
        setShowRoleSelection(false)
        setPendingOAuthData(null)
      }
    } finally {
      setOauthLoading(false)
    }
  }

  const handleError = (error) => {
    if (error.response) {
      let errorMessage = 'Registration failed. Please try again.'

      if (error.response.status === 422) {
        if (error.response.data?.errors) {
          const errors = error.response.data.errors
          if (Array.isArray(errors)) {
            errorMessage = errors.join(', ')
          } else if (typeof errors === 'object') {
            const errorMessages = Object.values(errors).flat()
            errorMessage = errorMessages.join(', ')
          }
        }
      } else if (error.response.status === 409 || error.response.status === 400) {
        errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage
      }

      toast.error(errorMessage)
    } else if (error.request) {
      toast.error('Network error. Please check your connection and try again.')
    } else {
      toast.error('Something went wrong. Please try again.')
    }
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

          <motion.button
            onClick={() => handleRoleSelection('institution')}
            disabled={oauthLoading}
            className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: oauthLoading ? 1 : 1.02 }}
            whileTap={{ scale: oauthLoading ? 1 : 0.98 }}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Institution</h4>
                <p className="text-sm text-slate-600">Manage your educational institution</p>
              </div>
            </div>
          </motion.button>
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

  if (registrationSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto text-center space-y-6"
      >
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">🎉 Welcome to QuizerAI!</h3>
          <p className="text-slate-600 mb-4">
            Your account has been created successfully!
          </p>
          <p className="text-sm text-slate-500">
            Redirecting you to login page...
          </p>
        </div>

        <motion.button
          onClick={() => window.location.href = '/login'}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue to Login
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    )
  }

  return (
    <>
      {showRoleSelection && <RoleSelectionModal />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h2>
          <p className="text-slate-600">Join QuizerAI and start learning smarter</p>
        </div>

        <div className="space-y-6">
          {/* Registration Form */}
          {!otpSent && (
            <>
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                {/* Full Name Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'full_name' || formData.full_name ? 'text-blue-500' : 'text-gray-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('full_name')}
                      onBlur={() => setFocusedField('')}
                      required
                      className={getInputClasses('full_name', formData.full_name)}
                      placeholder="QuizerAi"
                    />
                  </div>
                </div>

                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username <span className="text-red-500">*</span>
                    <span className="text-xs text-slate-500 ml-2">(No special characters like @, &)</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'username' || formData.username ? 'text-blue-500' : 'text-gray-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField('')}
                      required
                      className={getInputClasses('username', formData.username)}
                      placeholder="quizer27ai"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' || formData.email ? 'text-blue-500' : 'text-gray-400'}`}>
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
                      className={getInputClasses('email', formData.email)}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    I am a <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'student', label: 'Student' },
                      { value: 'teacher', label: 'Teacher' },
                      { value: 'institution', label: 'Institution' }
                    ].map((role) => (
                      <motion.label
                        key={role.value}
                        className={`relative flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.role === role.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{role.label}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-600 mb-2">
                    Must be 6+ characters with uppercase, number, and special character
                  </p>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' || formData.password ? 'text-blue-500' : 'text-gray-400'}`}>
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
                      className={getPasswordInputClasses('password', formData.password)}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${focusedField === 'confirmPassword' || formData.confirmPassword ? 'text-blue-500' : 'text-gray-400'}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      required
                      className={getPasswordInputClasses('confirmPassword', formData.confirmPassword)}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-slate-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </Link>
                  </label>
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
                      Send Verification Code
                      <Mail className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Google OAuth Section */}
              <div className="mt-8">
                {/* Divider */}
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

                {/* Google Button */}
                <div className="mt-6 flex justify-center">
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
                    onClick={handleGoogleRegister}
                  >
                    {/* Background Glow */}
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
                          <div className="mr-3 p-2 bg-white rounded-lg shadow-sm">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </div>
                          <span className="text-lg font-semibold">Continue with Google</span>
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
              </div>
            </>
          )}

          {/* OTP Verification Section */}
          {otpSent && !registrationSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Check Your Email</h3>
                <p className="text-slate-600 mb-4">
                  We&apos;ve sent a 6-digit verification code to<br />
                  <span className="font-medium text-slate-800">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={handleOtpChange}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono tracking-widest py-4 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-200"
                    maxLength={6}
                  />
                </div>

                {/* Timer and Status */}
                <div className="text-center space-y-2">
                  {otpExpiry > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>Code expires in {formatTime(otpExpiry)}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">Code has expired</div>
                  )}

                  {/* Resend Button */}
                  {(canResend && otpExpiry <= 0) ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center gap-1 mx-auto disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Resend Code
                    </button>
                  ) : resendCooldown > 0 ? (
                    <span className="text-sm text-slate-500">
                      Resend available in {formatTime(resendCooldown)}
                    </span>
                  ) : null}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !otpCode || otpCode.length !== 6}
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
                      Verify & Complete Registration
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false)
                    setOtpCode('')
                    setOtpExpiry(0)
                  }}
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  ← Back to Registration
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sign In Link - Only show during initial registration */}
        {!otpSent && (
          <div className="text-center mt-6">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </>
  )
}

export default RegisterForm