// this is cta
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Sparkles, Users, Zap, Star, GraduationCap, UserCheck, School, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { GradientText } from '@/components/common/GradientText'

const CTA = () => {
  const [activeAudience, setActiveAudience] = useState('student')
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const studentFeatures = [
    "AI-powered quiz generation",
    "Collaborative study rooms", 
    "Question paper digitization",
    "24/7 AI tutor support"
  ]

  const teacherFeatures = [
    "Smart classroom management",
    "Automated attendance tracking", 
    "Instant grading & analytics",
    "Excel data export"
  ]

  const features = activeAudience === 'student' ? studentFeatures : teacherFeatures

  const stats = [
    { number: "50K+", label: activeAudience === 'student' ? "Active Students" : "Teachers & Students" },
    { number: "10M+", label: "Quizzes Generated" },
    { number: "95%", label: "Success Rate" },
    { number: "500+", label: activeAudience === 'student' ? "Schools Trust Us" : "Classrooms Created" }
  ]

  return (
    <section className="py-24 bg-white relative overflow-hidden" ref={ref}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${
          activeAudience === 'student' 
            ? 'from-blue-600 via-purple-600 to-indigo-700' 
            : 'from-purple-600 via-indigo-600 to-blue-700'
        }`}></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-48 translate-y-48"></div>
          <div className="absolute top-1/2 left-1/2 w-128 h-128 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto text-center text-white"
        >
          {/* Audience Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center gap-1 mb-8 bg-white/20 backdrop-blur-md rounded-2xl p-2 w-fit mx-auto"
          >
            <button
              onClick={() => setActiveAudience('student')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                activeAudience === 'student' 
                  ? 'bg-white text-blue-600 shadow-lg' 
                  : 'text-white hover:text-blue-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Students
            </button>
            <button
              onClick={() => setActiveAudience('teacher')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                activeAudience === 'teacher' 
                  ? 'bg-white text-purple-600 shadow-lg' 
                  : 'text-white hover:text-purple-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Teachers
            </button>
          </motion.div>

          {/* Main Content */}
          <motion.div
            key={activeAudience}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>
                {activeAudience === 'student' 
                  ? 'Join the AI Learning Revolution' 
                  : 'Transform Your Teaching with AI'
                }
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {activeAudience === 'student' ? 'Learning Experience?' : 'Teaching Experience?'}
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              {activeAudience === 'student' 
                ? 'Join thousands of students who are already using QuizerAI to achieve better learning outcomes. Start your journey today with our comprehensive AI-powered platform.'
                : 'Join thousands of teachers who are already using QuizerAI to streamline classroom management, automate grading, and track student progress with powerful analytics.'
              }
            </p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={`${activeAudience}-${feature}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
            >
              <Link href="/register">
                <motion.button
                  className={`group bg-white cursor-pointer ${
                    activeAudience === 'student' ? 'text-blue-600' : 'text-purple-600'
                  } px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {activeAudience === 'student' ? (
                    <>
                      <GraduationCap className="w-6 h-6" />
                      Start Learning Free
                    </>
                  ) : (
                    <>
                      <School className="w-6 h-6" />
                      Start Teaching Free
                    </>
                  )}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link href={activeAudience === 'student' ? 'https://youtu.be/7V8i6nMBfjA?si=uxypBIULl0FZ19up' : '/contact'}>
                <motion.button
                  className="group border-2 cursor-pointer border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {activeAudience === 'student' ? (
                    <>
                      <Zap className="w-6 h-6" />
                      Watch Demo
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-6 h-6" />
                      Schedule Demo
                    </>
                  )}
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-white/20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={`${activeAudience}-${stat.label}`}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-200 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-16 text-center"
          >
            <p className="text-blue-200 text-sm mb-4">
              ✨ No credit card required • ⚡ Setup in under 2 minutes • 🔒 Enterprise-grade security
            </p>
            <div className="flex justify-center items-center gap-2 text-blue-200 text-sm">
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <span className="ml-2">Rated 4.9/5 by 10,000+ users</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA