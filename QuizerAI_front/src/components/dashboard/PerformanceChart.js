'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  ChevronDown
} from 'lucide-react'
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
import { Line, Bar } from 'react-chartjs-2'

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

const PerformanceChart = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [chartType, setChartType] = useState('line')

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ]

  // Sample data - in real app, this would come from API
  const performanceData = {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Quiz Scores',
          data: [78, 85, 92, 88, 94, 87, 91],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Study Time (hours)',
          data: [2.5, 3.2, 4.1, 2.8, 3.5, 4.2, 3.8],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    '30d': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Average Quiz Score',
          data: [82, 87, 89, 91],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Weekly Study Hours',
          data: [18, 22, 25, 24],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
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
          padding: 20,
          font: {
            size: 14,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: true,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#64748b'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          borderDash: [2, 2]
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#64748b'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3
      }
    }
  }

  const insights = [
    {
      title: "Performance Trend",
      value: "+12%",
      description: "Quiz scores improved this week",
      type: "positive"
    },
    {
      title: "Study Consistency",
      value: "6/7 days",
      description: "Active study sessions",
      type: "neutral"
    },
    {
      title: "Best Subject",
      value: "Mathematics",
      description: "Highest average score (94%)",
      type: "positive"
    }
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Performance Analytics</h3>
            <p className="text-sm text-slate-600">Track your learning progress over time</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-slate-100 text-slate-700 px-4 py-2 pr-8 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Export Button */}
          <motion.button
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Download className="w-5 h-5 text-slate-600" />
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        {chartType === 'line' ? (
          <Line data={performanceData[timeRange] || performanceData['7d']} options={chartOptions} />
        ) : (
          <Bar data={performanceData[timeRange] || performanceData['7d']} options={chartOptions} />
        )}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-slate-800">{insight.title}</h4>
              <div className={`w-2 h-2 rounded-full ${
                insight.type === 'positive' ? 'bg-green-500' :
                insight.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              insight.type === 'positive' ? 'text-green-600' :
              insight.type === 'negative' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {insight.value}
            </div>
            <p className="text-sm text-slate-600">{insight.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart Type Toggle */}
      <div className="flex items-center justify-center mt-6 gap-2">
        <motion.button
          onClick={() => setChartType('line')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            chartType === 'line'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Line Chart
        </motion.button>
        <motion.button
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            chartType === 'bar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Bar Chart
        </motion.button>
      </div>
    </div>
  )
}

export default PerformanceChart