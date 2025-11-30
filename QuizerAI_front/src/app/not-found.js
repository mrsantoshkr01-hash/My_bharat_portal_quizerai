/**
 * Coming Soon Page
 * 
 * Purpose: Engaging page to show users that features are being developed
 * Features:
 * - Inspiring quotes and messaging about learning
 * - Visual progress indicators
 * - Interactive elements and animations
 * - Quick navigation to available features
 * - Newsletter signup for updates
 * - Mobile-responsive design
 * 
 * Usage: Display when features are under development
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Search,
  ArrowLeft,
  BookOpen,
  Users,
  Play,
  Zap,
  Clock,
  Rocket,
  Star,
  Bell,
  Code,
  Sparkles,
  Target,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useState, useEffect } from 'react'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

export default function ComingSoon() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('')
  const [currentQuote, setCurrentQuote] = useState(0)
  const [progress, setProgress] = useState(0)

  const inspiringQuotes = [
    {
      text: "The beautiful thing about learning is that no one can take it away from you.",
      author: "B.B. King",
      icon: Sparkles
    },
    {
      text: "Education is the most powerful weapon which you can use to change the world.",
      author: "Nelson Mandela",
      icon: Target
    },
    {
      text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
      author: "Brian Herbert",
      icon: Heart
    },
    {
      text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      author: "Mahatma Gandhi",
      icon: Star
    },
    {
      text: "The expert in anything was once a beginner.",
      author: "Helen Hayes",
      icon: Rocket
    }
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleNewsletterSignup = (e) => {
    e.preventDefault()
    if (email.trim()) {
      // Handle newsletter signup
      // console.log('Newsletter signup:', email)
      setEmail('')
      // Show success message
    }
  }

  const quickLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, description: 'Access your learning hub', available: true },
    { href: '/dashboard/quizzes', label: 'Quizzes', icon: BookOpen, description: 'Practice with AI-generated quizzes', available: true },
    { href: '/dashboard/classrooms', label: 'Classrooms', icon: Users, description: 'Join collaborative study sessions', available: true },
    { href: '/ai-tutor', label: 'AI Tutor', icon: Play, description: 'Get personalized learning assistance', available: false }
  ]

  // Rotate quotes every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % inspiringQuotes.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Simulate progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0
        return prev + 0.5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const currentQuoteData = inspiringQuotes[currentQuote]
  const CurrentQuoteIcon = currentQuoteData.icon

  return (
    <div>
      <Header></Header>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4  py-24 relative overflow-hidden">

        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 right-10 w-16 h-16 bg-yellow-200 rounded-full opacity-20"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main Illustration */}
            <div className="mb-12">
              <motion.div
                className="relative mx-auto w-96 h-96"
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Background circles */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-30"></div>
                <div className="absolute inset-8 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full opacity-40"></div>
                <div className="absolute inset-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20"></div>

                {/* Central Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl"
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
                    <Code className="w-16 h-16 text-white" />
                  </motion.div>
                </div>

                {/* Floating progress indicators */}
                <motion.div
                  className="absolute top-12 right-12 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                  animate={{
                    x: [0, 10, 0],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Building...</span>
                </motion.div>

                <motion.div
                  className="absolute bottom-12 left-12 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                  animate={{
                    x: [0, -8, 0],
                    y: [0, 8, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Rocket className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">{Math.round(progress)}%</span>
                </motion.div>

                {/* Sparkle effects */}
                <motion.div
                  className="absolute top-6 left-1/3 w-3 h-3 bg-yellow-400 rounded-full"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-1/3 w-2 h-2 bg-green-400 rounded-full"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
              </motion.div>
            </div>

            {/* Main Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <motion.h1
                className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                animate={{
                  backgroundPosition: ['0%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-300% animate-gradient">
                  We&lsquo;re Crafting Something
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Amazing! 🚀
                </span>
              </motion.h1>

              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-8">
                Our team of learning enthusiasts is working around the clock to bring you the most
                <span className="font-semibold text-blue-600"> revolutionary AI-powered learning experience</span>.
                Every line of code is written with your success in mind.
              </p>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">Development Progress</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Rotating Inspirational Quotes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12 min-h-[120px] flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuote}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 max-w-3xl mx-auto border border-white/20 shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <CurrentQuoteIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <blockquote className="text-lg md:text-xl text-slate-700 font-medium italic mb-3 leading-relaxed">
                        {currentQuoteData.text}
                      </blockquote>
                      <cite className="text-blue-600 font-semibold">— {currentQuoteData.author}</cite>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Newsletter Signup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-12 max-w-md mx-auto"
            >
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Get notified when we launch!</h3>
                </div>
                <form onSubmit={handleNewsletterSignup} className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email for early access..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" icon={Zap}>
                    Notify Me
                  </Button>
                </form>
                <p className="text-sm text-slate-500 mt-2">
                  Be the first to experience the future of learning! 🎯
                </p>
              </div>
            </motion.div>

            {/* Meanwhile, Try These Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-12"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Meanwhile, explore what&lsquo;s already live! ✨
              </h3>
              <p className="text-slate-600 mb-8">
                Don&lsquo;t wait – start your learning journey with these amazing features that are ready now.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  >
                    {link.available ? (
                      <Link href={link.href}>
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 group relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-400">
                            <link.icon className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="font-bold text-slate-800 mb-2 text-lg">{link.label}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{link.description}</p>
                          <div className="mt-4 text-xs font-medium text-green-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Available Now
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="bg-slate-100/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-slate-200/20 relative overflow-hidden opacity-75">
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl flex items-center justify-center mb-4">
                          <link.icon className="w-7 h-7 text-white" />
                        </div>
                        <h4 className="font-bold text-slate-600 mb-2 text-lg">{link.label}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{link.description}</p>
                        <div className="mt-4 text-xs font-medium text-yellow-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mb-8 max-w-md mx-auto"
            >
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  placeholder="Search for quizzes, topics, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={Search}
                  className="flex-1"
                />
                <Button type="submit" icon={Search}>
                  Search
                </Button>
              </form>
            </motion.div>

            {/* Back Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={() => router.back()}
                variant="outline"
                icon={ArrowLeft}
              >
                Go Back
              </Button>
              <Link href="/">
                <Button icon={Home}>
                  Return Home
                </Button>
              </Link>
            </motion.div>
          </motion.div>


        </div>

      </div>
      <Footer></Footer>
    </div>
  )
}