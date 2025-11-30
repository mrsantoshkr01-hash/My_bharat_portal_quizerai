'use client'

import { useEffect, useRef, useCallback } from 'react'

export const useClickOutside = (callback) => {
  const ref = useRef(null)
  
  // Memoize the callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback(callback, [callback])

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        memoizedCallback()
      }
    }

    // Add event listeners
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [memoizedCallback])

  return ref
}