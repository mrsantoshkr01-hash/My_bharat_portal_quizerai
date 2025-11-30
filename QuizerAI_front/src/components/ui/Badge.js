/**
 * Badge Component
 * 
 * Purpose: Small status indicators and labels for categorization
 * Features:
 * - Multiple variants (solid, outline, soft)
 * - Color-coded status indicators
 * - Size variations for different contexts
 * - Icon support for enhanced meaning
 * - Interactive badges with hover states
 * 
 * Usage: Status indicators, category labels, notification counts
 */

'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Badge = forwardRef(({
  children,
  variant = 'solid',
  color = 'blue',
  size = 'md',
  icon: Icon,
  removable = false,
  onRemove,
  className,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full transition-all duration-200"
  
  const variants = {
    solid: {
      blue: "bg-blue-500 text-white",
      green: "bg-green-500 text-white",
      yellow: "bg-yellow-500 text-white",
      red: "bg-red-500 text-white",
      purple: "bg-purple-500 text-white",
      slate: "bg-slate-500 text-white"
    },
    outline: {
      blue: "border border-blue-500 text-blue-700 bg-white",
      green: "border border-green-500 text-green-700 bg-white",
      yellow: "border border-yellow-500 text-yellow-700 bg-white",
      red: "border border-red-500 text-red-700 bg-white",
      purple: "border border-purple-500 text-purple-700 bg-white",
      slate: "border border-slate-500 text-slate-700 bg-white"
    },
    soft: {
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      yellow: "bg-yellow-100 text-yellow-700",
      red: "bg-red-100 text-red-700",
      purple: "bg-purple-100 text-purple-700",
      slate: "bg-slate-100 text-slate-700"
    }
  }
  
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  }

  return (
    <motion.span
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant][color],
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {Icon && (
        <Icon className={cn("mr-1", size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
      )}
      
      {children}
      
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors duration-200"
        >
          <X className={cn(size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
        </button>
      )}
    </motion.span>
  )
})

Badge.displayName = 'Badge'

export default Badge