// utils/quizDataHandler.js

/**
 * Utility functions for handling quiz data between create and quiz pages
 */

export const QUIZ_STORAGE_KEY = 'quiz_data_'

/**
 * Store quiz data in localStorage for the quiz page
 * @param {string} quizId - Unique quiz identifier
 * @param {Array} questions - Array of questions from backend
 * @param {Object} metadata - Additional quiz metadata
 */
export const storeQuizData = (quizId, questions, metadata = {}) => {
  try {
    const quizData = {
      questions: transformBackendQuestions(questions),
      metadata: {
        title: metadata.title || 'Generated Quiz',
        description: metadata.description || 'AI Generated Quiz',
        difficulty: metadata.difficulty || 'medium',
        subject: metadata.subject || 'General',
        createdAt: new Date().toISOString(),
        source: metadata.source || 'ai_generated'
      },
      config: {
        totalQuestions: questions.length,
        estimatedTime: Math.ceil(questions.length * 1.5), // 1.5 min per question
        passingScore: 70
      }
    }

    localStorage.setItem(`${QUIZ_STORAGE_KEY}${quizId}`, JSON.stringify(quizData))
    return quizId
  } catch (error) {
    console.error('Error storing quiz data:', error)
    throw new Error('Failed to store quiz data')
  }
}

/**
 * Retrieve quiz data from localStorage
 * @param {string} quizId - Quiz identifier
 * @returns {Object|null} Quiz data or null if not found
 */
export const getQuizData = (quizId) => {
  try {
    const data = localStorage.getItem(`${QUIZ_STORAGE_KEY}${quizId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error retrieving quiz data:', error)
    return null
  }
}

/**
 * Clear quiz data from localStorage
 * @param {string} quizId - Quiz identifier
 */
export const clearQuizData = (quizId) => {
  try {
    localStorage.removeItem(`${QUIZ_STORAGE_KEY}${quizId}`)
  } catch (error) {
    console.error('Error clearing quiz data:', error)
  }
}

/**
 * Transform backend question format to frontend format
 * @param {Array} backendQuestions - Questions from backend API
 * @returns {Array} Transformed questions
 */
export const transformBackendQuestions = (backendQuestions) => {
  return backendQuestions.map((q, index) => {
    // Handle different question types
    let questionType = 'mcq' // Default to MCQ
    let options = []
    let correctAnswer = null

    if (q.options && Array.isArray(q.options)) {
      // Multiple choice question
      questionType = 'mcq'
      options = q.options
      correctAnswer = q.options.findIndex(opt => opt === q.answer)
    } else if (q.type === 'true_false' || q.question.toLowerCase().includes('true or false')) {
      // True/False question
      questionType = 'true_false'
      options = ['True', 'False']
      correctAnswer = q.answer === 'True' || q.answer === true ? 0 : 1
    } else if (q.type === 'short_answer') {
      // Short answer question
      questionType = 'short_answer'
      correctAnswer = q.answer
    } else if (q.type === 'fill_blank') {
      // Fill in the blank
      questionType = 'fill_blank'
      correctAnswer = Array.isArray(q.answer) ? q.answer : [q.answer]
    }

    return {
      id: index + 1,
      type: questionType,
      text: q.question,
      options: options,
      correctAnswer: correctAnswer,
      explanation: q.explanation || null,
      points: q.points || 10,
      difficulty: q.difficulty || 'medium',
      tags: q.tags || [],
      timeEstimate: q.timeEstimate || 90 // seconds
    }
  })
}

/**
 * Generate a unique quiz ID
 * @returns {string} Unique quiz identifier
 */
export const generateQuizId = () => {
  return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate quiz data structure
 * @param {Object} quizData - Quiz data to validate
 * @returns {boolean} True if valid
 */
export const validateQuizData = (quizData) => {
  if (!quizData || typeof quizData !== 'object') return false
  if (!quizData.questions || !Array.isArray(quizData.questions)) return false
  if (quizData.questions.length === 0) return false
  
  // Validate each question
  return quizData.questions.every(q => 
    q.id && 
    q.type && 
    q.text && 
    q.correctAnswer !== null && 
    q.correctAnswer !== undefined
  )
}

/**
 * Get quiz statistics
 * @param {Object} quizData - Quiz data
 * @returns {Object} Quiz statistics
 */
export const getQuizStats = (quizData) => {
  if (!validateQuizData(quizData)) {
    throw new Error('Invalid quiz data')
  }

  const questions = quizData.questions
  const totalQuestions = questions.length
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0)
  const estimatedTime = questions.reduce((sum, q) => sum + (q.timeEstimate || 90), 0)
  
  const difficultyCount = questions.reduce((acc, q) => {
    const difficulty = q.difficulty || 'medium'
    acc[difficulty] = (acc[difficulty] || 0) + 1
    return acc
  }, {})

  const typeCount = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1
    return acc
  }, {})

  return {
    totalQuestions,
    totalPoints,
    estimatedTimeMinutes: Math.ceil(estimatedTime / 60),
    difficultyBreakdown: difficultyCount,
    typeBreakdown: typeCount,
    averagePointsPerQuestion: Math.round(totalPoints / totalQuestions)
  }
}