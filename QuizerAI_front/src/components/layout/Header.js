'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  ChevronDown,
  Brain,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Zap,
  BookOpen,
  Users,
  School,
  GraduationCap,
  Video,
  FileText,
  MessageCircle,
  Building,
  Target,
  BarChart3,
  UserCheck,
  Calendar,
  Upload
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import Image from 'next/image'
import quizairlogopng from "public/images/hero/qbl.png"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const dropdownRef = useRef(null)
  const userMenuRef = useRef(null)

  // Safe auth hook usage with error boundary
  const { user, logout, loading, isTeacher, isStudent } = useAuth() || { 
    user: null, 
    logout: () => {}, 
    loading: false,
    isTeacher: false,
    isStudent: false
  }

  // Base navigation for non-authenticated users
  const baseNavigation = [
    {
      name: 'Features',
      href: '#features',
      icon: Zap,
      description: 'Powerful AI tools for learning',
      dropdownItems: [
        {
          name: 'Quiz Generator',
          href: '/dashboard/quizzes/create',
          icon: FileText,
          description: 'Create quizzes from any content instantly'
        },
        // {
        //   name: 'Question Papers',
        //   href: '/dashboard/question-papers/upload',
        //   icon: BookOpen,
        //   description: 'Digitize and practice with past papers'
        // },
        {
          name: 'YouTube Processing',
          href: '/dashboard/youtube/process',
          icon: Video,
          description: 'Extract notes and quizzes from videos'
        },
        {
          name: 'AI Tutor',
          href: '/ai_tutor',
          icon: MessageCircle,
          description: 'Get personalized learning assistance'
        }
        // {
        //   name: 'Collaborative Classrooms',
        //   href: '/features/classrooms',
        //   icon: Users,
        //   description: 'Study together in virtual environments'
        // }
      ]
    },
    // {
    //   name: 'Solutions',
    //   href: '#solutions',
    //   icon: Target,
    //   description: 'Tailored for every learner',
    //   dropdownItems: [
    //     {
    //       name: 'For Students',
    //       href: '/solutions/students',
    //       icon: GraduationCap,
    //       description: 'Enhance your study experience'
    //     },
    //     {
    //       name: 'For Teachers',
    //       href: '/solutions/teachers',
    //       icon: User,
    //       description: 'Streamline teaching and assessment'
    //     },
    //     {
    //       name: 'For Schools',
    //       href: '/solutions/schools',
    //       icon: School,
    //       description: 'Institution-wide learning solutions'
    //     },
    //     {
    //       name: 'For Coaching Centers',
    //       href: '/solutions/coaching',
    //       icon: Building,
    //       description: 'Scale your coaching business'
    //     }
    //   ]
    // },
    { name: 'How To Use', href: '/how_to_use' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contactus' },
    { name: 'Feedback', href: '/feedback' }
  ]

  // Teacher-specific navigation
  const teacherNavigation = [
    {
      name: 'Teaching Tools',
      href: '#teaching',
      icon: Users,
      description: 'Manage your classroom effectively',
      dropdownItems: [
        {
          name: 'My Classrooms',
          href: '/teacher_dashboard',
          icon: Users,
          description: 'View and manage all your classrooms'
        },
        {
          name: 'Create Classroom',
          href: '/teacher_dashboard/create-classroom',
          icon: School,
          description: 'Set up a new classroom'
        },
        {
          name: 'Generate Quiz',
          href: '/dashboard/quizzes/create',
          icon: FileText,
          description: 'Create quizzes for your students'
        },
        {
          name: 'Analytics Dashboard',
          href: '/teacher_dashboard/analytics',
          icon: BarChart3,
          description: 'Track student performance'
        },
        {
          name: 'Student Management',
          href: '/teacher_dashboard/students',
          icon: UserCheck,
          description: 'Manage student enrollment'
        }
      ]
    },
    {
      name: 'Resources',
      href: '#resources',
      icon: BookOpen,
      description: 'Teaching resources and tools',
      dropdownItems: [
        // {
        //   name: 'Question Papers',
        //   href: '/dashboard/question-papers/upload',
        //   icon: Upload,
        //   description: 'Upload and digitize exam papers'
        // },
        {
          name: 'YouTube Processing',
          href: '/dashboard/youtube/process',
          icon: Video,
          description: 'Create content from videos'
        },
        {
          name: 'AI Tutor',
          href: '/ai_tutor',
          icon: MessageCircle,
          description: 'AI-powered teaching assistant'
        }
      ]
    },
    { name: 'How To Use', href: '/how_to_use' },
    { name: 'Support', href: '/contactus' }
  ]

  // Student-specific navigation
  const studentNavigation = [
    {
      name: 'Study Tools',
      href: '#study',
      icon: BookOpen,
      description: 'Enhance your learning experience',
      dropdownItems: [
        {
          name: 'Generate Quiz',
          href: '/dashboard/quizzes/create',
          icon: FileText,
          description: 'Create quizzes from any content'
        },
        {
          name: 'My Classrooms',
          href: '/dashboard#classrooms',
          icon: Users,
          description: 'View enrolled classrooms'
        },
        // {
        //   name: 'Question Papers',
        //   href: '/dashboard/question-papers/upload',
        //   icon: Upload,
        //   description: 'Practice with past papers'
        // },
        {
          name: 'YouTube Learning',
          href: '/dashboard/youtube/process',
          icon: Video,
          description: 'Learn from video content'
        },
        {
          name: 'AI Tutor',
          href: '/ai_tutor',
          icon: MessageCircle,
          description: 'Get personalized help'
        }
      ]
    },
    {
      name: 'Progress',
      href: '#progress',
      icon: BarChart3,
      description: 'Track your learning journey',
      dropdownItems: [
        {
          name: 'Analytics Dashboard',
          href: '/dashboard/analytics',
          icon: BarChart3,
          description: 'View your performance insights'
        },
        // {
        //   name: 'Study Calendar',
        //   href: '/dashboard/calendar',
        //   icon: Calendar,
        //   description: 'Plan your study schedule'
        // }
      ]
    },
    { name: 'How To Use', href: '/how_to_use' },
    { name: 'Help', href: '/contactus' }
  ]

  // Choose navigation based on user role
  const getNavigation = () => {
    if (!user) return baseNavigation
    if (isTeacher) return teacherNavigation
    if (isStudent) return studentNavigation
    return baseNavigation
  }

  const navigation = getNavigation()

  // Animation variants (keeping your existing ones)
  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  }

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setActiveDropdown(null)
    setUserMenuOpen(false)
  }, [pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show loading state if auth is still loading
  if (loading) {
    return (
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/20"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <nav className="container mx-auto px-6">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Image src={quizairlogopng} className='rounded-lg' alt="QuizerAI" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                QuizerAI
              </span>
            </div>
            <div className="w-10 h-10 bg-slate-200 animate-pulse rounded-full"></div>
          </div>
        </nav>
      </motion.header>
    )
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-slate-200/30'
        : 'bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm'
        }`}
      initial="hidden"
      animate="visible"
      variants={headerVariants}
    >
      <nav className="container mx-auto px-6">
        <div className="flex items-center justify-between h-18">
          {/* Enhanced Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-11 h-11 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl"
              whileHover={{
                scale: 1.05,
                rotate: 3,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Image src={quizairlogopng} className='rounded-lg' alt="QuizerAI" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              QuizerAI
            </span>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navigation.map((item, index) => (
              <div key={item.name} className="relative" ref={index === activeDropdown ? dropdownRef : null}>
                {item.dropdownItems ? (
                  <div className="relative">
                    <motion.button
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 group ${isScrolled
                        ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                        : 'text-white hover:text-blue-200 hover:bg-white/10'
                        }`}
                      onClick={() => handleDropdown(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-expanded={activeDropdown === index}
                      aria-haspopup="true"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                      <ChevronDown
                        className={`w-4 h-4 transition-all duration-300 ${activeDropdown === index ? 'rotate-180' : 'group-hover:rotate-12'
                          }`}
                      />
                    </motion.button>

                    <AnimatePresence>
                      {activeDropdown === index && (
                        <motion.div
                          className="absolute top-full left-0 mt-3 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 py-4 z-50"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <div className="px-4 pb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <item.icon className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-slate-800">{item.name}</h3>
                            </div>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </div>
                          <div className="border-t border-slate-200/50 pt-2">
                            {item.dropdownItems.map((dropdownItem, i) => (
                              <motion.div
                                key={dropdownItem.name}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                custom={i}
                              >
                                <Link
                                  href={dropdownItem.href}
                                  className="flex items-start gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-lg mx-2 group"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  <dropdownItem.icon className="w-5 h-5 mt-0.5 text-slate-400 group-hover:text-blue-500" />
                                  <div>
                                    <div className="font-medium">{dropdownItem.name}</div>
                                    <div className="text-sm text-slate-500 mt-0.5">{dropdownItem.description}</div>
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={item.href}
                      className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 ${isScrolled
                        ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                        : 'text-white hover:text-blue-200 hover:bg-white/10'
                        }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Enhanced User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                {/* Search Button */}
                {/* <motion.button
                  className={`p-3 rounded-xl transition-all duration-300 ${isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
                    }`}
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </motion.button> */}

                {/* Notifications */}
                {/* <motion.button
                  className={`relative p-3 rounded-xl transition-all duration-300 ${isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
                    }`}
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <motion.span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </motion.button> */}

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100/80 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        className="absolute top-full right-0 mt-3 w-56 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 py-3 z-50"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <div className="px-4 py-2 border-b border-slate-200/50">
                          <div className="font-medium text-slate-800">{user.full_name || user.username}</div>
                          <div className="text-sm text-slate-600">{user.email}</div>
                          {user.role && (
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </div>
                          )}
                        </div>
                        <div className="py-2">
                          <Link 
                            href={isTeacher ? "/teacher_dashboard" : "/dashboard"} 
                            className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-lg mx-2" 
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            {isTeacher ? 'Teacher Dashboard' : 'Dashboard'}
                          </Link>
                          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-lg mx-2" onClick={() => setUserMenuOpen(false)}>
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-[90%] text-left text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 rounded-lg mx-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/login"
                    className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 ${isScrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white hover:text-blue-200'
                      }`}
                  >
                    Sign In
                  </Link>
                </motion.div>
                <Link href="/register">
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Zap className="w-4 h-4" />
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className={`lg:hidden p-3 rounded-xl transition-all duration-300 ${isScrolled ? 'text-slate-700' : 'text-white'
                }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg shadow-2xl border-t border-slate-200/30 z-40"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="px-6 py-8 space-y-6">
                {/* Navigation Links */}
                <div className="space-y-2">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                    >
                      {item.dropdownItems ? (
                        <div>
                          <button
                            className="flex items-center justify-between w-full text-left text-slate-700 font-medium py-4 border-b border-slate-200/50 hover:text-blue-600 transition-colors duration-200"
                            onClick={() => handleDropdown(index)}
                            aria-expanded={activeDropdown === index}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-5 h-5" />
                              {item.name}
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === index ? 'rotate-180' : ''
                                }`}
                            />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === index && (
                              <motion.div
                                className="mt-3 ml-6 space-y-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                {item.dropdownItems.map((dropdownItem, i) => (
                                  <motion.div
                                    key={dropdownItem.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                  >
                                    <Link
                                      href={dropdownItem.href}
                                      className="flex items-center gap-3 text-slate-600 py-2 hover:text-blue-600 transition-colors duration-200"
                                      onClick={() => {
                                        setActiveDropdown(null)
                                        setIsMenuOpen(false)
                                      }}
                                    >
                                      <dropdownItem.icon className="w-4 h-4" />
                                      {dropdownItem.name}
                                    </Link>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 text-slate-700 font-medium py-4 border-b border-slate-200/50 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.icon && <item.icon className="w-5 h-5" />}
                          {item.name}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Mobile User Actions */}
                {user ? (
                  <motion.div
                    className="border-t border-slate-200/50 pt-6 space-y-6"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={navigation.length}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
                        {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{user.full_name || user.username}</div>
                        <div className="text-sm text-slate-600">{user.email}</div>
                        {user.role && (
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Link
                        href={isTeacher ? "/teacher_dashboard" : "/dashboard"}
                        className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {isTeacher ? 'Teacher' : 'Dashboard'}
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          handleLogout()
                        }}
                        className="border border-red-200 text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="border-t border-slate-200/50 pt-6 grid grid-cols-2 gap-4"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={navigation.length}
                  >
                    <Link
                      href="/login"
                      className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-center flex items-center justify-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Zap className="w-4 h-4" />
                      Get Started
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}

export default Header