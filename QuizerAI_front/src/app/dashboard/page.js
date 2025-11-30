// this is the dashboard for the user in which all the achievement , quiz and analytics and other things
'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  Users,
  FileText,
  Play,
  BarChart3,
  Plus,
  TrendingUp,
  Clock,
  Trophy,
  Target,
  BookOpen,
  Zap
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import DashboardStats from '@/components/dashboard/DashboardStats'

import QuickActions from '@/components/dashboard/QuickActions'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import quizairlogopng from "public/images/hero/qbl.png"
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { useAnalytics } from '@/utils/api/analyticsApi'
import QuizReviewContainer from '@/components/dashboard/QuizReviewContainer'
import StudentClassrooms from '@/components/student/StudentClassrooms'

const DashboardPage = () => {
  const { user } = useAuth()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <div>
      <Header></Header>
      <div className="min-h-screen bg-gradient-to-br pt-24 from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            {/* Welcome Header */}
            <motion.div variants={itemVariants} className="mb-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-800 mb-2">
                    Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!

                  </h1>
                  <p className="text-xl text-slate-600">
                    Ready to continue your learning journey? Let&apos;s make today productive.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Image src={quizairlogopng} className='rounded-lg'></Image>
                    {/* <Brain className="w-10 h-10 text-white" /> */}
                  </motion.div>
                </div>
              </div>
            </motion.div>



            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="mb-12">
              <QuickActions />
            </motion.div>


            {/* Dashboard Stats */}
            <motion.div variants={itemVariants} className="mb-12">
              <DashboardStats />
            </motion.div>

            {/* Student Classrooms - NEW */}
            <motion.div variants={itemVariants} className="mb-12">
              <StudentClassrooms />
            </motion.div>

            

             {/* qustion review section  */}
            <motion.div variants={itemVariants} className="mb-12">
              <QuizReviewContainer></QuizReviewContainer>
            </motion.div>


            <div className="grid lg:grid-cols-3 gap-8">
              {/* Performance Chart */}
              {/* <motion.div variants={itemVariants} className="lg:col-span-2">
                <PerformanceChart />
              </motion.div> */}

              {/* Recent Activity */}
              {/* <motion.div variants={itemVariants}>
                <RecentActivity />
              </motion.div> */}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}

export default DashboardPage

