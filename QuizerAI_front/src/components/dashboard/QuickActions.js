'use client'

import { motion } from 'framer-motion'
import { 
  Plus, 
  Brain, 
  FileText, 
  Play, 
  Users, 
  BookOpen,
  Upload,
  Zap
} from 'lucide-react'
import Link from 'next/link'

const QuickActions = () => {
  const actions = [
    {
      title: "Generate Quiz & Summary",
      description: "Create quiz from any content instantly",
      icon: Brain,
      href: "/dashboard/quizzes/create",
      gradient: "from-blue-500 to-cyan-500",
      featured: true
    },
    // {
    //   title: "Upload Question Paper",
    //   description: "Digitize past papers into practice tests",
    //   icon: FileText,
    //   href: "/dashboard/question-papers/upload",
    //   gradient: "from-purple-500 to-pink-500"
    // },
    {
      title: "Process YouTube Video",
      description: "Convert videos to notes and quizzes",
      icon: Play,
      href: "/dashboard/youtube/process",
      gradient: "from-red-500 to-orange-500"
    },
    // {
    //   title: "Create Classroom",
    //   description: "Start collaborative study session",
    //   icon: Users,
    //   href: "/dashboard/classrooms/create",
    //   gradient: "from-green-500 to-emerald-500"
    // },
    {
      title: "AI Tutor",
      description: "Get instant help with any topic",
      icon: Zap,
      href: "/ai_tutor",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      title: "View Analytics",
      description: "Track your learning progress",
      icon: BookOpen,
      href: "/dashboard/analytics",
      gradient: "from-teal-500 to-cyan-500"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Quick Actions</h2>
        <motion.div
          className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full"
          animate={{ 
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          ✨ Choose your next step
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {actions.map((action, index) => (
          <Link key={action.title} href={action.href}>
            <motion.div
              variants={itemVariants}
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className={`relative bg-white rounded-2xl p-6 shadow-soft border border-slate-100 hover:shadow-hard transition-all duration-300 group cursor-pointer overflow-hidden ${
                action.featured ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
              }`}
            >
              {/* Featured badge */}
              {action.featured && (
                <div className="absolute top-4 right-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                {action.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {action.description}
              </p>

              {/* Plus icon */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-slate-600" />
                </div>
              </div>

              {/* Background gradient effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}

export default QuickActions