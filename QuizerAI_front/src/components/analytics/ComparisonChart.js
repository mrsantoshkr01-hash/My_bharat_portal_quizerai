'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, Trophy } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const ComparisonChart = () => {
  const [comparisonType, setComparisonType] = useState('class') // class, global, friends

  // Mock comparison data
  const comparisonData = {
    class: {
      title: 'Class Comparison',
      datasets: [
        {
          label: 'Your Score',
          data: [85, 78, 92, 81, 89],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Class Average',
          data: [75, 72, 78, 76, 80],
          backgroundColor: 'rgba(148, 163, 184, 0.6)',
          borderColor: 'rgb(148, 163, 184)',
          borderWidth: 2
        }
      ]
    },
    global: {
      title: 'Global Comparison',
      datasets: [
        {
          label: 'Your Score',
          data: [85, 78, 92, 81, 89],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Global Average',
          data: [70, 68, 74, 71, 75],
          backgroundColor: 'rgba(148, 163, 184, 0.6)',
          borderColor: 'rgb(148, 163, 184)',
          borderWidth: 2
        }
      ]
    },
    friends: {
      title: 'Friends Comparison',
      datasets: [
        {
          label: 'Your Score',
          data: [85, 78, 92, 81, 89],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Friends Average',
          data: [82, 80, 85, 83, 87],
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        }
      ]
    }
  }

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science']

  const chartData = {
    labels: subjects,
    datasets: comparisonData[comparisonType].datasets
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`
          }
        }
      }
    },
    scales: {
      x: {
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
        beginAtZero: true,
        max: 100,
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
            return value + '%'
          }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
      }
    }
  }

  // Calculate performance indicators
  const yourScores = comparisonData[comparisonType].datasets[0].data
  const compareScores = comparisonData[comparisonType].datasets[1].data
  const yourAverage = Math.round(yourScores.reduce((a, b) => a + b, 0) / yourScores.length)
  const compareAverage = Math.round(compareScores.reduce((a, b) => a + b, 0) / compareScores.length)
  const difference = yourAverage - compareAverage

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-slate-800">Performance Comparison</h3>
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[
            { value: 'class', label: 'Class', icon: Users },
            { value: 'global', label: 'Global', icon: Trophy },
            { value: 'friends', label: 'Friends', icon: Users }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setComparisonType(option.value)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                comparisonType === option.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{yourAverage}%</div>
          <div className="text-sm text-blue-700">Your Average</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-slate-600">{compareAverage}%</div>
          <div className="text-sm text-slate-600 capitalize">{comparisonType} Average</div>
        </div>
        <div className={`rounded-xl p-4 text-center ${
          difference > 0 ? 'bg-green-50' : difference < 0 ? 'bg-red-50' : 'bg-slate-50'
        }`}>
          <div className={`text-2xl font-bold ${
            difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-slate-600'
          }`}>
            {difference > 0 ? '+' : ''}{difference}%
          </div>
          <div className={`text-sm ${
            difference > 0 ? 'text-green-700' : difference < 0 ? 'text-red-700' : 'text-slate-600'
          }`}>
            Difference
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <h4 className="font-semibold text-slate-800 mb-2">Performance Insights</h4>
        <div className="text-sm text-slate-600 space-y-1">
          {difference > 10 && (
            <p>🎉 Excellent! You&apos;re performing {difference}% above the {comparisonType} average.</p>
          )}
          {difference > 0 && difference <= 10 && (
            <p>👍 Good job! You&apos;re {difference}% ahead of the {comparisonType} average.</p>
          )}
          {difference === 0 && (
            <p>📊 You&apos;re performing exactly at the {comparisonType} average level.</p>
          )}
          {difference < 0 && (
            <p>📈 Room for improvement! Focus on areas where you&apos;re below the {comparisonType} average.</p>
          )}
          <p>
            Your strongest subject: {subjects[yourScores.indexOf(Math.max(...yourScores))]} ({Math.max(...yourScores)}%)
          </p>
        </div>
      </div>
    </div>
  )
}

export default ComparisonChart