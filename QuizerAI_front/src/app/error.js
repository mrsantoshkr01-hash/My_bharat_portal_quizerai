/**
 * Global Error Page
 * 
 * Purpose: Error boundary for handling unexpected application errors
 * Features:
 * - User-friendly error messaging
 * - Error reporting functionality
 * - Recovery options and suggestions
 * - Debug information for development
 * - Automatic error logging
 * 
 * Usage: Automatically rendered by Next.js for unhandled errors
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error)
    
    // You can integrate with error reporting services here
    // Example: Sentry.captureException(error)
  }, [error])

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
    
    // Send error report to your backend
    // console.log('Error report:', errorReport)
    
    // For now, we'll just copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
    alert('Error details copied to clipboard. Please share with support.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Error Icon */}
          <motion.div
            className="mb-8"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              Something went wrong!
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-6">
              We encountered an unexpected error. This has been logged and our team 
              will investigate the issue. In the meantime, you can try the following:
            </p>
          </motion.div>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 text-left"
            >
              <h3 className="font-semibold text-red-800 mb-2">Error Details (Development Mode)</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-auto">
                {error.message}
              </pre>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={reset}
              icon={RefreshCw}
              className="bg-green-600 hover:bg-green-700"
            >
              Try Again
            </Button>
            
            <Link href="/">
              <Button variant="outline" icon={Home}>
                Go Home
              </Button>
            </Link>
            
            <Button
              onClick={handleReportError}
              variant="outline"
              icon={Mail}
            >
              Report Issue
            </Button>
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-sm text-slate-500"
          >
            <p>
              If this problem persists, please contact our support team at{' '}
              <a href="mailto:support@quizerai.com" className="text-blue-600 hover:text-blue-700">
                support@quizerai.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}