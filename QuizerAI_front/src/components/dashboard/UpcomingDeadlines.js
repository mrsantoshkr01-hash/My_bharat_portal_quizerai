/**
 * UpcomingDeadlines Component
 * 
 * Purpose: Display upcoming quiz deadlines and important dates
 * Features:
 * - Chronological deadline listing with priority indicators
 * - Calendar integration and reminders
 * - Quick action buttons for immediate access
 * - Color-coded urgency levels
 * - Countdown timers for critical deadlines
 * 
 * Usage: Dashboard sidebar widget for deadline awareness
 */

'use client'

import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  Plus,
  Bell
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

const UpcomingDeadlines = ({ data }) => {
  const deadlines = data || [
    {
      id: 1,
      title: "Physics Quiz - Chapter 5",
      type: "quiz",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      priority: "high",
      subject: "Physics",
      completed: false
    },
    {
      id: 2,
      title: "Math Assignment",
      type: "assignment",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      priority: "medium",
      subject: "Mathematics",
      completed: false
    },
    {
      id: 3,
      title: "Chemistry Lab Report",
      type: "report",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      priority: "low",
      subject: "Chemistry",
      completed: true
    }
  ]

  const getUrgencyLevel = (dueDate) => {
    const now = new Date()
    const timeUntil = dueDate - now
    const daysUntil = timeUntil / (1000 * 60 * 60 * 24)
    
    if (daysUntil < 1) return 'critical'
    if (daysUntil < 3) return 'high'
    if (daysUntil < 7) return 'medium'
    return 'low'
  }

  const getUrgencyColors = (urgency, completed) => {
    if (completed) return 'bg-green-100 text-green-700 border-green-200'
    
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getTimeRemaining = (dueDate) => {
    const now = new Date()
    const timeUntil = dueDate - now
    const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24))
    const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (daysUntil > 0) {
      return `${daysUntil} day${daysUntil > 1 ? 's' : ''}`
    } else if (hoursUntil > 0) {
      return `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`
    } else {
      return 'Due soon'
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Upcoming Deadlines</h3>
        <motion.button
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-5 h-5 text-slate-600" />
        </motion.button>
      </div>

      <div className="space-y-4">
        {deadlines.length > 0 ? (
          deadlines.map((deadline, index) => {
            const urgency = getUrgencyLevel(deadline.dueDate)
            const urgencyColors = getUrgencyColors(urgency, deadline.completed)
            
            return (
              <motion.div
                key={deadline.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  deadline.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className={`font-medium mb-1 ${
                        deadline.completed ? 'text-green-800 line-through' : 'text-slate-800'
                      }`}>
                        {deadline.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium text-blue-600">{deadline.subject}</span>
                        <span>•</span>
                        <span className="capitalize">{deadline.type}</span>
                      </div>
                    </div>
                    
                    {deadline.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className={`px-2 py-1 border rounded-full text-xs font-medium ${urgencyColors}`}>
                        {urgency === 'critical' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {getTimeRemaining(deadline.dueDate)}
                      </div>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(deadline.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(deadline.dueDate)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!deadline.completed && (
                    <div className="flex items-center gap-2">
                      <motion.button
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        whileHover={{ x: 2 }}
                      >
                        <span>Start Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </motion.button>
                      
                      <motion.button
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Bell className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}

                  {/* Urgency Indicator */}
                  {!deadline.completed && urgency === 'critical' && (
                    <motion.div
                      className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">No upcoming deadlines</p>
            <p className="text-sm text-slate-500">You&apos;re all caught up!</p>
          </div>
        )}
      </div>

      {deadlines.length > 3 && (
        <motion.button
          className="w-full mt-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View All Deadlines
        </motion.button>
      )}
    </div>
  )
}

export default UpcomingDeadlines