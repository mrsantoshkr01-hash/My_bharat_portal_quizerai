'use client'

import { motion } from 'framer-motion'
import { Upload, Cloud } from 'lucide-react'

const DragDropZone = ({ getRootProps, getInputProps, isDragActive, acceptedTypes, maxSize }) => {
  return (
    <motion.div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <input {...getInputProps()} />
      
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: isDragActive ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDragActive ? (
          <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        ) : (
          <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        )}
      </motion.div>

      <div className="space-y-2">
        <h4 className={`text-lg font-semibold ${
          isDragActive ? 'text-blue-700' : 'text-slate-800'
        }`}>
          {isDragActive ? 'Drop files here!' : 'Upload your files'}
        </h4>
        
        <p className={`text-sm ${
          isDragActive ? 'text-blue-600' : 'text-slate-600'
        }`}>
          {isDragActive 
            ? 'Release to upload your files'
            : 'Drag & drop files here, or click to browse'
          }
        </p>
      </div>

      {/* Animated background */}
      {isDragActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}

export default DragDropZone