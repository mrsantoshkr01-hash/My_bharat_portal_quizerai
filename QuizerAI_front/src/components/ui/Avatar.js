/**
 * Avatar Component
 * 
 * Purpose: User profile image display with fallback options
 * Features:
 * - Image display with automatic fallback to initials
 * - Multiple size variants for different contexts
 * - Status indicator support for online/offline states
 * - Group avatar stacking for team displays
 * - Customizable styling and hover effects
 * 
 * Usage: User profiles, comment sections, team member displays
 */

'use client'

import { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const Avatar = forwardRef(({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circular',
  status,
  showStatus = false,
  fallbackColor = 'blue',
  className,
  ...props
}, ref) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  }

  const variants = {
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none'
  }

  const fallbackColors = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    pink: 'bg-pink-500 text-white',
    gray: 'bg-gray-500 text-white'
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const shouldShowImage = src && !imageError && imageLoaded

  return (
    <div className="relative inline-block">
      <motion.div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-medium overflow-hidden",
          sizes[size],
          variants[variant],
          !shouldShowImage && fallbackColors[fallbackColor],
          className
        )}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {shouldShowImage ? (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : name ? (
          <span className="select-none">{getInitials(name)}</span>
        ) : (
          <User className={cn(
            size === 'xs' ? 'w-3 h-3' :
            size === 'sm' ? 'w-4 h-4' :
            size === 'md' ? 'w-5 h-5' :
            size === 'lg' ? 'w-6 h-6' :
            size === 'xl' ? 'w-8 h-8' : 'w-10 h-10'
          )} />
        )}
      </motion.div>

      {/* Status indicator */}
      {showStatus && status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            statusColors[status],
            size === 'xs' ? 'w-2 h-2' :
            size === 'sm' ? 'w-2.5 h-2.5' :
            size === 'md' ? 'w-3 h-3' :
            size === 'lg' ? 'w-3.5 h-3.5' :
            size === 'xl' ? 'w-4 h-4' : 'w-5 h-5'
          )}
        />
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'

// AvatarGroup component for displaying multiple avatars
export const AvatarGroup = ({ 
  avatars = [], 
  max = 3, 
  size = 'md',
  spacing = 'normal',
  className 
}) => {
  const spacingStyles = {
    tight: '-space-x-2',
    normal: '-space-x-1',
    loose: 'space-x-1'
  }

  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn("flex items-center", spacingStyles[spacing], className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id || index}
          {...avatar}
          size={size}
          className="ring-2 ring-white relative z-10"
          style={{ zIndex: visibleAvatars.length - index }}
        />
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            "relative inline-flex items-center justify-center font-medium rounded-full bg-slate-200 text-slate-600 ring-2 ring-white",
            sizes[size]
          )}
          style={{ zIndex: 0 }}
        >
          <span className="text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}

export default Avatar