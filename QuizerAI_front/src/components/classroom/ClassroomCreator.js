'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Globe, 
  Lock, 
  Calendar, 
  Clock,
  Plus,
  X,
  Settings,
  UserPlus,
  Book,
  Wand2
} from 'lucide-react'

const ClassroomCreator = ({ onClassroomCreated, onClose }) => {
  const [step, setStep] = useState(1)
  const [classroomData, setClassroomData] = useState({
    name: '',
    description: '',
    subject: '',
    privacy: 'public',
    maxMembers: 50,
    schedule: {
      type: 'flexible', // flexible, recurring, one-time
      startDate: '',
      time: '',
      duration: 60,
      recurrence: 'weekly'
    },
    settings: {
      allowMemberInvites: true,
      requireApproval: false,
      enableChat: true,
      enableScreenShare: true,
      recordSessions: false
    },
    invitedMembers: []
  })
  const [loading, setLoading] = useState(false)

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'History', 'Geography', 'Economics', 'Psychology',
    'Engineering', 'Medicine', 'Law', 'Business', 'Art & Design'
  ]

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      onClassroomCreated(classroomData)
    } catch (error) {
      console.error('Error creating classroom:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Classroom Name *
        </label>
        <input
          type="text"
          placeholder="e.g., Physics Study Group, Math Exam Prep"
          className="w-full input-primary"
          value={classroomData.name}
          onChange={(e) => setClassroomData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Subject
        </label>
        <select
          className="w-full input-primary"
          value={classroomData.subject}
          onChange={(e) => setClassroomData(prev => ({ ...prev, subject: e.target.value }))}
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <textarea
          rows={4}
          placeholder="Describe what this classroom is about, study goals, etc."
          className="w-full input-primary"
          value={classroomData.description}
          onChange={(e) => setClassroomData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Privacy Setting
          </label>
          <div className="space-y-3">
            {[
              { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can find and join' },
              { value: 'private', label: 'Private', icon: Lock, description: 'Invite-only classroom' }
            ].map((option) => (
              <motion.label
                key={option.value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  classroomData.privacy === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <input
                  type="radio"
                  name="privacy"
                  value={option.value}
                  checked={classroomData.privacy === option.value}
                  onChange={(e) => setClassroomData(prev => ({ ...prev, privacy: e.target.value }))}
                  className="sr-only"
                />
                <option.icon className={`w-5 h-5 mt-0.5 ${
                  classroomData.privacy === option.value ? 'text-purple-600' : 'text-slate-500'
                }`} />
                <div>
                  <div className="font-medium text-slate-800">{option.label}</div>
                  <div className="text-sm text-slate-600">{option.description}</div>
                </div>
              </motion.label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Maximum Members
          </label>
          <input
            type="number"
            min="2"
            max="500"
            className="w-full input-primary"
            value={classroomData.maxMembers}
            onChange={(e) => setClassroomData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
          />
          <p className="text-sm text-slate-500 mt-1">Recommended: 10-50 members for best experience</p>
        </div>
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Schedule & Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Session Schedule
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'flexible', label: 'Flexible', description: 'No fixed schedule' },
            { value: 'recurring', label: 'Recurring', description: 'Regular meetings' },
            { value: 'one-time', label: 'One-time', description: 'Single session' }
          ].map((option) => (
            <motion.label
              key={option.value}
              className={`p-4 rounded-lg border cursor-pointer transition-colors text-center ${
                classroomData.schedule.type === option.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <input
                type="radio"
                name="scheduleType"
                value={option.value}
                checked={classroomData.schedule.type === option.value}
                onChange={(e) => setClassroomData(prev => ({ 
                  ...prev, 
                  schedule: { ...prev.schedule, type: e.target.value }
                }))}
                className="sr-only"
              />
              <div className="font-medium text-slate-800 mb-1">{option.label}</div>
              <div className="text-sm text-slate-600">{option.description}</div>
            </motion.label>
          ))}
        </div>
      </div>

      {classroomData.schedule.type !== 'flexible' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full input-primary"
              value={classroomData.schedule.startDate}
              onChange={(e) => setClassroomData(prev => ({ 
                ...prev, 
                schedule: { ...prev.schedule, startDate: e.target.value }
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time
            </label>
            <input
              type="time"
              className="w-full input-primary"
              value={classroomData.schedule.time}
              onChange={(e) => setClassroomData(prev => ({ 
                ...prev, 
                schedule: { ...prev.schedule, time: e.target.value }
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (minutes)
            </label>
            <select
              className="w-full input-primary"
              value={classroomData.schedule.duration}
              onChange={(e) => setClassroomData(prev => ({ 
                ...prev, 
                schedule: { ...prev.schedule, duration: parseInt(e.target.value) }
              }))}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          {classroomData.schedule.type === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recurrence
              </label>
              <select
                className="w-full input-primary"
                value={classroomData.schedule.recurrence}
                onChange={(e) => setClassroomData(prev => ({ 
                  ...prev, 
                  schedule: { ...prev.schedule, recurrence: e.target.value }
                }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </motion.div>
      )}

      <div>
        <h4 className="font-medium text-slate-800 mb-3">Classroom Settings</h4>
        <div className="space-y-3">
          {[
            { key: 'allowMemberInvites', label: 'Allow members to invite others', description: 'Members can send invitations' },
            { key: 'requireApproval', label: 'Require approval for new members', description: 'You approve each join request' },
            { key: 'enableChat', label: 'Enable chat during sessions', description: 'Real-time messaging' },
            { key: 'enableScreenShare', label: 'Allow screen sharing', description: 'Members can share screens' },
            { key: 'recordSessions', label: 'Record study sessions', description: 'Save sessions for later review' }
          ].map((setting) => (
            <label key={setting.key} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={classroomData.settings[setting.key]}
                onChange={(e) => setClassroomData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, [setting.key]: e.target.checked }
                }))}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-slate-800">{setting.label}</div>
                <div className="text-sm text-slate-600">{setting.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Review & Launch</h3>
      
      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-600" />
          <h4 className="font-semibold text-slate-800">Classroom Summary</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-slate-600">Name:</span>
            <p className="font-medium">{classroomData.name || 'Untitled Classroom'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Subject:</span>
            <p className="font-medium">{classroomData.subject || 'No subject selected'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Privacy:</span>
            <p className="font-medium capitalize flex items-center gap-1">
              {classroomData.privacy === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {classroomData.privacy}
            </p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Max Members:</span>
            <p className="font-medium">{classroomData.maxMembers}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Schedule:</span>
            <p className="font-medium capitalize">{classroomData.schedule.type}</p>
          </div>
          {classroomData.schedule.type !== 'flexible' && (
            <div>
              <span className="text-sm text-slate-600">Duration:</span>
              <p className="font-medium">{classroomData.schedule.duration} minutes</p>
            </div>
          )}
        </div>
        
        <div>
          <span className="text-sm text-slate-600">Description:</span>
          <p className="font-medium">{classroomData.description || 'No description provided'}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wand2 className="w-6 h-6 text-purple-600" />
          <h4 className="font-semibold text-slate-800">Ready to Launch!</h4>
        </div>
        <p className="text-slate-600 mb-4">
          Your classroom will be created and you can start inviting members immediately. 
          You can always modify settings later from the classroom dashboard.
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>Setup takes just a few seconds</span>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Create Classroom</h2>
              <p className="text-slate-600">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    stepNum <= step ? 'bg-purple-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex gap-3">
            {step < 3 ? (
              <motion.button
                onClick={handleNext}
                className="btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="loading-dots">
                      <div style={{'--i': 0}}></div>
                      <div style={{'--i': 1}}></div>
                      <div style={{'--i': 2}}></div>
                    </div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Create Classroom
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ClassroomCreator
