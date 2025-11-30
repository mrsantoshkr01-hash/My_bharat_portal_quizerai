'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Calendar, Mail, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { GradientText } from '@/components/common/GradientText'

const TermsOfServicePage = () => {
  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms', number: '1' },
    { id: 'description', title: 'Description of Service', number: '2' },
    { id: 'accounts', title: 'User Accounts and Eligibility', number: '3' },
    { id: 'acceptable-use', title: 'Acceptable Use Policy', number: '4' },
    { id: 'content', title: 'Content and Intellectual Property', number: '5' },
    { id: 'education', title: 'Educational Institution Terms', number: '6' },
    { id: 'payment', title: 'Payment Terms', number: '7' },
    { id: 'privacy', title: 'Privacy and Data Protection', number: '8' },
    { id: 'ai', title: 'AI and Automated Processing', number: '9' },
    { id: 'third-party', title: 'Third-Party Services', number: '10' },
    { id: 'availability', title: 'Service Availability', number: '11' },
    { id: 'liability', title: 'Limitation of Liability', number: '12' },
    { id: 'termination', title: 'Termination', number: '13' },
    { id: 'disputes', title: 'Dispute Resolution', number: '14' },
    { id: 'contact', title: 'Contact Information', number: '15' }
  ]

  const highlights = [
    {
      icon: CheckCircle,
      title: "Free to Use",
      description: "Core features available at no cost",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: Shield,
      title: "Data Protection",
      description: "Your privacy and security are our priority",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: AlertTriangle,
      title: "Fair Use",
      description: "Educational and academic purposes only",
      color: "text-orange-600 bg-orange-100"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </Link>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <FileText className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
                    Terms of <GradientText>Service</GradientText>
                  </h1>
                  <p className="text-lg text-slate-600 mt-2">Legal guidelines for using QuizerAI</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Last Updated: January 15, 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>legal@quizerai.com</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {highlights.map((highlight, index) => (
                  <motion.div
                    key={highlight.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto ${highlight.color}`}>
                      <highlight.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">{highlight.title}</h3>
                    <p className="text-slate-600 text-sm">{highlight.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Table of Contents */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 sticky top-8">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Contents
                  </h3>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200 group"
                      >
                        <span className="text-blue-600 font-semibold mr-2">{section.number}.</span> 
                        <span className="group-hover:translate-x-1 transition-transform inline-block">{section.title}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-3"
              >
                <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200">
                  <div className="prose prose-slate max-w-none">
                    
                    {/* Introduction */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to QuizerAI</h2>
                      <p className="text-slate-700 leading-relaxed">
                        These Terms of Service govern your use of QuizerAI&apos;s AI-powered educational platform. 
                        By using our service, you agree to these terms. Please read them carefully.
                      </p>
                    </div>

                    <div className="space-y-12">
                      
                      <section id="acceptance">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">1</span>
                          Acceptance of Terms
                        </h2>
                        <div className="bg-blue-50 rounded-xl p-6 mb-4">
                          <p className="text-blue-800 font-medium mb-2">Key Points:</p>
                          <ul className="text-blue-700 space-y-1 text-sm">
                            <li>• These terms apply to all users of QuizerAI</li>
                            <li>• By creating an account, you agree to these terms</li>
                            <li>• Terms also apply to students, teachers, and institutions</li>
                          </ul>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          By creating an account or using QuizerAI, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms apply to all users of the Service, including students, teachers, educational institutions, and other visitors or users.
                        </p>
                      </section>

                      <section id="description">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">2</span>
                          Description of Service
                        </h2>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          QuizerAI is an AI-powered educational platform that provides:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          {[
                            'AI quiz generation from any content',
                            'Question paper digitization',
                            'YouTube video processing',
                            'Collaborative virtual classrooms',
                            'AI tutoring and assistance',
                            'Analytics and progress tracking',
                            'Content creation and sharing',
                            'Multi-format content support'
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-slate-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section id="accounts">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">3</span>
                          User Accounts and Eligibility
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-green-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-green-800 mb-3">Account Requirements</h3>
                            <ul className="text-green-700 space-y-2 text-sm">
                              <li>• Provide accurate information</li>
                              <li>• Keep credentials secure</li>
                              <li>• Report unauthorized access</li>
                              <li>• One account per person</li>
                            </ul>
                          </div>
                          
                          <div className="bg-orange-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-orange-800 mb-3">Eligibility</h3>
                            <ul className="text-orange-700 space-y-2 text-sm">
                              <li>• Must be 13+ years old</li>
                              <li>• Under 18 needs parental consent</li>
                              <li>• Comply with local laws</li>
                              <li>• Educational use purposes</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section id="acceptable-use">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">4</span>
                          Acceptable Use Policy
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-green-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Permitted Uses
                            </h3>
                            <ul className="text-green-700 space-y-2 text-sm">
                              <li>• Educational and academic purposes</li>
                              <li>• Creating and sharing educational content</li>
                              <li>• Collaborative learning and teaching</li>
                              <li>• Personal skill development</li>
                            </ul>
                          </div>
                          
                          <div className="bg-red-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              Prohibited Uses
                            </h3>
                            <ul className="text-red-700 space-y-2 text-sm">
                              <li>• Illegal or harmful content</li>
                              <li>• Violating intellectual property</li>
                              <li>• Unauthorized commercial use</li>
                              <li>• Hacking or security breaches</li>
                              <li>• Spam or harassment</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section id="content">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">5</span>
                          Content and Intellectual Property
                        </h2>
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
                          <h3 className="font-semibold text-slate-800 mb-3">Important Information:</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-indigo-800 mb-2">Your Content:</h4>
                              <ul className="text-indigo-700 space-y-1">
                                <li>• You retain ownership of uploaded content</li>
                                <li>• Grant us license to process for educational use</li>
                                <li>• Must have rights to share content</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-blue-800 mb-2">AI-Generated Content:</h4>
                              <ul className="text-blue-700 space-y-1">
                                <li>• Provided as educational tools</li>
                                <li>• Personal and educational use permitted</li>
                                <li>• Commercial use may require licensing</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section id="payment">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">7</span>
                          Payment Terms
                        </h2>
                        <div className="bg-yellow-50 rounded-xl p-6">
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-yellow-800 mb-2">Free Plan:</h4>
                              <p className="text-yellow-700">Core features with usage limits</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-orange-800 mb-2">Subscriptions:</h4>
                              <p className="text-orange-700">Enhanced features, auto-renewal</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-red-800 mb-2">Refunds:</h4>
                              <p className="text-red-700">30-day money-back guarantee</p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section id="liability">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">12</span>
                          Limitation of Liability
                        </h2>
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-6">
                          <p className="text-red-800 font-medium mb-2">Important Legal Notice:</p>
                          <p className="text-red-700 text-sm leading-relaxed">
                            QuizerAI is provided &apos;as is&apos; without warranties. Our liability is limited to the amount 
                            you paid for the service. We are not liable for indirect or consequential damages. 
                            Some jurisdictions do not allow liability limitations, so these may not apply to you.
                          </p>
                        </div>
                      </section>

                      <section id="contact">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">15</span>
                          Contact Information
                        </h2>
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                          <h3 className="font-semibold text-slate-800 mb-4">Questions about these Terms?</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="font-medium text-slate-800">Legal Team</p>
                                <a href="mailto:legal@quizerai.com" className="text-blue-600 hover:text-blue-700">
                                  legal@quizerai.com
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-purple-500" />
                              <div>
                                <p className="font-medium text-slate-800">Support Team</p>
                                <a href="mailto:support@quizerai.com" className="text-purple-600 hover:text-purple-700">
                                  support@quizerai.com
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                    </div>

                    {/* Footer CTA */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center mt-12">
                      <h3 className="text-2xl font-bold mb-4">Ready to Start Learning?</h3>
                      <p className="mb-6 opacity-90">
                        By using QuizerAI, you agree to these Terms of Service and can start your AI-powered learning journey.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                          <motion.button
                            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Create Account
                          </motion.button>
                        </Link>
                        <Link href="/privacy">
                          <motion.button
                            className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Privacy Policy
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default TermsOfServicePage