'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Circle, 
  Edit3, 
  Clock,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react'

export const MCQQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult = false, correctAnswer = null }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">{question.text}</h3>
      
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = showResult && correctAnswer === index
          const isWrong = showResult && isSelected && correctAnswer !== index
          
          return (
            <motion.button
              key={index}
              onClick={() => !showResult && onAnswerSelect(index)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                isCorrect 
                  ? 'border-green-500 bg-green-50 text-green-800' 
                  : isWrong 
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-800' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : isWrong ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : isSelected ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export const ShortAnswerQuestion = ({ question, answer, onAnswerChange, showResult = false, correctAnswer = null }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">{question.text}</h3>
      
      <div className="space-y-4">
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={showResult}
          className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
            showResult 
              ? 'border-slate-300 bg-slate-50' 
              : 'border-slate-200 focus:border-blue-500'
          }`}
          rows="4"
        />
        
        {showResult && correctAnswer && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <h4 className="font-semibold text-green-800 mb-2">Sample Answer:</h4>
            <p className="text-green-700">{correctAnswer}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const FillBlankQuestion = ({ question, answers, onAnswerChange, showResult = false, correctAnswers = null }) => {
  const parts = question.text.split('_____')
  
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold text-slate-800 mb-6">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <input
                type="text"
                value={answers[index] || ''}
                onChange={(e) => onAnswerChange(index, e.target.value)}
                disabled={showResult}
                className={`inline-block mx-2 px-3 py-1 border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 bg-transparent min-w-24 text-center ${
                  showResult 
                    ? correctAnswers && correctAnswers[index] === answers[index]
                      ? 'border-green-500 text-green-700'
                      : 'border-red-500 text-red-700'
                    : ''
                }`}
                placeholder="____"
              />
            )}
          </span>
        ))}
      </div>
      
      {showResult && correctAnswers && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">Correct Answers:</h4>
          <div className="space-y-1">
            {correctAnswers.map((answer, index) => (
              <p key={index} className="text-blue-700">
                Blank {index + 1}: <span className="font-medium">{answer}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const TrueFalseQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult = false, correctAnswer = null }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">{question.text}</h3>
      
      <div className="flex gap-4 justify-center">
        {[
          { value: true, label: 'True', color: 'green' },
          { value: false, label: 'False', color: 'red' }
        ].map(({ value, label, color }) => {
          const isSelected = selectedAnswer === value
          const isCorrect = showResult && correctAnswer === value
          const isWrong = showResult && isSelected && correctAnswer !== value
          
          return (
            <motion.button
              key={value.toString()}
              onClick={() => !showResult && onAnswerSelect(value)}
              disabled={showResult}
              className={`px-8 py-4 rounded-xl border-2 font-semibold transition-all duration-200 ${
                isCorrect 
                  ? `border-${color}-500 bg-${color}-50 text-${color}-800` 
                  : isWrong 
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-800' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              whileHover={!showResult ? { scale: 1.05 } : {}}
              whileTap={!showResult ? { scale: 0.95 } : {}}
            >
              {label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export const MultipleSelectQuestion = ({ question, selectedAnswers, onAnswerToggle, showResult = false, correctAnswers = null }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">{question.text}</h3>
      <p className="text-sm text-slate-600 mb-4">Select all that apply:</p>
      
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswers.includes(index)
          const isCorrect = showResult && correctAnswers && correctAnswers.includes(index)
          const shouldBeSelected = showResult && correctAnswers && correctAnswers.includes(index)
          const isWrong = showResult && isSelected && !correctAnswers?.includes(index)
          
          return (
            <motion.button
              key={index}
              onClick={() => !showResult && onAnswerToggle(index)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                isCorrect && isSelected
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : isWrong 
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : shouldBeSelected && !isSelected
                  ? 'border-orange-500 bg-orange-50 text-orange-800'
                  : isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-800' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckSquare className={`w-6 h-6 ${
                      isCorrect ? 'text-green-600' : isWrong ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  ) : shouldBeSelected ? (
                    <Square className="w-6 h-6 text-orange-600" />
                  ) : (
                    <Square className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}