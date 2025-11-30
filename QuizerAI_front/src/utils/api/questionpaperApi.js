// services/questionPaperApi.js
// API service for Question Paper Upload feature

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Question Paper API Service
 * Handles all API calls related to question paper upload and management
 */
export const questionPaperApi = {
  /**
   * Upload question paper files and extract questions
   * @param {FormData} formData - Form data with files and metadata
   * @returns {Promise<Object>} Extracted questions response
   */
  async uploadAndExtract(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-papers/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it for FormData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed with status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  },

  /**
   * Upload question paper from URL and extract questions
   * @param {Object} urlData - URL and metadata
   * @returns {Promise<Object>} Extracted questions response
   */
  async uploadFromUrl(urlData) {
    try {
      const formData = new FormData()
      Object.keys(urlData).forEach(key => {
        if (urlData[key] !== null && urlData[key] !== undefined) {
          formData.append(key, urlData[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/api/question-papers/upload-url`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `URL upload failed with status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  },

  /**
   * Save extracted questions to database
   * @param {Object} saveData - Questions and metadata to save
   * @returns {Promise<Object>} Save response with paper_id
   */
  async saveToDatabase(saveData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-papers/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Save failed with status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  },

  /**
   * Fetch all question papers with filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} List of question papers
   */
  async fetchQuestionPapers(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      // Add filters to params
      if (filters.subject) params.append('subject', filters.subject)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.status) params.append('status', filters.status)
      if (filters.my_papers !== undefined) params.append('my_papers', filters.my_papers)
      if (filters.limit) params.append('limit', filters.limit)
      if (filters.offset) params.append('offset', filters.offset)

      const response = await fetch(`${API_BASE_URL}/api/question-papers/?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch question papers')
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  },

  /**
   * Fetch specific question paper by ID
   * @param {string} paperId - Paper ID to fetch
   * @returns {Promise<Object>} Question paper data
   */
  async getQuestionPaper(paperId) {
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
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  },

  /**
   * Delete question paper
   * @param {string} paperId - Paper ID to delete
   * @returns {Promise<Object>} Delete confirmation
   */
  async deleteQuestionPaper(paperId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-papers/${paperId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete question paper')
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  },

  /**
   * Check processing status of question paper
   * @param {string} paperId - Paper ID to check
   * @returns {Promise<Object>} Status information
   */
  async checkPaperStatus(paperId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-papers/${paperId}/status`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to check paper status')
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  }
}