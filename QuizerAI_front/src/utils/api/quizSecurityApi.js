import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/quiz-security`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Quiz Security API Error:', error);

    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }

    return Promise.reject(error);
  }
);

export const quizSecurityApi = {
  // Security Configuration Management (Teachers)
  createSecurityConfig: async (configData) => {
    try {
      const response = await api.post('/config', configData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create security config');
    }
  },

  getSecurityConfig: async (quizId) => {
    try {
      const response = await api.get(`/config/${quizId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No security config exists
      }
      throw new Error(error.response?.data?.detail || 'Failed to get security config');
    }
  },

  updateSecurityConfig: async (quizId, updateData) => {
    try {
      const response = await api.put(`/config/${quizId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update security config');
    }
  },

  // Security Session Management (Students)
  startSession: async (sessionData) => {
  try {
    console.log('Sending to security API:', sessionData); // ✅ Log the actual data being sent
    const response = await api.post('/session/start', sessionData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to start security session');
  }
},

  updateLocation: async (locationData) => {
    try {
      const response = await api.post('/session/location', locationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update location');
    }
  },

  reportViolation: async (violationData) => {
    try {
      const response = await api.post('/session/violation', violationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to report violation');
    }
  },

  terminateSession: async (sessionId, reason) => {
    try {
      const response = await api.post(`/session/${sessionId}/terminate?reason=${encodeURIComponent(reason)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to terminate session');
    }
  },

  getSession: async (sessionId) => {
    try {
      const response = await api.get(`/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get session');
    }
  },

  // Teacher Location Verification
  verifyTeacherLocation: async (locationData) => {
    // locationData.assignment_id now refers to classroom_quiz_assignments.id
    try {
      const response = await api.post('/teacher/verify-location', locationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to verify teacher location');
    }
  },

  // Analytics and Reporting
  getAnalytics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.quizId) params.append('quiz_id', filters.quizId);
      if (filters.startDate) params.append('start_date', filters.startDate.toISOString());
      if (filters.endDate) params.append('end_date', filters.endDate.toISOString());

      const response = await api.get(`/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get analytics');
    }
  },

  getSessionViolations: async (sessionId) => {
    try {
      const response = await api.get(`/violations/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get violations');
    }
  },

  // Health Check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Security service is not available');
    }
  },

  // Utility Functions
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  isLocationWithinRadius: (studentLat, studentLon, centerLat, centerLon, radius) => {
    const distance = quizSecurityApi.calculateDistance(studentLat, studentLon, centerLat, centerLon);
    return distance <= radius;
  },

  generateDeviceFingerprint: () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    return btoa(JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 100),
      canvas: canvas.toDataURL(),
      timestamp: Date.now()
    }));
  }
};

export default quizSecurityApi;