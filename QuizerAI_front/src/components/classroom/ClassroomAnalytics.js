'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Award,
  Download,
  Calendar,
  Filter
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ClassroomAnalytics = ({ classroomId, timeRange = '30d' }) => {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - in real app, this would come from API
  const analyticsData = {
    overview: {
      totalMembers: 24,
      activeMembers: 18,
      totalQuizzes: 15,
      averageScore: 78,
      studyHours: 156,
      engagement: 85
    },
    engagement: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Active Members',
          data: [12, 15, 18, 18],
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Quiz Participation',
          data: [8, 12, 16, 15],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    performance: {
      labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
      datasets: [
        {
          label: 'Average Score',
          data: [72, 68, 75, 82, 78],
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        }
      ]
    },
    subjects: {
      labels: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      datasets: [
        {
          data: [35, 25, 20, 20],
          backgroundColor: [
            'rgba(147, 51, 234, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderWidth: 0
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(147, 51, 234, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      }
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'members', label: 'Members', icon: Users }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Members', value: analyticsData.overview.totalMembers, change: '+12%', icon: Users, color: 'purple' },
          { label: 'Active Members', value: analyticsData.overview.activeMembers, change: '+8%', icon: TrendingUp, color: 'blue' },
          { label: 'Average Score', value: `${analyticsData.overview.averageScore}%`, change: '+5%', icon: Target, color: 'green' },
          { label: 'Study Hours', value: analyticsData.overview.studyHours, change: '+23%', icon: Clock, color: 'orange' },
          { label: 'Total Quizzes', value: analyticsData.overview.totalQuizzes, change: '+3', icon: Award, color: 'pink' },
          { label: 'Engagement Rate', value: `${analyticsData.overview.engagement}%`, change: '+7%', icon: BarChart3, color: 'indigo' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            className="bg-white rounded-xl p-6 shadow-soft border border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
              </div>
              <span className="text-sm font-medium text-green-600">{metric.change}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{metric.value}</div>
            <div className="text-sm text-slate-600">{metric.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Member Engagement</h3>
          <div className="h-64">
            <Line data={analyticsData.engagement} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Subject Distribution</h3>
          <div className="h-64">
            <Doughnut 
              data={analyticsData.subjects} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom'
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderEngagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Engagement Trends</h3>
        <div className="h-80">
          <Line data={analyticsData.engagement} options={chartOptions} />
        </div>
      </div>
    </div>
  )

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Quiz Performance Over Time</h3>
        <div className="h-80">
          <Bar data={analyticsData.performance} options={chartOptions} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Classroom Analytics</h2>
          <p className="text-slate-600">Insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-soft border border-slate-200">
        <div className="border-b border-slate-200 p-1">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'engagement' && renderEngagement()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'members' && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Member Analytics</h3>
              <p className="text-slate-600">Detailed member performance analytics coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassroomAnalytics