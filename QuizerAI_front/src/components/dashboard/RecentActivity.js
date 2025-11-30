'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  Users, 
  FileText, 
  Play,
  Clock,
  TrendingUp,
  CheckCircle,
  MoreHorizontal
} from 'lucide-react'

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: "quiz_completed",
      title: "Biology Chapter 5 Quiz",
      description: "Scored 92% on Cellular Respiration",
      icon: Brain,
      color: "text-blue-600 bg-blue-100",
      time: "2 hours ago",
      score: 92
    },
    {
      id: 2,
      type: "classroom_joined",
      title: "Physics Study Group",
      description: "Joined collaborative session",
      icon: Users,
      color: "text-green-600 bg-green-100",
      time: "5 hours ago",
      participants: 8
    },
    {
      id: 3,
      type: "paper_processed",
      title: "JEE Main 2023 Paper",
      description: "Question paper digitized successfully",
      icon: FileText,
      color: "text-purple-600 bg-purple-100",
      time: "1 day ago",
      questions: 30
    },
    {
      id: 4,
      type: "video_processed",
      title: "Calculus Tutorial",
      description: "Generated notes from Khan Academy video",
      icon: Play,
      color: "text-red-600 bg-red-100",
      time: "2 days ago",
      duration: "45 min"
    },
    {
      id: 5,
      type: "quiz_completed",
      title: "Chemistry Practice Test",
      description: "Organic Chemistry fundamentals",
      icon: Brain,
      color: "text-blue-600 bg-blue-100",
      time: "3 days ago",
      score: 78
    }
  ]

  const getActivityDetails = (activity) => {
    switch (activity.type) {
      case 'quiz_completed':
        return (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">{activity.score}%</span>
          </div>
        )
      case 'classroom_joined':
        return (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 font-medium">{activity.participants} participants</span>
          </div>
        )
      case 'paper_processed':
        return (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">{activity.questions} questions</span>
          </div>
        )
      case 'video_processed':
        return (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-orange-600 font-medium">{activity.duration}</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Recent Activity</h3>
        <motion.button
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MoreHorizontal className="w-5 h-5 text-slate-600" />
        </motion.button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.color} group-hover:scale-110 transition-transform duration-200`}>
              <activity.icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-slate-800 truncate">
                  {activity.title}
                </h4>
                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                  {activity.time}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 mb-2">
                {activity.description}
              </p>
              
              {getActivityDetails(activity)}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="w-full mt-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        View All Activity
      </motion.button>
    </div>
  )
}

export default RecentActivity