// FAQ Component
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Plus, Minus, HelpCircle, GraduationCap, UserCheck, Users } from 'lucide-react'
import { GradientText } from '@/components/common/GradientText'

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState('general') // 'general', 'student', 'teacher'
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const faqCategories = {
    general: [
      {
        question: "How does QuizerAI generate quizzes from different content types?",
        answer: "QuizerAI uses advanced natural language processing and machine learning algorithms to analyze and understand content from various sources including PDFs, images, videos, audio files, and handwritten notes. Our AI extracts key concepts, identifies important information, and automatically generates relevant questions in multiple formats such as MCQ, short answer, and fill-in-the-blank questions."
      },
      {
        question: "What makes QuizerAI different from other educational platforms?",
        answer: "QuizerAI stands out through its comprehensive AI-powered approach that supports multiple content types, real-time collaboration, and personalized learning paths. Unlike traditional platforms, we can process handwritten notes via OCR, convert YouTube videos into structured learning materials, digitize question papers, and provide advanced analytics. Our platform adapts to individual learning styles and offers 24/7 AI tutoring support."
      },
      {
        question: "Is my data secure and private on QuizerAI?",
        answer: "Data security and privacy are our top priorities. We use enterprise-grade encryption for all data transmission and storage, comply with GDPR and other international privacy standards, and maintain SOC 2 compliance. Your study materials, quiz results, and personal information are never shared with third parties without your explicit consent. You have complete control over your data and can delete it at any time."
      },
      {
        question: "What pricing plans are available and can I try before purchasing?",
        answer: "We offer generous free plans for both students and teachers that include essential features. Our paid plans are currently free during beta testing. All premium features come with unlimited usage, detailed analytics, and priority support. You can upgrade or switch between plans at any time without long-term commitments."
      }
    ],
    student: [
      {
        question: "Can I use QuizerAI for specific competitive exams like SAT, GRE, or JEE?",
        answer: "Absolutely! QuizerAI is specifically designed to support various competitive exams including SAT, GRE, UPSC, JEE, NEET, and many others. Our platform includes exam-specific templates, difficulty levels, and question patterns that match the format and style of these standardized tests. You can also upload past question papers to create practice tests with authentic exam experience."
      },
      {
        question: "How does the YouTube video processing feature work for studying?",
        answer: "Our YouTube integration allows you to enter any educational topic, and our AI automatically selects high-quality educational videos, extracts transcripts, and generates comprehensive notes, summaries, and quizzes. This saves hours of manual work and ensures you get the most relevant and valuable content for your study needs. The feature supports multiple languages and various subject areas."
      },
      {
        question: "How can I track my learning progress and identify weak areas?",
        answer: "QuizerAI provides comprehensive analytics showing your performance across subjects, question types, and time periods. You'll see detailed breakdowns of correct/incorrect answers, time spent on topics, improvement trends, and personalized recommendations. The platform identifies knowledge gaps and suggests specific areas for focused study."
      },
      {
        question: "Can I collaborate with other students on QuizerAI?",
        answer: "Yes! Our collaborative learning features allow you to join study groups, share quizzes, compete in real-time challenges, and compare performance with peers. You can create study sessions where multiple students take quizzes together, analyze group results, and learn from each other's strengths."
      }
    ],
    teacher: [
      {
        question: "How can I manage multiple classrooms and students efficiently?",
        answer: "QuizerAI offers comprehensive classroom management tools allowing you to create unlimited classrooms, organize students by subjects or grades, and manage enrollments with simple join codes. You can bulk add students, organize them into groups, and monitor their progress across different assignments and time periods."
      },
      {
        question: "Does QuizerAI support automated attendance tracking?",
        answer: "Yes! Our innovative approach uses daily quizzes as attendance markers. When students complete assigned quizzes, they're automatically marked present. You can set up recurring daily quizzes, view attendance reports, and export data to Excel. Manual overrides are available for excused absences or technical issues."
      },
      {
        question: "How does automated grading work and can I export results?",
        answer: "QuizerAI automatically grades all objective questions (MCQ, true/false, fill-in-the-blank) instantly. You get detailed analytics on each student's performance, class averages, and question-level insights. All data can be exported to Excel or CSV formats with student names, scores, timestamps, and detailed breakdowns for easy record-keeping and grade book integration."
      },
      {
        question: "Can I integrate QuizerAI with my existing LMS or Google Classroom?",
        answer: "We offer integrations with popular LMS platforms including Google Classroom, Moodle, and Canvas. You can sync student rosters, distribute assignments, and automatically send grades back to your LMS gradebook. API access is available for custom integrations with institutional systems."
      },
      {
        question: "How can I create assignments from my existing teaching materials?",
        answer: "Simply upload your lesson materials - PDFs, PowerPoint presentations, handwritten notes, or even point to YouTube videos you use in class. QuizerAI will generate relevant quiz questions that align with your content. You can review, edit, and customize questions before assigning them to your classes."
      },
      {
        question: "What kind of analytics and insights do I get about my students?",
        answer: "You receive comprehensive dashboards showing individual student progress, class performance trends, topic-wise analytics, time-to-completion metrics, and learning gap identification. The platform provides actionable insights like 'Students struggle with Topic X' or 'Class performance improved 25% over last month' to help you adjust your teaching strategies."
      }
    ]
  }

  const categories = [
    { key: 'general', label: 'General', icon: HelpCircle },
    { key: 'student', label: 'For Students', icon: GraduationCap },
    { key: 'teacher', label: 'For Teachers', icon: UserCheck }
  ]

  const currentFaqs = faqCategories[activeCategory]

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index)
  }

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden" ref={ref}>
      {/* Background Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Frequently Asked Questions</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-slate-800">Got Questions? We Have</span>
              <GradientText className="block">Answers</GradientText>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about QuizerAI&apos;s features, pricing, and functionality 
              for both students and teachers.
            </p>
          </motion.div>

          {/* Category Tabs */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => {
                  setActiveCategory(category.key)
                  setActiveIndex(-1) // Reset active index when switching categories
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeCategory === category.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </motion.div>

          {/* FAQ Items */}
          <motion.div 
            key={activeCategory} // Key prop forces re-render when category changes
            variants={containerVariants} 
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {currentFaqs.map((faq, index) => (
              <motion.div
                key={`${activeCategory}-${index}`}
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
              >
                <motion.button
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors duration-200"
                  onClick={() => toggleFAQ(index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h3 className="text-lg font-semibold text-slate-800 pr-8">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: activeIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {activeIndex === index ? (
                      <Minus className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-400" />
                    )}
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6">
                        <p className="text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Audience-Specific Benefits */}
          <motion.div variants={itemVariants} className="mt-16">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Students</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  Get unlimited quiz generation, progress tracking, and 24/7 AI tutoring support to excel in your studies.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Generate quizzes from any content</li>
                  <li>• Track progress with detailed analytics</li>
                  <li>• Collaborate with study groups</li>
                  <li>• Prepare for competitive exams</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Teachers</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  Streamline classroom management with automated grading, attendance tracking, and comprehensive analytics.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Manage unlimited classrooms</li>
                  <li>• Automated attendance & grading</li>
                  <li>• Export results to Excel</li>
                  <li>• Track student performance</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div 
            variants={itemVariants}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Still have questions?
              </h3>
              <p className="text-slate-600 mb-6">
                Our support team is here to help both students and teachers get the most out of QuizerAI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact Support
                </motion.button>
                <motion.button
                  className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Community
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default FAQ