'use client'

import { motion } from 'framer-motion'
import { Users, BookOpen, TrendingUp, Clock, Award, Target } from 'lucide-react'
import { useMyClassrooms } from '@/utils/api/classroomApi'

const TeacherStats = () => {
  const { data: classrooms, loading } = useMyClassrooms()

  const stats = [
    {
      title: 'Active Classrooms',
      value: classrooms?.length || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      change: '+2 this month'
    },
    {
      title: 'Total Students',
      value: classrooms?.reduce((sum, c) => sum + (c.student_count || 0), 0) || 0,
      icon: Target,
      color: 'text-green-600', 
      bg: 'bg-green-100',
      change: '+12 this week'
    },
    {
      title: 'Quizzes Assigned',
      value: classrooms?.reduce((sum, c) => sum + (c.total_quizzes_assigned || 0), 0) || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      change: '+5 this week'
    }
  ]

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {stat.change}
              </div>
            </div>
            
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {stat.value}
            </div>
            
            <div className="text-sm text-slate-600">
              {stat.title}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default TeacherStats