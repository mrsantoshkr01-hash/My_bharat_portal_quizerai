'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  User,
  ArrowRight
} from 'lucide-react'
import { useEnrolledClassrooms } from '@/utils/api/classroomApi'
import JoinClassroomModal from './JoinClassroomModal'
import Link from 'next/link'

const StudentClassrooms = () => {
  const { data: classrooms, loading, refetch } = useEnrolledClassrooms()
  const [showJoinModal, setShowJoinModal] = useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">My Classrooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Classrooms</h2>
        <motion.button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Join Classroom
        </motion.button>
      </div>

      {!classrooms || classrooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-2xl border border-slate-200"
        >
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">No Classrooms Yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Join your first classroom using a join code from your teacher to start accessing assignments and tracking your progress.
          </p>
          <motion.button
            onClick={() => setShowJoinModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join First Classroom
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((enrollment, index) => {
            const classroom = enrollment.classroom
            
            return (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {classroom.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                    {classroom.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-2">{classroom.subject}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3 h-3" />
                    <span>{enrollment.teacher_name}</span>
                    <span>•</span>
                    <span>Joined {formatDate(enrollment.joined_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-slate-800">{classroom.student_count}</div>
                    <div className="text-xs text-slate-600">Students</div>
                  </div>
                  <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-600">{enrollment.pending_assignments}</div>
                    <div className="text-xs text-slate-600">Pending</div>
                  </div>
                </div>

                {enrollment.pending_assignments > 0 && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{enrollment.pending_assignments} assignment{enrollment.pending_assignments !== 1 ? 's' : ''} due</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/student/classroom/${classroom.id}`} className="flex-1">
                    <motion.button 
                      className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View Classroom
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                  <Link href={`/student/classroom/${classroom.id}/assignments`}>
                    <motion.button 
                      className="bg-white bg-opacity-80 text-slate-700 py-2.5 px-3 rounded-lg hover:bg-opacity-100 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <JoinClassroomModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          refetch()
          setShowJoinModal(false)
        }}
      />
    </div>
  )
}

export default StudentClassrooms