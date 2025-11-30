'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef(({ 
  label,
  type = 'text',
  className,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  error,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200",
            LeftIcon && "pl-11",
            RightIcon && "pr-11",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <RightIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input