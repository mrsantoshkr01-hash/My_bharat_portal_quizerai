'use client'

import { motion } from 'framer-motion'

const TopicSelector = ({ onTopicSelect }) => {
  const popularTopics = [
    'Calculus Derivatives',
    'Organic Chemistry',
    'Physics Momentum',
    'Linear Algebra',
    'Statistics',
    'Trigonometry',
    'Biology Cell Structure',
    'World War 2',
    'Shakespeare',
    'Python Programming'
  ]

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Popular Topics</h4>
      <div className="flex flex-wrap gap-2">
        {popularTopics.map((topic, index) => (
          <motion.button
            key={topic}
            onClick={() => onTopicSelect(topic)}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {topic}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default TopicSelector