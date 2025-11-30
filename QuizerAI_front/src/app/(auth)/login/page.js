// In this we are going to write the code of login page
'use client'

import { motion } from 'framer-motion'
import { Brain, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'
import ParticleBackground from '@/components/common/ParticleBackground'
import Image from 'next/image'
import quizairlogopng from "public/images/hero/qbl.png"

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex">
        {/* Left Section - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </motion.div>

            {/* Logo */}
            <Link href={'/'} ><motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Image src={quizairlogopng} className='rounded-lg'></Image>
                {/* <Brain className="w-7 h-7 text-white" /> */}
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                QuizerAI
              </span>
            </motion.div></Link>

            {/* Login Form */}
            <LoginForm />
          </div>
        </div>

        {/* Right Section - Visual */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-lg text-center"
          >
            <div className="relative">
              {/* Main Illustration */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/50">
                <motion.div
                  animate={{
                    y: [-10, 10, -10],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-8"
                >
                  <Brain className="w-16 h-16 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-slate-800 mb-4">
                  Welcome Back to the Future of Learning
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Continue your AI-powered learning journey. Transform any content into
                  interactive quizzes, collaborate with peers, and achieve academic excellence.
                </p>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <span className="text-2xl">🧠</span>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"
                animate={{
                  y: [0, 12, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                <span className="text-xl">📚</span>
              </motion.div>
            </div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { emoji: "🎯", label: "Smart Quizzes" },
                { emoji: "👥", label: "Collaboration" },
                { emoji: "📊", label: "Analytics" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-3xl mb-2">{feature.emoji}</div>
                  <div className="text-sm font-medium text-slate-700">{feature.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage