'use client'

import { motion } from 'framer-motion'
import { Calendar, TrendingUp } from 'lucide-react'

const PerformanceHeatmap = () => {
  // Generate mock data for the last 12 weeks
  const generateHeatmapData = () => {
    const data = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let week = 0; week < 12; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date()
        date.setDate(date.getDate() - (12 - week) * 7 + day)
        
        // Generate realistic study activity (higher on weekdays)
        const isWeekend = day === 0 || day === 6
        const baseActivity = isWeekend ? 0.3 : 0.7
        const activity = Math.random() * 0.5 + baseActivity
        
        data.push({
          date: date.toISOString().split('T')[0],
          day: days[day],
          week,
          dayOfWeek: day,
          activity: Math.min(activity, 1),
          score: Math.round(60 + activity * 40), // Score between 60-100
          studyTime: Math.round(activity * 120), // Study time in minutes
        })
      }
    }
    return data
  }

  const heatmapData = generateHeatmapData()
  const maxActivity = Math.max(...heatmapData.map(d => d.activity))

  const getActivityColor = (activity) => {
    const intensity = activity / maxActivity
    if (intensity === 0) return 'bg-slate-100'
    if (intensity < 0.25) return 'bg-blue-200'
    if (intensity < 0.5) return 'bg-blue-400'
    if (intensity < 0.75) return 'bg-blue-600'
    return 'bg-blue-800'
  }

  const getActivityLevel = (activity) => {
    const intensity = activity / maxActivity
    if (intensity === 0) return 'No activity'
    if (intensity < 0.25) return 'Low activity'
    if (intensity < 0.5) return 'Medium activity'
    if (intensity < 0.75) return 'High activity'
    return 'Very high activity'
  }

  const weeks = Array.from({ length: 12 }, (_, i) => i)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-slate-800">Study Activity Heatmap</h3>
        </div>
        <div className="text-sm text-slate-600">Last 12 weeks</div>
      </div>

      <div className="space-y-4">
        {/* Days of week labels */}
        <div className="grid grid-cols-[3rem,1fr] gap-4">
          <div></div>
          <div className="grid grid-cols-12 gap-1">
            {weeks.map((week) => (
              <div key={week} className="text-xs text-slate-500 text-center">
                {week % 4 === 0 ? `W${week + 1}` : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        {days.map((day, dayIndex) => (
          <div key={day} className="grid grid-cols-[3rem,1fr] gap-4">
            <div className="text-xs text-slate-600 flex items-center">{day}</div>
            <div className="grid grid-cols-12 gap-1">
              {weeks.map((week) => {
                const cellData = heatmapData.find(
                  d => d.week === week && d.dayOfWeek === dayIndex
                )
                return (
                  <motion.div
                    key={`${week}-${dayIndex}`}
                    className={`w-full aspect-square rounded-sm cursor-pointer ${getActivityColor(cellData?.activity || 0)}`}
                    whileHover={{ scale: 1.2 }}
                    title={cellData ? 
                      `${cellData.date}\n${getActivityLevel(cellData.activity)}\nScore: ${cellData.score}%\nStudy time: ${cellData.studyTime}m` : 
                      'No data'
                    }
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (week * 7 + dayIndex) * 0.01 }}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Less</span>
            <div className="flex gap-1">
              {['bg-slate-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-800'].map((color, index) => (
                <div key={index} className={`w-3 h-3 rounded-sm ${color}`} />
              ))}
            </div>
            <span>More</span>
          </div>
          
          <div className="text-sm text-slate-600">
            Total study days: {heatmapData.filter(d => d.activity > 0).length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceHeatmap