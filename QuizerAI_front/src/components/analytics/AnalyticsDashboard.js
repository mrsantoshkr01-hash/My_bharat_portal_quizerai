'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Brain,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import PerformanceHeatmap from './PerformanceHeatmap'
import ProgressChart from './ProgressChart'
import ComparisonChart from './ComparisonChart'

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d')
  const [subject, setSubject] = useState('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, subject])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setData({
        overview: {
          totalQuizzes: 47,
          averageScore: 82,
          studyHours: 156,
          improvement: 15,
          streak: 12,
          rank: 3
        },
        subjects: [
          { name: 'Mathematics', score: 85, quizzes: 15, hours: 45, trend: 'up' },
          { name: 'Physics', score: 78, quizzes: 12, hours: 38, trend: 'up' },
          { name: 'Chemistry', score: 81, quizzes: 10, hours: 32, trend: 'down' },
          { name: 'Biology', score: 87, quizzes: 10, hours: 41, trend: 'up' }
        ],
        weeklyProgress: [
          { week: 'Week 1', score: 75, quizzes: 8, hours: 12 },
          { week: 'Week 2', score: 78, quizzes: 10, hours: 15 },
          { week: 'Week 3', score: 82, quizzes: 12, hours: 18 },
          { week: 'Week 4', score: 85, quizzes: 15, hours: 22 }
        ]
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <div style={{'--i': 0}}></div>
            <div style={{'--i': 1}}></div>
            <div style={{'--i': 2}}></div>
          </div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Learning Analytics</h1>
                <p className="text-lg text-slate-600">Track your progress and identify areas for improvement</p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 3 months</option>
                  <option value="1y">Last year</option>
                </select>
                
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Subjects</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                </select>
                
                <motion.button
                  onClick={fetchAnalyticsData}
                  disabled={loading}
                  className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
                
                <motion.button
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Overview Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {[
              { label: 'Total Quizzes', value: data.overview.totalQuizzes, icon: Brain, color: 'blue', change: '+5' },
              { label: 'Average Score', value: `${data.overview.averageScore}%`, icon: Target, color: 'green', change: '+8%' },
              { label: 'Study Hours', value: data.overview.studyHours, icon: Clock, color: 'purple', change: '+12h' },
              { label: 'Improvement', value: `+${data.overview.improvement}%`, icon: TrendingUp, color: 'emerald', change: 'This month' },
              { label: 'Study Streak', value: `${data.overview.streak} days`, icon: Award, color: 'orange', change: 'Current' },
              { label: 'Class Rank', value: `#${data.overview.rank}`, icon: Users, color: 'pink', change: 'Top 5%' }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-${metric.color}-100 rounded-xl flex items-center justify-center`}>
                    <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                  </div>
                  <span className="text-xs font-medium text-green-600">{metric.change}</span>
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{metric.value}</div>
                <div className="text-sm text-slate-600">{metric.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Progress Chart */}
            <motion.div variants={itemVariants} className="xl:col-span-2">
              <ProgressChart data={data.weeklyProgress} timeRange={timeRange} />
            </motion.div>

            {/* Subject Performance */}
            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 h-full">
                <h3 className="text-xl font-semibold text-slate-800 mb-6">Subject Performance</h3>
                <div className="space-y-4">
                  {data.subjects.map((subject, index) => (
                    <motion.div
                      key={subject.name}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{subject.name}</h4>
                        <p className="text-sm text-slate-600">{subject.quizzes} quizzes • {subject.hours}h</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800">{subject.score}%</div>
                        <div className={`text-sm ${subject.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {subject.trend === 'up' ? '↗' : '↘'} {subject.trend === 'up' ? '+' : '-'}3%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Performance Heatmap */}
          <motion.div variants={itemVariants} className="mb-8">
            <PerformanceHeatmap />
          </motion.div>

          {/* Comparison Chart */}
          <motion.div variants={itemVariants}>
            <ComparisonChart />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard