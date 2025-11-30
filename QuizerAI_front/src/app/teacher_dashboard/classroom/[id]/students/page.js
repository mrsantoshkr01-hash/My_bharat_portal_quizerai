'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Users, 
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  UserMinus,
  MessageSquare,
  Award,
  Clock,
  Search,
  AlertTriangle
} from 'lucide-react'
import { TeacherGuard } from '@/components/auth/RoleGuard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { classroomApi } from '@/utils/api/classroomApi'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ClassroomStudentsPage = () => {
  const params = useParams()
  const router = useRouter()
  const [classroom, setClassroom] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const classroomId = params.id

  useEffect(() => {
    if (classroomId && classroomId !== 'undefined' && !isNaN(parseInt(classroomId))) {
      fetchData()
    } else {
      setError('Invalid classroom ID')
      setLoading(false)
    }
  }, [classroomId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [classroomData, studentsData] = await Promise.all([
        classroomApi.getClassroomAnalytics(classroomId),
        classroomApi.getClassroomStudents(classroomId)
      ])
      
      console.log('Classroom data:', classroomData)
      console.log('Students data:', studentsData)
      console.log('Students type:', typeof studentsData, 'Is array:', Array.isArray(studentsData))
      
      setClassroom(classroomData.classroom)
      
      // Handle the new backend response structure
      let studentsArray = []
      if (Array.isArray(studentsData)) {
        // Old format - direct array
        studentsArray = studentsData
      } else if (studentsData && Array.isArray(studentsData.students)) {
        // New format - wrapped in object
        studentsArray = studentsData.students
      } else if (studentsData && studentsData.students) {
        // Handle any other nested structure
        studentsArray = []
      }
      
      console.log('Final students array:', studentsArray)
      setStudents(studentsArray)
    } catch (error) {
      console.error('Error fetching data:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to load classroom data'
      setError(errorMessage)
      toast.error(errorMessage)
      setStudents([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this classroom?`)) {
      return
    }

    try {
      await classroomApi.removeStudent(classroomId, studentId)
      toast.success(`${studentName} removed from classroom`)
      setStudents(prev => (prev || []).filter(s => s?.student?.id !== studentId))
    } catch (error) {
      toast.error('Failed to remove student')
    }
  }

  // Safe filtering and sorting with null checks
  const filteredAndSortedStudents = (students || [])
    .filter(student => {
      if (!student?.student) return false
      const fullName = student.student.full_name || ''
      const email = student.student.email || ''
      return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             email.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a?.student?.full_name || ''
          bValue = b?.student?.full_name || ''
          break
        case 'joined':
          aValue = new Date(a?.joined_at || 0)
          bValue = new Date(b?.joined_at || 0)
          break
        case 'score':
          aValue = a?.average_score || 0
          bValue = b?.average_score || 0
          break
        case 'assignments':
          aValue = a?.completed_assignments || 0
          bValue = b?.completed_assignments || 0
          break
        default:
          aValue = a?.student?.full_name || ''
          bValue = b?.student?.full_name || ''
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const getScoreColor = (score) => {
    const numScore = Number(score) || 0
    if (numScore >= 90) return 'text-green-600 bg-green-100'
    if (numScore >= 80) return 'text-blue-600 bg-blue-100'
    if (numScore >= 70) return 'text-yellow-600 bg-yellow-100'
    if (numScore >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getCompletionPercentage = (completed, total) => {
    const completedNum = Number(completed) || 0
    const totalNum = Number(total) || 0
    return totalNum > 0 ? Math.round((completedNum / totalNum) * 100) : 0
  }

  // Error state
  if (error) {
    return (
      <TeacherGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Students</h2>
                <p className="text-red-600 mb-6">{error}</p>
                <div className="space-x-4">
                  <button
                    onClick={fetchData}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <Link href="/teacher_dashboard">
                    <button className="bg-slate-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors">
                      Back to Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </TeacherGuard>
    )
  }

  if (loading) {
    return (
      <TeacherGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-slate-200 rounded w-64"></div>
                <div className="bg-white rounded-2xl p-8">
                  <div className="h-12 bg-slate-200 rounded w-96 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-32 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-7xl mx-auto">
            
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <Link href={`/teacher_dashboard/classroom/${classroomId}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Classroom</span>
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Students</h1>
                  <p className="text-slate-600">{classroom?.name} - {(students || []).length} enrolled</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{classroom?.join_code}</div>
                    <div className="text-xs text-slate-500">Join Code</div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="joined">Sort by Join Date</option>
                    <option value="score">Sort by Average Score</option>
                    <option value="assignments">Sort by Completed Assignments</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Students Grid */}
            {filteredAndSortedStudents.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredAndSortedStudents.map((studentData, index) => {
                  const student = studentData?.student || {}
                  const completionPercentage = getCompletionPercentage(
                    studentData?.completed_assignments,
                    studentData?.total_assignments
                  )

                  return (
                    <motion.div
                      key={student.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
                    >
                      {/* Student Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                            {(student.full_name || 'U').charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-lg">
                              {student.full_name || 'Unknown User'}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Mail className="w-3 h-3" />
                              {student.email || 'No email'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions Menu */}
                        <div className="relative group">
                          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Send Message
                            </button>
                            <button 
                              onClick={() => handleRemoveStudent(student.id, student.full_name)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove from Class
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-4">
                        {/* Average Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Average Score</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(studentData?.average_score)}`}>
                            {Number(studentData?.average_score || 0).toFixed(1)}%
                          </span>
                        </div>

                        {/* Assignment Progress */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Assignment Progress</span>
                            <span className="font-medium text-slate-800">
                              {studentData?.completed_assignments || 0}/{studentData?.total_assignments || 0}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                completionPercentage >= 80 ? 'bg-green-500' :
                                completionPercentage >= 60 ? 'bg-blue-500' :
                                completionPercentage >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Joined</span>
                          <div className="flex items-center gap-1 text-slate-800">
                            <Calendar className="w-3 h-3" />
                            {formatDate(studentData?.joined_at)}
                          </div>
                        </div>

                        {/* Last Activity */}
                        {studentData?.last_activity && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Last Active</span>
                            <div className="flex items-center gap-1 text-slate-800">
                              <Clock className="w-3 h-3" />
                              {formatDate(studentData.last_activity)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Performance Indicator */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Performance</span>
                          <div className="flex items-center gap-1">
                            {(studentData?.average_score || 0) >= 80 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              (studentData?.average_score || 0) >= 80 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(studentData?.average_score || 0) >= 80 ? 'Excellent' : 
                               (studentData?.average_score || 0) >= 60 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white rounded-2xl border border-slate-200"
              >
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  {searchTerm ? 'No students found' : 'No students enrolled yet'}
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  {searchTerm 
                    ? `No students match your search for "${searchTerm}"`
                    : 'Share your join code with students to get them enrolled in this classroom.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={fetchData}
                    className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </TeacherGuard>
  )
}

export default ClassroomStudentsPage