'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Brain, 
  Users, 
  FileText, 
  Play, 
  BarChart3, 
  MessageSquare,
  Settings,
  HelpCircle,
  BookOpen,
  Upload,
  Zap
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

const Navigation = ({ collapsed = false }) => {
  const pathname = usePathname()
  const { user } = useAuth()

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview and stats'
    },
    {
      label: 'Quizzes',
      href: '/dashboard/quizzes',
      icon: Brain,
      description: 'Generate and manage quizzes',
      badge: 'New'
    },
    {
      label: 'Classrooms',
      href: '/dashboard/classrooms',
      icon: Users,
      description: 'Collaborative study rooms'
    },
    {
      label: 'Question Papers',
      href: '/dashboard/question-papers',
      icon: FileText,
      description: 'Digitize past papers'
    },
    {
      label: 'YouTube',
      href: '/dashboard/youtube',
      icon: Play,
      description: 'Process educational videos'
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Performance insights'
    },
    {
      label: 'AI Tutor',
      href: '/ai-tutor',
      icon: MessageSquare,
      description: '24/7 learning assistant',
      badge: 'AI'
    }
  ]

  const bottomItems = [
    {
      label: 'Help & Support',
      href: '/help',
      icon: HelpCircle,
      description: 'Get assistance'
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account preferences'
    }
  ]

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavItem = ({ item, isBottom = false }) => (
    <Link href={item.href}>
      <motion.div
        className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
          isActive(item.href)
            ? 'bg-blue-500 text-white shadow-lg'
            : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
        }`}
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`flex-shrink-0 ${
          isActive(item.href) ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
        }`}>
          <item.icon className="w-5 h-5" />
        </div>
        
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{item.label}</span>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    item.badge === 'New' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate ${
                isActive(item.href) ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {item.description}
              </p>
            </div>
          </>
        )}

        {/* Active indicator */}
        {isActive(item.href) && (
          <motion.div
            className="absolute left-0 top-1/2 w-1 h-8 bg-white rounded-r-full -translate-y-1/2"
            layoutId="activeIndicator"
          />
        )}
      </motion.div>
    </Link>
  )

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => (
        <NavItem key={item.href} item={item} />
      ))}
      
      <div className="border-t border-slate-200 pt-4 mt-6">
        {bottomItems.map((item) => (
          <NavItem key={item.href} item={item} isBottom />
        ))}
      </div>
    </nav>
  )
}

export default Navigation