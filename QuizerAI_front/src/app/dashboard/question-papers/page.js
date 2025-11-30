'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Upload, 
  Search,
  Grid,
  List,
  Clock,
  Eye,
  Share2,
  MoreVertical,
  Loader2,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  BookOpen,
  X,
  Download,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'
import axios from 'axios'

// API Service with Axios
const apiService = {
  async fetchQuestionPapers(filters = {}) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

    try {
      const params = {
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.status && { status: filters.status }),
        ...(filters.my_papers !== undefined && { my_papers: filters.my_papers })
      }

      const response = await axios.get(`${API_BASE_URL}/api/question-papers/`, { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch question papers')
    }
  },

  async deleteQuestionPaper(paperId) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/question-papers/${paperId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete question paper')
    }
  },

  async getQuestionPaper(paperId) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/question-papers/${paperId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch question paper')
    }
  },

  async checkPaperStatus(paperId) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/question-papers/${paperId}/status`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to check paper status')
    }
  }
}

const QuestionPapersPage = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    status: '',
    my_papers: false
  })
  const [papers, setPapers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load papers on component mount and filter changes
  useEffect(() => {
    loadPapers()
  }, [filters])

  const loadPapers = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.fetchQuestionPapers(filters)
      setPapers(data)
    } catch (error) {
      toast.error(error.message)
      setPapers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleDeletePaper = async () => {
    if (!selectedPaper) return
    
    try {
      setDeleting(true)
      await apiService.deleteQuestionPaper(selectedPaper.paper_id)
      toast.success('Question paper deleted successfully')
      await loadPapers() // Reload papers
      setShowDeleteModal(false)
      setSelectedPaper(null)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (paper.exam_type && paper.exam_type.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const PaperCard = ({ paper }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paper.status)}`}>
              {getStatusIcon(paper.status)}
              <span className="capitalize">{paper.status}</span>
            </div>
            {paper.exam_type && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {paper.exam_type}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {paper.title}
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            {paper.subject} {paper.year && `• ${paper.year}`} • {paper.total_questions || 0} questions
          </p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setSelectedPaper(paper)}
            className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-slate-800">{paper.attempts || 0}</div>
          <div className="text-slate-600">Attempts</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-slate-800">{paper.average_score || 0}%</div>
          <div className="text-slate-600">Avg Score</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold capitalize ${
            paper.difficulty === 'easy' ? 'text-green-600' :
            paper.difficulty === 'medium' ? 'text-orange-600' : 'text-red-600'
          }`}>
            {paper.difficulty}
          </div>
          <div className="text-slate-600">Difficulty</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {paper.status === 'processed' ? (
          <Link href={`/quiz/${paper.paper_id}`} className="flex-1">
            <motion.button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlayCircle className="w-4 h-4" />
              Start Practice
            </motion.button>
          </Link>
        ) : paper.status === 'processing' ? (
          <div className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Failed
          </div>
        )}
        
        <motion.button
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSelectedPaper(paper)}
        >
          <Eye className="w-4 h-4 text-slate-600" />
        </motion.button>
        
        <motion.button
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {/* Share paper */}}
        >
          <Share2 className="w-4 h-4 text-slate-600" />
        </motion.button>
      </div>
    </motion.div>
  )

  const PaperListItem = ({ paper }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800">{paper.title}</h3>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paper.status)}`}>
                {getStatusIcon(paper.status)}
                <span className="capitalize">{paper.status}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {paper.subject} {paper.exam_type && `• ${paper.exam_type}`} • {paper.total_questions || 0} questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="text-slate-800 font-medium">{paper.average_score || 0}% avg</div>
            <div className="text-slate-600">{paper.attempts || 0} attempts</div>
          </div>
          {paper.status === 'processed' && (
            <Link href={`/quiz/${paper.paper_id}`}>
              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayCircle className="w-4 h-4" />
                Practice
              </motion.button>
            </Link>
          )}
          <button
            onClick={() => setSelectedPaper(paper)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Question Papers</h1>
              <p className="text-lg text-slate-600">Practice with uploaded question papers and extracted questions</p>
            </div>
            <Link href="/dashboard/question-papers/upload">
              <motion.button
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="w-5 h-5" />
                Upload Paper
              </motion.button>
            </Link>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 mb-8"
          >
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search question papers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="General Studies">General Studies</option>
                </select>

                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="processed">Processed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>

                <button
                  onClick={() => handleFilterChange('my_papers', !filters.my_papers)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    filters.my_papers 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  My Papers
                </button>

                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors duration-200 ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Grid className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-colors duration-200 ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <List className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPapers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">No Question Papers Found</h3>
              <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                {searchQuery || Object.values(filters).some(v => v) 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first question paper to get started with practice tests'
                }
              </p>
              <Link href="/dashboard/question-papers/upload">
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upload Question Paper
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPapers.map((paper, index) => (
                    <motion.div
                      key={paper.paper_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PaperCard paper={paper} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPapers.map((paper, index) => (
                    <motion.div
                      key={paper.paper_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PaperListItem paper={paper} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Delete Question Paper</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete &quot;{selectedPaper.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedPaper(null)
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePaper}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Paper Actions Menu */}
      {selectedPaper && !showDeleteModal && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30"
          onClick={() => setSelectedPaper(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{selectedPaper.title}</h3>
            <div className="space-y-2">
              {selectedPaper.status === 'processed' && (
                <Link href={`/quiz/${selectedPaper.paper_id}`}>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Start Quiz
                  </button>
                </Link>
              )}
              <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Paper
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
            <button
              onClick={() => setSelectedPaper(null)}
              className="w-full mt-4 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default QuestionPapersPage