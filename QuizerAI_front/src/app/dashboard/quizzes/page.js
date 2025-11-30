/**
 * Quizzes Management Page - Self-Contained
 * 
 * Purpose: Complete quiz management interface for students and teachers
 * Features:
 * - Quiz library with advanced filtering and search
 * - Grid and list view options
 * - Quiz creation wizard integration
 * - Performance tracking and analytics
 * - Sharing and collaboration tools
 * - Bulk operations for teachers
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Grid3X3,
  List,
  Play,
  Edit,
  Share2,
  Trash2,
  Download,
  Clock,
  Users,
  Trophy,
  MoreVertical,
  Heart,
  BookOpen,
  Star
} from 'lucide-react'

// Simple Button Component
const Button = ({ children, onClick, icon: Icon, size = 'md', variant = 'primary', className = '', disabled = false, ...props }) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 rounded-xl font-medium transition-colors
        ${sizeClasses[size]} ${variantClasses[variant]} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// Simple Card Component
const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Simple Modal Component
const Modal = ({ isOpen, onClose, children, size = 'md', showCloseButton = true }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

// Simple Input Component
const Input = ({ placeholder, value, onChange, leftIcon: LeftIcon, className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      {LeftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <LeftIcon className="w-5 h-5 text-slate-400" />
        </div>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          LeftIcon ? 'pl-12' : ''
        }`}
        {...props}
      />
    </div>
  )
}

// Simple QuizCard Component
const QuizCard = ({ quiz, onStart, onContinue, onReview, viewMode, isSelected, onSelect }) => {
  const [showActions, setShowActions] = useState(false)

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700'
  }

  const handleAction = (action) => {
    switch (action) {
      case 'start':
        onStart(quiz.id)
        break
      case 'continue':
        onContinue(quiz.id)
        break
      case 'review':
        onReview(quiz.id)
        break
    }
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl p-4 border-2 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(quiz.id)}
            className="w-5 h-5 text-blue-600 rounded"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-800">{quiz.title}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[quiz.difficulty]}`}>
                {quiz.difficulty}
              </span>
            </div>
            <p className="text-slate-600 text-sm">{quiz.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {quiz.questionCount || 10} questions
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {quiz.duration || '15'} min
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {quiz.attempts || 0} attempts
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAction('start')}>
              <Play className="w-4 h-4" />
              Start
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowActions(!showActions)}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 border-2 transition-all duration-200 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(quiz.id)}
          className="w-5 h-5 text-blue-600 rounded"
        />
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">{quiz.title}</h3>
        <p className="text-slate-600 text-sm">{quiz.description}</p>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          {quiz.questionCount || 10} questions
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {quiz.duration || '15'} min
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[quiz.difficulty]}`}>
          {quiz.difficulty}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {quiz.attempts || 0}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {quiz.rating || '4.5'}
          </div>
        </div>

        <Button size="sm" onClick={() => handleAction('start')}>
          <Play className="w-4 h-4" />
          Start Quiz
        </Button>
      </div>
    </motion.div>
  )
}

// Simple QuizCreator Component
const QuizCreator = ({ onQuizCreated, onCancel }) => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Quiz</h2>
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Quiz creation interface would go here</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onCancel} variant="outline">Cancel</Button>
          <Button onClick={() => onQuizCreated({ id: Date.now(), title: 'New Quiz' })}>
            Create Quiz
          </Button>
        </div>
      </div>
    </div>
  )
}

// Mock data and API functions
const mockQuizzes = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics including variables, functions, and objects.",
    difficulty: "easy",
    questionCount: 15,
    duration: "20 min",
    attempts: 245,
    rating: "4.8",
    tags: ["javascript", "programming", "frontend"]
  },
  {
    id: 2,
    title: "React Hooks Deep Dive",
    description: "Advanced concepts in React Hooks including useEffect, useContext, and custom hooks.",
    difficulty: "hard",
    questionCount: 12,
    duration: "25 min",
    attempts: 89,
    rating: "4.6",
    tags: ["react", "hooks", "advanced"]
  },
  {
    id: 3,
    title: "CSS Grid Layout",
    description: "Master CSS Grid layout with practical examples and real-world scenarios.",
    difficulty: "medium",
    questionCount: 10,
    duration: "15 min",
    attempts: 156,
    rating: "4.7",
    tags: ["css", "layout", "design"]
  }
]

const quizAPI = {
  getAll: async (params) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockQuizzes
  },
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },
  duplicate: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  }
}

const useAuth = () => ({
  user: { id: 1, name: "John Doe" }
})

const toast = {
  success: (message) => console.log('Success:', message),
  error: (message) => console.log('Error:', message)
}

// Mock useQuery hook
const useQuery = ({ queryKey, queryFn, enabled = true }) => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await queryFn()
        setData(result)
      } catch (error) {
        console.error('Query error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [queryKey.join(','), enabled])

  return { 
    data, 
    isLoading, 
    refetch: () => {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const result = await queryFn()
          setData(result)
        } catch (error) {
          console.error('Query error:', error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }
}

// Main Component
const QuizzesPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedQuizzes, setSelectedQuizzes] = useState([])
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: quizzes = [], isLoading, refetch } = useQuery({
    queryKey: ['quizzes', searchQuery, selectedFilter, sortBy],
    queryFn: () => quizAPI.getAll({ search: searchQuery, filter: selectedFilter, sort: sortBy }),
    enabled: mounted,
  })

  const filterOptions = [
    { value: 'all', label: 'All Quizzes' },
    { value: 'my-quizzes', label: 'My Quizzes' },
    { value: 'shared', label: 'Shared with Me' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'favorite', label: 'Favorites' }
  ]

  const sortOptions = [
    { value: 'recent', label: 'Recently Added' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'performance', label: 'My Performance' }
  ]

  const handleQuizAction = async (action, quizId) => {
    try {
      switch (action) {
        case 'start':
          window.location.href = `/quiz/${quizId}`
          break
        case 'continue':
          window.location.href = `/quiz/${quizId}?continue=true`
          break
        case 'review':
          window.location.href = `/quiz/${quizId}/results`
          break
        case 'edit':
          window.location.href = `/dashboard/quizzes/${quizId}/edit`
          break
        case 'duplicate':
          await quizAPI.duplicate(quizId)
          toast.success('Quiz duplicated successfully')
          refetch()
          break
        case 'delete':
          if (confirm('Are you sure you want to delete this quiz?')) {
            await quizAPI.delete(quizId)
            toast.success('Quiz deleted successfully')
            refetch()
          }
          break
      }
    } catch (error) {
      toast.error(`Failed to ${action} quiz`)
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedQuizzes.length === 0) {
      toast.error('Please select quizzes first')
      return
    }

    try {
      switch (action) {
        case 'delete':
          if (confirm(`Delete ${selectedQuizzes.length} selected quiz(es)?`)) {
            await Promise.all(selectedQuizzes.map(id => quizAPI.delete(id)))
            toast.success('Quizzes deleted successfully')
            setSelectedQuizzes([])
            refetch()
          }
          break
        case 'export':
          toast.success('Exporting quizzes...')
          break
      }
    } catch (error) {
      toast.error(`Failed to ${action} quizzes`)
    }
  }

  const filteredQuizzes = quizzes?.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  }) || []

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">My Quizzes</h1>
              <p className="text-slate-600">
                {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'es' : ''} available
              </p>
            </div>

            <div className="flex items-center gap-3">
              {selectedQuizzes.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl">
                  <span className="text-sm font-medium">{selectedQuizzes.length} selected</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
                Create Quiz
              </Button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search quizzes by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={Search}
              />
            </div>

            <div className="lg:w-48">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quiz Grid/List */}
          {isLoading ? (
            <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredQuizzes.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onStart={(id) => handleQuizAction('start', id)}
                  onContinue={(id) => handleQuizAction('continue', id)}
                  onReview={(id) => handleQuizAction('review', id)}
                  viewMode={viewMode}
                  isSelected={selectedQuizzes.includes(quiz.id)}
                  onSelect={(id) => {
                    setSelectedQuizzes(prev => 
                      prev.includes(id) 
                        ? prev.filter(qId => qId !== id)
                        : [...prev, id]
                    )
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Quizzes Found</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Create your first quiz to get started.'}
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
                Create Your First Quiz
              </Button>
            </Card>
          )}

          {/* Create Quiz Modal */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            size="full"
            showCloseButton={false}
          >
            <QuizCreator
              onQuizCreated={(quiz) => {
                setIsCreateModalOpen(false)
                refetch()
                toast.success('Quiz created successfully!')
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </Modal>
        </div>
      </div>
    </div>
  )
}

export default QuizzesPage