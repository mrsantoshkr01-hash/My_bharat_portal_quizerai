'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { classroomApi } from '@/utils/api/classroomApi'
import toast from 'react-hot-toast'

const JoinClassroomModal = ({ isOpen, onClose, onSuccess }) => {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!joinCode.trim()) {
      setError('Please enter a join code')
      return
    }

    if (joinCode.length !== 6) {
      setError('Join code must be 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await classroomApi.joinClassroom(joinCode.trim().toUpperCase())
      
      toast.success(`Successfully joined ${result.classroom_name}!`, {
        duration: 4000,
        position: 'top-right'
      })

      onSuccess()
      setJoinCode('')
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to join classroom'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setJoinCode('')
      setError('')
      onClose()
    }
  }

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setJoinCode(value)
    if (error) setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Join Classroom</h3>
                  <p className="text-sm text-slate-600">Enter the 6-character code from your teacher</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={handleCodeChange}
                  placeholder="ABC123"
                  disabled={loading}
                  className={`w-full text-center text-2xl font-mono font-bold tracking-wider px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    error 
                      ? 'border-red-300 bg-red-50 text-red-700' 
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  maxLength={6}
                  autoComplete="off"
                />
                <div className="mt-2 text-xs text-slate-500 text-center">
                  {joinCode.length}/6 characters
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}

              <div className="space-y-3">
                <motion.button
                  type="submit"
                  disabled={loading || joinCode.length !== 6}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    loading || joinCode.length !== 6
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:from-blue-700 hover:to-purple-700'
                  }`}
                  whileHover={joinCode.length === 6 && !loading ? { scale: 1.02 } : {}}
                  whileTap={joinCode.length === 6 && !loading ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Join Classroom
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full py-3 px-4 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="px-6 pb-6 pt-0">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Need help?</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Ask your teacher for the 6-character join code</li>
                  <li>• Join codes are case-insensitive</li>
                  <li>• You can only join active classrooms</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default JoinClassroomModal