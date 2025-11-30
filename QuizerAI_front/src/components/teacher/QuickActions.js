'use client'

import { motion } from 'framer-motion'
import { Plus, Users, FileText, BarChart3, Settings, Upload } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const QuickActions = () => {
  const params = useParams()
  const classroomId = params.id // Get the dynamic ID from the URL

  const actions = [
    {
      title: 'Create Classroom',
      description: 'Set up a new classroom for your students',
      icon: Plus,
      href: '/teacher_dashboard/create_classroom',
      gradient: 'from-blue-500 to-cyan-500',
      primary: true
    },
    {
      title: 'Generate Quiz',
      description: 'Create quiz from documents or URLs',
      icon: FileText,
      href: '/dashboard/quizzes/create',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'View Analytics',
      description: 'Track student progress and performance',
      icon: BarChart3,
      href: '/teacher_dashboard/analytics',
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action, index) => (
          <Link key={action.title} href={action.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 cursor-pointer group ${
                action.primary ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                {action.title}
              </h3>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                {action.description}
              </p>
              
              {action.primary && (
                <div className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <Plus className="w-3 h-3" />
                  Start Here
                </div>
              )}
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions