'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Settings,
  FileText,
  Users,
  Save,
  Loader2,
  BookOpen,
  Search,
  Filter,
  Eye,
  X,
  Send
} from 'lucide-react'
import { TeacherGuard } from '@/components/auth/RoleGuard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { classroomApi } from '@/utils/api/classroomApi'
import { quizApi } from '@/utils/api/quizApi'
import Link from 'next/link'
import toast from 'react-hot-toast'
import GeofenceSetup from '@/components/QuizSecurity/GeofenceSetup'

const AssignQuizPage = () => {
  const params = useParams()
  const router = useRouter()
  const [classroom, setClassroom] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [filteredQuizzes, setFilteredQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterSubject, setFilterSubject] = useState('all')
  const [showPreview, setShowPreview] = useState(false)
  const [quizDetails, setQuizDetails] = useState(null)
  const [showAssignment, setShowAssignment] = useState(false)
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    time_limit_minutes: '',
    max_attempts: 1,
    shuffle_questions: null,
    show_results_immediately: true,
    allow_late_submission: true,
    negative_marking: false, // Add this line,
    // ADD THESE GEOFENCING FIELDS
    geofencing_enabled: false,
    geofence_center_lat: null,    // Use this instead of allowed_latitude
    geofence_center_lng: null,    // Use this instead of allowed_longitude
    geofence_radius_meters: 100   // Use this instead of allowed_radius
  })

  const classroomId = params.id

  useEffect(() => {
    if (classroomId && classroomId !== 'undefined' && !isNaN(parseInt(classroomId))) {
      fetchData()
    } else {
      toast.error('Invalid classroom ID')
      router.push('/teacher_dashboard')
    }
  }, [classroomId])

  // Filter quizzes based on search and filters
  useEffect(() => {
    let filtered = quizzes

    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(quiz => quiz.difficulty_level === filterDifficulty)
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(quiz => quiz.subject === filterSubject)
    }

    setFilteredQuizzes(filtered)
  }, [quizzes, searchTerm, filterDifficulty, filterSubject])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [classroomData, quizzesData] = await Promise.all([
        classroomApi.getClassroomAnalytics(classroomId),
        quizApi.getMyQuizzes({ status: 'active' })
      ])

      setClassroom(classroomData.classroom)
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadQuizDetails = async (quiz) => {
    try {
      setLoading(true)
      const details = await quizApi.getQuizById(quiz.id, true)
      setQuizDetails(details)
      return details
    } catch (error) {
      toast.error('Failed to load quiz details')
      return null
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (quiz) => {
    const details = await loadQuizDetails(quiz)
    if (details) {
      setShowPreview(true)
    }
  }

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz)
    setFormData(prev => ({
      ...prev,
      title: `${quiz.title} - Assignment`,
      time_limit_minutes: quiz.total_time_minutes || 30,
      shuffle_questions: quiz.shuffle_questions,
      show_results_immediately: classroom?.show_results_to_students || true
    }))
    setShowAssignment(true)
  }

  const handleAssign = async () => {
    // ADD THIS at the beginning of handleAssign function:
    if (!selectedQuiz || !formData.title.trim()) {
      toast.error('Please fill in required fields')
      return
    }

    // Validate time limit if provided
    if (formData.time_limit_minutes && (isNaN(formData.time_limit_minutes) || formData.time_limit_minutes < 1)) {
      toast.error('Time limit must be a positive number')
      return
    }

    // Validate due date if provided
    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      toast.error('Due date cannot be in the past')
      return
    }

    try {
      setSubmitting(true)

      const assignmentData = {
        quiz_id: selectedQuiz.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        instructions: formData.instructions.trim() || null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        time_limit_minutes: formData.time_limit_minutes ? parseInt(formData.time_limit_minutes) : null,
        max_attempts: parseInt(formData.max_attempts),
        shuffle_questions: formData.shuffle_questions,
        show_results_immediately: formData.show_results_immediately,
        allow_late_submission: formData.allow_late_submission,
        negative_marking: formData.negative_marking, // Add this line
        // FIX THE FIELD NAMES - these should match what GeofenceSetup returns
        geofencing_enabled: formData.geofencing_enabled || false,
        allowed_latitude: formData.geofence_center_lat || null,  // Changed from allowed_latitude
        allowed_longitude: formData.geofence_center_lng || null, // Changed from allowed_longitude  
        allowed_radius: formData.geofence_radius_meters || 100   // Changed from allowed_radius

      }

      console.log('Assignment data being sent:', assignmentData)
      console.log('Geofencing enabled:', formData.geofencing_enabled)
      console.log('Coordinates:', formData.geofence_center_lat, formData.geofence_center_lng)


      await classroomApi.assignQuizToClassroom(classroomId, assignmentData)

      toast.success('Quiz assigned successfully! Students will be notified.')
      router.push(`/teacher_dashboard/classroom/${classroomId}`)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to assign quiz'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
        type === 'number' ? (value === '' ? '' : parseInt(value)) :
          value
    }))
  }

  const subjects = [...new Set(quizzes.map(q => q.subject).filter(Boolean))]

  if (loading && !quizzes.length) {
    return (
      <TeacherGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-slate-200 rounded w-64"></div>
                <div className="bg-white rounded-2xl p-8">
                  <div className="h-12 bg-slate-200 rounded w-96 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </TeacherGuard>
    )
  }

  return (
    <TeacherGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />

        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <Link href={`/teacher_dashboard/classroom/${classroomId}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Classroom</span>
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Assign Quiz</h1>
              <p className="text-lg text-slate-600">Choose a quiz from your library to assign to {classroom?.name}</p>
            </motion.div>

            {/* Quiz Library Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Your Quiz Library</h3>
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/quizzes/create">
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Create New Quiz
                    </button>
                  </Link>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search quizzes by title, description, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                  {filteredQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 truncate">{quiz.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{quiz.total_questions} questions</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            {quiz.subject && (
                              <span className="bg-slate-100 px-2 py-1 rounded-full">{quiz.subject}</span>
                            )}
                            {quiz.difficulty_level && (
                              <span className={`px-2 py-1 rounded-full ${quiz.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' :
                                quiz.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {quiz.difficulty_level}
                              </span>
                            )}
                            {quiz.total_time_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {quiz.total_time_minutes}min
                              </div>
                            )}
                          </div>
                          {quiz.description && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{quiz.description}</p>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handlePreview(quiz)}
                              className="flex items-center gap-1 px-3 py-1 text-xs border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Preview
                            </button>
                            <button
                              onClick={() => handleQuizSelect(quiz)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Users className="w-3 h-3" />
                              Assign
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {quizzes.length === 0 ? (
                    <>
                      <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-600 mb-2">No Quizzes in Library</h4>
                      <p className="text-slate-500 mb-6">Create your first quiz to start assigning to students.</p>
                      <Link href="/dashboard/quizzes/create">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                          Create Your First Quiz
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-600 mb-2">No Matching Quizzes</h4>
                      <p className="text-slate-500 mb-4">Try adjusting your search or filters.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setFilterDifficulty('all')
                          setFilterSubject('all')
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear Filters
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Quiz Preview Modal */}
        <AnimatePresence>
          {showPreview && quizDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{quizDetails.title}</h3>
                    <p className="text-slate-600 text-sm">{quizDetails.total_questions} questions • {quizDetails.total_time_minutes} minutes</p>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                  {quizDetails.questions ? (
                    <div className="space-y-6">
                      {quizDetails.questions.map((question, index) => (
                        <div key={question.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Q{index + 1}
                            </span>
                            <p className="font-medium text-slate-800">{question.question_text}</p>
                          </div>

                          {question.options && (
                            <div className="ml-8 space-y-2">
                              {question.options.map((option, optIndex) => {
                                const isCorrect = question.correct_answer === option
                                return (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded border ${isCorrect ? 'border-green-300 bg-green-50' : 'border-slate-200'
                                      }`}
                                  >
                                    <span className={isCorrect ? 'text-green-800 font-medium' : 'text-slate-700'}>
                                      {option}
                                    </span>
                                    {isCorrect && <span className="text-green-600 ml-2">✓</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {question.explanation && (
                            <div className="mt-3 ml-8 p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-sm text-blue-800">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No questions available
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Assignment Modal */}
        <AnimatePresence>
          {showAssignment && selectedQuiz && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAssignment(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Assign Quiz to Classroom</h3>
                    <p className="text-slate-600 text-sm">&quot;{selectedQuiz.title}&quot;</p>
                  </div>
                  <button
                    onClick={() => setShowAssignment(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Instructions (Optional)
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Additional instructions for students..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        name="time_limit_minutes"
                        value={formData.time_limit_minutes}
                        onChange={handleChange}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="show_results_immediately"
                        checked={formData.show_results_immediately}
                        onChange={handleChange}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">Show results immediately</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="negative_marking"
                        checked={formData.negative_marking}
                        onChange={handleChange}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">Enable negative marking (-1 for wrong answers)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700">Max attempts:</span>
                      <select
                        name="max_attempts"
                        value={formData.max_attempts}
                        onChange={handleChange}
                        className="p-1 border border-slate-300 rounded text-sm"
                      >
                        {[1, 2, 3, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* for security reason */}

                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSecuritySettings(true)}
                    className="flex items-center gap-2 w-full p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Configure Security & Geofencing</span>
                  </button>
                </div>


                {showSecuritySettings && (
                  <GeofenceSetup
                    quizId={selectedQuiz?.id}
                    isAssignmentMode={true}
                    onClose={() => setShowSecuritySettings(false)}
                    onSettingsUpdate={(settings) => {
                      console.log('Security settings saved:', settings);

                      // UPDATE FORM DATA WITH GEOFENCING SETTINGS
                      setFormData(prev => ({
                        ...prev,
                        geofencing_enabled: settings.geofencing_enabled || false,
                        geofence_center_lat: settings.allowed_latitude || null,
                        geofence_center_lng: settings.allowed_longitude || null,
                        geofence_radius_meters: settings.allowed_radius || 100
                      }));

                      console.log('Updated formData coordinates:', {
                        lat: settings.allowed_latitude,
                        lng: settings.allowed_longitude,
                        radius: settings.allowed_radius
                      });
                      setShowSecuritySettings(false);
                    }}
                  />
                )}

                <div className="flex gap-3 p-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowAssignment(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Assign Quiz
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </TeacherGuard>
  )
}

export default AssignQuizPage

