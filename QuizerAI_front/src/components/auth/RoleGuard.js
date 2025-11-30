'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const TeacherGuard = ({ children, fallback = null }) => {
  const { isTeacher, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isTeacher) {
      router.push('/dashboard')
    }
  }, [loading, isTeacher, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return isTeacher ? children : fallback
}

export const StudentGuard = ({ children, fallback = null }) => {
  const { isStudent, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/dashboard')
    }
  }, [loading, isStudent, router])

  if (loading) return <div>Loading...</div>
  if (!user) {
    router.push('/login')
    return null
  }

  return isStudent ? children : fallback
}