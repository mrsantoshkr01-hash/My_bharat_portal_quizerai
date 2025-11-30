// for animation in the website at different place 
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export const AnimatedCounter = ({ end, duration = 2, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const incrementTime = (duration * 1000) / end
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev < end) {
          return Math.min(prev + Math.ceil(end / 50), end)
        }
        clearInterval(timer)
        return end
      })
    }, incrementTime)

    return () => clearInterval(timer)
  }, [end, duration])

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  )
}
