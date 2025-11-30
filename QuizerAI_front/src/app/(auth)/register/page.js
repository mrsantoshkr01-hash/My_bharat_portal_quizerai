// this is the page where we are going to write the code for registration of the user teachers and other domain
'use client'

import { motion } from 'framer-motion'
import { Brain, ArrowLeft, Users, GraduationCap, Building } from 'lucide-react'
import Link from 'next/link'
import RegisterForm from '@/components/auth/RegisterForm'
import ParticleBackground  from '@/components/common/ParticleBackground'
import Image from 'next/image'
import quizairlogopng from "public/images/hero/qbl.png"

const RegisterPage = () => {
  const benefits = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Transform any content into interactive quizzes instantly with advanced AI technology."
    },
    {
      icon: Users,
      title: "Collaborative Study",
      description: "Join virtual classrooms and study with peers in real-time collaborative sessions."
    },
    {
      icon: GraduationCap,
      title: "Exam Excellence",
      description: "Specialized tools for competitive exams like SAT, GRE, JEE, UPSC, and more."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 min-h-screen flex">
        {/* Left Section - Benefits */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-lg"
          >
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Join 50,000+ Students Learning Smarter
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Experience the future of education with AI-powered tools that adapt to your learning style.
              </p>
            </div>

            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.2 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-12 bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/50"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white font-semibold"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Trusted by students worldwide</div>
                  <div className="text-sm text-slate-600">From MIT to local schools</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">50K+</div>
                  <div className="text-sm text-slate-600">Active Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">10M+</div>
                  <div className="text-sm text-slate-600">Quizzes Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-slate-600">Success Rate</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Section - Form */}
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
        <Link href={'/'}>  <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                 <Image alt='quizerailogo' src={quizairlogopng} className='rounded-lg'></Image>
                {/* <Brain className="w-7 h-7 text-white" /> */}
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                QuizerAI
              </span>
            </motion.div>  </Link>  

            {/* Register Form */}
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage