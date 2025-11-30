/*
 * ClassroomCard Component
 * 
 * Purpose: Display collaborative classroom information with join/manage actions
 * Features:
 * - Real-time participant count and status indicators
 * - Classroom metadata display (subject, schedule, access level)
 * - Quick action buttons for joining or managing sessions
 * - Activity indicators and recent session summaries
 * - Visual status representations for active/scheduled/completed sessions
 * 
 * Usage: Classroom listing and dashboard quick access
 */

'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  Clock, 
  Calendar, 
  Lock,
  Unlock,
  Play,
  Settings,
  BarChart3,
  MessageSquare,
  User,
  Crown
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

const ClassroomCard = ({ 
  classroom, 
  userRole = 'student',
  onJoin, 
  onManage, 
  onViewAnalytics,
  className 
}) => {
  const {
    id,
    name,
    description,
    subject,
    instructor,
    participantCount,
    maxParticipants,
    status, // active, scheduled, completed
    isPublic,
    nextSession,
    lastActivity,
    recentQuizzes,
    averageScore,
    completionRate
  } = classroom

  const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const statusLabels = {
    active: 'Live Session',
    scheduled: 'Scheduled',
    completed: 'Completed'
  }

  const getActionButton = () => {
    if (userRole === 'teacher' || userRole === 'instructor') {
      return (
        <div className="flex gap-2">
          <motion.button
            onClick={() => onManage(id)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-4 h-4" />
            Manage
          </motion.button>
          <motion.button
            onClick={() => onViewAnalytics(id)}
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </motion.button>
        </div>
      )
    }

    if (status === 'active') {
      return (
        <motion.button
          onClick={() => onJoin(id)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play className="w-4 h-4" />
          Join Session
        </motion.button>
      )
    }

    if (status === 'scheduled') {
      return (
        <motion.button
          disabled
          className="flex items-center gap-2 bg-slate-300 text-slate-600 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
        >
          <Clock className="w-4 h-4" />
          Scheduled
        </motion.button>
      )
    }

    return (
      <motion.button
        onClick={() => onJoin(id)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Users className="w-4 h-4" />
        View Details
      </motion.button>
    )
  }

  return (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-soft border border-slate-100 hover:shadow-medium transition-all duration-300 ${className}`}
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-slate-800">{name}</h3>
            <div className={`px-2 py-1 border rounded-full text-xs font-medium ${statusColors[status]}`}>
              {statusLabels[status]}
            </div>
          </div>
          
          <p className="text-slate-600 text-sm mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="font-medium text-blue-600">{subject}</span>
            <div className="flex items-center gap-1">
              {isPublic ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isPublic ? 'Public' : 'Private'}</span>
            </div>
          </div>
        </div>

        {status === 'active' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">Live</span>
          </div>
        )}
      </div>

      {/* Instructor Info */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold">
          {instructor?.name?.charAt(0) || 'T'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{instructor?.name || 'Unknown Instructor'}</span>
            <Crown className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="text-sm text-slate-600">{instructor?.title || 'Instructor'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold text-slate-800">
              {participantCount}
              {maxParticipants && `/${maxParticipants}`}
            </span>
          </div>
          <span className="text-xs text-slate-600">Participants</span>
        </div>

        {recentQuizzes && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="text-lg font-bold text-slate-800">{recentQuizzes}</span>
            </div>
            <span className="text-xs text-slate-600">Recent Quizzes</span>
          </div>
        )}

        {averageScore && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-lg font-bold text-slate-800">{averageScore}%</span>
            </div>
            <span className="text-xs text-slate-600">Avg Score</span>
          </div>
        )}
      </div>

      {/* Session Info */}
      {nextSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Next Session</span>
          </div>
          <p className="text-blue-700 text-sm">
            {formatDate(nextSession)} at {formatTime(nextSession)}
          </p>
        </div>
      )}

      {lastActivity && (
        <div className="text-xs text-slate-500 mb-4">
          Last activity: {formatDate(lastActivity)}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        {getActionButton()}
      </div>
    </motion.div>
  )
}

export default ClassroomCard
