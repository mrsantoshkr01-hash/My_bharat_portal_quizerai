// 'use client'

// import { createContext, useContext, useEffect, useState } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import axios from 'axios'
// import toast from 'react-hot-toast'

// const AuthContext = createContext({})

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [initialized, setInitialized] = useState(false)
//   const router = useRouter()
//   const pathname = usePathname()

//   // API Base URL - update this to match your backend
//   const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

//   // Protected routes that require authentication
//   const protectedRoutes = ['/dashboard', '/quiz', '/classroom', '/ai_tutor', '/analytics']
//   const authRoutes = ['/login', '/register']

//   // PUBLIC routes that should NEVER redirect to login
//   const publicRoutes = ['/', '/about', '/features', '/pricing', '/contact', '/help', '/privacy', '/terms']

//   useEffect(() => {
//     initializeAuth()
//   }, [])

//   useEffect(() => {
//     if (initialized && !loading) {
//       handleRouteProtection()
//     }
//   }, [user, pathname, initialized, loading])

//   const initializeAuth = async () => {
//     try {
//       const token = localStorage.getItem('authToken')
//       const userData = localStorage.getItem('userData')

//       if (token && userData) {
//         try {
//           const user = JSON.parse(userData)
//           setUser(user)
//           // Optionally verify token with backend
//           await verifyToken(token)
//         } catch (error) {
//           console.error('Invalid stored user data:', error)
//           clearTokens()
//         }
//       }
//     } catch (error) {
//       console.error('Auth initialization error:', error)
//       clearTokens()
//     } finally {
//       setLoading(false)
//       setInitialized(true)
//     }
//   }

//   const getDashboardRoute = (userRole) => {
//     switch (userRole) {
//       case 'teacher':
//         return '/teacher_dashboard'
//       case 'student':
//         return '/dashboard'
//       case 'institution':
//         return '/institution_dashboard' // If you have this
//       default:
//         return '/dashboard'
//     }
//   }

//   const verifyToken = async (token) => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/auth_auth/me`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         timeout: 10000
//       })

//       if (response.data && response.data.user) {
//         setUser(response.data.user)
//         localStorage.setItem('userData', JSON.stringify(response.data.user))
//         return response.data.user
//       }
//     } catch (error) {
//       console.error('Token verification failed:', error)
//       clearTokens()
//       setUser(null)
//       throw error
//     }
//   }

//   const clearTokens = () => {
//     localStorage.removeItem('authToken')
//     localStorage.removeItem('refreshToken')
//     localStorage.removeItem('userData')
//     localStorage.removeItem('tokenExpiry')
//     localStorage.removeItem('tempAuthToken')
//   }

//   const handleRouteProtection = () => {
//     const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
//     const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
//     const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/'

//     // FIX: Check if it's a public route first and do nothing
//     if (isPublicRoute) {
//       return // Don't redirect public routes
//     }

//     // ONLY redirect if it's a protected route AND user is not authenticated
//     if (isProtectedRoute && !user) {
//       router.push('/login?redirect=' + encodeURIComponent(pathname))
//     }
//     // ONLY redirect authenticated users away from auth pages
//     else if (isAuthRoute && user) {
//       const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
//       router.push(redirectUrl || '/dashboard')
//     }
//   }
//   const login = async (email, password, rememberMe = false) => {
//     // This function should NOT make an API call since LoginForm already handles it
//     // Just update the context state with existing stored data
//     try {
//       const token = localStorage.getItem('authToken')
//       const userData = localStorage.getItem('userData')

//       if (token && userData) {
//         const user = JSON.parse(userData)
//         setUser(user)

//         // Handle redirect
//         const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
//         router.push(redirectUrl || '/dashboard')

//         return { success: true, user }
//       }

//       return { success: false, error: 'No login data found' }
//     } catch (error) {
//       console.error('Login context update error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   const register = async (userData) => {
//     try {
//       setLoading(true)

//       const response = await axios.post(`${API_BASE_URL}/auth_auth/register`, userData, {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         timeout: 15000,
//       })

//       if (response.data && (response.data.success !== false)) {
//         const token = response.data.access_token || response.data.token
//         const user = response.data.user

//         if (token && user) {
//           // Store tokens and user data
//           localStorage.setItem('authToken', token)
//           localStorage.setItem('userData', JSON.stringify(user))

//           if (response.data.refresh_token) {
//             localStorage.setItem('refreshToken', response.data.refresh_token)
//           }

//           setUser(user)

//           toast.success(response.data.message || 'Account created successfully!', {
//             position: "top-right",
//             autoClose: 3000,
//           })

//           router.push('/dashboard')
//           return { success: true, user }
//         } else {
//           throw new Error('Invalid response format')
//         }
//       }
//     } catch (error) {
//       console.error('Registration error:', error)

//       let errorMessage = 'Registration failed. Please try again.'

//       if (error.response) {
//         const status = error.response.status
//         const errorData = error.response.data

//         switch (status) {
//           case 400:
//             errorMessage = errorData?.detail || 'Invalid request. Please check your input.'
//             break
//           case 409:
//             errorMessage = 'Email already exists. Please use a different email.'
//             break
//           case 422:
//             if (errorData?.errors) {
//               if (Array.isArray(errorData.errors)) {
//                 errorMessage = errorData.errors.join(', ')
//               } else if (typeof errorData.errors === 'object') {
//                 const errorMessages = Object.values(errorData.errors).flat()
//                 errorMessage = errorMessages.join(', ')
//               } else {
//                 errorMessage = errorData.message || 'Please check your input.'
//               }
//             } else {
//               errorMessage = errorData?.detail || errorData?.message || 'Invalid input data.'
//             }
//             break
//           case 500:
//           case 502:
//           case 503:
//           case 504:
//             errorMessage = 'Server error. Please try again later.'
//             break
//           default:
//             errorMessage = errorData?.detail || errorData?.message || errorMessage
//         }

//         toast.error(errorMessage, {
//           position: "top-right",
//           autoClose: 5000,
//         })
//       } else if (error.request) {
//         toast.error('Network error. Please check your connection and try again.', {
//           position: "top-right",
//           autoClose: 4000,
//         })
//       } else {
//         toast.error('An unexpected error occurred. Please try again.', {
//           position: "top-right",
//           autoClose: 4000,
//         })
//       }

//       return { success: false, error: errorMessage }
//     } finally {
//       setLoading(false)
//     }
//   }

//   const logout = async () => {
//     try {
//       const token = localStorage.getItem('authToken')
//       if (token) {
//         try {
//           await axios.post(`${API_BASE_URL}/auth_auth/logout`, {}, {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             timeout: 10000
//           })
//         } catch (error) {
//           console.warn('Backend logout failed:', error)
//           // Continue with local logout even if backend fails
//         }
//       }
//     } catch (error) {
//       console.error('Logout error:', error)
//     } finally {
//       clearTokens()
//       setUser(null)
//       router.push('/login')
//       toast.success('Logged out successfully', {
//         position: "top-right",
//         autoClose: 3000,
//       })
//     }
//   }

//   const updateUser = async (updates) => {
//     try {
//       const token = localStorage.getItem('authToken')

//       const response = await axios.patch(`${API_BASE_URL}/auth_auth/profile`, updates, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         timeout: 15000
//       })

//       if (response.data) {
//         const user = response.data.user || response.data
//         setUser(user)
//         localStorage.setItem('userData', JSON.stringify(user))

//         toast.success('Profile updated successfully', {
//           position: "top-right",
//           autoClose: 3000,
//         })

//         return { success: true, user }
//       }
//     } catch (error) {
//       console.error('Update profile error:', error)

//       let errorMessage = 'Profile update failed. Please try again.'

//       if (error.response) {
//         const errorData = error.response.data
//         errorMessage = errorData?.detail || errorData?.message || errorMessage
//       } else if (error.request) {
//         errorMessage = 'Network error. Please check your connection.'
//       }

//       toast.error(errorMessage, {
//         position: "top-right",
//         autoClose: 4000,
//       })

//       return { success: false, error: errorMessage }
//     }
//   }

//   const requestPasswordReset = async (email) => {
//     try {
//       const response = await axios.post(`${API_BASE_URL}/auth_auth/forgot-password`,
//         { email },
//         {
//           headers: { 'Content-Type': 'application/json' },
//           timeout: 15000
//         }
//       )

//       if (response.data) {
//         toast.success('Password reset email sent!', {
//           position: "top-right",
//           autoClose: 4000,
//         })
//         return { success: true }
//       }
//     } catch (error) {
//       console.error('Password reset error:', error)

//       let errorMessage = 'Failed to send reset email. Please try again.'

//       if (error.response) {
//         const errorData = error.response.data
//         errorMessage = errorData?.detail || errorData?.message || errorMessage
//       } else if (error.request) {
//         errorMessage = 'Network error. Please check your connection.'
//       }

//       toast.error(errorMessage, {
//         position: "top-right",
//         autoClose: 4000,
//       })

//       return { success: false, error: errorMessage }
//     }
//   }

//   const resetPassword = async (token, newPassword) => {
//     try {
//       const response = await axios.post(`${API_BASE_URL}/auth_auth/reset-password`,
//         { token, password: newPassword },
//         {
//           headers: { 'Content-Type': 'application/json' },
//           timeout: 15000
//         }
//       )

//       if (response.data) {
//         toast.success('Password reset successfully!', {
//           position: "top-right",
//           autoClose: 3000,
//         })

//         router.push('/login')
//         return { success: true }
//       }
//     } catch (error) {
//       console.error('Password reset error:', error)

//       let errorMessage = 'Password reset failed. Please try again.'

//       if (error.response) {
//         const errorData = error.response.data
//         errorMessage = errorData?.detail || errorData?.message || errorMessage
//       } else if (error.request) {
//         errorMessage = 'Network error. Please check your connection.'
//       }

//       toast.error(errorMessage, {
//         position: "top-right",
//         autoClose: 4000,
//       })

//       return { success: false, error: errorMessage }
//     }
//   }

//   const refreshToken = async () => {
//     try {
//       const refreshToken = localStorage.getItem('refreshToken')
//       if (!refreshToken) return false

//       const response = await axios.post(`${API_BASE_URL}/auth_auth/refresh`,
//         { refresh_token: refreshToken },
//         {
//           headers: { 'Content-Type': 'application/json' },
//           timeout: 10000
//         }
//       )

//       if (response.data && response.data.access_token) {
//         localStorage.setItem('authToken', response.data.access_token)

//         if (response.data.refresh_token) {
//           localStorage.setItem('refreshToken', response.data.refresh_token)
//         }

//         return true
//       } else {
//         logout()
//         return false
//       }
//     } catch (error) {
//       console.error('Token refresh error:', error)
//       logout()
//       return false
//     }
//   }

//   const value = {
//     user,
//     loading,
//     isLoading: loading,
//     initialized,
//     login,
//     register,
//     logout,
//     updateUser,
//     requestPasswordReset,
//     resetPassword,
//     refreshToken,
//     isAuthenticated: !!user,
//     isStudent: user?.role === 'student',
//     isTeacher: user?.role === 'teacher',
//     isInstitution: user?.role === 'institution',
//     hasRole: (role) => user?.role === role,
//     canAccessTeacherFeatures: () => user?.role === 'teacher' && user?.is_active,
//     canAccessStudentFeatures: () => user?.role === 'student' && user?.is_active
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }



'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  // Protected routes that require authentication (both dashboards included)
  const protectedRoutes = ['/dashboard', '/teacher_dashboard', '/quiz', '/classroom', '/ai_tutor', '/analytics', '/settings', '/profile']
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const publicRoutes = ['/', '/about', '/features', '/pricing', '/contact', '/help', '/privacy', '/terms', '/how_to_use', '/contactus', '/feedback']

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    if (initialized && !loading) {
      handleRouteProtection()
    }
  }, [user, pathname, initialized, loading])

  // Get the appropriate dashboard based on user role
  const getDashboardRoute = (userRole) => {
    switch (userRole) {
      case 'teacher':
        return '/teacher_dashboard'
      case 'student':
        return '/dashboard'
      case 'institution':
        return '/dashboard' // Institutions use student dashboard
      default:
        return '/dashboard'
    }
  }

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('userData')

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          
          // Verify token is still valid
          await verifyToken(token)
        } catch (error) {
          console.error('Invalid stored user data:', error)
          clearTokens()
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      clearTokens()
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth_auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      if (response.data && response.data.user) {
        const userData = response.data.user
        setUser(userData)
        localStorage.setItem('userData', JSON.stringify(userData))
        return userData
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      clearTokens()
      setUser(null)
      throw error
    }
  }

  const clearTokens = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('tokenExpiry')
    localStorage.removeItem('tempAuthToken')
  }

  const handleRouteProtection = () => {
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/'

    // Allow access to public routes
    if (isPublicRoute) {
      return
    }

    // Redirect authenticated users away from auth pages to their appropriate dashboard
    if (isAuthRoute && user) {
      const dashboardRoute = getDashboardRoute(user.role)
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
      
      // If there's a redirect URL and it's a valid protected route, go there
      if (redirectUrl && protectedRoutes.some(route => redirectUrl.startsWith(route))) {
        // Check if user can access the redirect route based on role
        if (redirectUrl.startsWith('/teacher_dashboard') && user.role === 'teacher') {
          router.push(redirectUrl)
        } else if (redirectUrl === '/dashboard' && (user.role === 'student' || user.role === 'institution')) {
          router.push(redirectUrl)
        } else if (!redirectUrl.startsWith('/dashboard') && !redirectUrl.startsWith('/teacher_dashboard')) {
          router.push(redirectUrl) // Other protected routes accessible by all authenticated users
        } else {
          router.push(dashboardRoute) // Fallback to appropriate dashboard
        }
      } else {
        router.push(dashboardRoute)
      }
      return
    }

    // Handle protected routes
    if (isProtectedRoute) {
      if (!user) {
        // Not authenticated - redirect to login
        router.push('/login?redirect=' + encodeURIComponent(pathname))
        return
      }

      // Role-based access control for dashboards
      if (pathname === '/dashboard' && user.role === 'teacher') {
        // Teacher trying to access student dashboard - redirect to teacher dashboard
        router.push('/teacher_dashboard')
        return
      }
      
      if (pathname.startsWith('/teacher_dashboard') && (user.role === 'student' || user.role === 'institution')) {
        // Student trying to access teacher dashboard - redirect to student dashboard
        router.push('/dashboard')
        return
      }

      // All other protected routes are accessible by authenticated users
      return
    }

    // For any other non-public routes, require authentication
    if (!isPublicRoute && !isAuthRoute && !user) {
      router.push('/login?redirect=' + encodeURIComponent(pathname))
      return
    }
  }

  const login = async (email, password, rememberMe = false) => {
    try {
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('userData')

      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // Get redirect URL from query params
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
        
        // Determine where to redirect based on user role and redirect URL
        let targetRoute
        if (redirectUrl && protectedRoutes.some(route => redirectUrl.startsWith(route))) {
          // Check role-based access for redirect URL
          if (redirectUrl.startsWith('/teacher_dashboard') && parsedUser.role === 'teacher') {
            targetRoute = redirectUrl
          } else if (redirectUrl === '/dashboard' && (parsedUser.role === 'student' || parsedUser.role === 'institution')) {
            targetRoute = redirectUrl
          } else if (!redirectUrl.startsWith('/dashboard') && !redirectUrl.startsWith('/teacher_dashboard')) {
            targetRoute = redirectUrl // Other protected routes
          } else {
            targetRoute = getDashboardRoute(parsedUser.role) // Fallback to appropriate dashboard
          }
        } else {
          targetRoute = getDashboardRoute(parsedUser.role)
        }

        router.push(targetRoute)

        // toast.success(`Welcome back, ${parsedUser.full_name || parsedUser.username}!`, {
        //   position: "top-right",
        //   autoClose: 3000,
        // })

        return { success: true, user: parsedUser }
      }

      return { success: false, error: 'No login data found' }
    } catch (error) {
      console.error('Login context update error:', error)
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)

      const response = await axios.post(`${API_BASE_URL}/auth_auth/register`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })

      if (response.data && (response.data.success !== false)) {
        const token = response.data.access_token || response.data.token
        const user = response.data.user

        if (token && user) {
          // Store tokens and user data
          localStorage.setItem('authToken', token)
          localStorage.setItem('userData', JSON.stringify(user))

          if (response.data.refresh_token) {
            localStorage.setItem('refreshToken', response.data.refresh_token)
          }

          setUser(user)

          toast.success(response.data.message || `Account created successfully! Welcome, ${user.full_name || user.username}!`, {
            position: "top-right",
            autoClose: 4000,
          })

          // Redirect to appropriate dashboard based on user role
          const dashboardRoute = getDashboardRoute(user.role)
          router.push(dashboardRoute)

          return { success: true, user }
        } else {
          throw new Error('Invalid response format')
        }
      } else {
        throw new Error(response.data?.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)

      let errorMessage = 'Registration failed. Please try again.'

      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 400:
            errorMessage = errorData?.detail || errorData?.message || 'Invalid request. Please check your input.'
            break
          case 409:
            errorMessage = errorData?.detail || 'Email already exists. Please use a different email or try logging in.'
            break
          case 422:
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
            errorMessage = 'Too many registration attempts. Please try again later.'
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
      } else {
        errorMessage = error.message || 'An unexpected error occurred. Please try again.'
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 6000,
      })

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        try {
          await axios.post(`${API_BASE_URL}/auth_auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          })
        } catch (error) {
          console.warn('Backend logout failed:', error)
          // Continue with local logout even if backend fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearTokens()
      setUser(null)
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any quiz data or other cached content
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('quiz_') || key.startsWith('currentQuiz')) {
            localStorage.removeItem(key)
          }
        })
      }

      router.push('/login')
      
      toast.success('Logged out successfully. See you next time!', {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  const updateUser = async (updates) => {
    try {
      const token = localStorage.getItem('authToken')

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.patch(`${API_BASE_URL}/auth_auth/profile`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })

      if (response.data) {
        const updatedUser = response.data.user || response.data
        setUser(updatedUser)
        localStorage.setItem('userData', JSON.stringify(updatedUser))

        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        })

        return { success: true, user: updatedUser }
      }
    } catch (error) {
      console.error('Update profile error:', error)

      let errorMessage = 'Profile update failed. Please try again.'

      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 401:
            errorMessage = 'Session expired. Please login again.'
            logout() // Auto logout on auth error
            break
          case 403:
            errorMessage = 'You do not have permission to update this profile.'
            break
          case 422:
            errorMessage = errorData?.detail || 'Invalid data provided. Please check your input.'
            break
          default:
            errorMessage = errorData?.detail || errorData?.message || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      })

      return { success: false, error: errorMessage }
    }
  }

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth_auth/forgot-password`,
        { email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      )

      if (response.data) {
        toast.success('Password reset instructions sent to your email!', {
          position: "top-right",
          autoClose: 5000,
        })
        return { success: true }
      }
    } catch (error) {
      console.error('Password reset error:', error)

      let errorMessage = 'Failed to send reset email. Please try again.'

      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 404:
            errorMessage = 'No account found with this email address.'
            break
          case 429:
            errorMessage = 'Too many reset requests. Please wait before trying again.'
            break
          default:
            errorMessage = errorData?.detail || errorData?.message || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      })

      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth_auth/reset-password`,
        { token, password: newPassword },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      )

      if (response.data) {
        toast.success('Password reset successfully! You can now login with your new password.', {
          position: "top-right",
          autoClose: 4000,
        })

        router.push('/login')
        return { success: true }
      }
    } catch (error) {
      console.error('Password reset error:', error)

      let errorMessage = 'Password reset failed. Please try again.'

      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 400:
            errorMessage = 'Invalid or expired reset token. Please request a new reset link.'
            break
          case 422:
            errorMessage = 'Password does not meet requirements. Please choose a stronger password.'
            break
          default:
            errorMessage = errorData?.detail || errorData?.message || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      })

      return { success: false, error: errorMessage }
    }
  }

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (!storedRefreshToken) return false

      const response = await axios.post(`${API_BASE_URL}/auth_auth/refresh`,
        { refresh_token: storedRefreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      )

      if (response.data && response.data.access_token) {
        localStorage.setItem('authToken', response.data.access_token)

        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token)
        }

        // Update user data if provided
        if (response.data.user) {
          setUser(response.data.user)
          localStorage.setItem('userData', JSON.stringify(response.data.user))
        }

        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  // Helper function to check if user has specific permissions
  const hasPermission = (permission) => {
    if (!user) return false
    
    const permissions = user.permissions || []
    return permissions.includes(permission)
  }

  // Helper function to check if user is active
  const isActiveUser = () => {
    return user?.is_active === true
  }

  const value = {
    // User state
    user,
    loading,
    isLoading: loading,
    initialized,
    
    // Authentication methods
    login,
    register,
    logout,
    updateUser,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    
    // User status helpers
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
    isInstitution: user?.role === 'institution',
    isActive: isActiveUser(),
    
    // Role and permission helpers
    hasRole: (role) => user?.role === role,
    hasPermission,
    canAccessTeacherFeatures: () => user?.role === 'teacher' && user?.is_active,
    canAccessStudentFeatures: () => (user?.role === 'student' || user?.role === 'institution') && user?.is_active,
    
    // Route helpers
    getDashboardRoute: () => getDashboardRoute(user?.role)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}