'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp, 
  RotateCcw,
  Share2,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Award,
  BarChart3
} from 'lucide-react'
import { AnimatedCounter } from '@/components/common/AnimatedCounter'
import confetti from 'react-confetti'

const QuizResults = ({ quiz, answers, onRetake, onExit }) => {
  const [showConfetti, setShowConfetti] = useState(false)
  const [viewMode, setViewMode] = useState('summary') // summary, detailed, analytics

  // Calculate results
  const totalQuestions = quiz.questions.length
  const answeredQuestions = Object.keys(answers).length
  const correctAnswers = quiz.questions.filter(q => {
    const userAnswer = answers[q.id]
    return userAnswer === q.correctAnswer
  }).length
  
  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const timeSpent = quiz.duration * 60 - 120 // Simulated time spent
  const accuracy = Math.round((correctAnswers / answeredQuestions) * 100)

  useEffect(() => {
    if (score >= 80) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [score])

  const getGradeInfo = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100', message: 'Outstanding!' }
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100', message: 'Excellent!' }
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100', message: 'Good job!' }
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100', message: 'Keep practicing!' }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100', message: 'Review the material' }
  }

  const gradeInfo = getGradeInfo(score)

  const renderSummary = () => (
    <div className="space-y-8">
      {/* Main Score Display */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative inline-block">
          <div className={`w-40 h-40 rounded-full ${gradeInfo.bg} flex items-center justify-center mb-6 mx-auto relative overflow-hidden`}>
            <motion.div
              className={`absolute inset-0 ${gradeInfo.bg}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <div className="relative z-10 text-center">
              <div className={`text-4xl font-bold ${gradeInfo.color} mb-1`}>
                <AnimatedCounter end={score} suffix="%" duration={2} />
              </div>
              <div className={`text-xl font-semibold ${gradeInfo.color}`}>
                {gradeInfo.grade}
              </div>
            </div>
          </div>
          
          {score >= 80 && (
            <motion.div
              className="absolute -top-2 -right-2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-800" />
              </div>
            </motion.div>
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{gradeInfo.message}</h2>
        <p className="text-lg text-slate-600">
          You scored {correctAnswers} out of {totalQuestions} questions correctly
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white rounded-2xl p-6 text-center shadow-soft border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mb-1">
            <AnimatedCounter end={accuracy} suffix="%" duration={1.5} />
          </div>
          <div className="text-sm text-slate-600">Accuracy Rate</div>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl p-6 text-center shadow-soft border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mb-1">
            {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-slate-600">Time Taken</div>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl p-6 text-center shadow-soft border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mb-1">
            <AnimatedCounter end={Math.round(score / 10)} suffix="/10" duration={1.5} />
          </div>
          <div className="text-sm text-slate-600">Overall Rating</div>
        </motion.div>
      </div>

      {/* Performance Breakdown */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Performance Breakdown</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
            <div className="text-sm text-slate-600">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-2xl font-bold text-red-600">{answeredQuestions - correctAnswers}</div>
            <div className="text-sm text-slate-600">Incorrect</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⏭️</div>
            <div className="text-2xl font-bold text-slate-600">{totalQuestions - answeredQuestions}</div>
            <div className="text-sm text-slate-600">Skipped</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{correctAnswers}/{totalQuestions}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      {score >= 70 && (
        <motion.div
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-slate-800">Achievements Unlocked!</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {score >= 90 && (
              <div className="flex items-center gap-2 text-yellow-700">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">Quiz Master</span>
              </div>
            )}
            {score >= 80 && (
              <div className="flex items-center gap-2 text-yellow-700">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">High Scorer</span>
              </div>
            )}
            {timeSpent < quiz.duration * 60 * 0.8 && (
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Speed Demon</span>
              </div>
            )}
            {accuracy >= 90 && (
              <div className="flex items-center gap-2 text-yellow-700">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Sharp Shooter</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )

  const renderDetailed = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Question-by-Question Review</h3>
      
      {quiz.questions.map((question, index) => {
        const userAnswer = answers[question.id]
        const isCorrect = userAnswer === question.correctAnswer
        const wasSkipped = userAnswer === undefined

        return (
          <motion.div
            key={question.id}
            className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                wasSkipped ? 'bg-slate-100' : isCorrect ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {wasSkipped ? (
                  <AlertCircle className="w-4 h-4 text-slate-600" />
                ) : isCorrect ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-800">Question {index + 1}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    wasSkipped ? 'bg-slate-100 text-slate-600' :
                    isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {wasSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                
                <p className="text-slate-700 mb-3">{question.question}</p>
                
                {question.type === 'mcq' && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border ${
                          option.id === question.correctAnswer ? 'border-green-500 bg-green-50' :
                          option.id === userAnswer && !isCorrect ? 'border-red-500 bg-red-50' :
                          'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {option.id === question.correctAnswer && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {option.id === userAnswer && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={
                            option.id === question.correctAnswer ? 'text-green-700 font-medium' :
                            option.id === userAnswer && !isCorrect ? 'text-red-700' :
                            'text-slate-700'
                          }>
                            {option.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-1">Explanation:</h5>
                    <p className="text-blue-700 text-sm">{question.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {showConfetti && (
        <confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Quiz Completed!</h1>
            <p className="text-lg text-slate-600">{quiz.title}</p>
          </motion.div>

          {/* View Mode Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-1 shadow-soft border border-slate-200">
              {[
                { id: 'summary', label: 'Summary', icon: Trophy },
                { id: 'detailed', label: 'Detailed Review', icon: Eye },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'summary' && renderSummary()}
            {viewMode === 'detailed' && renderDetailed()}
            {viewMode === 'analytics' && (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Advanced Analytics</h3>
                <p className="text-slate-600">Detailed performance analytics coming soon!</p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={onRetake}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-5 h-5" />
              Retake Quiz
            </motion.button>
            
            <motion.button
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5" />
              Share Results
            </motion.button>
            
            <motion.button
              className="flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
              Download Report
            </motion.button>
            
            <motion.button
              onClick={onExit}
              className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 px-8 py-3 rounded-xl font-semibold transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default QuizResults
