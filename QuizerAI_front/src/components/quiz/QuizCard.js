'use client'

import { motion } from 'framer-motion'
import { 
  Clock, 
  Users, 
  BarChart3, 
  Play, 
  Edit3, 
  Trash2,
  Share2,
  BookOpen,
  Target,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

const QuizCard = ({ quiz, onEdit, onDelete, onShare }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const getSubjectIcon = (subject) => {
    // Return appropriate icon based on subject
    return BookOpen
  }

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300 group"
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
              {quiz.title}
            </h3>
            <p className="text-sm text-slate-600">{quiz.subject}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-600 mb-4 line-clamp-2">
        {quiz.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Questions</span>
          </div>
          <div className="font-semibold text-slate-800">{quiz.questionCount}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Duration</span>
          </div>
          <div className="font-semibold text-slate-800">{quiz.duration}m</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Attempts</span>
          </div>
          <div className="font-semibold text-slate-800">{quiz.attempts || 0}</div>
        </div>
      </div>

      {/* Performance */}
      {quiz.bestScore && (
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Best Score</span>
            <span className="font-semibold text-green-600">{quiz.bestScore}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${quiz.bestScore}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/quiz/${quiz.id}`} className="flex-1">
          <motion.button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-4 h-4" />
            Start Quiz
          </motion.button>
        </Link>
        
        <div className="flex gap-1">
          <motion.button
            onClick={() => onEdit(quiz)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={() => onShare(quiz)}
            className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={() => onDelete(quiz)}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Created Date */}
      <div className="flex items-center gap-1 text-xs text-slate-500 mt-3">
        <Calendar className="w-3 h-3" />
        <span>Created {quiz.createdAt}</span>
      </div>
    </motion.div>
  )
}

export default QuizCard