'use client'

import { motion } from 'framer-motion'
import Progress from '@/components/ui/Progress'

const UploadProgress = ({ progress = 0, size = 'md', showPercentage = true }) => {
  return (
    <div className={`w-full ${size === 'sm' ? 'mt-2' : 'mt-4'}`}>
      <div className="flex items-center justify-between mb-2">
        {showPercentage && (
          <motion.span 
            className={`font-medium text-blue-600 ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(progress)}%
          </motion.span>
        )}
        
        {progress === 100 && (
          <motion.span
            className={`text-green-600 ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ✓ Complete
          </motion.span>
        )}
      </div>
      
      <Progress
        value={progress}
        max={100}
        color="blue"
        className={size === 'sm' ? 'h-1' : 'h-2'}
      />
    </div>
  )
}

export default UploadProgress