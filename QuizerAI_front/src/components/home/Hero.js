'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BrainCircuit,
  Sparkles,
  Users,
  BookOpen,
  Play,
  ChevronRight,
  Star,
  Trophy,
  Zap,
  GraduationCap,
  UserCheck,
  BarChart3,
  ClipboardList
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedCounter } from '@/components/common/AnimatedCounter'
import ParticleBackground from '@/components/common/ParticleBackground'
import { GradientText } from '@/components/common/GradientText'

const Hero = () => {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [activeUserType, setActiveUserType] = useState('student') // 'student' or 'teacher'

  const studentFeatures = [
    {
      icon: BrainCircuit,
      title: "AI-Powered Quiz Generation",
      description: "Transform any content into interactive quizzes instantly",
      benefit: "Study smarter, not harder"
    },
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Study together in virtual classrooms with real-time collaboration",
      benefit: "Learn with peers globally"
    },
    {
      icon: BookOpen,
      title: "Question Paper Digitization",
      description: "Convert past papers into digital practice tests with analytics",
      benefit: "Master exam patterns"
    },
    {
      icon: Play,
      title: "YouTube Integration",
      description: "Generate notes and quizzes from educational videos automatically",
      benefit: "Learn from any video"
    }
  ]

  const teacherFeatures = [
    {
      icon: Users,
      title: "Classroom Management",
      description: "Create unlimited classrooms and manage student enrollment effortlessly",
      benefit: "Organize classes seamlessly"
    },
    {
      icon: ClipboardList,
      title: "Automated Attendance",
      description: "Track attendance through daily quizzes and automated marking",
      benefit: "Save 10+ hours weekly"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Get detailed insights on student progress and learning gaps",
      benefit: "Data-driven teaching"
    },
    {
      icon: UserCheck,
      title: "Instant Grading & Export",
      description: "Auto-grade quizzes and export results to Excel for record-keeping",
      benefit: "Streamlined assessments"
    }
  ]

  const features = activeUserType === 'student' ? studentFeatures : teacherFeatures

  const stats = [
    // { label: "Active Users", value: 50000, suffix: "+" },
    // { label: "Quizzes Generated", value: 250000, suffix: "+" },
    // { label: "Classrooms Created", value: 5000, suffix: "+" },
    // { label: "Success Rate", value: 95, suffix: "%" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <section className="relative min-h-screen flex items-center pt-20 justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-10 text-blue-500/20"
        variants={floatingVariants}
        animate="animate"
      >
        <BrainCircuit size={80} />
      </motion.div>
      <motion.div
        className="absolute top-32 right-16 text-purple-500/20"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '1s' }}
      >
        <Sparkles size={60} />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-20 text-indigo-500/20"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
      >
        <Trophy size={70} />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-10 text-blue-500/20"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '0.5s' }}
      >
        <Zap size={50} />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div className="text-center lg:text-left" variants={itemVariants}>
              {/* <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Star className="w-4 h-4" />
                <span>Trusted by 50,000+ students & teachers worldwide</span>
              </motion.div> */}

              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                variants={itemVariants}
              >
                <GradientText className="block">Transform</GradientText>
                <span className="text-slate-800">Learning & Teaching</span>
                <GradientText className="block">with AI Magic</GradientText>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl"
                variants={itemVariants}
              >
                Whether you&apos;re a student wanting to study smarter or a teacher looking to streamline 
                classroom management, QuizerAI transforms your educational experience with powerful AI tools.
              </motion.p>

              {/* User Type Toggle */}
              <motion.div 
                className="flex items-center justify-center lg:justify-start gap-1 mb-8 bg-white/80 backdrop-blur-lg rounded-2xl p-2 w-fit"
                variants={itemVariants}
              >
                <button
                  onClick={() => setActiveUserType('student')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    activeUserType === 'student' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  I&apos;m a Student
                </button>
                <button
                  onClick={() => setActiveUserType('teacher')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    activeUserType === 'teacher' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-slate-600 hover:text-purple-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  I&apos;m a Teacher
                </button>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
                variants={itemVariants}
              >
                <Link href="/register">
                  <motion.button
                    className={`group bg-gradient-to-r ${
                      activeUserType === 'student' 
                        ? 'from-blue-600 to-indigo-600' 
                        : 'from-purple-600 to-indigo-600'
                    } text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {activeUserType === 'student' ? 'Start Learning Free' : 'Start Teaching Free'}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>

                <Link href={'https://youtu.be/7V8i6nMBfjA?si=uxypBIULl0FZ19up'}>
                  <motion.button
                    className="group cursor-pointer border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-8 h-5" />
                    Watch Demo
                  </motion.button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
                variants={itemVariants}
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="text-3xl font-bold text-slate-800 mb-1">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Interactive Feature Showcase */}
            <motion.div
              className="relative"
              variants={itemVariants}
            >
              <div className="relative">
                {/* Main Feature Card */}
                <motion.div
                  className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/50"
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    key={`${activeUserType}-${currentFeature}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-24 h-16 bg-gradient-to-br ${
                        activeUserType === 'student' 
                          ? 'from-blue-500 to-indigo-600' 
                          : 'from-purple-500 to-indigo-600'
                      } rounded-2xl flex items-center justify-center`}>
                        {(() => {
                          const IconComponent = features[currentFeature].icon;
                          return <IconComponent className="w-12 h-8 text-white" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">
                          {features[currentFeature].title}
                        </h3>
                        <p className="text-slate-600 mt-1">
                          {features[currentFeature].description}
                        </p>
                        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                          activeUserType === 'student' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Zap className="w-3 h-3" />
                          {features[currentFeature].benefit}
                        </div>
                      </div>
                    </div>

                    {/* Mock Interface */}
                    <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="flex-1 bg-white rounded-lg px-3 py-1 text-sm text-slate-600">
                          quizerai.com/{activeUserType === 'student' ? 'dashboard' : 'teacher_dashboard'}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="h-4 bg-gradient-to-r from-blue-300 to-transparent rounded-full w-3/4"></div>
                        <div className="h-4 bg-gradient-to-r from-indigo-300 to-transparent rounded-full w-1/2"></div>
                        <div className="h-4 bg-gradient-to-r from-purple-300 to-transparent rounded-full w-5/6"></div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                            <span className="text-xs text-slate-500">
                              {activeUserType === 'student' ? 'My Quizzes' : 'My Classes'}
                            </span>
                          </div>
                          <div className="h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                            <span className="text-xs text-slate-500">Analytics</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Feature Navigation Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {features.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentFeature
                          ? `${activeUserType === 'student' ? 'bg-blue-600' : 'bg-purple-600'} w-8`
                          : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      onClick={() => setCurrentFeature(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>

                {/* Floating Cards */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg border border-blue-100"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-600">
                      {activeUserType === 'student' ? 'Quiz Generated!' : 'Class Created!'}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-lg border border-purple-100"
                  animate={{
                    y: [0, 10, 0],
                    rotate: [0, -2, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-600">
                      {activeUserType === 'student' ? '5 students joined' : '25 students active'}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 320" className="w-full h-20 fill-white">
          <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  )
}

export default Hero