'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Calendar,
  Settings,
  Plus,
  BookOpen,
  Copy,
  BarChart3,
  FileText,
  Download,
  Loader2,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  Target,
  Star
} from 'lucide-react'
import { TeacherGuard } from '@/components/auth/RoleGuard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { classroomApi } from '@/utils/api/classroomApi'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ClassroomDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const [classroom, setClassroom] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [exporting, setExporting] = useState(false)

  const classroomId = params.id

  useEffect(() => {
    if (classroomId) {
      fetchClassroomData()
    }
  }, [classroomId])

  const fetchClassroomData = async () => {
    try {
      setLoading(true)
      const data = await classroomApi.getClassroomAnalytics(classroomId)
      setClassroom(data.classroom)
      setAnalytics(data)
    } catch (error) {
      toast.error('Failed to load classroom data')
      router.push('/teacher_dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(classroom.join_code)
      toast.success('Join code copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy join code')
    }
  }

  const handleExportClassroom = async () => {
    try {
      setExporting(true)
      const blob = await classroomApi.exportClassroomExcel(classroomId)

      // Create download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Classroom_Performance_${classroom.name}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast.success('Classroom performance exported successfully')
    } catch (error) {
      toast.error('Failed to export classroom data')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <TeacherGuard>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <Header />

          {/* Mobile-first header skeleton */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="h-5 bg-slate-200 rounded w-32 animate-pulse"></div>
                <div className="h-8 bg-slate-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                {/* Hero section skeleton */}
                <div className="bg-slate-200 rounded-2xl lg:rounded-3xl h-64 lg:h-80"></div>

                {/* Stats grid skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-200 rounded-2xl h-24 lg:h-32"></div>
                  ))}
                </div>

                {/* Quick actions skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-200 rounded-2xl h-40"></div>
                  ))}
                </div>

                {/* Assignments section skeleton */}
                <div className="bg-slate-200 rounded-2xl lg:rounded-3xl h-96"></div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </TeacherGuard>
    )
  }

  return (
    <TeacherGuard>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header />

        {/* Mobile-first header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/teacher_dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportClassroom}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all text-sm"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">

            {/* Hero Section - Enhanced with dynamic data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white mb-8 relative overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-white rounded-full"></div>
                <div className="absolute top-1/2 -left-8 w-24 h-24 bg-white rounded-full"></div>
                <div className="absolute bottom-4 right-1/3 w-16 h-16 bg-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                  {/* Left side - Classroom info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{classroom?.name}</h1>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${classroom?.status === 'ACTIVE'
                          ? 'bg-green-500 bg-opacity-20 text-green-100'
                          : 'bg-gray-500 bg-opacity-20 text-gray-100'
                        }`}>
                        {classroom?.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {classroom?.subject}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Created {classroom?.created_at ? new Date(classroom.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    {classroom?.description && (
                      <p className="text-white/90 text-sm lg:text-base max-w-2xl">
                        {classroom.description}
                      </p>
                    )}
                  </div>

                  {/* Right side - Join code */}
                  <div className="lg:text-right">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/30 shadow-2xl shadow-black/10">
                      <div className="text-4xl lg:text-5xl text-white font-bold mb-3 tracking-widest drop-shadow-lg">
                        {classroom?.join_code}
                      </div>
                      <div className="text-sm text-white/70 mb-4 font-medium">Join Code</div>
                      <button
                        onClick={handleCopyJoinCode}
                        className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 mx-auto text-sm font-medium backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid - Enhanced with dynamic data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
            >
              <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">{analytics?.total_students || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>

              <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">{analytics?.total_assignments || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </div>

              <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">{analytics?.total_submissions || 0}</div>
                </div>
                <div className="text-sm text-gray-600">Submissions</div>
              </div>

              <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">{analytics?.average_class_score || 0}%</div>
                </div>
                <div className="text-sm text-gray-600">Class Average</div>
              </div>
            </motion.div>

            {/* Quick Actions - Redesigned with dynamic links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8"
            >
              <Link href={`/teacher_dashboard/classroom/${classroomId}/assign-quiz`}>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-blue-200 group cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Assign New Quiz</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Create and assign new quizzes to your students with custom settings</p>
                </div>
              </Link>

              <Link href={`/teacher_dashboard/classroom/${classroomId}/students`}>
                <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-emerald-200 group cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Manage Students</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">View student performance and manage your classroom roster</p>
                </div>
              </Link>

              <Link href={`/teacher_dashboard/classroom/${classroomId}/analytics`}>
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-purple-200 group cursor-pointer sm:col-span-2 lg:col-span-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">View Analytics</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Get detailed insights into class performance and progress</p>
                </div>
              </Link>
            </motion.div>

            {/* Recent Assignments - Enhanced with dynamic data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-200"
            >
              <div className="p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">Recent Assignments</h3>
                    <p className="text-gray-600 text-sm">Monitor student progress and performance</p>
                  </div>
                  <Link href={`/teacher_dashboard/classroom/${classroomId}/assignments`}>
                    <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm self-start sm:self-auto">
                      View All Assignments →
                    </button>
                  </Link>
                </div>

                {analytics?.assignments && analytics.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.assignments.slice(0, 3).map((assignment, index) => (
                      <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                        <div className="flex items-start gap-4 mb-4 sm:mb-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{assignment.title}</h4>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {assignment.completed_count || 0}/{assignment.total_students || 0} completed
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                Avg: {assignment.average_score || 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {assignment.total_students > 0 ? Math.round((assignment.completed_count / assignment.total_students) * 100) : 0}%
                            </div>
                            <div className="text-xs text-gray-500">Completion Rate</div>
                          </div>
                          <div className="w-16 h-16 relative">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="2"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="2"
                                strokeDasharray={`${assignment.total_students > 0 ? (assignment.completed_count / assignment.total_students) * 100 : 0}, 100`}
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 lg:py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h4>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">Get started by creating your first assignment to engage your students</p>
                    <Link href={`/teacher_dashboard/classroom/${classroomId}/assign-quiz`}>
                      <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                        Create First Assignment
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </TeacherGuard>
  )
}

export default ClassroomDetailPage