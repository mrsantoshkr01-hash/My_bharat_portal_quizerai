'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, Target } from 'lucide-react'
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

const ProgressChart = ({ data, timeRange }) => {
  const [chartType, setChartType] = useState('line')
  const [metric, setMetric] = useState('score')

  const chartData = {
    labels: data.map(d => d.week),
    datasets: [
      {
        label: metric === 'score' ? 'Average Score (%)' : metric === 'quizzes' ? 'Quizzes Completed' : 'Study Hours',
        data: data.map(d => d[metric]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.6)',
        fill: chartType === 'line',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
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
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return `${context[0].label}`
          },
          label: function(context) {
            const value = context.parsed.y
            const suffix = metric === 'score' ? '%' : metric === 'hours' ? ' hours' : ' quizzes'
            return `${context.dataset.label}: ${value}${suffix}`
          }
        }
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
          color: '#64748b',
          callback: function(value) {
            const suffix = metric === 'score' ? '%' : metric === 'hours' ? 'h' : ''
            return value + suffix
          }
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

  // Calculate trend
  const firstValue = data[0]?.[metric] || 0
  const lastValue = data[data.length - 1]?.[metric] || 0
  const trend = lastValue - firstValue
  const trendPercentage = firstValue > 0 ? Math.round((trend / firstValue) * 100) : 0

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-slate-800">Progress Over Time</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-3 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Score</option>
            <option value="quizzes">Quizzes</option>
            <option value="hours">Study Hours</option>
          </select>
          
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            trend > 0 ? 'bg-green-100' : trend < 0 ? 'bg-red-100' : 'bg-slate-100'
          }`}>
            <TrendingUp className={`w-4 h-4 ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600 rotate-180' : 'text-slate-600'
            }`} />
          </div>
          <div>
            <div className={`text-lg font-bold ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-slate-600'
            }`}>
              {trend > 0 ? '+' : ''}{trend}{metric === 'score' ? '%' : metric === 'hours' ? 'h' : ''}
            </div>
            <div className="text-sm text-slate-600">
              {Math.abs(trendPercentage)}% {trend > 0 ? 'improvement' : trend < 0 ? 'decline' : 'no change'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {chartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  )
}

export default ProgressChart