'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue',
  className 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colors = {
    blue: 'border-blue-600',
    purple: 'border-purple-600',
    green: 'border-green-600',
    red: 'border-red-600'
  }

  return (
    <motion.div
      className={cn(
        "border-2 border-transparent rounded-full",
        sizes[size],
        colors[color],
        "border-t-current",
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )
}

export default LoadingSpinner