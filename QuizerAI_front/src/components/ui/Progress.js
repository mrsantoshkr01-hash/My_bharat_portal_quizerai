/**
 * Progress Component
 * 
 * Purpose: Visual progress indicator for various operations and completion states
 * Features:
 * - Linear and circular progress variants
 * - Customizable colors and sizes
 * - Animation support with smooth transitions
 * - Label and percentage display options
 * - Multi-step progress tracking
 * 
 * Usage: Loading states, quiz progress, form completion tracking
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const Progress = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'linear',
  color = 'blue',
  showLabel = false,
  label,
  className,
  animated = true
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizes = {
    sm: variant === 'linear' ? 'h-2' : 'w-8 h-8',
    md: variant === 'linear' ? 'h-3' : 'w-12 h-12',
    lg: variant === 'linear' ? 'h-4' : 'w-16 h-16',
    xl: variant === 'linear' ? 'h-6' : 'w-20 h-20'
  }

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  }

  if (variant === 'circular') {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className={cn("relative inline-flex items-center justify-center", sizes[size], className)}>
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-200"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={cn("transition-colors duration-200", colors[color])}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: animated ? strokeDashoffset : strokeDashoffset }}
            transition={{ duration: animated ? 1 : 0, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showLabel && label ? (
            <span className="text-xs font-medium text-slate-700">{label}</span>
          ) : (
            <span className="text-xs font-medium text-slate-700">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={cn("w-full bg-slate-200 rounded-full overflow-hidden", sizes[size])}>
        <motion.div
          className={cn("h-full rounded-full transition-colors duration-200", colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

export default Progress