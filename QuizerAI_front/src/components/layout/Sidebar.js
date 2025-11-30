'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Brain, 
  User, 
  Settings, 
  LogOut, 
  ChevronLeft,
  Bell,
  Crown,
  Zap
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import Navigation from './Navigation'

const Sidebar = ({ isOpen, onToggle, collapsed, onCollapse }) => {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState(3)

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    }
  }

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl border-r border-slate-200 z-50 lg:relative lg:translate-x-0 ${
          collapsed ? 'w-20' : 'w-80'
        } transition-all duration-300`}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            {!collapsed && (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  QuizerAI
                </span>
              </motion.div>
            )}

            <div className="flex items-center gap-2">
              {/* Notifications */}
              {!collapsed && (
                <motion.button
                  className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Collapse Button (Desktop) */}
              <motion.button
                className="hidden lg:flex p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={onCollapse}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className={`w-5 h-5 text-slate-600 transition-transform ${
                  collapsed ? 'rotate-180' : ''
                }`} />
              </motion.button>

              {/* Close Button (Mobile) */}
              <motion.button
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={onToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-slate-600" />
              </motion.button>
            </div>
          </div>

          {/* User Profile */}
          {!collapsed && (
            <motion.div 
              className="p-6 border-b border-slate-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-sm text-slate-600 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Plan Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-800 text-sm">
                    {user?.plan || 'Free'} Plan
                  </span>
                </div>
                <div className="text-xs text-slate-600 mb-2">
                  2 of 5 quizzes used this month
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full w-2/5"></div>
                </div>
              </div>

              {user?.plan === 'Free' && (
                <motion.button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap className="w-4 h-4" />
                  Upgrade to Pro
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-6">
            <Navigation collapsed={collapsed} />
          </div>

          {/* User Actions */}
          {!collapsed && (
            <motion.div 
              className="p-6 border-t border-slate-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-2">
                <motion.button
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User className="w-5 h-5" />
                  <span>Profile Settings</span>
                </motion.button>

                <motion.button
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-5 h-5" />
                  <span>Preferences</span>
                </motion.button>

                <motion.button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Collapsed User Actions */}
          {collapsed && (
            <div className="p-4 border-t border-slate-200 space-y-2">
              <motion.button
                className="w-full p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Profile Settings"
              >
                <User className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={logout}
                className="w-full p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar