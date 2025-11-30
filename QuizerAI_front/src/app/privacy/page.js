'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Calendar, Mail, Lock, Eye, Globe, Users, Database, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { GradientText } from '@/components/common/GradientText'

const PrivacyPolicyPage = () => {
  const sections = [
    { id: 'information-collect', title: 'Information We Collect', number: '1' },
    { id: 'how-we-use', title: 'How We Use Your Information', number: '2' },
    { id: 'legal-basis', title: 'Legal Basis for Processing', number: '3' },
    { id: 'sharing', title: 'Information Sharing', number: '4' },
    { id: 'security', title: 'Data Security', number: '5' },
    { id: 'retention', title: 'Data Retention', number: '6' },
    { id: 'rights', title: 'Your Privacy Rights', number: '7' },
    { id: 'children', title: 'Children\'s Privacy', number: '8' },
    { id: 'international', title: 'International Transfers', number: '9' },
    { id: 'cookies', title: 'Cookies & Tracking', number: '10' },
    { id: 'third-party', title: 'Third-Party Services', number: '11' },
    { id: 'changes', title: 'Policy Changes', number: '12' },
    { id: 'contact', title: 'Contact Us', number: '13' }
  ]

  const protectionFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data transmission protected with industry-standard encryption",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Full compliance with European data protection regulations",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Eye,
      title: "Transparent Processing",
      description: "Clear information about how we collect and use your data",
      color: "from-purple-500 to-indigo-500"
    }
  ]

  const dataTypes = [
    {
      category: "Personal Information",
      icon: Users,
      items: ["Name and email", "Educational institution", "Role and preferences", "Account credentials"],
      color: "bg-blue-50 border-blue-200"
    },
    {
      category: "Educational Content",
      icon: Database,
      items: ["Uploaded documents", "Generated quizzes", "Study materials", "Performance data"],
      color: "bg-green-50 border-green-200"
    },
    {
      category: "Usage Analytics",
      icon: Globe,
      items: ["Platform interactions", "Feature usage", "Learning progress", "Technical data"],
      color: "bg-purple-50 border-purple-200"
    }
  ]

  const privacyRights = [
    { right: "Access", description: "View your personal data" },
    { right: "Rectification", description: "Correct inaccurate information" },
    { right: "Erasure", description: "Delete your data" },
    { right: "Portability", description: "Export your data" },
    { right: "Restriction", description: "Limit data processing" },
    { right: "Objection", description: "Object to certain processing" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
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
              <Link href="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </Link>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-3xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
                    Privacy <GradientText>Policy</GradientText>
                  </h1>
                  <p className="text-lg text-slate-600 mt-2">How we protect and handle your data</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span>Last Updated: January 15, 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-500" />
                  <span>privacy@quizerai.com</span>
                </div>
              </div>

              {/* Protection Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {protectionFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
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
                    <Shield className="w-5 h-5 text-green-500" />
                    Contents
                  </h3>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block text-sm text-slate-600 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-all duration-200 group"
                      >
                        <span className="text-green-600 font-semibold mr-2">{section.number}.</span> 
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
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Privacy Commitment</h2>
                      <p className="text-slate-700 leading-relaxed">
                        At QuizerAI, we are committed to protecting your privacy and ensuring the security of your personal data. 
                        This policy explains how we collect, use, and safeguard your information when you use our platform.
                      </p>
                    </div>

                    <div className="space-y-12">
                      
                      <section id="information-collect">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">1</span>
                          Information We Collect
                        </h2>
                        
                        <div className="grid gap-6 mb-6">
                          {dataTypes.map((type, index) => (
                            <motion.div
                              key={type.category}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`rounded-xl p-6 border-2 ${type.color}`}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <type.icon className="w-6 h-6 text-slate-700" />
                                <h3 className="text-lg font-semibold text-slate-800">{type.category}</h3>
                              </div>
                              <div className="grid md:grid-cols-2 gap-2">
                                {type.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl p-6">
                          <p className="text-blue-800 font-medium mb-2">Data Collection Principle:</p>
                          <p className="text-blue-700 text-sm">
                            We only collect information that is necessary to provide and improve our educational services. 
                            We never collect more data than needed and always inform you about our data practices.
                          </p>
                        </div>
                      </section>

                      <section id="how-we-use">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">2</span>
                          How We Use Your Information
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-green-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                              <Shield className="w-5 h-5" />
                              Service Provision
                            </h3>
                            <ul className="text-green-700 space-y-2 text-sm">
                              <li>• Create and maintain your account</li>
                              <li>• Process educational content with AI</li>
                              <li>• Generate personalized quizzes and notes</li>
                              <li>• Enable collaborative learning features</li>
                              <li>• Track learning progress and analytics</li>
                            </ul>
                          </div>
                          
                          <div className="bg-blue-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                              <Globe className="w-5 h-5" />
                              Platform Improvement
                            </h3>
                            <ul className="text-blue-700 space-y-2 text-sm">
                              <li>• Improve AI algorithms and accuracy</li>
                              <li>• Enhance user experience and features</li>
                              <li>• Conduct educational research (anonymized)</li>
                              <li>• Provide customer support</li>
                              <li>• Ensure platform security and safety</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Important: We Never Sell Your Data
                          </h3>
                          <p className="text-yellow-700 text-sm">
                            QuizerAI does not sell, rent, or trade your personal information to third parties for marketing purposes. 
                            Your educational data and personal information are used solely to provide and improve our services.
                          </p>
                        </div>
                      </section>

                      <section id="security">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">5</span>
                          Data Security and Protection
                        </h2>
                        
                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-purple-50 rounded-xl p-6 text-center">
                            <Lock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-purple-800 mb-2">Encryption</h3>
                            <p className="text-purple-700 text-sm">End-to-end encryption for all data transmission and storage</p>
                          </div>
                          
                          <div className="bg-indigo-50 rounded-xl p-6 text-center">
                            <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-indigo-800 mb-2">Access Control</h3>
                            <p className="text-indigo-700 text-sm">Strict access controls and employee security training</p>
                          </div>
                          
                          <div className="bg-blue-50 rounded-xl p-6 text-center">
                            <Database className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-blue-800 mb-2">Secure Storage</h3>
                            <p className="text-blue-700 text-sm">Data stored in secure, certified data centers</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
                          <h3 className="font-semibold text-slate-800 mb-3">Security Measures Include:</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <ul className="space-y-2">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>Regular security audits and penetration testing</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>Multi-factor authentication options</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>Incident response procedures</span>
                              </li>
                            </ul>
                            <ul className="space-y-2">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span>Employee background checks and training</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span>Secure coding practices and updates</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span>Physical security at data centers</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section id="rights">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">7</span>
                          Your Privacy Rights
                        </h2>
                        
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-6">
                          <h3 className="font-semibold text-slate-800 mb-4">You have the following rights regarding your personal data:</h3>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            {privacyRights.map((right, index) => (
                              <div key={right.right} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-green-800">{right.right}</h4>
                                  <p className="text-green-700 text-sm">{right.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-blue-50 rounded-xl p-6">
                            <h3 className="font-semibold text-blue-800 mb-3">GDPR Rights (EU Users)</h3>
                            <ul className="text-blue-700 text-sm space-y-2">
                              <li>• Data portability in machine-readable format</li>
                              <li>• Right to restrict processing</li>
                              <li>• Right to object to processing</li>
                              <li>• Right to lodge complaints with authorities</li>
                            </ul>
                          </div>
                          
                          <div className="bg-orange-50 rounded-xl p-6">
                            <h3 className="font-semibold text-orange-800 mb-3">CCPA Rights (California)</h3>
                            <ul className="text-orange-700 text-sm space-y-2">
                              <li>• Know what personal information is collected</li>
                              <li>• Delete personal information</li>
                              <li>• Opt out of sale (we don&apos;t sell data)</li>
                              <li>• Non-discrimination for exercising rights</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section id="children">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">8</span>
                          Children&apos;s Privacy (COPPA Compliance)
                        </h2>
                        
                        <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
                          <h3 className="font-semibold text-pink-800 mb-4">Special Protection for Children</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium text-pink-800 mb-2">Age Requirements:</h4>
                              <ul className="text-pink-700 text-sm space-y-1">
                                <li>• Users must be 13+ years old</li>
                                <li>• Under 18 requires parental consent</li>
                                <li>• Under 13 only through school accounts</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-pink-800 mb-2">Parental Rights:</h4>
                              <ul className="text-pink-700 text-sm space-y-1">
                                <li>• Review child&apos;s information</li>
                                <li>• Request deletion of child&apos;s data</li>
                                <li>• Refuse further data collection</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section id="contact">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">13</span>
                          Contact Our Privacy Team
                        </h2>
                        
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                          <h3 className="font-semibold text-slate-800 mb-4">Privacy Questions or Requests?</h3>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                              <Mail className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <h4 className="font-medium text-slate-800 mb-1">Privacy Officer</h4>
                              <a href="mailto:privacy@quizerai.com" className="text-green-600 hover:text-green-700 text-sm">
                                privacy@quizerai.com
                              </a>
                            </div>
                            <div className="text-center">
                              <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                              <h4 className="font-medium text-slate-800 mb-1">Data Protection</h4>
                              <a href="mailto:dpo@quizerai.com" className="text-blue-600 hover:text-blue-700 text-sm">
                                dpo@quizerai.com
                              </a>
                            </div>
                            <div className="text-center">
                              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                              <h4 className="font-medium text-slate-800 mb-1">General Support</h4>
                              <a href="mailto:support@quizerai.com" className="text-purple-600 hover:text-purple-700 text-sm">
                                support@quizerai.com
                              </a>
                            </div>
                          </div>
                        </div>
                      </section>

                    </div>

                    {/* Footer CTA */}
                    <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center mt-12">
                      <h3 className="text-2xl font-bold mb-4">Your Privacy Matters</h3>
                      <p className="mb-6 opacity-90">
                        We&apos;re committed to protecting your data and being transparent about our practices. 
                        Start learning with confidence on QuizerAI.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                          <motion.button
                            className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Start Learning Safely
                          </motion.button>
                        </Link>
                        <Link href="/terms">
                          <motion.button
                            className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-green-600 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Terms of Service
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

export default PrivacyPolicyPage