'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import { 
  Brain,
  Users,
  FileText,
  Play,
  BarChart3,
  MessageSquare,
  Clock,
  Shield,
  Smartphone,
  Zap,
  Target,
  Award,
  BookOpen,
  PenTool,
  Globe,
  Lightbulb,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Download,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { GradientText } from '@/components/common/GradientText'

const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const mainFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Quiz & Summary Generation",
      description: "Transform any content - PDFs, images, URLs, audio, video, handwritten notes, YouTube videos, or question papers into personalized quizzes with multiple formats.",
      gradient: "from-blue-500 to-cyan-500",
      features: ["MCQ, Short & Long Answer", "Fill-in-the-blank", "Adaptive Difficulty", "Instant Generation"],
      link: '/dashboard/quizzes/create',
      audience: "both"
    },
    {
      icon: Users,
      title: "Smart Classroom Management",
      description: "Create unlimited virtual classrooms, manage student enrollment, track attendance through daily quizzes, and organize courses efficiently.",
      gradient: "from-purple-500 to-pink-500",
      features: ["Unlimited Classrooms", "Automated Attendance", "Student Enrollment", "Class Organization"],
      link: '/teacher_dashboard/create-classroom',
      audience: "teacher"
    },
    {
      icon: Play,
      title: "YouTube Video Processing",
      description: "Enter any topic and our AI curates the best YouTube videos, extracts transcripts, and generates notes, summaries, and tailored quizzes.",
      gradient: "from-red-500 to-orange-500",
      features: ["Auto Video Selection", "Transcript Extraction", "Smart Notes", "Topic-Based Quizzes"],
      link: '/dashboard/youtube/process',
      audience: "both"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics & Performance Tracking",
      description: "Interactive dashboards with progress trackers, heatmaps, peer comparisons, detailed performance insights, and exportable reports for record-keeping.",
      gradient: "from-indigo-500 to-blue-500",
      features: ["Progress Heatmaps", "Excel Export", "Student Analytics", "Performance Reports"],
      link: '/dashboard/analytics',
      audience: "both"
    },
    {
      icon: ClipboardList,
      title: "Automated Grading & Assessment",
      description: "Instantly grade assignments, generate detailed feedback, track student progress, and export results to Excel for seamless record management.",
      gradient: "from-green-500 to-emerald-500",
      features: ["Auto-Grading", "Detailed Feedback", "Progress Tracking", "Excel Export"],
      link: '/teacher_dashboard',
      audience: "teacher"
    },
    {
      icon: MessageSquare,
      title: "24/7 AI Tutor",
      description: "Get instant help with personalized explanations, voice interactions, and step-by-step guidance whenever you need academic support.",
      gradient: "from-violet-500 to-purple-500",
      features: ["Voice Interaction", "Instant Explanations", "Personalized Help", "Study Guidance"],
      link: '/ai_tutor',
      audience: "both"
    }
  ]

  const additionalFeatures = [
    { icon: Shield, title: "Secure & Private", description: "Your data is protected with encryption", audience: "both" },
    { icon: Smartphone, title: "Mobile Optimized", description: "Perfect experience on all devices", audience: "both" },
    { icon: Zap, title: "Lightning Fast", description: "Instant quiz generation and results", audience: "both" },
    { icon: Download, title: "Data Export", description: "Export attendance & grades to Excel", audience: "teacher" },
    { icon: Calendar, title: "Daily Quizzes", description: "Automated daily assessments", audience: "teacher" },
    { icon: BookOpen, title: "Multi-format Support", description: "PDFs, images, audio, video & more", audience: "both" },
    { icon: PenTool, title: "Handwriting Recognition", description: "Convert handwritten notes via OCR", audience: "both" },
    { icon: TrendingUp, title: "Performance Insights", description: "Track learning gaps and progress", audience: "teacher" },
    { icon: Users, title: "Bulk Management", description: "Manage multiple classes efficiently", audience: "teacher" },
    { icon: Target, title: "Personalized Learning", description: "AI adapts to individual needs", audience: "student" }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  }

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.1,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-20">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="w-4 h-4" />
              <span>Powerful Features</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-slate-800">Everything Students & Teachers</span>
              <GradientText className="block">Need to Excel</GradientText>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From AI-powered quiz generation to classroom management, our comprehensive platform 
              provides all the tools needed for effective learning and teaching.
            </p>

            {/* Audience Indicators */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">For Students</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <span className="text-purple-800 font-medium">For Teachers</span>
              </div>
            </div>
          </motion.div>

          {/* Main Features Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid lg:grid-cols-2 gap-8 mb-20"
          >
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.1 }
                }}
                className="group relative"
              >
                <Link href={feature.link}>
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-500 h-full">
                    {/* Audience Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        feature.audience === 'teacher' ? 'bg-purple-100 text-purple-700' : 
                        feature.audience === 'student' ? 'bg-blue-100 text-blue-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {feature.audience === 'teacher' ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Teachers
                          </>
                        ) : feature.audience === 'student' ? (
                          <>
                            <GraduationCap className="w-3 h-3" />
                            Students
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            Students & Teachers
                          </>
                        )}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Feature List */}
                    <div className="grid grid-cols-2 gap-3">
                      {feature.features.map((item, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-slate-600"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                          <span>{item}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Features */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              Plus Many More <GradientText>Amazing Features</GradientText>
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover additional capabilities that make QuizerAI the complete solution for both learning and teaching
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
          >
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="group text-center p-6 bg-white rounded-2xl shadow-soft border border-slate-100 hover:shadow-medium hover:border-blue-200 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                
                <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h4>
                
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {feature.description}
                </p>

                {/* Audience indicator */}
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  feature.audience === 'teacher' ? 'bg-purple-50 text-purple-600' : 
                  feature.audience === 'student' ? 'bg-blue-50 text-blue-600' : 
                  'bg-green-50 text-green-600'
                }`}>
                  {feature.audience === 'teacher' ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      Teachers
                    </>
                  ) : feature.audience === 'student' ? (
                    <>
                      <GraduationCap className="w-3 h-3" />
                      Students
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      Both
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center mt-20"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
                <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              </div>

              <div className="relative z-10 max-w-4xl mx-auto">
                <motion.h3 
                  className="text-3xl md:text-4xl font-bold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Ready to Transform Your Learning & Teaching Experience?
                </motion.h3>
                
                <motion.p 
                  className="text-xl mb-8 text-blue-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Join thousands of students and teachers who are already achieving remarkable results with AI
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link href={'/register'}>
                    <motion.button
                      className="bg-white cursor-pointer text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <GraduationCap className="w-5 h-5" />
                      Start as Student
                    </motion.button>
                  </Link> 
                  
                  <Link href={'/register'}>
                    <motion.button
                      className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center gap-2"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserCheck className="w-5 h-5" />
                      Start as Teacher
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features