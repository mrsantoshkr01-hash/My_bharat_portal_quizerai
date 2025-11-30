// Updated Testimonials with Enhanced Teacher Features
'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Star, Quote } from 'lucide-react'
import Image from 'next/image'
import { GradientText } from '@/components/common/GradientText'
import Link from 'next/link'

const Testimonials = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const testimonials = [
    {
      name: "Saurav Sharma",
      role: "Computer Science Student",
      university: "IIT Ropar",
      image: "/images/avatars/sarah.jpg",
      rating: 5,
      text: "QuizerAI transformed my JEE preparation completely! I can convert my lecture PDFs, YouTube videos, and handwritten notes into practice quizzes in seconds. The AI tutor explains complex concepts 24/7, and the personalized learning paths helped me focus on weak areas. My mock test scores improved from 60% to 94%!",
      highlight: "Mock scores: 60% → 94%",
      features: ["AI-Powered Quiz Generation", "24/7 AI Tutor", "Personalized Learning"]
    },
    {
      name: "Dr. Kamal Nayan",
      role: "Biology Professor",
      university: "IGMS PATNA",
      image: "/images/avatars/michael.jpg",
      rating: 5,
      text: "QuizerAI revolutionized my classroom management! I manage 8 different classes with automated attendance through daily quizzes, instant grading, and comprehensive analytics. The Excel export feature saves me 15+ hours weekly on administrative tasks. Student engagement increased by 40%!",
      highlight: "Saves 15+ hours weekly",
      features: ["Smart Classroom Management", "Automated Attendance", "Excel Export", "Performance Analytics"]
    },
    {
      name: "Priya Sharma",
      role: "NEET Aspirant",
      university: "Class 12 Student",
      image: "/images/avatars/priya.jpg",
      rating: 5,
      text: "Preparing for NEET was overwhelming until I discovered QuizerAI. The platform digitized 10 years of question papers via OCR, processed my YouTube study videos into structured notes, and created adaptive quizzes. The progress tracking showed exactly where I was weak. Cleared NEET with 680/720!",
      highlight: "NEET Score: 680/720",
      features: ["OCR Question Processing", "YouTube Integration", "Adaptive Learning"]
    },
    {
      name: "Rajesh Kumar",
      role: "Mathematics Teacher",
      university: "DPS Patna",
      image: "/images/avatars/james.jpg",
      rating: 5,
      text: "Managing 200+ students across 6 classes became effortless with QuizerAI. The bulk student management, automated daily attendance tracking, and detailed performance insights transformed my teaching. Parents love the exported progress reports, and my principal praised the 35% improvement in class averages!",
      highlight: "35% class improvement",
      features: ["Bulk Student Management", "Daily Attendance Automation", "Parent Reports"]
    },
    {
      name: "Ganesh Maharaj",
      role: "Medical Student",
      university: "IGMS PATNA",
      image: "/images/avatars/emma.jpg",
      rating: 5,
      text: "Medical school requires processing massive amounts of complex information. QuizerAI's multi-format support helped me convert textbook PDFs, video lectures, and handwritten notes into comprehensive quiz sets. The collaborative study groups and peer comparison features kept me motivated throughout my preparation.",
      highlight: "Enhanced retention & collaboration",
      features: ["Multi-Format Processing", "Collaborative Learning", "Peer Comparisons"]
    },
    {
      name: "Dr. Sunita Devi",
      role: "Chemistry Department Head",
      university: "Patna University",
      image: "/images/avatars/sunita.jpg",
      rating: 5,
      text: "QuizerAI streamlined our entire department's assessment process. We digitized 50+ years of chemistry question papers, created standardized quiz banks, and implemented automated grading for 500+ students. The LMS integration with our existing systems was seamless. Assessment time reduced by 80%!",
      highlight: "80% time reduction",
      features: ["Question Bank Digitization", "LMS Integration", "Automated Grading"]
    },
    {
      name: "Amit Singh",
      role: "Engineering Student & Tutor",
      university: "NIT Patna",
      image: "/images/avatars/amit.jpg",
      rating: 5,
      text: "As both a student and part-time tutor, QuizerAI serves dual purposes perfectly. For my own studies, I generate quizzes from YouTube lectures and research papers. For teaching, I create classroom assignments, track student attendance automatically, and provide detailed performance feedback. It's like having an AI teaching assistant!",
      highlight: "Dual-purpose efficiency",
      features: ["YouTube Processing", "Classroom Creation", "Performance Tracking"]
    },
    {
      name: "Mrs. Rekha Sharma",
      role: "Principal",
      university: "St. Xavier's High School",
      image: "/images/avatars/rekha.jpg",
      rating: 5,
      text: "Implementing QuizerAI across our school transformed our educational approach. 25 teachers now manage their classes efficiently with automated attendance, parents receive detailed progress reports, and our board exam results improved by 28%. The platform's scalability handles our 1000+ student database seamlessly.",
      highlight: "28% exam improvement",
      features: ["School-Wide Implementation", "Parent Reports", "Scalable Management"]
    }
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
        duration: 0.6,
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
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden" ref={ref}>
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

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
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 rounded-full text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Star className="w-4 h-4" />
              <span>Success Stories from Students & Teachers</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-slate-800">Trusted by</span>
              <GradientText className="block">10,000+ Students & Teachers</GradientText>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Discover how QuizerAI is transforming education with AI-powered learning, 
              smart classroom management, and comprehensive performance analytics.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={cardVariants}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden">
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 text-blue-500/20">
                    <Quote className="w-8 h-8" />
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                    {testimonial.text}
                  </p>

                  {/* Highlight */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium mb-6">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{testimonial.highlight}</span>
                  </div>

                  {/* Features Used */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {testimonial.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                      <div className="text-xs text-blue-600 font-medium">{testimonial.university}</div>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden mb-16"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
              <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  The Numbers Speak for Themselves
                </h3>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Join a growing community of learners and educators achieving remarkable results
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { number: "10,000+", label: "Active Users", description: "Students & Teachers worldwide" },
                  { number: "1M+", label: "Quizzes Generated", description: "AI-powered assessments created" },
                  { number: "500+", label: "Educational Institutions", description: "Schools & colleges using QuizerAI" },
                  { number: "85%", label: "Time Saved", description: "On administrative tasks" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                    <div className="font-semibold mb-1">{stat.label}</div>
                    <div className="text-sm text-blue-200">{stat.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Use Cases Section */}
          <motion.div variants={itemVariants} className="mb-16">
            <h3 className="text-3xl font-bold text-slate-800 mb-8 text-center">
              Perfect for <GradientText>Every Educational Need</GradientText>
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Competitive Exams", desc: "JEE, NEET, SAT, GRE preparation", icon: "🎯" },
                { title: "Classroom Teaching", desc: "Automated grading & attendance", icon: "👩‍🏫" },
                { title: "Self-Study", desc: "Personalized learning paths", icon: "📚" },
                { title: "School Management", desc: "Institutional-level analytics", icon: "🏫" }
              ].map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  className="bg-white rounded-2xl p-6 border border-slate-200 text-center hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-3xl mb-3">{useCase.icon}</div>
                  <h4 className="font-semibold text-slate-800 mb-2">{useCase.title}</h4>
                  <p className="text-sm text-slate-600">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center"
          >
            <h3 className="text-3xl font-bold text-slate-800 mb-6">
              Ready to Join These <GradientText>Success Stories?</GradientText>
            </h3>
            
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Whether you&apos;re a student aiming for top scores or a teacher looking to streamline classroom management, 
              start your journey with QuizerAI today
            </p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href={'/register'}>
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.45 }}
                >
                  Start Free Trial
                </motion.button>
              </Link>   
              
              <motion.button
                className="border-2 cursor-pointer border-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.45 }}
              >
                View All Reviews
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials