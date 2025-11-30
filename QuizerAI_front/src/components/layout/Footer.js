'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Brain,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowRight,
  Heart
} from 'lucide-react'
import Image from 'next/image'
import quizairlogopng from "public/images/hero/qbl.png"

const Footer = () => {
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Quiz Generator', href: '/dashboard/quizzes/create' },
      { name: 'Question Papers', href: '/dashboard/question-papers/upload' },
      { name: 'YouTube Processing', href: '/dashboard/youtube/process' },
      { name: 'AI Tutor', href: '/ai_tutor' },
      { name: 'Pricing', href: '/pricing' }
    ],
    solutions: [
      { name: 'For Students', href: '/solutions/students' },
      { name: 'For Teachers', href: '/solutions/teachers' },
      { name: 'For Schools', href: '/solutions/schools' },
      { name: 'For Coaching Centers', href: '/solutions/coaching' },
      // { name: 'Enterprise', href: '/enterprise' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      // { name: 'Documentation', href: '/docs' },
      // { name: 'API Reference', href: '/api-docs' },
      // { name: 'Community', href: '/community' },
      { name: 'Contact Support', href: '/support' },
      // { name: 'Status', href: '/status' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Blog', href: '/blog' },
      // { name: 'Careers', href: '/careers' },
      // { name: 'Press Kit', href: '/press' },
      // { name: 'Partners', href: '/partners' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' }
      // { name: 'Cookie Policy', href: '/cookies' },
      // { name: 'GDPR', href: '/gdpr' },
      // { name: 'Security', href: '/security' }
    ]
  }

  const socialLinks = [
    // { name: 'Facebook', icon: Facebook, href: '#', color: 'hover:text-blue-600' },
    { name: 'X', icon: Twitter, href: 'https://x.com/QuizerAI_?t=en6wP18MwlgFaAYcfdG2uw&s=09', color: 'hover:text-sky-500' },
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/quizerai?igsh=MWNoM2F1ZnNkZ2FmYw==', color: 'hover:text-pink-600' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/quizerai/', color: 'hover:text-blue-700' },
    { name: 'YouTube', icon: Youtube, href: 'http://www.youtube.com/@QuizerAI-q8l', color: 'hover:text-red-600' }
  ]

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Newsletter Section */}
        <div className="py-16 border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold mb-4">
                Stay Updated with QuizerAI
              </h3>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Get the latest features, study tips, and educational insights delivered to your inbox.
                Join our community of learners and educators.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

              <p className="text-sm text-slate-400 mt-4">
                No spam, unsubscribe at any time. We respect your privacy.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                {/* Logo */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Image src={quizairlogopng} className='rounded-lg'></Image>
                    {/* <Brain className="w-7 h-7 text-white" /> */}
                  </div>
                  <span className="text-2xl font-bold">QuizerAI</span>
                </div>

                <p className="text-slate-300 leading-relaxed mb-6 max-w-sm">
                  Empowering students and educators worldwide with AI-powered learning tools.
                  Transform any content into interactive educational experiences.
                </p>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <a
                    href="mailto:support@quizerai.com"
                    className="flex items-center cursor-pointer gap-3 text-slate-300 hover:text-blue-400 transition-colors duration-200"
                  >
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>support@quizerai.com</span>
                  </a>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <span>+91 7870304944</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span>Kolkata , West Bengal , India</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      className={`w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 transition-all duration-200 ${social.color}`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Links Sections */}
            {Object.entries(footerLinks).map(([category, links], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="font-semibold text-white mb-4 capitalize">
                  {category === 'product' ? 'Product' :
                    category === 'solutions' ? 'Solutions' :
                      category === 'support' ? 'Support' :
                        category === 'company' ? 'Company' : 'Legal'}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-slate-300 hover:text-white transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-slate-400"
            >
              <span>© 2025 QuizerAI. Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for learners worldwide.</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center gap-6 text-sm text-slate-400"
            >
              <span>🌍 Available in 15+ languages</span>
              <span>🔒 SOC 2 Compliant</span>
              <span>⚡ 99.9% Uptime</span>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer