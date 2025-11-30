// utils/quiz-integration.js
// Utilities for integrating Question Paper Upload feature with existing quiz system

/**
 * Fetch question paper from backend API
 * @param {string} paperId - The paper ID to fetch
 * @returns {Promise<Object>} Question paper data
 */
export const fetchQuestionPaper = async (paperId) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/question-papers/${paperId}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('not found')
      } else if (response.status === 403) {
        throw new Error('access denied')
      } else if (response.status === 202) {
        throw new Error('not ready')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch question paper')
      }
    }
    
    return await response.json()
  } catch (error) {
    if (error.message === 'not found' || error.message === 'access denied' || error.message === 'not ready') {
      throw error
    }
    throw new Error('Network error occurred while fetching question paper')
  }
}

/**
 * Transform question paper from backend format to quiz format
 * @param {Object} questionPaper - Question paper from backend
 * @returns {Object} Transformed quiz object
 */
export const transformQuestionPaperToQuiz = (questionPaper) => {
  try {
    return {
      id: questionPaper.paper_id,
      title: questionPaper.title,
      description: questionPaper.metadata?.instructions || 'Question Paper Quiz',
      difficulty: questionPaper.metadata?.difficulty || 'medium',
      subject: questionPaper.metadata?.subject || 'General',
      questions: questionPaper.questions.map((q, index) => ({
        id: index + 1,
        text: q.question,
        type: q.type || 'mcq',
        options: q.options || [],
        correctAnswer: q.type === 'mcq' ? 
          (q.options ? q.options.findIndex(opt => opt === q.answer) : 0) : 
          q.answer,
        points: q.points || 10,
        explanation: q.explanation || null
      })),
      totalPoints: questionPaper.total_points || (questionPaper.questions.length * 10),
      passingScore: 70,
      timeLimit: questionPaper.metadata?.time_limit || 180
    }
  } catch (error) {
    console.error('Error transforming question paper:', error)
    throw new Error('Failed to process question paper data')
  }
}

/**
 * Store quiz in localStorage for session continuity
 * @param {Object} quiz - Quiz object to store
 * @returns {boolean} Success status
 */
export const storeQuizForSession = (quiz) => {
  try {
    const quizData = quiz.questions.map(q => ({
      question: q.text,
      options: q.options,
      answer: q.correctAnswer,
      explanation: q.explanation,
      type: q.type
    }))
    
    localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quizData))
    
    // Also store metadata
    localStorage.setItem(`quiz_meta_${quiz.id}`, JSON.stringify({
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      subject: quiz.subject,
      timeLimit: quiz.timeLimit
    }))
    
    return true
  } catch (error) {
    console.error('Error storing quiz for session:', error)
    return false
  }
}

/**
 * Load quiz from localStorage
 * @param {string} quizId - Quiz ID to load
 * @returns {Object|null} Quiz object or null if not found
 */
export const loadQuizFromSession = (quizId) => {
  try {
    const quizData = localStorage.getItem(`quiz_${quizId}`)
    const metaData = localStorage.getItem(`quiz_meta_${quizId}`)
    
    if (quizData) {
      const questions = JSON.parse(quizData)
      const meta = metaData ? JSON.parse(metaData) : {}
      
      return {
        id: quizId,
        title: meta.title || 'Quiz',
        description: meta.description || 'Quiz',
        difficulty: meta.difficulty || 'medium',
        subject: meta.subject || 'General',
        timeLimit: meta.timeLimit || 180,
        questions: questions.map((q, index) => ({
          id: index + 1,
          text: q.question,
          type: q.type || 'mcq',
          options: q.options || [],
          correctAnswer: q.type === 'mcq' ? 
            (q.options ? q.options.findIndex(opt => opt === q.answer) : 0) : 
            q.answer,
          points: 10,
          explanation: q.explanation || null
        })),
        totalPoints: questions.length * 10,
        passingScore: 70
      }
    }
    
    return null
  } catch (error) {
    console.error('Error loading quiz from session:', error)
    return null
  }
}

/**
 * Validate question paper data structure
 * @param {Object} questionPaper - Question paper to validate
 * @returns {Array<string>} Array of validation errors
 */
export const validateQuestionPaper = (questionPaper) => {
  const errors = []
  
  if (!questionPaper) {
    errors.push('Question paper data is missing')
    return errors
  }
  
  if (!questionPaper.paper_id) {
    errors.push('Paper ID is missing')
  }
  
  if (!questionPaper.title) {
    errors.push('Paper title is missing')
  }
  
  if (!questionPaper.questions || !Array.isArray(questionPaper.questions)) {
    errors.push('Questions array is missing or invalid')
  } else if (questionPaper.questions.length === 0) {
    errors.push('No questions found in the paper')
  }
  
  // Validate individual questions
  questionPaper.questions?.forEach((q, index) => {
    if (!q.question || q.question.trim() === '') {
      errors.push(`Question ${index + 1} text is missing`)
    }
    
    if (!q.answer) {
      errors.push(`Question ${index + 1} answer is missing`)
    }
    
    if (q.type === 'mcq' && (!q.options || !Array.isArray(q.options) || q.options.length === 0)) {
      errors.push(`Question ${index + 1} options are missing or invalid`)
    }
  })
  
  return errors
}

/**
 * Handle quiz loading errors and redirect appropriately
 * @param {Error} error - The error that occurred
 * @param {Object} router - Next.js router object
 */
export const handleQuizError = (error, router) => {
  console.error('Quiz error:', error)
  
  if (error.message === 'not found') {
    router.push('/dashboard/question-papers?error=not_found')
  } else if (error.message === 'access denied') {
    router.push('/dashboard/question-papers?error=access_denied')
  } else if (error.message === 'not ready') {
    router.push('/dashboard/question-papers?error=processing')
  } else {
    router.push('/dashboard/question-papers?error=generic')
  }
}

/**
 * Generate temporary quiz ID for immediate quiz taking
 * @returns {string} Temporary quiz ID
 */
export const generateTempQuizId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Store extracted questions for immediate quiz taking
 * @param {Array} questions - Array of extracted questions
 * @param {Object} metadata - Quiz metadata
 * @returns {string} Temporary quiz ID
 */
export const storeExtractedQuestionsForQuiz = (questions, metadata = {}) => {
  const tempQuizId = generateTempQuizId()
  
  // Transform questions to match quiz format
  const quizData = questions.map(q => ({
    question: q.question,
    options: q.options || [],
    answer: q.answer,
    explanation: q.explanation,
    type: q.type || 'mcq'
  }))
  
  // Store in localStorage
  localStorage.setItem(`quiz_${tempQuizId}`, JSON.stringify(quizData))
  
  // Store metadata
  localStorage.setItem(`quiz_meta_${tempQuizId}`, JSON.stringify({
    title: metadata.title || 'Extracted Questions Quiz',
    description: metadata.description || 'Quiz from extracted question paper',
    difficulty: metadata.difficulty || 'medium',
    subject: metadata.subject || 'General',
    timeLimit: metadata.timeLimit || 180
  }))
  
  return tempQuizId
}