import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  // State
  sidebarOpen: false,
  theme: 'light',
  notifications: [],
  modals: {
    createQuiz: false,
    createClassroom: false,
    joinClassroom: false,
    uploadFile: false,
    settings: false,
  },
  toasts: [],

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    set({ theme })
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  },

  initializeTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      get().setTheme(theme)
    }
  },

  // Modal management
  openModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: true }
  })),

  closeModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: false }
  })),

  closeAllModals: () => set((state) => ({
    modals: Object.keys(state.modals).reduce((acc, key) => ({
      ...acc,
      [key]: false
    }), {})
  })),

  // Notifications
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        id: Date.now(),
        timestamp: new Date(),
        read: false,
        ...notification
      },
      ...state.notifications
    ]
  })),

  markNotificationAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    )
  })),

  removeNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter(notification => notification.id !== notificationId)
  })),

  clearNotifications: () => set({ notifications: [] }),

  // Toast messages
  addToast: (toast) => {
    const id = Date.now()
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          timestamp: new Date(),
          duration: 5000,
          ...toast
        }
      ]
    }))

    // Auto remove toast after duration
    setTimeout(() => {
      get().removeToast(id)
    }, toast.duration || 5000)

    return id
  },

  removeToast: (toastId) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== toastId)
  })),

  clearToasts: () => set({ toasts: [] }),

  // Global loading states
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // Form states
  formStates: {},
  
  setFormState: (formName, state) => set((currentState) => ({
    formStates: {
      ...currentState.formStates,
      [formName]: { ...currentState.formStates[formName], ...state }
    }
  })),

  clearFormState: (formName) => set((state) => {
    const newFormStates = { ...state.formStates }
    delete newFormStates[formName]
    return { formStates: newFormStates }
  }),

  // Search and filters
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  filters: {},
  setFilter: (filterName, value) => set((state) => ({
    filters: { ...state.filters, [filterName]: value }
  })),

  clearFilters: () => set({ filters: {} }),

  // Preferences
  preferences: {
    autoSave: true,
    notifications: true,
    darkMode: false,
    soundEffects: true,
    animations: true,
  },

  setPreference: (key, value) => set((state) => ({
    preferences: { ...state.preferences, [key]: value }
  })),

  resetPreferences: () => set({
    preferences: {
      autoSave: true,
      notifications: true,
      darkMode: false,
      soundEffects: true,
      animations: true,
    }
  }),
}))

// Initialize theme on app start
if (typeof window !== 'undefined') {
  useUIStore.getState().initializeTheme()
}


export default useUIStore