'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Trophy,
  Brain,
  BookOpen,
  Calendar,
  Award,
  Zap,
  Activity,
  Download,
  RefreshCw,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle,
  Users,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Import your analytics API
import { useAnalytics, analyticsApi } from '@/utils/api/analyticsApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Responsive Hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return { isMobile }
}

// AnimatedCounter component
const AnimatedCounter = ({ end, suffix = '', duration = 1.5 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    const animate = (currentTime) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count}{suffix}</span>
}

// Overview Stats Cards Component
const OverviewStatsCards = ({ stats, loading }) => {
  const statCards = [
    {
      title: "Quizzes Completed",
      value: stats?.total_quizzes || 0,
      change: `+${stats?.this_month_quizzes || 0}`,
      changeType: "increase",
      icon: Brain,
      gradient: "from-blue-500 to-cyan-500",
      description: "This month"
    },
    {
      title: "Average Score",
      value: stats?.average_score || 0,
      suffix: "%",
      change: stats?.is_improving ? "+5%" : "0%",
      changeType: stats?.is_improving ? "increase" : "stable",
      icon: Target,
      gradient: "from-green-500 to-emerald-500",
      description: "Overall performance"
    },
    {
      title: "Study Hours",
      value: stats?.total_study_hours || 0,
      suffix: "h",
      change: stats?.monthly_change_percentage > 0 ? `+${stats.monthly_change_percentage}%` : "0%",
      changeType: stats?.monthly_change_percentage > 0 ? "increase" : "stable", 
      icon: Clock,
      gradient: "from-purple-500 to-pink-500",
      description: "Total logged"
    },
    {
      title: "Study Streak",
      value: stats?.current_streak || 0,
      change: "+1",
      changeType: "increase",
      icon: Trophy,
      gradient: "from-orange-500 to-red-500",
      description: "Days in a row"
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border animate-pulse">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-xl mb-3 lg:mb-4"></div>
            <div className="h-6 lg:h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 lg:h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 lg:h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group cursor-pointer"
        >
          <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>

          <div className="mb-2">
            <div className="text-2xl lg:text-3xl font-bold text-slate-800">
              <AnimatedCounter 
                end={stat.value} 
                suffix={stat.suffix || ''} 
                duration={1.5}
              />
            </div>
            <div className="text-xs lg:text-sm text-slate-600">{stat.title}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stat.changeType === 'increase' 
                ? 'bg-green-100 text-green-700' 
                : stat.changeType === 'decrease'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {stat.changeType === 'increase' && <ArrowUp className="w-3 h-3" />}
              {stat.changeType === 'decrease' && <ArrowDown className="w-3 h-3" />}
              {stat.changeType === 'stable' && <Minus className="w-3 h-3" />}
              {stat.change}
            </div>
            <div className="text-xs text-slate-500">{stat.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Performance Chart Component
const PerformanceChart = ({ data, loading }) => {
  const [chartType, setChartType] = useState('line')
  const [timeRange, setTimeRange] = useState('30d')
  const { isMobile } = useResponsive()

  if (loading || !data?.performance_trends) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 mb-6 lg:mb-8">
        <div className="animate-pulse">
          <div className="h-4 lg:h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 lg:h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const chartData = {
    labels: data.performance_trends.labels || [],
    datasets: [
      {
        label: 'Quiz Scores (%)',
        data: data.performance_trends.performance_data?.scores || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Study Hours',
        data: data.performance_trends.performance_data?.study_hours || [],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: isMobile ? 10 : 20,
          font: { size: isMobile ? 11 : 14, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: isMobile ? 8 : 12
      }
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { 
          font: { size: isMobile ? 10 : 12 }, 
          color: '#64748b',
          maxTicksLimit: isMobile ? 5 : 10
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { 
          font: { size: isMobile ? 10 : 12 }, 
          color: '#64748b' 
        },
        title: { 
          display: !isMobile,
          text: 'Score (%)',
          font: { size: isMobile ? 10 : 12 }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { 
          font: { size: isMobile ? 10 : 12 }, 
          color: '#64748b' 
        },
        title: { 
          display: !isMobile,
          text: 'Hours',
          font: { size: isMobile ? 10 : 12 }
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 mb-6 lg:mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-semibold text-slate-800">Performance Trends</h3>
            <p className="text-xs lg:text-sm text-slate-600">
              {data.performance_trends.trend_direction === 'improving' ? 'Trending upward' : 
               data.performance_trends.trend_direction === 'declining' ? 'Needs attention' : 'Stable performance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3 w-full sm:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="appearance-none bg-slate-100 text-slate-700 px-3 lg:px-4 py-2 pr-6 lg:pr-8 rounded-lg font-medium text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
          </select>
          
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="h-64 lg:h-80 mb-4 lg:mb-6 overflow-hidden">
        {chartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      <div className="flex items-center justify-center gap-2 px-2 lg:px-4">
        <button
          onClick={() => setChartType('line')}
          className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all flex-1 sm:flex-none ${
            chartType === 'line'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Line Chart
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all flex-1 sm:flex-none ${
            chartType === 'bar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Bar Chart
        </button>
      </div>
    </div>
  )
}

// Subject Analytics Component
const SubjectAnalytics = ({ data, loading }) => {
  if (loading || !data?.subject_analytics) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 mb-6 lg:mb-8">
        <div className="animate-pulse">
          <div className="h-4 lg:h-6 bg-gray-200 rounded w-1/3 mb-4 lg:mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 lg:h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const subjects = data.subject_analytics.subjects || []

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 mb-6 lg:mb-8">
        <div className="text-center py-6 lg:py-8">
          <BookOpen className="w-10 h-10 lg:w-12 lg:h-12 text-slate-400 mx-auto mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-slate-600 mb-2">No Subject Data Yet</h3>
          <p className="text-sm lg:text-base text-slate-500">Complete more quizzes to see subject-wise analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 mb-6 lg:mb-8">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-semibold text-slate-800">Subject Performance</h3>
            <p className="text-xs lg:text-sm text-slate-600">
              {data.subject_analytics.best_subject && (
                <>Best: {data.subject_analytics.best_subject}</>
              )}
              {data.subject_analytics.most_practiced_subject && (
                <> • Most Practiced: {data.subject_analytics.most_practiced_subject}</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.subject}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 lg:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <div className="flex items-center gap-2 lg:gap-3">
                <h4 className="font-semibold text-slate-800 text-sm lg:text-base">{subject.subject}</h4>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  subject.trend === 'improving' 
                    ? 'bg-green-100 text-green-700' 
                    : subject.trend === 'declining'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {subject.trend === 'improving' && <TrendingUp className="w-3 h-3" />}
                  {subject.trend === 'declining' && <TrendingDown className="w-3 h-3" />}
                  {subject.trend === 'stable' && <Minus className="w-3 h-3" />}
                  <span className="hidden sm:inline">{subject.trend}</span>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-slate-800">{subject.average_score}%</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-4 text-xs lg:text-sm">
              <div>
                <div className="text-slate-600">Quizzes</div>
                <div className="font-semibold">{subject.total_quizzes}</div>
              </div>
              <div>
                <div className="text-slate-600">Best Score</div>
                <div className="font-semibold">{subject.best_score}%</div>
              </div>
              <div>
                <div className="text-slate-600">Time Spent</div>
                <div className="font-semibold">{subject.total_time_hours}h</div>
              </div>
              <div>
                <div className="text-slate-600">Progress</div>
                <div className={`font-semibold ${
                  subject.trend === 'improving' ? 'text-green-600' : 
                  subject.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {subject.trend}
                </div>
              </div>
            </div>

            {/* Progress bar for average score */}
            <div className="mt-2 lg:mt-3">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    subject.average_score >= 90 ? 'bg-green-500' :
                    subject.average_score >= 80 ? 'bg-blue-500' :
                    subject.average_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.average_score}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Recent Activity Component
const RecentActivity = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100">
        <div className="animate-pulse">
          <div className="h-4 lg:h-6 bg-gray-200 rounded w-1/3 mb-4 lg:mb-6"></div>
          <div className="space-y-3 lg:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 lg:gap-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 lg:h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 lg:h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100">
        <div className="text-center py-6 lg:py-8">
          <Activity className="w-10 h-10 lg:w-12 lg:h-12 text-slate-400 mx-auto mb-3 lg:mb-4" />
          <h3 className="text-base lg:text-lg font-semibold text-slate-600 mb-2">No Recent Activity</h3>
          <p className="text-sm lg:text-base text-slate-500">Complete some quizzes to see your activity here</p>
        </div>
      </div>
    )
  }

  const getPerformanceColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'average': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-red-600 bg-red-100'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-semibold text-slate-800">Recent Activity</h3>
            <p className="text-xs lg:text-sm text-slate-600">Your latest quiz completions</p>
          </div>
        </div>
        <button className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {activities.map((activity) => (
          <motion.div
            key={activity.session_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 lg:gap-4 p-2 lg:p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-slate-800 truncate text-sm lg:text-base pr-2">{activity.quiz_title}</h4>
                <div className="text-lg lg:text-2xl font-bold text-slate-800 flex-shrink-0">{activity.score}%</div>
              </div>
              
              <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm text-slate-600 flex-wrap">
                <span className="truncate">{activity.subject}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs">{formatDate(activity.completion_date)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs">{activity.time_taken_minutes}m</span>
              </div>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPerformanceColor(activity.performance_level)}`}>
              <span className="hidden sm:inline">{activity.performance_level}</span>
              <span className="sm:hidden">{activity.performance_level.charAt(0).toUpperCase()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Main Dashboard Component
const RealAnalyticsDashboard = () => {
  const { data, loading, error, refetch } = useAnalytics()

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 lg:w-12 lg:h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg lg:text-xl font-semibold text-slate-800 mb-2">Failed to load analytics</h2>
          <p className="text-sm lg:text-base text-slate-600 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Handle case where user has no saved data
  if (data && !data.has_data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto text-center pt-12 lg:pt-20">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8">
            <BarChart3 className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-3 lg:mb-4">Your Analytics Dashboard</h1>
          <p className="text-base lg:text-lg text-slate-600 mb-6 lg:mb-8 max-w-2xl mx-auto px-4">
            Complete and save some quizzes to start seeing your personalized learning analytics and insights.
          </p>
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 max-w-md mx-auto">
            <BookOpen className="w-10 h-10 lg:w-12 lg:h-12 text-blue-500 mx-auto mb-3 lg:mb-4" />
            <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-2">Get Started</h3>
            <p className="text-sm lg:text-base text-slate-600 mb-4">
              Take your first quiz and click &quot;Save to Dashboard&quot; to start building your learning profile.
            </p>
            <button className="w-full px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Browse Quizzes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
            <p className="text-sm lg:text-base text-slate-600">Track your learning progress and insights</p>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3 w-full sm:w-auto">
            <button 
              onClick={refetch}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 lg:w-5 lg:h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm lg:text-base">
              <Download className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <OverviewStatsCards stats={data?.overview} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-8">
            <PerformanceChart data={data} loading={loading} />
            <SubjectAnalytics data={data} loading={loading} />
          </div>

          {/* Right Column - Activity */}
          <div className="space-y-6 lg:space-y-8">
            <RecentActivity activities={data?.recent_activity || []} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealAnalyticsDashboard