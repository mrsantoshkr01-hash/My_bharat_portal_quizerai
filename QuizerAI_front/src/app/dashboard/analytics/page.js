// all the code of analytics
/**
 * Analytics Page
 * 
 * Purpose: Comprehensive analytics dashboard for detailed performance insights
 * Features:
 * - Performance metrics with historical trends
 * - Subject-wise analysis and comparisons
 * - Learning pattern identification
 * - Peer comparison and benchmarking
 * - Customizable date ranges and filters
 * - Exportable reports and data visualization
 * 
 * Integration: Advanced analytics API with machine learning insights
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import RealAnalyticsDashboard from '@/components/dashboard/DashboardStats'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import QuizReviewContainer from '@/components/dashboard/QuizReviewContainer'


const AnalyticsPage = () => {
  return (
    <div>
      <Header></Header>
      <div className="min-h-screen bg-gradient-to-br pt-24 from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Learning Analytics</h1>
              <p className="text-slate-600">
                Comprehensive insights into your learning journey, performance patterns, and growth opportunities.
              </p>
            </motion.div>
            <RealAnalyticsDashboard></RealAnalyticsDashboard>
            <QuizReviewContainer></QuizReviewContainer>

          </div>
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}

export default AnalyticsPage