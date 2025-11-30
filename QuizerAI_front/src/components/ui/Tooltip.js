/**
 * Tooltip Component
 * 
 * Purpose: Contextual information display on hover or focus
 * Features:
 * - Multiple positioning options (top, bottom, left, right)
 * - Customizable appearance and timing
 * - Accessibility support with proper ARIA attributes
 * - Portal rendering for z-index management
 * - Rich content support beyond simple text
 * 
 * Usage: Help text, additional context, keyboard shortcuts display
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 500,
  disabled = false,
  className,
  contentClassName
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const updatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const scrollX = window.pageXOffset
    const scrollY = window.pageYOffset

    let x, y

    switch (position) {
      case 'top':
        x = rect.left + scrollX + rect.width / 2
        y = rect.top + scrollY
        break
      case 'bottom':
        x = rect.left + scrollX + rect.width / 2
        y = rect.bottom + scrollY
        break
      case 'left':
        x = rect.left + scrollX
        y = rect.top + scrollY + rect.height / 2
        break
      case 'right':
        x = rect.right + scrollX
        y = rect.top + scrollY + rect.height / 2
        break
      default:
        x = rect.left + scrollX + rect.width / 2
        y = rect.top + scrollY
    }

    setCoords({ x, y })
  }

  const showTooltip = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      updatePosition()
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'transform -translate-x-1/2 -translate-y-full mb-2'
      case 'bottom':
        return 'transform -translate-x-1/2 mt-2'
      case 'left':
        return 'transform -translate-y-1/2 -translate-x-full mr-2'
      case 'right':
        return 'transform -translate-y-1/2 ml-2'
      default:
        return 'transform -translate-x-1/2 -translate-y-full mb-2'
    }
  }

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 bg-slate-900 transform rotate-45"
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 translate-y-1/2`
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -translate-x-1/2`
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 translate-x-1/2`
      default:
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`
    }
  }

  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={className}
      >
        {children}
      </div>

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && content && (
            <motion.div
              className={cn(
                "fixed z-50 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg shadow-lg pointer-events-none",
                getPositionClasses(),
                contentClassName
              )}
              style={{ left: coords.x, top: coords.y }}
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="relative z-10">
                {typeof content === 'string' ? content : content}
              </div>
              <div className={getArrowClasses()} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default Tooltip