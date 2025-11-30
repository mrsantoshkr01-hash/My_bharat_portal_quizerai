'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

export const useScrollAnimation = (options = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    rootMargin = '0px'
  } = options

  const [ref, inView] = useInView({
    threshold,
    triggerOnce,
    rootMargin
  })

  return [ref, inView]
}

export const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef()
  const startTimeRef = useRef()

  const startAnimation = useCallback(() => {
    if (isAnimating) return

    setIsAnimating(true)
    startTimeRef.current = null

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentCount = start + (end - start) * easeOut

      setCount(Math.floor(currentCount))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end)
        setIsAnimating(false)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
  }, [end, duration, start, isAnimating])

  const resetAnimation = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    setCount(start)
    setIsAnimating(false)
  }, [start])

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return { count, startAnimation, resetAnimation, isAnimating }
}

export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0)
  const elementRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect()
        const scrolled = window.pageYOffset
        const parallax = scrolled * speed
        setOffset(parallax)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return [elementRef, offset]
}