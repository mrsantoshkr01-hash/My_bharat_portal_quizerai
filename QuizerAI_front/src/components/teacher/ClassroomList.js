'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Calendar, MoreVertical, Settings, Eye, Trash2, Copy, ExternalLink, Archive, AlertTriangle } from 'lucide-react'
import { useMyClassrooms, classroomApi, useClassroomActions } from '@/utils/api/classroomApi'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ClassroomList = () => {
  const { data: classrooms, loading, refetch } = useMyClassrooms()
  const { archiveClassroom, permanentlyDelete, loading: actionLoading, error } = useClassroomActions()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(null)
  const [deleteStep, setDeleteStep] = useState('confirm')

  const handleCopyJoinCode = async (joinCode) => {
    try {
      await navigator.clipboard.writeText(joinCode)
      toast.success('Join code copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy join code')
    }
  }

  const handleArchive = async (classroom) => {
    if (window.confirm(`Archive "${classroom.name}"?\n\nThis will:\n- Remove all students from the classroom\n- Cancel any draft assignments\n- Hide the classroom from your active list\n\nYou can restore it later if needed.`)) {
      try {
        const result = await archiveClassroom(classroom.id)
        toast.success(result.message || 'Classroom archived successfully')
        refetch()
        setActiveDropdown(null)
      } catch (err) {
        toast.error(err.message || 'Failed to archive classroom')
      }
    }
  }

  const handlePermanentDelete = async (classroom) => {
    try {
      const result = await permanentlyDelete(classroom.id)
      toast.success(result.message || 'Classroom permanently deleted')
      refetch()
      setShowDeleteDialog(null)
      setDeleteStep('confirm')
    } catch (err) {
      toast.error(err.message || 'Failed to delete classroom')
    }
  }

  const openDeleteDialog = (classroom) => {
    setShowDeleteDialog(classroom)
    setDeleteStep('confirm')
    setActiveDropdown(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setActiveDropdown(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 sm:p-6 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
              <div className="space-y-2">
                <div className="h-5 sm:h-6 bg-slate-200 rounded w-32 sm:w-48"></div>
                <div className="h-3 sm:h-4 bg-slate-200 rounded w-24 sm:w-32"></div>
              </div>
              <div className="h-6 sm:h-8 bg-slate-200 rounded w-16 sm:w-24"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="h-12 sm:h-16 bg-slate-200 rounded"></div>
              <div className="h-12 sm:h-16 bg-slate-200 rounded"></div>
              <div className="hidden sm:block h-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!classrooms || classrooms.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <Users className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">No Classrooms Yet</h3>
        <p className="text-slate-500 mb-4 sm:mb-6 text-sm sm:text-base">Create your first classroom to start managing students and assignments</p>
        <Link href="/teacher_dashboard/create_classroom">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 text-sm sm:text-base">
            Create First Classroom
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-800">
          My Classrooms ({classrooms.length})
        </h3>
        <Link href="/teacher_dashboard/create_classroom">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto">
            Create New
          </button>
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {classrooms.map((classroom, index) => (
          <motion.div
            key={classroom.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100 hover:shadow-md transition-all duration-300"
          >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{classroom.name}</h4>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                    classroom.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {classroom.status}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-slate-600 text-sm sm:text-base">
                  <span className="font-medium">{classroom.subject}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-xs sm:text-sm">Created {formatDate(classroom.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="text-center sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{classroom.join_code}</div>
                  <div className="text-xs text-slate-500">Join Code</div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === classroom.id ? null : classroom.id)}
                    className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors duration-200"
                  >
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === classroom.id && (
                      <>
                        {/* Backdrop for mobile */}
                        <div 
                          className="fixed inset-0 z-10 sm:hidden" 
                          onClick={handleClickOutside}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-48 z-20"
                        >
                          <Link href={`/teacher_dashboard/classroom/${classroom.id}`}>
                            <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left text-sm">
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </Link>
                          
                          <button
                            onClick={() => handleCopyJoinCode(classroom.join_code)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Join Code
                          </button>
                          
                          <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left text-sm">
                            <Settings className="w-4 h-4" />
                            Settings
                          </button>
                          
                          <hr className="my-2" />
                          
                          <button
                            onClick={() => handleArchive(classroom)}
                            disabled={actionLoading}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-yellow-50 text-yellow-600 transition-colors text-left disabled:opacity-50 text-sm"
                          >
                            <Archive className="w-4 h-4" />
                            {actionLoading ? 'Archiving...' : 'Archive'}
                          </button>
                          
                          <button
                            onClick={() => openDeleteDialog(classroom)}
                            disabled={actionLoading}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors text-left disabled:opacity-50 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Permanent Delete
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Stats Section - Only Students and Quizzes Assigned */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white bg-opacity-60 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-800">{classroom.student_count}</div>
                <div className="text-xs sm:text-sm text-slate-600">Students</div>
              </div>
              
              <div className="bg-white bg-opacity-60 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-800">{classroom.total_quizzes_assigned}</div>
                <div className="text-xs sm:text-sm text-slate-600">Quizzes Assigned</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/teacher_dashboard/classroom/${classroom.id}/assignments`} className="flex-1">
                <button className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base">
                  Manage Assignments
                </button>
              </Link>
              
              <Link href={`/teacher_dashboard/classroom/${classroom.id}`} className="flex-1 sm:flex-initial">
                <button className="w-full bg-white bg-opacity-80 text-slate-700 py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium hover:bg-opacity-100 transition-all duration-200 text-sm sm:text-base">
                  View Details
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">Delete Classroom</h3>
                  <p className="text-slate-600 text-sm sm:text-base truncate">&quot;{showDeleteDialog.name}&quot;</p>
                </div>
              </div>

              {deleteStep === 'confirm' ? (
                <>
                  <div className="mb-6">
                    <p className="text-slate-700 mb-4 text-sm sm:text-base">
                      Are you sure you want to permanently delete this classroom? This action:
                    </p>
                    <ul className="text-sm text-red-600 bg-red-50 p-3 rounded-lg list-disc list-inside space-y-1">
                      <li>Cannot be undone</li>
                      <li>Will remove all students</li>
                      <li>Will delete all assignments and data</li>
                      <li>May prevent deletion if students have submissions</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowDeleteDialog(null)}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDeleteStep('permanent')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-slate-700 mb-3 text-sm sm:text-base">
                      Type <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">DELETE</span> to confirm permanent deletion:
                    </p>
                    <input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value === 'DELETE') {
                          handlePermanentDelete(showDeleteDialog)
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setDeleteStep('confirm')}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={(e) => {
                        const input = e.target.parentElement.parentElement.querySelector('input')
                        if (input.value === 'DELETE') {
                          handlePermanentDelete(showDeleteDialog)
                        } else {
                          toast.error('Please type DELETE to confirm')
                        }
                      }}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      {actionLoading ? 'Deleting...' : 'Delete Forever'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ClassroomList