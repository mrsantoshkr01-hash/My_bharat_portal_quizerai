// /*
//  * QuizCreator Component
//  * 
//  * Purpose: Interactive interface for creating custom quizzes from various content sources
//  * Features:
//  * - Multi-step quiz creation workflow with validation
//  * - Content source selection (upload files, paste text, URL import)
//  * - Question type configuration (MCQ, short answer, fill-in-blank, true/false)
//  * - Difficulty level adjustment and adaptive questioning
//  * - Real-time preview of generated questions
//  * - Advanced settings for timing, randomization, and scoring
//  * 
//  * Integration: Connects to backend AI processing endpoints for content analysis and question generation
//  */

// 'use client'

// import { useState } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { 
//   Upload, 
//   FileText, 
//   Image, 
//   Video, 
//   Music, 
//   Link2,
//   Plus,
//   X,
//   Wand2,
//   Settings,
//   Clock,
//   Target,
//   Brain
// } from 'lucide-react'
// import { useDropzone } from 'react-dropzone'

// const QuizCreator = ({ onQuizCreated, onClose }) => {
//   const [step, setStep] = useState(1)
//   const [quizData, setQuizData] = useState({
//     title: '',
//     description: '',
//     subject: '',
//     difficulty: 'medium',
//     duration: 30,
//     questionTypes: ['mcq'],
//     content: null,
//     contentType: 'file'
//   })
//   const [loading, setLoading] = useState(false)

//   const contentTypes = [
//     { id: 'file', label: 'Upload File', icon: Upload, description: 'PDF, Word, PowerPoint files' },
//     { id: 'image', label: 'Images', icon: Image, description: 'JPG, PNG image files' },
//     { id: 'video', label: 'Video', icon: Video, description: 'MP4, AVI video files' },
//     { id: 'audio', label: 'Audio', icon: Music, description: 'MP3, WAV audio files' },
//     { id: 'url', label: 'Web Link', icon: Link2, description: 'Articles, web pages' },
//     { id: 'text', label: 'Text Input', icon: FileText, description: 'Type or paste content' }
//   ]

//   const questionTypes = [
//     { id: 'mcq', label: 'Multiple Choice', description: 'Choose from multiple options' },
//     { id: 'short', label: 'Short Answer', description: 'Brief text responses' },
//     { id: 'long', label: 'Long Answer', description: 'Detailed explanations' },
//     { id: 'fill', label: 'Fill in Blanks', description: 'Complete missing parts' },
//     { id: 'true_false', label: 'True/False', description: 'Binary choice questions' }
//   ]

//   const onDrop = (acceptedFiles) => {
//     const file = acceptedFiles[0]
//     setQuizData(prev => ({ ...prev, content: file }))
//   }

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     multiple: false,
//     accept: {
//       'application/pdf': ['.pdf'],
//       'application/msword': ['.doc'],
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
//       'image/*': ['.jpg', '.jpeg', '.png'],
//       'video/*': ['.mp4', '.avi'],
//       'audio/*': ['.mp3', '.wav']
//     }
//   })

//   const handleNext = () => {
//     if (step < 3) setStep(step + 1)
//   }

//   const handleBack = () => {
//     if (step > 1) setStep(step - 1)
//   }

//   const handleSubmit = async () => {
//     setLoading(true)
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 2000))
//       onQuizCreated(quizData)
//     } catch (error) {
//       console.error('Error creating quiz:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const renderStep1 = () => (
//     <motion.div
//       initial={{ opacity: 0, x: 20 }}
//       animate={{ opacity: 1, x: 0 }}
//       exit={{ opacity: 0, x: -20 }}
//       className="space-y-6"
//     >
//       <h3 className="text-xl font-semibold text-slate-800 mb-4">Content Source</h3>
//       <p className="text-slate-600 mb-6">Choose how you want to provide content for your quiz</p>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {contentTypes.map((type) => (
//           <motion.button
//             key={type.id}
//             onClick={() => setQuizData(prev => ({ ...prev, contentType: type.id }))}
//             className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
//               quizData.contentType === type.id
//                 ? 'border-blue-500 bg-blue-50 text-blue-700'
//                 : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
//             }`}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//           >
//             <type.icon className={`w-8 h-8 mb-3 ${
//               quizData.contentType === type.id ? 'text-blue-600' : 'text-slate-500'
//             }`} />
//             <h4 className="font-semibold mb-1">{type.label}</h4>
//             <p className="text-sm text-slate-600">{type.description}</p>
//           </motion.button>
//         ))}
//       </div>

//       {/* File Upload Area */}
//       {['file', 'image', 'video', 'audio'].includes(quizData.contentType) && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mt-6"
//         >
//           <div
//             {...getRootProps()}
//             className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
//               isDragActive
//                 ? 'border-blue-500 bg-blue-50'
//                 : 'border-slate-300 hover:border-slate-400'
//             }`}
//           >
//             <input {...getInputProps()} />
//             <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//             <p className="text-slate-600 mb-2">
//               {isDragActive
//                 ? 'Drop the file here...'
//                 : 'Drag & drop a file here, or click to select'}
//             </p>
//             <p className="text-sm text-slate-500">
//               Supports PDF, Word, PowerPoint, images, videos, and audio files
//             </p>
//           </div>
          
//           {quizData.content && (
//             <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
//               <p className="text-green-700 font-medium">File uploaded: {quizData.content.name}</p>
//             </div>
//           )}
//         </motion.div>
//       )}

//       {/* URL Input */}
//       {quizData.contentType === 'url' && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mt-6"
//         >
//           <label className="block text-sm font-medium text-slate-700 mb-2">
//             Website URL
//           </label>
//           <input
//             type="url"
//             placeholder="https://example.com/article"
//             className="w-full input-primary"
//             value={quizData.url || ''}
//             onChange={(e) => setQuizData(prev => ({ ...prev, url: e.target.value }))}
//           />
//         </motion.div>
//       )}

//       {/* Text Input */}
//       {quizData.contentType === 'text' && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mt-6"
//         >
//           <label className="block text-sm font-medium text-slate-700 mb-2">
//             Content Text
//           </label>
//           <textarea
//             rows={8}
//             placeholder="Paste your content here..."
//             className="w-full input-primary"
//             value={quizData.text || ''}
//             onChange={(e) => setQuizData(prev => ({ ...prev, text: e.target.value }))}
//           />
//         </motion.div>
//       )}
//     </motion.div>
//   )

//   const renderStep2 = () => (
//     <motion.div
//       initial={{ opacity: 0, x: 20 }}
//       animate={{ opacity: 1, x: 0 }}
//       exit={{ opacity: 0, x: -20 }}
//       className="space-y-6"
//     >
//       <h3 className="text-xl font-semibold text-slate-800 mb-4">Quiz Settings</h3>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">
//             Quiz Title
//           </label>
//           <input
//             type="text"
//             placeholder="Enter quiz title"
//             className="w-full input-primary"
//             value={quizData.title}
//             onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">
//             Subject
//           </label>
//           <input
//             type="text"
//             placeholder="e.g., Mathematics, Biology"
//             className="w-full input-primary"
//             value={quizData.subject}
//             onChange={(e) => setQuizData(prev => ({ ...prev, subject: e.target.value }))}
//           />
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-slate-700 mb-2">
//           Description
//         </label>
//         <textarea
//           rows={3}
//           placeholder="Brief description of the quiz content"
//           className="w-full input-primary"
//           value={quizData.description}
//           onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">
//             Difficulty Level
//           </label>
//           <select
//             className="w-full input-primary"
//             value={quizData.difficulty}
//             onChange={(e) => setQuizData(prev => ({ ...prev, difficulty: e.target.value }))}
//           >
//             <option value="easy">Easy</option>
//             <option value="medium">Medium</option>
//             <option value="hard">Hard</option>
//             <option value="adaptive">Adaptive</option>
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-slate-700 mb-2">
//             Duration (minutes)
//           </label>
//           <input
//             type="number"
//             min="5"
//             max="180"
//             className="w-full input-primary"
//             value={quizData.duration}
//             onChange={(e) => setQuizData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
//           />
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-slate-700 mb-3">
//           Question Types
//         </label>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//           {questionTypes.map((type) => (
//             <motion.label
//               key={type.id}
//               className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
//                 quizData.questionTypes.includes(type.id)
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-slate-200 hover:border-slate-300'
//               }`}
//               whileHover={{ scale: 1.02 }}
//             >
//               <input
//                 type="checkbox"
//                 checked={quizData.questionTypes.includes(type.id)}
//                 onChange={(e) => {
//                   if (e.target.checked) {
//                     setQuizData(prev => ({
//                       ...prev,
//                       questionTypes: [...prev.questionTypes, type.id]
//                     }))
//                   } else {
//                     setQuizData(prev => ({
//                       ...prev,
//                       questionTypes: prev.questionTypes.filter(t => t !== type.id)
//                     }))
//                   }
//                 }}
//                 className="mt-1"
//               />
//               <div>
//                 <div className="font-medium text-slate-800">{type.label}</div>
//                 <div className="text-sm text-slate-600">{type.description}</div>
//               </div>
//             </motion.label>
//           ))}
//         </div>
//       </div>
//     </motion.div>
//   )

//   const renderStep3 = () => (
//     <motion.div
//       initial={{ opacity: 0, x: 20 }}
//       animate={{ opacity: 1, x: 0 }}
//       exit={{ opacity: 0, x: -20 }}
//       className="space-y-6"
//     >
//       <h3 className="text-xl font-semibold text-slate-800 mb-4">Review & Generate</h3>
      
//       <div className="bg-slate-50 rounded-xl p-6 space-y-4">
//         <div className="flex items-center gap-3">
//           <Brain className="w-6 h-6 text-blue-600" />
//           <h4 className="font-semibold text-slate-800">Quiz Summary</h4>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <span className="text-sm text-slate-600">Title:</span>
//             <p className="font-medium">{quizData.title || 'Untitled Quiz'}</p>
//           </div>
//           <div>
//             <span className="text-sm text-slate-600">Subject:</span>
//             <p className="font-medium">{quizData.subject || 'General'}</p>
//           </div>
//           <div>
//             <span className="text-sm text-slate-600">Difficulty:</span>
//             <p className="font-medium capitalize">{quizData.difficulty}</p>
//           </div>
//           <div>
//             <span className="text-sm text-slate-600">Duration:</span>
//             <p className="font-medium">{quizData.duration} minutes</p>
//           </div>
//         </div>
        
//         <div>
//           <span className="text-sm text-slate-600">Question Types:</span>
//           <div className="flex flex-wrap gap-2 mt-1">
//             {quizData.questionTypes.map(type => (
//               <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
//                 {questionTypes.find(qt => qt.id === type)?.label}
//               </span>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
//         <div className="flex items-center gap-3 mb-4">
//           <Wand2 className="w-6 h-6 text-purple-600" />
//           <h4 className="font-semibold text-slate-800">AI Generation Process</h4>
//         </div>
//         <p className="text-slate-600 mb-4">
//           Our AI will analyze your content and generate personalized questions based on your preferences. 
//           This process typically takes 1-2 minutes.
//         </p>
//         <div className="flex items-center gap-2 text-sm text-slate-600">
//           <Clock className="w-4 h-4" />
//           <span>Estimated time: 1-2 minutes</span>
//         </div>
//       </div>
//     </motion.div>
//   )

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//       <motion.div
//         className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto"
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         exit={{ opacity: 0, scale: 0.9 }}
//       >
//         {/* Header */}
//         <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-3xl">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-bold text-slate-800">Create New Quiz</h2>
//               <p className="text-slate-600">Step {step} of 3</p>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
//             >
//               <X className="w-6 h-6 text-slate-600" />
//             </button>
//           </div>

//           {/* Progress Bar */}
//           <div className="mt-4">
//             <div className="flex items-center gap-2">
//               {[1, 2, 3].map((stepNum) => (
//                 <div
//                   key={stepNum}
//                   className={`flex-1 h-2 rounded-full transition-colors ${
//                     stepNum <= step ? 'bg-blue-500' : 'bg-slate-200'
//                   }`}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6">
//           <AnimatePresence mode="wait">
//             {step === 1 && renderStep1()}
//             {step === 2 && renderStep2()}
//             {step === 3 && renderStep3()}
//           </AnimatePresence>
//         </div>

//         {/* Footer */}
//         <div className="border-t border-slate-200 p-6 flex items-center justify-between">
//           <button
//             onClick={handleBack}
//             disabled={step === 1}
//             className="px-6 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Back
//           </button>

//           <div className="flex gap-3">
//             {step < 3 ? (
//               <motion.button
//                 onClick={handleNext}
//                 className="btn-primary"
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//               >
//                 Continue
//               </motion.button>
//             ) : (
//               <motion.button
//                 onClick={handleSubmit}
//                 disabled={loading}
//                 className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                 whileHover={{ scale: loading ? 1 : 1.02 }}
//                 whileTap={{ scale: loading ? 1 : 0.98 }}
//               >
//                 {loading ? (
//                   <>
//                     <div className="loading-dots">
//                       <div style={{'--i': 0}}></div>
//                       <div style={{'--i': 1}}></div>
//                       <div style={{'--i': 2}}></div>
//                     </div>
//                     Generating Quiz...
//                   </>
//                 ) : (
//                   <>
//                     <Wand2 className="w-5 h-5" />
//                     Generate Quiz
//                   </>
//                 )}
//               </motion.button>
//             )}
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   )
// }

// export default QuizCreator