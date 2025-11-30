import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export class FeedbackApiService {
  /**
   * Submit feedback form data
   * @param {Object} feedbackData - The feedback form data
   * @returns {Promise<Object>} The created feedback response
   */
  static async submitFeedback(feedbackData) {
    try {
      console.log('Submitting feedback:', feedbackData);
      
      const response = await api.post('/api/feedback/', {
        name: feedbackData.name || null,
        email: feedbackData.email || null,
        overall_rating: feedbackData.overallRating,
        user_type: feedbackData.userType || null,
        usage_frequency: feedbackData.usageFrequency || null,
        primary_use_case: feedbackData.primaryUseCase || null,
        device_type: feedbackData.deviceType || null,
        browser_type: feedbackData.browserType || null,
        feedback_type: feedbackData.feedbackType || null,
        website_working: feedbackData.websiteWorking || null,
        expectations: feedbackData.expectations || null,
        suggestions: feedbackData.suggestions || null,
        improvements: feedbackData.improvements || null,
        missing_features: feedbackData.missingFeatures || null,
        user_experience: feedbackData.userExperience || null,
        performance: feedbackData.performance || null,
        additional_comments: feedbackData.additionalComments || null,
        allow_contact: feedbackData.allowContact || false,
        screenshots: feedbackData.screenshotPaths || []
      });
      
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to submit feedback. Please try again.'
      );
    }
  }

  /**
   * Upload screenshots for feedback
   * @param {FileList|Array} files - The files to upload
   * @returns {Promise<Array>} Array of uploaded file paths
   */
  static async uploadScreenshots(files) {
    try {
      if (!files || files.length === 0) {
        return [];
      }

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post('/api/feedback/upload-screenshots', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      return response.data.file_paths;
    } catch (error) {
      console.error('Error uploading screenshots:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to upload screenshots. Please try again.'
      );
    }
  }

  /**
   * Submit feedback with file uploads (combined operation)
   * @param {Object} feedbackData - The feedback form data
   * @param {FileList|Array} files - The files to upload
   * @returns {Promise<Object>} The created feedback response
   */
  static async submitFeedbackWithFiles(feedbackData, files) {
    try {
      let screenshotPaths = [];
      
      // Upload files first if any
      if (files && files.length > 0) {
        screenshotPaths = await this.uploadScreenshots(files);
      }
      
      // Add screenshot paths to feedback data
      const feedbackWithScreenshots = {
        ...feedbackData,
        screenshotPaths
      };
      
      // Submit feedback
      return await this.submitFeedback(feedbackWithScreenshots);
    } catch (error) {
      console.error('Error submitting feedback with files:', error);
      throw error;
    }
  }

  /**
   * Get feedback list (Public for admin dashboard)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated feedback list
   */
  static async getFeedbackList(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        page_size: params.pageSize || 10,
        ...(params.feedbackType && { feedback_type: params.feedbackType }),
        ...(params.ratingFilter && { rating_filter: params.ratingFilter }),
        ...(params.deviceType && { device_type: params.deviceType }),
      });

      const response = await api.get(`/api/feedback/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback list:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch feedback list.'
      );
    }
  }

  /**
   * Get feedback by ID (Public for admin dashboard)
   * @param {number} feedbackId - The feedback ID
   * @returns {Promise<Object>} Feedback details
   */
  static async getFeedbackById(feedbackId) {
    try {
      const response = await api.get(`/api/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch feedback details.'
      );
    }
  }

  /**
   * Get feedback statistics (Public for admin dashboard)
   * @param {number} days - Number of days for recent feedback stats
   * @returns {Promise<Object>} Feedback statistics
   */
  static async getFeedbackStats(days = 30) {
    try {
      const response = await api.get(`/api/feedback/stats/overview?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch feedback statistics.'
      );
    }
  }

  /**
   * Delete feedback (Public for admin dashboard)
   * @param {number} feedbackId - The feedback ID to delete
   * @returns {Promise<Object>} Success response
   */
  static async deleteFeedback(feedbackId) {
    try {
      const response = await api.delete(`/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to delete feedback.'
      );
    }
  }

  /**
   * Mark feedback as resolved (Public for admin dashboard)
   * @param {number} feedbackId - The feedback ID to mark as resolved
   * @returns {Promise<Object>} Success response
   */
  static async markFeedbackResolved(feedbackId) {
    try {
      const response = await api.put(`/api/feedback/${feedbackId}/mark-resolved`);
      return response.data;
    } catch (error) {
      console.error('Error marking feedback as resolved:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to mark feedback as resolved.'
      );
    }
  }
}

export default FeedbackApiService;