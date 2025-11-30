'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { TeacherGuard } from '@/components/auth/RoleGuard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import TeacherStats from '@/components/teacher/TeacherStats'
import ClassroomList from '@/components/teacher/ClassroomList'
import QuickActions from '@/components/teacher/QuickActions'
import { Users, BookOpen, BarChart3, Plus } from 'lucide-react'

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <TeacherGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
       
        <div className="container mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-24">
          <div className="max-w-7xl mx-auto">
           
            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-1 sm:mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600">
                Manage your classrooms, assignments, and student progress
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 sm:mb-8"
            >
              <QuickActions />
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <TeacherStats />
            </motion.div>

            {/* Main Content Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
                {/* Tab Navigation */}
                <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
                  <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'overview', label: 'My Classrooms', icon: Users },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">Classrooms</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6">
                  {activeTab === 'overview' && <ClassroomList />}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
       
        <Footer />
      </div>
    </TeacherGuard>
  )
}

export default TeacherDashboard