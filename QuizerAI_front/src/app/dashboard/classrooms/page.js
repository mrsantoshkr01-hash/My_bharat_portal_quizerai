/**
 * Classrooms Management Page
 * 
 * Purpose: Interface for managing and participating in collaborative learning classrooms
 * Features:
 * - Classroom discovery and joining
 * - Teacher classroom creation and management
 * - Live session monitoring
 * - Participant management and analytics
 * - Resource sharing and collaboration tools
 * - Session scheduling and calendar integration
 * 
 * Integration: Real-time WebSocket connections for live collaboration
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Users, 
  BookOpen, 
  Clock, 
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Copy,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useClassroomStore } from '@/store/classroomStore'
import useUIStore  from '@/store/uiStore'
import Header from '@/components/layout/Header'

const ClassroomsPage = () => {
  const { classrooms, fetchClassrooms, isLoading } = useClassroomStore()
  const { openModal } = useUIStore()
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState('all')

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const filteredClassrooms = classrooms.filter(classroom => {
    const matchesSearch = classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         classroom.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'owned' && classroom.role === 'teacher') ||
                         (filterBy === 'joined' && classroom.role === 'student')
    
    return matchesSearch && matchesFilter
  })

  const ClassroomCard = ({ classroom }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              classroom.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
            <span className={`text-xs font-medium ${
              classroom.role === 'teacher' ? 'text-blue-600' : 'text-purple-600'
            }`}>
              {classroom.role === 'teacher' ? 'Teaching' : 'Student'}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
            {classroom.name}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-2 mb-4">
            {classroom.description || 'No description provided'}
          </p>
        </div>
        <div className="relative">
          <button className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{classroom.member_count || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{classroom.quiz_count || 0} quizzes</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{new Date(classroom.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/dashboard/classrooms/${classroom.id}`} className="flex-1">
          <motion.button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Enter Classroom
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </Link>
        <motion.button
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigator.clipboard.writeText(classroom.code)}
        >
          <Copy className="w-4 h-4 text-slate-600" />
        </motion.button>
      </div>
    </motion.div>
  )

  const ClassroomListItem = ({ classroom }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            classroom.role === 'teacher' 
              ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
              : 'bg-gradient-to-br from-green-500 to-emerald-500'
          }`}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{classroom.name}</h3>
            <p className="text-sm text-slate-600">{classroom.member_count} members • {classroom.quiz_count} quizzes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            classroom.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {classroom.role}
          </span>
          <Link href={`/dashboard/classrooms/${classroom.id}`}>
            <motion.button
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Enter
            </motion.button>
          </Link>
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Classrooms</h1>
              <p className="text-lg text-slate-600">Collaborate with peers and share knowledge</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/classrooms/create">
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  Create Classroom
                </motion.button>
              </Link>
              <motion.button
                onClick={() => openModal('joinClassroom')}
                className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus className="w-5 h-5" />
                Join Classroom
              </motion.button>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search classrooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="all">All Classrooms</option>
                  <option value="owned">My Classrooms</option>
                  <option value="joined">Joined Classrooms</option>
                </select>
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
          ) : filteredClassrooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">No Classrooms Found</h3>
              <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first classroom or join one to get started'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/classrooms/create">
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Classroom
                  </motion.button>
                </Link>
                <motion.button
                  onClick={() => openModal('joinClassroom')}
                  className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Classroom
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClassrooms.map((classroom, index) => (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ClassroomCard classroom={classroom} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClassrooms.map((classroom, index) => (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ClassroomListItem classroom={classroom} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassroomsPage