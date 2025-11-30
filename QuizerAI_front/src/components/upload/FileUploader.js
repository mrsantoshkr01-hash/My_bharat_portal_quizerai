'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import DragDropZone from './DragDropZone'
import UploadProgress from './UploadProgress'
import Button from '@/components/ui/Button'
import { formatFileSize } from '@/lib/utils'

const FileUploader = ({ 
  title = "Upload Files",
  description = "Drag & drop files here or click to browse",
  acceptedTypes = ['application/pdf', 'image/*'],
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024, // 50MB
  onUpload
}) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(file => {
      console.error('File rejected:', file.file.name, file.errors)
    })

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {}),
    maxFiles,
    maxSize,
    multiple: true
  })

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }

  const uploadFile = async (fileData) => {
    const formData = new FormData()
    formData.append('file', fileData.file)

    // Simulate upload progress
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          resolve({ success: true, fileId: fileData.id })
        }
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: Math.round(progress)
        }))
      }, 200)
    })
  }

  const handleUpload = async () => {
    setUploading(true)
    
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    for (const file of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' } : f
      ))

      try {
        await uploadFile(file)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed' } : f
        ))
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ))
      }
    }

    setUploading(false)
    
    if (onUpload) {
      const successfulFiles = files.filter(f => f.status === 'completed')
      onUpload(successfulFiles)
    }
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.startsWith('audio/')) return '🎵'
    if (type.startsWith('video/')) return '🎥'
    return '📁'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <File className="w-5 h-5 text-slate-600" />
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100"
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600">{description}</p>
        </div>

        <DragDropZone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          acceptedTypes={acceptedTypes}
          maxSize={maxSize}
        />

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              <h4 className="font-medium text-slate-800">Selected Files</h4>
              
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="text-2xl">{getFileIcon(file.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{file.name}</div>
                    <div className="text-sm text-slate-600">{formatFileSize(file.size)}</div>
                    
                    {file.status === 'uploading' && (
                      <UploadProgress 
                        progress={uploadProgress[file.id] || 0}
                        size="sm"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex gap-3"
          >
            <Button
              variant="secondary"
              onClick={() => setFiles([])}
              disabled={uploading}
              className="flex-1"
            >
              Clear All
            </Button>
            
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={files.every(f => f.status !== 'pending')}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </motion.div>
        )}

        {/* Upload Info */}
        <div className="mt-6 text-center">
          <div className="text-sm text-slate-500">
            Max {maxFiles} files • {formatFileSize(maxSize)} max size
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Supported: {acceptedTypes.map(type => 
              type.replace('application/', '').replace('/*', '').toUpperCase()
            ).join(', ')}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default FileUploader