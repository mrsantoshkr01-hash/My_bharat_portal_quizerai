'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Crown,
  Shield,
  UserMinus,
  MessageSquare,
  Award,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react'

const StudentList = ({ students, currentUser, onRemoveStudent, onMakeAdmin, onSendMessage }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, score, activity, joined
  const [filterRole, setFilterRole] = useState('all') // all, admin, member

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === 'all' || student.role === filterRole
      return matchesSearch && matchesRole
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'score':
          return (b.averageScore || 0) - (a.averageScore || 0)
        case 'activity':
          return new Date(b.lastActive) - new Date(a.lastActive)
        case 'joined':
          return new Date(b.joinedAt) - new Date(a.joinedAt)
        default:
          return 0
      }
    })

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return Crown
      case 'admin': return Shield
      default: return Users
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'text-yellow-600 bg-yellow-100'
      case 'admin': return 'text-purple-600 bg-purple-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getActivityStatus = (lastActive) => {
    const now = new Date()
    const lastActiveDate = new Date(lastActive)
    const diffMinutes = (now - lastActiveDate) / (1000 * 60)
    
    if (diffMinutes < 5) return { status: 'online', color: 'bg-green-500' }
    if (diffMinutes < 30) return { status: 'away', color: 'bg-yellow-500' }
    return { status: 'offline', color: 'bg-slate-400' }
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-slate-600" />
            <h3 className="text-xl font-semibold text-slate-800">
              Members ({filteredStudents.length})
            </h3>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="score">Sort by Score</option>
              <option value="activity">Sort by Activity</option>
              <option value="joined">Sort by Joined</option>
            </select>

            <select
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="owner">Owners</option>
              <option value="admin">Admins</option>
              <option value="member">Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="divide-y divide-slate-100">
        {filteredStudents.map((student, index) => {
          const RoleIcon = getRoleIcon(student.role)
          const activityStatus = getActivityStatus(student.lastActive)
          
          return (
            <motion.div
              key={student.id}
              className="p-6 hover:bg-slate-50 transition-colors duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${activityStatus.color}`}></div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800 truncate">{student.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleColor(student.role)}`}>
                      <RoleIcon className="w-3 h-3" />
                      {student.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">{student.email}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>Joined {student.joinedAt}</span>
                    <span>•</span>
                    <span className="capitalize">{activityStatus.status}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 text-center">
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <Target className="w-3 h-3" />
                      <span className="text-xs">Score</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {student.averageScore ? `${student.averageScore}%` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Hours</span>
                    </div>
                    <div className="font-semibold text-slate-800">{student.studyHours || 0}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <Award className="w-3 h-3" />
                      <span className="text-xs">Quizzes</span>
                    </div>
                    <div className="font-semibold text-slate-800">{student.completedQuizzes || 0}</div>
                  </div>
                </div>

                {/* Actions */}
                {currentUser.role === 'owner' || currentUser.role === 'admin' ? (
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={() => onSendMessage(student)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </motion.button>
                    
                    {student.role !== 'owner' && currentUser.role === 'owner' && (
                      <motion.button
                        onClick={() => onMakeAdmin(student)}
                        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={student.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      >
                        <Shield className="w-4 h-4" />
                      </motion.button>
                    )}
                    
                    {student.role !== 'owner' && student.id !== currentUser.id && (
                      <motion.button
                        onClick={() => onRemoveStudent(student)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Remove Member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <motion.button
                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Mobile Stats */}
              <div className="md:hidden mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-600 mb-1">Score</div>
                  <div className="font-semibold text-slate-800">
                    {student.averageScore ? `${student.averageScore}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Hours</div>
                  <div className="font-semibold text-slate-800">{student.studyHours || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Quizzes</div>
                  <div className="font-semibold text-slate-800">{student.completedQuizzes || 0}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-600 mb-2">No members found</h4>
          <p className="text-slate-500">
            {searchTerm ? 'Try adjusting your search terms' : 'This classroom has no members yet'}
          </p>
        </div>
      )}
    </div>
  )
}

export default StudentList