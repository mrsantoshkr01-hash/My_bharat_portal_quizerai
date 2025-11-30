'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  BarChart3,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import { TeacherGuard } from '@/components/auth/RoleGuard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { classroomApi, useAssignmentActions } from '@/utils/api/classroomApi'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Mobile-friendly modal component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-200 bg-opacity-75" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl sm:max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// Assignment Results Modal
const ResultsModal = ({ isOpen, onClose, assignment, classroomId }) => {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportFilter, setExportFilter] = useState('all')
  const { getResults } = useAssignmentActions()

  useEffect(() => {
    if (isOpen && assignment) {
      fetchResults()
    }
  }, [isOpen, assignment])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const data = await getResults(classroomId, assignment.id)
      setResults(data)
    } catch (error) {
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setExportLoading(true)
      const blob = await classroomApi.exportAssignmentExcel(classroomId, assignment.id, exportFilter)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Generate filename
      const safeTitle = assignment.title.replace(/[^a-zA-Z0-9]/g, '_')
      const dateStr = new Date().toISOString().split('T')[0]
      link.download = `Assignment_Results_${safeTitle}_${dateStr}.xlsx`

      document.body.appendChild(link)
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast.success('Excel file downloaded successfully')
    } catch (error) {
      toast.error('Failed to export Excel file')
      console.error('Export error:', error)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Results: ${assignment?.title || ''}`}>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : results ? (
          <>
            {/* Export Controls */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Export:</label>
                  <select
                    value={exportFilter}
                    onChange={(e) => setExportFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={exportLoading}
                  >
                    <option value="all">All Students</option>
                    <option value="submitted">Submitted Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>
                <button
                  onClick={handleExportExcel}
                  disabled={exportLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {exportLoading ? 'Generating...' : 'Download Excel'}
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{results.statistics.submitted_count}</div>
                <div className="text-xs text-blue-600">Submitted</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-red-600">{results.statistics.pending_count}</div>
                <div className="text-xs text-red-600">Pending</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{results.statistics.average_score}%</div>
                <div className="text-xs text-green-600">Average</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{results.statistics.completion_rate.toFixed(1)}%</div>
                <div className="text-xs text-purple-600">Completion</div>
              </div>
            </div>

            {/* Student Results */}
            <div className="max-h-64 overflow-y-auto">
              <h4 className="font-semibold mb-2 text-sm">Student Results ({results.student_results.length} students)</h4>
              <div className="space-y-2">
                {results.student_results.map((student) => (
                  <div key={student.student_id} className="flex justify-between items-center p-2 border rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{student.student_name}</div>
                      <div className="text-xs text-gray-500 truncate">{student.student_email}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {student.submitted ? (
                        <div className="space-y-1">
                          <div className={`font-semibold ${student.score_percentage >= 80 ? 'text-green-600' :
                            student.score_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {student.score_percentage}%
                          </div>
                          {student.is_late && <div className="text-xs text-red-500">Late</div>}
                        </div>
                      ) : (
                        <div className="text-yellow-600 text-xs font-medium">Pending</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load results
          </div>
        )}
      </div>
    </Modal>
  )
}

// Edit Assignment Modal
const EditModal = ({ isOpen, onClose, assignment, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    time_limit_minutes: 30,
    max_attempts: 1,
    allow_late_submission: false,
    show_results_immediately: true,
    negative_marking: false
  })
  const [loading, setLoading] = useState(false)
  const { updateAssignment } = useAssignmentActions()

  useEffect(() => {
    if (isOpen && assignment) {
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
        time_limit_minutes: assignment.time_limit_minutes || 30,
        max_attempts: assignment.max_attempts || 1,
        allow_late_submission: assignment.allow_late_submission || false,
        show_results_immediately: assignment.show_results_immediately || true,
        negative_marking: assignment.negative_marking || false // Add this line
      })
    }
  }, [isOpen, assignment])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updateAssignment(assignment.classroom_id, assignment.id, {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      })
      toast.success('Assignment updated successfully')
      onUpdate()
      onClose()
    } catch (error) {
      toast.error('Failed to update assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
            <input
              type="number"
              value={formData.time_limit_minutes}
              onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allow_late_submission}
              onChange={(e) => setFormData({ ...formData, allow_late_submission: e.target.checked })}
              className="mr-2"
            />
            Allow Late Submission
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.show_results_immediately}
              onChange={(e) => setFormData({ ...formData, show_results_immediately: e.target.checked })}
              className="mr-2"
            />
            Show Results Immediately
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.negative_marking}
              onChange={(e) => setFormData({ ...formData, negative_marking: e.target.checked })}
              className="mr-2"
            />
            Negative Marking
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Main component
const ClassroomAssignmentsPage = () => {
  const params = useParams()
  const router = useRouter()
  const [classroom, setClassroom] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(null)
  const [resultsModal, setResultsModal] = useState({ isOpen: false, assignment: null })
  const [editModal, setEditModal] = useState({ isOpen: false, assignment: null })
  const { deleteAssignment } = useAssignmentActions()

  const classroomId = params?.id

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

      const [classroomData, assignmentsData] = await Promise.all([
        classroomApi.getClassroomAnalytics(classroomId),
        classroomApi.getClassroomAssignments(classroomId)
      ])

      setClassroom(classroomData.classroom)
      console.log(classroomData)
      console.log(classroomData.classroom)

      setAssignments(assignmentsData)
      console.log(assignmentsData)

    } catch (error) {
      console.error('Error fetching data:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load assignments'
      setError(errorMessage)
      toast.error(errorMessage)

      if (error.response?.status === 404 || error.response?.status === 403) {
        setTimeout(() => {
          router.push('/teacher_dashboard')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (assignment) => {
    if (!confirm(`Are you sure you want to delete "${assignment.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteAssignment(classroomId, assignment.id)
      toast.success('Assignment deleted successfully')
      fetchData() // Refresh the list
    } catch (error) {
      toast.error('Failed to delete assignment')
    }
    setShowDropdown(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'expired': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  if (!classroomId || classroomId === 'undefined' || isNaN(parseInt(classroomId))) {
    return (
      <TeacherGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">Invalid Classroom</h2>
                <p className="text-red-600 mb-6">
                  The classroom ID is invalid or missing. Please check the URL and try again.
                </p>
                <Link href="/teacher_dashboard">
                  <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors">
                    Back to Dashboard
                  </button>
                </Link>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </TeacherGuard>
    )
  }

  if (error) {
    return (
      <TeacherGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Assignments</h2>
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
              className="mb-6"
            >
              <Link href={`/teacher_dashboard/classroom/${classroomId}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Classroom</span>
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Assignments</h1>
                <p className="text-slate-600 text-sm sm:text-base">{classroom?.name} - {assignments.length} assignments</p>
              </div>
              <Link href={`/teacher_dashboard/classroom/${classroomId}/assign-quiz`}>
                <motion.button
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 text-sm sm:text-base w-full sm:w-auto justify-center"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </motion.button>
              </Link>
            </motion.div>

            {/* Assignments Grid */}
            {assignments.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              >
                {assignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
                  >
                    {/* Assignment Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-1 truncate">
                            {assignment.title}
                          </h3>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === assignment.id ? null : assignment.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showDropdown === assignment.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button
                              onClick={() => {
                                setResultsModal({ isOpen: true, assignment })
                                setShowDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Results
                            </button>
                            <button
                              onClick={() => {
                                setEditModal({ isOpen: true, assignment })
                                setShowDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Assignment
                            </button>
                            <button
                              onClick={() => handleDelete(assignment)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignment Details */}
                    {assignment.description && (
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-bold text-slate-800">{assignment.completed_count || 0}</div>
                        <div className="text-xs text-slate-600">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-bold text-slate-800">{assignment.total_students || 0}</div>
                        <div className="text-xs text-slate-600">Total Students</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(((assignment.completed_count || 0) / (assignment.total_students || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                          style={{ width: `${((assignment.completed_count || 0) / (assignment.total_students || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Information */}
                    <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Created: {formatDate(assignment.created_at)}</span>
                      </div>
                      {assignment.due_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Due: {formatDate(assignment.due_date)}</span>
                        </div>
                      )}
                      {assignment.average_score > 0 && (
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>Avg Score: {assignment.average_score}%</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white rounded-2xl border border-slate-200"
              >
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No Assignments Yet</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto px-4">
                  Create your first assignment to start tracking student progress and performance.
                </p>
                <Link href={`/teacher_dashboard/classroom/${classroomId}/assign-quiz`}>
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create First Assignment
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modals */}
        <ResultsModal
          isOpen={resultsModal.isOpen}
          onClose={() => setResultsModal({ isOpen: false, assignment: null })}
          assignment={resultsModal.assignment}
          classroomId={classroomId}
        />

        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, assignment: null })}
          assignment={editModal.assignment}
          onUpdate={fetchData}
        />

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowDropdown(null)}
          />
        )}

        <Footer />
      </div>
    </TeacherGuard>
  )
}

export default ClassroomAssignmentsPage