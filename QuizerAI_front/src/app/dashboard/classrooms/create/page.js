'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { useClassroomStore } from '@/store/classroomStore'
import  useUIStore  from '@/store/uiStore'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'

const CreateClassroomPage = () => {
  const router = useRouter()
  const { createClassroom, isLoading } = useClassroomStore()
  const { addToast } = useUIStore()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    privacy: 'public',
    allowStudentQuizzes: true,
    autoJoin: false,
    maxMembers: 50
  })
  const [step, setStep] = useState(1)
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const subjects = [
    'Mathematics', 'Science', 'English', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art',
    'Music', 'Physical Education', 'Economics', 'Psychology', 'Other'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const generateClassroomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setGeneratedCode(code)
    return code
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const classroomData = {
      ...formData,
      code: generateClassroomCode()
    }

    const result = await createClassroom(classroomData)
    
    if (result.success) {
      setStep(3)
      addToast({
        type: 'success',
        title: 'Classroom Created!',
        message: 'Your classroom has been created successfully.'
      })
    } else {
      toast.error(result.error || 'Failed to create classroom')
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link href="/dashboard/classrooms" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Classrooms</span>
            </Link>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center space-x-8">
              {[
                { number: 1, label: 'Basic Info', icon: BookOpen },
                { number: 2, label: 'Settings', icon: Settings },
                { number: 3, label: 'Complete', icon: Check }
              ].map((stepItem) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step >= stepItem.number 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step > stepItem.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <stepItem.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 font-medium ${
                    step >= stepItem.number ? 'text-slate-800' : 'text-slate-500'
                  }`}>
                    {stepItem.label}
                  </span>
                  {stepItem.number < 3 && (
                    <div className={`w-8 h-0.5 mx-4 transition-all duration-300 ${
                      step > stepItem.number ? 'bg-blue-600' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200"
          >
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Classroom Information</h2>
                
                <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Classroom Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-primary"
                      placeholder="Enter classroom name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="input-primary"
                      placeholder="Describe what this classroom is about"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="input-primary"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject.toLowerCase()}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue to Settings
                  </motion.button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Classroom Settings</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Privacy Settings
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="privacy"
                          value="public"
                          checked={formData.privacy === 'public'}
                          onChange={handleChange}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-slate-800">Public</div>
                          <div className="text-sm text-slate-600">Anyone can find and join this classroom</div>
                        </div>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="privacy"
                          value="private"
                          checked={formData.privacy === 'private'}
                          onChange={handleChange}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-slate-800">Private</div>
                          <div className="text-sm text-slate-600">Students need the classroom code to join</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Maximum Members
                    </label>
                    <input
                      type="number"
                      name="maxMembers"
                      value={formData.maxMembers}
                      onChange={handleChange}
                      min="1"
                      max="500"
                      className="input-primary"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">Allow Student Quiz Creation</div>
                        <div className="text-sm text-slate-600">Students can create and share quizzes</div>
                      </div>
                      <input
                        type="checkbox"
                        name="allowStudentQuizzes"
                        checked={formData.allowStudentQuizzes}
                        onChange={handleChange}
                        className="toggle"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">Auto-Join</div>
                        <div className="text-sm text-slate-600">Automatically approve join requests</div>
                      </div>
                      <input
                        type="checkbox"
                        name="autoJoin"
                        checked={formData.autoJoin}
                        onChange={handleChange}
                        className="toggle"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border-2 border-slate-300 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:border-slate-400 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? 'Creating...' : 'Create Classroom'}
                    </motion.button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-slate-800 mb-4">
                  Classroom Created Successfully!
                </h2>
                
                <p className="text-lg text-slate-600 mb-8">
                  Your classroom {formData.name} is ready. Share the classroom code with your students.
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                  <div className="text-sm text-slate-600 mb-2">Classroom Code</div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-3xl font-mono font-bold text-slate-800">
                      {generatedCode || 'ABC123'}
                    </div>
                    <motion.button
                      onClick={() => copyToClipboard(generatedCode || 'ABC123')}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard/classrooms">
                    <motion.button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View All Classrooms
                    </motion.button>
                  </Link>
                  <Link href={`/dashboard/classrooms/${generatedCode || 'abc123'}`}>
                    <motion.button
                      className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Enter Classroom
                    </motion.button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CreateClassroomPage