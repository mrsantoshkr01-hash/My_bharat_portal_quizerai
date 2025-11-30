// for gradient in the website 
'use client'

import { cn } from '@/lib/utils'

export const GradientText = ({ children, className }) => {
  return (
    <span className={cn("bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent", className)}>
      {children}
    </span>
  )
}