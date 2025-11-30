// for classromms
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  BookOpen, 
  Plus, 
  Share2, 
  Settings, 
  MoreVertical,
  UserPlus,
  MessageCircle,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Copy,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { useClassroomStore } from '@/store/classroomStore'
import Header from '@/components/layout/Header'

const ClassroomDetailPage = () => {
  const params = useParams()
  const { currentClassroom, classroomMembers, classroomQuizzes, getClassroomById, isLoading } = useClassroomStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (params.id) {
      getClassroomById(params.id)
    }
  }, [params.id])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: Target },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const filteredQuizzes = classroomQuizzes?.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (isLoading || !currentClassroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-soft">
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200 mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">{currentClassroom.name}</h1>
                    <p className="text-slate-600">{currentClassroom.subject} • {currentClassroom.code}</p>
                  </div>
                </div>
                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                  {currentClassroom.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{classroomMembers?.length || 0} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{classroomQuizzes?.length || 0} quizzes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">Created {new Date(currentClassroom.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigator.clipboard.writeText(currentClassroom.code)}
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </motion.button>
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Members
                </motion.button>
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Quiz
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft border border-slate-200 mb-8"
          >
            <div className="flex items-center border-b border-slate-200 px-6">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                  whileHover={{ y: -2 }}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </motion.button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-blue-700">{classroomMembers?.length || 0}</span>
                        </div>
                        <h3 className="font-semibold text-blue-800">Total Members</h3>
                        <p className="text-sm text-blue-600">Active participants</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-purple-700">{classroomQuizzes?.length || 0}</span>
                        </div>
                        <h3 className="font-semibold text-purple-800">Total Quizzes</h3>
                        <p className="text-sm text-purple-600">Available assessments</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-2xl font-bold text-green-700">85%</span>
                        </div>
                        <h3 className="font-semibold text-green-800">Avg. Score</h3>
                        <p className="text-sm text-green-600">Class performance</p>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {[
                          { user: 'Sarah Chen', action: 'completed', item: 'Biology Quiz #3', time: '2 hours ago', score: '92%' },
                          { user: 'Mike Johnson', action: 'joined', item: 'the classroom', time: '5 hours ago' },
                          { user: 'Teacher', action: 'shared', item: 'Chemistry Practice Test', time: '1 day ago' },
                          { user: 'Emma Wilson', action: 'completed', item: 'Physics Lab Quiz', time: '2 days ago', score: '88%' }
                        ].map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-semibold">
                              {activity.user.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-800">
                                <span className="font-medium">{activity.user}</span> {activity.action} {activity.item}
                                {activity.score && <span className="text-green-600 font-medium"> ({activity.score})</span>}
                              </p>
                              <p className="text-sm text-slate-500">{activity.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'quizzes' && (
                  <motion.div
                    key="quizzes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Search and Filter */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search quizzes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        />
                      </div>
                      <motion.button
                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-5 h-5" />
                        Add Quiz
                      </motion.button>
                    </div>

                    {/* Quiz Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredQuizzes.map((quiz, index) => (
                        <motion.div
                          key={quiz.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-medium transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                {quiz.title}
                              </h4>
                              <p className="text-sm text-slate-600 line-clamp-2">
                                {quiz.description}
                              </p>
                            </div>
                            <button className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>{quiz.duration || 30} min</span>
                          </div>
                          
                          <Link href={`/quiz/${quiz.id}`}>
                            <motion.button
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Start Quiz
                            </motion.button>
                          </Link>
                        </motion.div>
                      ))}
                    </div>

                    {filteredQuizzes.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Target className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Quizzes Yet</h3>
                        <p className="text-slate-600 mb-6">Start by creating your first quiz for this classroom</p>
                        <motion.button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Create Quiz
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'members' && (
                  <motion.div
                    key="members"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">Classroom Members</h3>
                      <motion.button
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite Members
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(classroomMembers || []).map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-medium transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">{member.name}</h4>
                              <p className="text-sm text-slate-600">{member.role}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              member.status === 'online' ? 'bg-green-500' : 'bg-slate-300'
                            }`}></div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Quizzes completed:</span>
                              <span className="font-medium text-slate-800">{member.quiz_count || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Avg. score:</span>
                              <span className="font-medium text-slate-800">{member.avg_score || 0}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-slate-800">Classroom Analytics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h4 className="font-semibold text-slate-800 mb-4">Performance Overview</h4>
                        <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
                          <p className="text-slate-500">Chart visualization would go here</p>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h4 className="font-semibold text-slate-800 mb-4">Quiz Participation</h4>
                        <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
                          <p className="text-slate-500">Participation chart would go here</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ClassroomDetailPage